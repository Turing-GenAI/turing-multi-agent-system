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

from ..scripts.box_copy_files import get_box_client, process_folder_contents
from .langchain_azure_openai import azure_embedding_openai_client
from .log_setup import get_logger
from ..common.constants import CHUNK_SIZE, CHUNK_OVERLAP

# Get logger instance
logger = get_logger()

class GuidelinesProcessor:
    def __init__(self):
        self.base_documents_dir = "Documents"
        self.base_chromadb_dir = "chromadb2"
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
            folder_id = os.getenv("BOX_ROOT_FOLDER_ID", "0")
            
            logger.info("Starting download of files from Box...")
            stats = process_folder_contents(
                client,
                folder_id=folder_id,
                local_base_path=self.base_documents_dir,
                download_mode="smart"  # Use smart mode to only download changed files, Else "overwrite" can also be used
            )
            
            logger.info(f"Download complete. Stats: {stats}")
            return True
            
        except Exception as e:
            logger.error(f"Error downloading files from Box: {e}")
            return False

    def setup_site_area_folders(self, site_area: str) -> str:
        """
        Create the required folder structure for a site area
        """
        base_dir = os.path.join(self.base_chromadb_dir, site_area)
        folders = ["document_persist", "guidelines", "summary"]
        
        for folder in folders:
            folder_path = os.path.join(base_dir, folder)
            os.makedirs(folder_path, exist_ok=True)
            logger.info(f"Created/verified folder: {folder_path}")
            
        return os.path.join(base_dir, "guidelines")

    def load_and_split_document(self, file_path: str) -> Optional[List[Document]]:
        """
        Load a document and split it into chunks
        """
        try:
            _, ext = os.path.splitext(file_path)
            if ext.lower() not in self.supported_extensions:
                logger.warning(f"Unsupported file type: {ext} for file {file_path}")
                return None

            loader_class = self.supported_extensions[ext.lower()]
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

    def process_site_area(self, site_area: str) -> Optional[Chroma]:
        """
        Process all documents in a site area and create ChromaDB
        """
        try:
            site_area_path = os.path.join(self.base_documents_dir, site_area)
            if not os.path.exists(site_area_path):
                logger.error(f"Site area directory not found: {site_area_path}")
                return None

            # Setup ChromaDB directory
            persist_directory = self.setup_site_area_folders(site_area)
            
            all_splits = []
            metadata_list = []
            
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
            vectorstore = Chroma.from_texts(
                texts=all_splits,
                embedding=azure_embedding_openai_client,
                metadatas=metadata_list,
                persist_directory=persist_directory
            )
            
            logger.info(f"Successfully created ChromaDB for {site_area} with {len(all_splits)} chunks")
            return vectorstore
            
        except Exception as e:
            logger.error(f"Error processing site area {site_area}: {e}")
            return None

    def process_all_site_areas(self) -> Dict[str, bool]:
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
            
            logger.info(f"Found site areas: {site_areas}")
            
            for site_area in site_areas:
                logger.info(f"Processing site area: {site_area}")
                vectorstore = self.process_site_area(site_area)
                results[site_area] = vectorstore is not None
                
            return results
            
        except Exception as e:
            logger.error(f"Error processing site areas: {e}")
            return results

def test_box_download():
    """Test the Box download functionality"""
    processor = GuidelinesProcessor()
    success = processor.download_box_files()
    print(f"Box download test {'successful' if success else 'failed'}")

def test_single_site_area(site_area: str):
    """Test processing a single site area"""
    processor = GuidelinesProcessor()
    vectorstore = processor.process_site_area(site_area)
    print(f"Site area processing test {'successful' if vectorstore else 'failed'}")

def test_all_site_areas():
    """Test processing all site areas"""
    processor = GuidelinesProcessor()
    results = processor.process_all_site_areas()
    print("Processing results by site area:", results)

if __name__ == "__main__":
    # Test individual components
    print("Testing Box download...")
    test_box_download()
    
    # print("\nTesting single site area processing...")
    # test_single_site_area("pd")  # Replace with actual site area
    
    print("\nTesting all site areas processing...")
    test_all_site_areas()

"""Use following code to use above module in other modules.
from jnj_audit_copilot.app.utils.create_guidelines_db import GuidelinesProcessor

# Test just the Box download
processor = GuidelinesProcessor()
processor.download_box_files()

# Process all site areas
processor.process_all_site_areas()
"""