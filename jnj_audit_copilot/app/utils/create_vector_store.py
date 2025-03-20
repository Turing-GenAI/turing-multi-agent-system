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
from ..common.constants import CHROMADB_INDEX_SUMMARIES,CHROMADB_INDEX_GUIDELINES, CHROMADB_SUMMARY_FOLDER_NAME, CHROMADB_GUIDELINES_FOLDER_NAME
from ..common.constants import BOX_ROOT_FOLDER_ID, BOX_DOWNLOAD_FOLDER, db_url
from ..common.config import CHROMADB_DIR_NEW
from .helpers import create_ingestion_filepaths_dict_new, is_folder_empty, delete_folder

ingestion_filepaths_dict = create_ingestion_filepaths_dict_new(
    CHROMADB_DIR_NEW,
    CHROMADB_SUMMARY_FOLDER_NAME,
    CHROMADB_GUIDELINES_FOLDER_NAME
)

# Get logger instance
logger = get_logger()

class DataProcessor:
    def __init__(self):
        self.box_root_folder_id = BOX_ROOT_FOLDER_ID
        self.box_download_folder = BOX_DOWNLOAD_FOLDER
        self.site_area_exclusions = ['Demo', 'Risk_Scores', 'SGR']
        self.ingestion_filepaths_dict = ingestion_filepaths_dict
        
    class SiteDataProcessor:
        def __init__(self, parent):
            self.parent = parent
            self.box_download_folder = parent.box_download_folder
            self.site_area_exclusions = parent.site_area_exclusions
            self.ingestion_filepaths_dict = parent.ingestion_filepaths_dict
            self.db_url = db_url
            
        def get_all_tables_from_summaries_schema(self, site_area: str):
            """
            Get all tables from the summaries schema and combine them into a single DataFrame
            with table name as an additional column.
            """
            postgres_table_name = site_area.lower()
            try:
                engine = create_engine(self.db_url)

                query = f'SELECT * FROM summaries."{postgres_table_name}"'
                df = pd.read_sql(query, engine)
                logger.info(f"Read {len(df)} rows from table {site_area}")
                logger.info(f"Columns in {site_area}: {df.columns.tolist()}")
                # print(f"Read {len(df)} rows from table {site_area}")
                # print(f"Columns in {site_area}: {df.columns.tolist()}")
                
                return df
            except Exception as e:
                logger.error(f"Error getting tables from summaries schema: {e}")
                # print(f"Error getting tables from summaries schema: {e}")
                return None

        def process_summary_data_by_site_area(self,site_area: str):
            """
            Create a new ChromaDB collection for summaries and store embeddings.
            Each site area gets its own folder structure with guidelines, and summary folders.
            
            Args:
                site_area (str): Name of the site area (e.g., 'PD', 'AE_SAE')
            """
            try:
                self.summary_persist_directory =  self.ingestion_filepaths_dict[site_area]["summary_persist_directory"]
                # Get the data for this site area
                logger.info(f"Fetching data from PostgreSQL for {site_area}...")
                # print(f"Fetching data from PostgreSQL for {site_area}...")
                df = self.get_all_tables_from_summaries_schema(site_area)

                if df is None or df.empty:
                    logger.error(f"No data found for site area: {site_area}")
                    # print(f"No data found for site area: {site_area}")
                    return None

                # Generate embeddings for the "Summary" column
                logger.info("Generating embeddings...")
                # print("Generating embeddings...")
                summaries = df["Summary"].tolist()
                
                # Store embeddings in ChromaDB with site-specific collection name
                logger.info(f"Storing summaries in ChromaDB for {site_area}...")
                # print(f"Storing summaries in ChromaDB for {site_area}...")
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
                # print(f"Successfully stored {len(summaries)} embeddings in ChromaDB for {site_area}")
                return summary_vectorstore
            except Exception as e:
                logger.error(f"Error storing summaries in ChromaDB for {site_area}: {e}")
                # print(f"Error storing summaries in ChromaDB for {site_area}: {e}")
                logger.error(f"Error details: {str(e)}")
                # print(f"Error details: {str(e)}")
                return None

        def process_all_summary_data(self):
            logger.info("Calling function: process_all_summary_data ...")
            # print("Calling function: process_all_summary_data ...")
            """
            Process all available site areas and create their respective ChromaDB collections.
            """
            try:
                # Get list of all tables (site areas) from PostgreSQL
                engine = create_engine(self.db_url)
                inspector = inspect(engine)
                site_areas = inspector.get_table_names(schema='summaries')

                # Converting all extracted site_areas to upper as per the requirement
                site_areas = [site_area.upper() for site_area in site_areas]
                
                logger.info(f"Found site areas: {site_areas}")
                # print(f"Found site areas: {site_areas}")
                
                # Process each site area
                for site_area in site_areas:
                    logger.info(f"Processing site area: {site_area}")
                    # print(f"Processing site area: {site_area}")
                    self.process_summary_data_by_site_area(site_area)
                    
            except Exception as e:
                logger.error(f"Error processing site areas: {e}")
                # print(f"Error processing site areas: {e}")


    class GuidelinesProcessor:
        def __init__(self, parent):
            self.parent = parent
            self.box_download_folder = parent.box_download_folder
            self.site_area_exclusions = parent.site_area_exclusions
            self.ingestion_filepaths_dict = parent.ingestion_filepaths_dict
            self.box_root_folder_id = parent.box_root_folder_id
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
                # print("Initializing Box client...")

                try:
                    client = get_box_client()
                except Exception as box_auth_error:
                    logger.error(f"Box authentication failed: {box_auth_error}")
                    # print(f"Box authentication failed: {box_auth_error}")
                    # print("Continuing without Box download. Using existing files if available.")
                    

                    # Check if we have any existing files to work with
                    if os.path.exists(self.box_download_folder) and os.listdir(self.box_download_folder):
                        logger.info("Using existing documents directory.")
                        # print("Using existing documents directory.")
                        return True

                    else:
                        # Create an empty directory so the rest of the code can continue
                        os.makedirs(self.box_download_folder, exist_ok=True)
                        logger.warning("Created empty documents directory. No Box files will be available.")
                        # print("Created empty documents directory. No Box files will be available.")
                        return False
                
                if os.path.exists(self.box_download_folder):
                    logger.info("Documents directory already exists. Skipping download...")
                    # print("Documents directory already exists. Skipping download...")
                    return True

                # Create Documents directory if it doesn't exist
                os.makedirs(self.box_download_folder, exist_ok=True)
                logger.info("Starting download of files from Box...")
                # print("Starting download of files from Box...")
                stats = process_folder_contents(
                    client,
                    folder_id=self.box_root_folder_id,
                    local_base_path=self.box_download_folder,
                    download_mode="smart"  # Use smart mode to only download changed files, Else "overwrite" can also be used
                )
                # print(f"Download complete. Stats: {stats}")
                logger.info(f"Download complete. Stats: {stats}")
                return True
            except Exception as e:
                logger.error(f"Error downloading files from Box: {e}")
                # print(f"Error downloading files from Box: {e}")
                
                # Create directory if it doesn't exist so the rest of the code can continue
                os.makedirs(self.box_download_folder, exist_ok=True)
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
                # print(f"Split {file_path} into {len(splits)} chunks")
                return splits

            except Exception as e:
                logger.error(f"Error processing file {file_path}: {e}")
                # print(f"Error processing file {file_path}: {e}")
                return None

        def process_documents_by_site_area(self, site_area: str) -> Optional[Chroma]:
            """
            Process all documents in a site area and create ChromaDB
            """
            try:
                self.guidelines_persist_directory = self.ingestion_filepaths_dict[site_area]["guidelines_persist_directory"]
                site_area_path = os.path.join(self.box_download_folder, site_area)
                if not os.path.exists(site_area_path):
                    logger.error(f"Site area directory not found: {site_area_path}")
                    # print(f"Site area directory not found: {site_area_path}")
                    return None

                all_splits = []
                metadata_list = []
                
                # Walk through all files in the site area
                for root, _, files in os.walk(site_area_path):
                    for file in files:
                        file_path = os.path.join(root, file)
                        logger.info(f"Processing file: {file_path}")
                        # print(f"Processing file: {file_path}")
                        
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
                    # print(f"No documents processed for site area: {site_area}")
                    return None

                # Create and persist ChromaDB
                guidelines_vectorstore = Chroma.from_texts(
                    texts=all_splits,
                    embedding=azure_embedding_openai_client,
                    metadatas=metadata_list,
                    persist_directory=self.guidelines_persist_directory,
                    collection_name=CHROMADB_INDEX_GUIDELINES
                )
                
                logger.info(f"Successfully created ChromaDB for {site_area} with {len(all_splits)} chunks")
                # print(f"Successfully created ChromaDB for {site_area} with {len(all_splits)} chunks")
                return guidelines_vectorstore
                
            except Exception as e:
                logger.error(f"Error processing site area {site_area}: {e}")
                # print(f"Error processing site area {site_area}: {e}")
                return None

        def process_all_documents(self) -> Dict[str, bool]:
            """
            Process all site areas in the Documents directory
            """
            logger.info("Calling function: process_all_documents ...")
            # print("Calling function: process_all_documents ...")
            results = {}
            try:
                if not os.path.exists(self.box_download_folder):
                    logger.error(f"Documents directory not found: {self.box_download_folder}")
                    # print(f"Documents directory not found: {self.box_download_folder}")
                    return results

                site_areas = [d for d in os.listdir(self.box_download_folder) 
                            if os.path.isdir(os.path.join(self.box_download_folder, d))]
                site_areas = [area for area in site_areas if area not in self.site_area_exclusions]
                logger.info(f"Found site areas: {site_areas}")
                # print(f"Found site areas: {site_areas}")
                
                for site_area in site_areas:
                    logger.info(f"Processing site area: {site_area}")
                    # print(f"Processing site area: {site_area}")
                    vectorstore = self.process_documents_by_site_area(site_area)
                    results[site_area] = vectorstore is not None
                    
                return results
                
            except Exception as e:
                logger.error(f"Error processing site areas: {e}")
                # print(f"Error processing site areas: {e}")
                return results

def process_all_site_areas():
    """
    Process all site areas considering Documents and Site Data directories
    """
    data_processor = DataProcessor()
    guidelines_processor = data_processor.GuidelinesProcessor(data_processor)
    if is_folder_empty(BOX_DOWNLOAD_FOLDER):
        guidelines_processor.download_box_files()
    guidelines_processor.process_all_documents()

    site_data_processor = data_processor.SiteDataProcessor(data_processor)
    site_data_processor.process_all_summary_data()

def process_all_by_site_area(site_area, reingest_data_flag):
    """
    Process a single site area considering Documents and Site Data directories
    """
    guidelines_persist_directory =  ingestion_filepaths_dict[site_area]["guidelines_persist_directory"]
    summary_persist_directory =  ingestion_filepaths_dict[site_area]["summary_persist_directory"]

    if reingest_data_flag:
        try:
            delete_folder(guidelines_persist_directory)
            logger.info(f"Successfully deleted folder {guidelines_persist_directory}")
        except Exception as e:
            logger.error(f"Error deleting folder {guidelines_persist_directory}: {e}")
            # print(f"Error deleting folder {guidelines_persist_directory}: {e}")
        try:
            delete_folder(summary_persist_directory)
            logger.info(f"Successfully deleted folder {summary_persist_directory}")
        except Exception as e:
            logger.error(f"Error deleting folder {summary_persist_directory}: {e}")
            # print(f"Error deleting folder {summary_persist_directory}: {e}")

    data_processor = DataProcessor()
    guidelines_processor = data_processor.GuidelinesProcessor(data_processor)
    if is_folder_empty(BOX_DOWNLOAD_FOLDER) or reingest_data_flag:
        try:
            guidelines_processor.download_box_files()
        except Exception as e:
            logger.error(f"Error during download of Box data for site area {site_area}: {e}")
            # print(f"Error during download of Box data for site area {site_area}: {e}")
    if is_folder_empty(guidelines_persist_directory):
        try:
            guidelines_processor.process_documents_by_site_area(site_area)
        except Exception as e:
            logger.error(f"Error during processing of documents for site area {site_area}: {e}")
            # print(f"Error during processing of documents for site area {site_area}: {e}")
    
    site_data_processor = data_processor.SiteDataProcessor(data_processor)
    if is_folder_empty(summary_persist_directory):
        try:
            site_data_processor.process_summary_data_by_site_area(site_area)
        except Exception as e:
            logger.error(f"Error during processing of summary data for site area {site_area}: {e}")
            # print(f"Error during processing of summary data for site area {site_area}: {e}")

if __name__ == "__main__":
    process_all_site_areas()