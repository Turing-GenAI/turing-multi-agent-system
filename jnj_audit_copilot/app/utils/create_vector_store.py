import os
from typing import Dict, List, Optional
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import (
    TextLoader,
    PyPDFLoader,
    Docx2txtLoader,
)
import pandas as pd
from sqlalchemy import create_engine, inspect

from ..scripts.box_copy_files import get_box_client, process_folder_contents
from .langchain_azure_openai import azure_embedding_openai_client
from .log_setup import get_logger
from ..common.constants import CHUNK_SIZE, CHUNK_OVERLAP
from ..common.constants import CHROMADB_INDEX_SUMMARIES, CHROMADB_INDEX_DOCS

def get_project_root():
    """
    Get the absolute path to the project root directory.
    """
    # Path to this file
    current_file = os.path.abspath(__file__)
    # Path to utils directory
    utils_dir = os.path.dirname(current_file)
    # Path to app directory
    app_dir = os.path.dirname(utils_dir)
    # Path to jnj_audit_copilot directory
    jnj_dir = os.path.dirname(app_dir)
    # Path to project root
    project_root = os.path.dirname(jnj_dir)
    return project_root

BOX_ROOT_FOLDER_ID = os.getenv("BOX_ROOT_FOLDER_ID", "0")
BOX_DOWNLOAD_FOLDER = os.path.join(get_project_root(), "jnj_audit_copilot", 'box_download')
CHROMA_DB_FOLDER = os.path.join(get_project_root(), "jnj_audit_copilot", 'chroma_db_new')

os.makedirs(CHROMA_DB_FOLDER, exist_ok=True)
os.makedirs(BOX_DOWNLOAD_FOLDER, exist_ok=True)

# PostgreSQL connection
db_url = "postgresql://citus:V3ct0r%243arch%402024%21@c-rag-pg-cluster-vectordb.ohp4jnn4od53fv.postgres.cosmos.azure.com:5432/rag_db?sslmode=require"

# Get logger instance
logger = get_logger()

class DataProcessor:
    def __init__(self):
        self.box_root_folder_id = BOX_ROOT_FOLDER_ID
        self.base_documents_dir = BOX_DOWNLOAD_FOLDER
        self.base_chromadb_dir = CHROMA_DB_FOLDER
        self.site_area_exclusions = ['Demo', 'Risk_Scores', 'SGR']
        
    def setup_chromadb_folders(self, site_area: str) -> str:
        """
        Create the required folder structure for a site area
        """
        base_dir = os.path.join(self.base_chromadb_dir, site_area)
        folders = ["guidelines", "summary"]
        
        for folder in folders:
            folder_path = os.path.join(base_dir, folder)
            os.makedirs(folder_path, exist_ok=True)
            logger.info(f"Created/verified folder: {folder_path}")

        summary_persist_directory = os.path.join(base_dir, "summary")
        guidelines_persist_directory = os.path.join(base_dir, "guidelines")

        return summary_persist_directory, guidelines_persist_directory

    class GuidelinesProcessor:
        def __init__(self, parent):
            self.parent = parent
            self.base_documents_dir = parent.base_documents_dir
            self.base_chromadb_dir = parent.base_chromadb_dir
            self.site_area_exclusions = parent.site_area_exclusions
            self.setup_chromadb_folders = parent.setup_chromadb_folders
            self.supported_extensions = {
            '.txt': TextLoader,
            '.pdf': PyPDFLoader,
            '.docx': Docx2txtLoader,
            '.doc': Docx2txtLoader  # Note: might need additional handling for .doc files
        }
        
        def download_box_files(self) -> bool:
            """
            Download files from Box using the existing box_copy_files script
            """
            try:
                logger.info("Initializing Box client...")
                client = get_box_client()
                
                # Create Documents directory if it doesn't exist
                os.makedirs(self.base_documents_dir, exist_ok=True)
                
                # Get the root folder ID from environment
                box_folder_id = BOX_ROOT_FOLDER_ID
                
                logger.info("Starting download of files from Box...")
                stats = process_folder_contents(
                    client,
                    folder_id=box_folder_id,
                    local_base_path=self.base_documents_dir,
                    download_mode="smart"  # Use smart mode to only download changed files, Else "overwrite" can also be used
                )        
                logger.info(f"Download complete. Stats: {stats}")
                return True
            except Exception as e:
                logger.error(f"Error downloading files from Box: {e}")
                return False

        def load_and_split_document(self, file_path: str) -> Optional[List[Document]]:
            """
            Load a document and split it into chunks
            """
            try:
                _, ext = os.path.splitext(file_path)
                if ext.lower() not in self.supported_extensions:
                    logger.warning(f"Unsupported file type: {ext} for file {file_path}")
                    return None

                loader_class = self.supported_extensions.get(ext.lower())
                loader = loader_class(file_path)
                documents = loader.load()
                
                # Split documents into chunks
                text_splitter = RecursiveCharacterTextSplitter(
                    chunk_size=CHUNK_SIZE,
                    chunk_overlap=CHUNK_OVERLAP,
                    length_function=len,
                )
                
                splits = text_splitter.split_documents(documents)
                logger.info(f"Split {file_path} into {len(splits)} chunks")
                return splits

            except Exception as e:
                logger.error(f"Error processing file {file_path}: {e}")
                return None

        def process_documents_by_site_area(self, site_area: str) -> Optional[Chroma]:
            """
            Process all documents in a site area and create ChromaDB
            """
            try:
                site_area_path = os.path.join(self.base_documents_dir, site_area)
                if not os.path.exists(site_area_path):
                    logger.error(f"Site area directory not found: {site_area_path}")
                    return None

                all_splits = []
                metadata_list = []

                _, guidelines_persist_directory = self.setup_chromadb_folders(site_area)
                
                # Walk through all files in the site area
                for root, _, files in os.walk(site_area_path):
                    for file in files:
                        file_path = os.path.join(root, file)
                        logger.info(f"Processing file: {file_path}")
                        
                        splits = self.load_and_split_document(file_path)
                        if splits:
                            all_splits.extend([doc.page_content for doc in splits])
                            rel_path = os.path.relpath(file_path, site_area_path)
                            metadata_list.extend([{
                                "site_area": site_area,
                                "file_name": file,
                                "relative_path": rel_path,
                                "chunk_index": i
                            } for i in range(len(splits))])

                if not all_splits:
                    logger.warning(f"No documents processed for site area: {site_area}")
                    return None

                # Create and persist ChromaDB
                guidelines_vectorstore = Chroma.from_texts(
                    texts=all_splits,
                    embedding=azure_embedding_openai_client,
                    metadatas=metadata_list,
                    persist_directory=guidelines_persist_directory,
                    collection_name=CHROMADB_INDEX_DOCS
                )
                
                logger.info(f"Successfully created ChromaDB for {site_area} with {len(all_splits)} chunks")
                return guidelines_vectorstore
                
            except Exception as e:
                logger.error(f"Error processing site area {site_area}: {e}")
                return None

        def process_all_documents(self) -> Dict[str, bool]:
            """
            Process all site areas in the Documents directory
            """
            results = {}
            try:
                if not os.path.exists(self.base_documents_dir):
                    logger.error(f"Documents directory not found: {self.base_documents_dir}")
                    return results

                site_areas = [d for d in os.listdir(self.base_documents_dir) 
                            if os.path.isdir(os.path.join(self.base_documents_dir, d))]
                site_areas = [area for area in site_areas if area not in self.site_area_exclusions]
                logger.info(f"Found site areas: {site_areas}")
                
                for site_area in site_areas:
                    logger.info(f"Processing site area: {site_area}")
                    vectorstore = self.process_documents_by_site_area(site_area)
                    results[site_area] = vectorstore is not None
                    
                return results
                
            except Exception as e:
                logger.error(f"Error processing site areas: {e}")
                return results

    class SiteDataProcessor:
        def __init__(self, parent):
            self.parent = parent
            self.base_documents_dir = parent.base_documents_dir
            self.base_chromadb_dir = parent.base_chromadb_dir
            self.site_area_exclusions = parent.site_area_exclusions
            self.setup_chromadb_folders = parent.setup_chromadb_folders
            self.db_url = db_url
            
        def get_all_tables_from_summaries_schema(self, site_area: str):
            """
            Get all tables from the summaries schema and combine them into a single DataFrame
            with table name as an additional column.
            """
            postgres_table_name = site_area.lower()
            try:
                engine = create_engine(self.db_url)
                # inspector = inspect(engine)

                query = f'SELECT * FROM summaries."{postgres_table_name}"'
                df = pd.read_sql(query, engine)
                logger.info(f"Read {len(df)} rows from table {site_area}")
                logger.info(f"Columns in {site_area}: {df.columns.tolist()}")
                
                return df
            except Exception as e:
                logger.error(f"Error getting tables from summaries schema: {e}")
                return None

        def process_summary_data_by_site_area(self,site_area: str):
            """
            Create a new ChromaDB collection for summaries and store embeddings.
            Each site area gets its own folder structure with document_persist, guidelines, and summary folders.
            
            Args:
                site_area (str): Name of the site area (e.g., 'PD', 'AE_SAE')
            """
            try:
                # Get the data for this site area
                logger.info(f"Fetching data from PostgreSQL for {site_area}...")
                df = self.get_all_tables_from_summaries_schema(site_area)

                if df is None or df.empty:
                    logger.error(f"No data found for site area: {site_area}")
                    return None

                # Generate embeddings for the "Summary" column
                logger.info("Generating embeddings...")
                summaries = df["Summary"].tolist()
                
                # Store embeddings in ChromaDB with site-specific collection name
                logger.info(f"Storing summaries in ChromaDB for {site_area}...")
                
                self.summary_persist_directory, _ =  self.setup_chromadb_folders(site_area)

                summary_vectorstore = Chroma.from_texts(
                    texts=summaries,
                    embedding=azure_embedding_openai_client,
                    collection_name=CHROMADB_INDEX_SUMMARIES,  # Unique collection name for each site area
                    metadatas=[{
                        "site_area": site_area,
                        "database_name": row.get("database_name"),
                        "schema_name": row.get("schema_name"),
                        "table_name": row.get("table_name")
                    } for _, row in df.iterrows()],
                    persist_directory = self.summary_persist_directory
                )

                logger.info(f"Successfully stored {len(summaries)} embeddings in ChromaDB for {site_area}")
                return summary_vectorstore
            except Exception as e:
                logger.error(f"Error storing summaries in ChromaDB for {site_area}: {e}")
                logger.error(f"Error details: {str(e)}")
                return None

        def process_all_summary_data(self):
            """
            Process all available site areas and create their respective ChromaDB collections.
            """
            try:
                # Get list of all tables (site areas) from PostgreSQL
                engine = create_engine(db_url)
                inspector = inspect(engine)
                site_areas = inspector.get_table_names(schema='summaries')

                # Converting all extracted site_areas to upper as per the requirement
                site_areas = [site_area.upper() for site_area in site_areas]
                
                logger.info(f"Found site areas: {site_areas}")
                
                # Process each site area
                for site_area in site_areas:
                    logger.info(f"Processing site area: {site_area}")
                    self.process_summary_data_by_site_area(site_area)
                    
            except Exception as e:
                logger.error(f"Error processing site areas: {e}")

if __name__ == "__main__":
    data_processor = DataProcessor()
    guidelines_processor = data_processor.GuidelinesProcessor(data_processor)
    guidelines_processor.process_all_documents()

    site_data_processor = data_processor.SiteDataProcessor(data_processor)
    site_data_processor.process_all_summary_data()