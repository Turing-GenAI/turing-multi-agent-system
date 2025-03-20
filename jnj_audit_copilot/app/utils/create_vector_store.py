import os
from typing import Dict, List, Optional
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_community.document_loaders import (
    TextLoader,
    PyPDFLoader,
    Docx2txtLoader,
)
import pandas as pd
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv
import argparse
import sys

from ..scripts.box_copy_files import get_box_client, process_folder_contents
from .langchain_azure_openai import azure_embedding_openai_client
from .log_setup import get_logger
from ..common.constants import CHUNK_SIZE, CHUNK_OVERLAP
from .mongo_vcore_vector_client import MongoVCoreVectorClient

# Load environment variables
load_dotenv()

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
BOX_DOWNLOAD_FOLDER = os.path.join(get_project_root(), "jnj_audit_copilot", 'documents')

# PostgreSQL connection
db_url = "postgresql://citus:V3ct0r%243arch%402024%21@c-rag-pg-cluster-vectordb.ohp4jnn4od53fv.postgres.cosmos.azure.com:5432/rag_db?sslmode=require"

# Get logger instance
logger = get_logger()

class DataProcessor:
    def __init__(self):
        self.box_root_folder_id = BOX_ROOT_FOLDER_ID
        self.base_documents_dir = BOX_DOWNLOAD_FOLDER
        self.site_area_exclusions = ['Demo', 'Risk_Scores', 'SGR']
        
        # Get embedding model name from environment
        self.embedding_model_name = os.getenv("AZURE_OPENAI_EMBEDDING_API_MODEL_NAME", "")
        
        # Get vector dimension from environment with proper error handling
        try:
            env_dimension = os.getenv("VECTOR_DIMENSION")
            if env_dimension and env_dimension.strip():
                self.vector_dimension = int(env_dimension)
                logger.info(f"Using vector dimension from environment: {self.vector_dimension}")
            else:
                # Use dimension based on model
                if "small" in self.embedding_model_name.lower():
                    self.vector_dimension = 1536  # Dimension for text-embedding-3-small
                elif "large" in self.embedding_model_name.lower():
                    self.vector_dimension = 2000
                else:
                    self.vector_dimension = 1536  # Safe default
                
                logger.info(f"Using default dimension for model {self.embedding_model_name}: {self.vector_dimension}")
        except (ValueError, TypeError) as e:
            logger.error(f"Error parsing VECTOR_DIMENSION environment variable: {e}")
            # Fallback to safe default
            self.vector_dimension = 1536
            logger.warning(f"Falling back to safe default dimension: {self.vector_dimension}")
        
        # Set the vector index type (can be overridden from environment)
        self.vector_index_type = os.getenv("VECTOR_INDEX_TYPE", "vector-ivf")
        
        # Get vector index creation flag (can be overridden from environment)
        create_vector_index_env = os.getenv("CREATE_VECTOR_INDEX", "true").lower()
        self.create_vector_index = create_vector_index_env not in ("false", "0", "no", "n")
        
        # Log configuration
        logger.info(f"Vector DB Configuration:")
        logger.info(f"  - Embedding Model: {self.embedding_model_name}")
        logger.info(f"  - Vector Dimension: {self.vector_dimension}")
        logger.info(f"  - Vector Index Type: {self.vector_index_type}")
        logger.info(f"  - Vector Index Creation: {'Enabled' if self.create_vector_index else 'Disabled'}")
    
    def get_vector_client(self, collection_name, **kwargs):
        """
        Get the appropriate vector client based on configuration
        """
        vector_client = MongoVCoreVectorClient(
                collection_name=collection_name,
                embedding_function=azure_embedding_openai_client,
                vector_dimension=self.vector_dimension,
                index_type=self.vector_index_type,
                create_vector_index=self.create_vector_index,
                **kwargs
            )
        return vector_client
    
    class SiteDataProcessor:
        def __init__(self, parent):
            self.parent = parent
            self.base_documents_dir = parent.base_documents_dir
            self.site_area_exclusions = parent.site_area_exclusions
            self.db_url = db_url
            self.vector_dimension = parent.vector_dimension
            self.vector_index_type = parent.vector_index_type
            self.create_vector_index = parent.create_vector_index
            
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
                
                return df
            except Exception as e:
                logger.error(f"Error getting tables from summaries schema: {e}")
                return None

        def process_summary_data_by_site_area(self, site_area: str, force_reingestion: bool = False):
            """
            Create a new vector store collection for summaries and store embeddings.
            Each site area gets its own collection.
            
            Args:
                site_area (str): Name of the site area (e.g., 'PD', 'AE_SAE')
                force_reingestion (bool): If True, will drop existing collection and recreate
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
                
                # Store embeddings with site-specific collection name
                logger.info(f"Storing summaries for {site_area}...")
                
                collection_name = f"summaries_{site_area.lower()}"
                
                # Create a client to check if collection exists and has documents
                client = MongoVCoreVectorClient(
                    collection_name=collection_name,
                    embedding_function=azure_embedding_openai_client,
                    vector_dimension=self.vector_dimension,
                    index_type=self.vector_index_type,
                    create_vector_index=self.create_vector_index
                )
                
                # If reingestion is forced, delete the existing collection
                if force_reingestion:
                    try:
                        # Drop the existing collection
                        client.collection.drop()
                        logger.info(f"Dropped existing collection {collection_name} for reingestion")
                    except Exception as drop_error:
                        logger.warning(f"Could not drop collection {collection_name}: {drop_error}")
                
                # Create documents with metadata
                documents = []
                for _, row in df.iterrows():
                    doc = Document(
                        page_content=row["Summary"],
                        metadata={
                            "site_area": site_area,
                            "database_name": row.get("database_name"),
                            "schema_name": row.get("schema_name"),
                            "table_name": row.get("table_name")
                        }
                    )
                    documents.append(doc)

                # Get the appropriate vector client based on configuration
                    
                vectorstore = MongoVCoreVectorClient.from_documents(
                        documents=documents,
                        embedding=azure_embedding_openai_client,
                        collection_name=collection_name,
                        vector_dimension=self.vector_dimension,
                        index_type=self.vector_index_type,
                        create_vector_index=self.create_vector_index
                    )
                logger.info(f"Successfully stored {len(summaries)} embeddings in MongoDB vCore for {site_area}")

                return vectorstore
            except Exception as e:
                logger.error(f"Error storing summaries: {e}")
                logger.error(f"Error details: {str(e)}")
                return None

        def process_all_summary_data(self):
            """
            Process all available site areas and create their respective vector store collections.
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


    class GuidelinesProcessor:
        def __init__(self, parent):
            self.parent = parent
            self.base_documents_dir = parent.base_documents_dir
            self.site_area_exclusions = parent.site_area_exclusions
            self.box_root_folder_id = parent.box_root_folder_id
            self.vector_dimension = parent.vector_dimension
            self.vector_index_type = parent.vector_index_type
            self.create_vector_index = parent.create_vector_index
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
                print("Initializing Box client...")

                try:
                    client = get_box_client()
                except Exception as box_auth_error:
                    logger.error(f"Box authentication failed: {box_auth_error}")
                    print(f"Box authentication failed: {box_auth_error}")
                    print("Continuing without Box download. Using existing files if available.")
                    

                # Check if we have any existing files to work with
                if os.path.exists(self.base_documents_dir) and os.listdir(self.base_documents_dir):
                    logger.info("Using existing documents directory.")

                else:
                    # Create an empty directory so the rest of the code can continue
                    os.makedirs(self.base_documents_dir, exist_ok=True)
                    logger.warning("Created empty documents directory. No Box files will be available.")                
                
                logger.info("Starting download of files from Box...")
                stats = process_folder_contents(
                    client,
                    folder_id=self.box_root_folder_id,
                    local_base_path=self.base_documents_dir,
                    download_mode="smart"  # Use smart mode to only download changed files, we can also use "skip" to skip download and "overwrite" to overwrite existing files
                )
                print(f"Download complete. Stats: {stats}")
                logger.info(f"Download complete. Stats: {stats}")
                return True
            except Exception as e:
                logger.error(f"Error downloading files from Box: {e}")
                print(f"Error downloading files from Box: {e}")

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

        def process_documents_by_site_area(self, site_area: str, force_reingestion: bool = False):
            """
            Process all documents in a site area and store in vector database
            
            Args:
                site_area (str): Name of the site area (e.g., 'PD', 'AE_SAE')
                force_reingestion (bool): If True, will drop existing collection and recreate
            """
            try:
                site_area_path = os.path.join(self.base_documents_dir, site_area)
                if not os.path.exists(site_area_path):
                    logger.error(f"Site area directory not found: {site_area_path}")
                    return None

                all_splits = []
                
                # Walk through all files in the site area
                for root, _, files in os.walk(site_area_path):
                    for file in files:
                        file_path = os.path.join(root, file)
                        logger.info(f"Processing file: {file_path}")
                        
                        splits = self.load_and_split_document(file_path)
                        if splits:
                            all_splits.extend(splits)
                            rel_path = os.path.relpath(file_path, site_area_path)
                            
                            # Add metadata information to existing metadata
                            for i, doc in enumerate(splits):
                                doc.metadata.update({
                                    "site_area": site_area,
                                    "file_name": file,
                                    "relative_path": rel_path,
                                    "chunk_index": i
                                })

                if not all_splits:
                    logger.warning(f"No documents processed for site area: {site_area}")
                    return None

                # Create and store in vector database
                collection_name = f"guidelines_{site_area.lower()}"
                
                # Create a client to check if collection exists
                if force_reingestion:
                    try:
                        # Create a temporary client to drop the existing collection
                        temp_client = MongoVCoreVectorClient(
                            collection_name=collection_name,
                            embedding_function=azure_embedding_openai_client,
                            vector_dimension=self.vector_dimension,
                            index_type=self.vector_index_type,
                            create_vector_index=self.create_vector_index
                        )
                        # Drop the existing collection
                        temp_client.collection.drop()
                        logger.info(f"Dropped existing collection {collection_name} for reingestion")
                    except Exception as drop_error:
                        logger.warning(f"Could not drop collection {collection_name}: {drop_error}")
                
                vectorstore = MongoVCoreVectorClient.from_documents(
                        documents=all_splits,
                        embedding=azure_embedding_openai_client,
                        collection_name=collection_name,
                        vector_dimension=self.vector_dimension,
                        index_type=self.vector_index_type,
                        create_vector_index=self.create_vector_index
                    )
                logger.info(f"Successfully created MongoDB vCore vector store for {site_area} with {len(all_splits)} chunks")
                
                return vectorstore
                
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

def process_all_by_site_area(site_area: str, force_reingestion: bool = False):
    """
    Process a specific site area's data and update the MongoDB vector stores.
    
    This function allows targeted reingestion of data for a specific site area,
    which is useful when there are changes to the source data that need to be 
    reflected in the RAG pipeline.
    
    Args:
        site_area (str): The site area to process (e.g. 'PD', 'AE_SAE')
        force_reingestion (bool): If True, drops existing collections before reingestion
                               to ensure clean data. Default is False.
    
    Returns:
        dict: A dictionary with status information about the processing
    """
    results = {
        "site_area": site_area,
        "guidelines_processed": False,
        "summaries_processed": False
    }
    
    try:
        logger.info(f"Starting processing for site area: {site_area}")
        if force_reingestion:
            logger.info(f"Force reingestion enabled - will drop existing collections")
        
        # Initialize the processor
        data_processor = DataProcessor()
        
        # Process guidelines documents
        try:
            guidelines_processor = data_processor.GuidelinesProcessor(data_processor)
            
            # Download files from Box if necessary
            if force_reingestion:
                logger.info("Triggering Box file download due to force reingestion")
                guidelines_processor.download_box_files()
            elif not os.path.exists(os.path.join(BOX_DOWNLOAD_FOLDER, site_area)):
                logger.info(f"Site area directory {site_area} not found, downloading Box files")
                guidelines_processor.download_box_files()
            
            # Process the guidelines documents
            logger.info(f"Processing guidelines documents for {site_area}")
            guidelines_vectorstore = guidelines_processor.process_documents_by_site_area(
                site_area=site_area,
                force_reingestion=force_reingestion
            )
            
            if guidelines_vectorstore:
                count = guidelines_vectorstore.count()
                logger.info(f"Successfully processed guidelines for {site_area}. Collection now has {count} documents.")
                
                # Debug: Check metadata of first few documents
                if count > 0:
                    try:
                        # Sample query to check metadata
                        sample_results = guidelines_vectorstore.similarity_search(
                            query="test query",
                            k=min(3, count)
                        )
                        
                        logger.info(f"Sample guidelines docs metadata check ({len(sample_results)} docs):")
                        for i, doc in enumerate(sample_results):
                            logger.info(f"Doc {i+1} metadata: {doc.metadata}")
                            # Comment out problematic logging line with encoding issues
                            # logger.info(f"Doc {i+1} content preview: {doc.page_content[:50]}...")
                    except Exception as check_e:
                        logger.error(f"Error checking guidelines metadata: {check_e}")
                
                results["guidelines_processed"] = True
                results["guidelines_count"] = count
        except Exception as e:
            logger.error(f"Error processing guidelines for {site_area}: {e}")
            results["guidelines_error"] = str(e)
        
        # Process summary data
        try:
            site_data_processor = data_processor.SiteDataProcessor(data_processor)
            
            # Process the summary data
            logger.info(f"Processing summary data for {site_area}")
            summary_vectorstore = site_data_processor.process_summary_data_by_site_area(
                site_area=site_area,
                force_reingestion=force_reingestion
            )
            
            if summary_vectorstore:
                count = summary_vectorstore.count()
                logger.info(f"Successfully processed summaries for {site_area}. Collection now has {count} documents.")
                
                # Debug: Check metadata of first few documents
                if count > 0:
                    try:
                        # Get the collection name
                        collection_name = f"summaries_{site_area.lower()}"
                        logger.info(f"Summary collection name: {collection_name}")
                        
                        # Sample query to check metadata
                        sample_results = summary_vectorstore.similarity_search(
                            query="test query",
                            k=min(3, count)
                        )
                        
                        logger.info(f"Sample summary docs metadata check ({len(sample_results)} docs):")
                        for i, doc in enumerate(sample_results):
                            logger.info(f"Doc {i+1} metadata: {doc.metadata}")
                            # Comment out problematic logging line with encoding issues
                            # logger.info(f"Doc {i+1} content preview: {doc.page_content[:50]}...")
                            
                        # Check if site_area field exists and is correctly set
                        missing_site_area = [i for i, doc in enumerate(sample_results) 
                                           if 'site_area' not in doc.metadata 
                                           or doc.metadata['site_area'] != site_area]
                        
                        if missing_site_area:
                            logger.warning(f"Found {len(missing_site_area)} docs without proper site_area metadata")
                        
                        # Try a filtered search to confirm filtering works
                        filtered_results = summary_vectorstore.similarity_search(
                            query="test query",
                            k=min(3, count),
                            filter={"site_area": site_area}
                        )
                        
                        logger.info(f"Filtered search returned {len(filtered_results)} results")
                        
                    except Exception as check_e:
                        logger.error(f"Error checking summary metadata: {check_e}")
                
                results["summaries_processed"] = True
                results["summaries_count"] = count
        except Exception as e:
            logger.error(f"Error processing summaries for {site_area}: {e}")
            results["summaries_error"] = str(e)
        
        logger.info(f"Completed processing for site area: {site_area}")
        return results
        
    except Exception as e:
        logger.error(f"An unexpected error occurred processing site area {site_area}: {e}")
        results["error"] = str(e)
        return results

if __name__ == "__main__":
    # Create argument parser
    parser = argparse.ArgumentParser(description="MongoDB Vector Store Creation and Management")
    parser.add_argument("--mode", choices=["all", "site"], default="all",
                       help="Processing mode: 'all' for all site areas, 'site' for specific site area")
    parser.add_argument("--site-area", type=str, 
                       help="Site area to process (required when mode is 'site')")
    parser.add_argument("--force-reingestion", action="store_true", 
                       help="Force reingestion of data (drop existing collections)")
    
    # Parse arguments
    args = parser.parse_args()
    
    # Log the vector store being used
    logger.info("Using MongoDB vCore as vector store")
    print("Using MongoDB vCore as vector store")
    
    # Process based on the chosen mode
    if args.mode == "site":
        # Check if site area is provided
        if not args.site_area:
            print("❌ Error: Site area is required when mode is 'site'")
            parser.print_help()
            sys.exit(1)
            
        # Process specific site area
        print(f"\n=== Processing Single Site Area: {args.site_area} ===")
        print(f"Force Reingestion: {'Enabled' if args.force_reingestion else 'Disabled'}")
        
        results = process_all_by_site_area(args.site_area, args.force_reingestion)
        
        # Print results
        if results["guidelines_processed"] and results["summaries_processed"]:
            print("\n✅ Successfully processed both guidelines and summaries")
            print(f"  - Guidelines documents: {results.get('guidelines_count', 0)}")
            print(f"  - Summary documents: {results.get('summaries_count', 0)}")
        else:
            print("\n⚠️ Processing completed with some issues:")
            
            if results.get("guidelines_processed"):
                print(f"✅ Guidelines: {results.get('guidelines_count', 0)} documents")
            elif "guidelines_error" in results:
                print(f"❌ Guidelines error: {results['guidelines_error']}")
            else:
                print("❌ Guidelines processing failed")
                
            if results.get("summaries_processed"):
                print(f"✅ Summaries: {results.get('summaries_count', 0)} documents")
            elif "summaries_error" in results:
                print(f"❌ Summaries error: {results['summaries_error']}")
            else:
                print("❌ Summaries processing failed")
                
        print(f"\n=== Processing of {args.site_area} Complete ===")
    else:
        # Process all site areas (original functionality)
        data_processor = DataProcessor()
        guidelines_processor = data_processor.GuidelinesProcessor(data_processor)
        
        # Step 1: Download Box files
        print("=== Starting Box File Download ===")
        download_success = guidelines_processor.download_box_files()
        if download_success:
            print("✅ Box file download completed successfully or using existing files")
        else:
            print("⚠️ Box file download had issues - will use any existing files instead")
        
        # Step 2: Process documents and create vector stores
        print("\n=== Starting Guidelines Processing ===")
        results = guidelines_processor.process_all_documents()
        successful_areas = [area for area, success in results.items() if success]
        failed_areas = [area for area, success in results.items() if not success]
        
        print(f"✅ Successfully processed {len(successful_areas)} site areas: {', '.join(successful_areas) if successful_areas else 'None'}")
        if failed_areas:
            print(f"❌ Failed to process {len(failed_areas)} site areas: {', '.join(failed_areas)}")
        
        # Step 3: Process summary data from PostgreSQL
        print("\n=== Starting Summary Data Processing ===")
        site_data_processor = data_processor.SiteDataProcessor(data_processor)
        site_data_processor.process_all_summary_data()
        print("✅ Summary data processing completed")
        
        print("\n=== Vector Store Creation Complete ===")
        print("The data is now ready for querying using the MongoDB vCore vector search")