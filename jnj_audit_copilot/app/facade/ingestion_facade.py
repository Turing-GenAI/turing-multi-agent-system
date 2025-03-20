import uuid

from langchain.retrievers.multi_vector import MultiVectorRetriever
from langchain.storage import LocalFileStore

# Splitters
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader

# Filtering complex metadata
from langchain_community.vectorstores.utils import filter_complex_metadata
from langchain_core.documents import Document

from ..common.config import ACTIVITY_LIST_FILE, CHROMADB_DIR
from ..common.constants import (
    CHROMADB_DOCUMENT_FOLDER_NAME,
    CHROMADB_GUIDELINES_FOLDER_NAME,
    CHUNK_OVERLAP,
    CHUNK_SIZE,
    site_id,
    trial_id,
)
from ..utils.helpers import (
    checkResources,
    create_ingestion_filepaths_dict,
    input_filepaths_dict,
    read_file,
)
from ..utils.langchain_azure_openai import (
    azure_embedding_openai_client as embedding_client,
)
from ..utils.log_setup import get_logger
from ..utils.mongo_vcore_vector_client import MongoVCoreVectorClient
from .extraction.extraction import Extraction
from .extraction_facade import ExtractionFacade

# Get the same logger instance set up earlier
logger = get_logger()
ingestion_filepaths_dict = create_ingestion_filepaths_dict(
    ACTIVITY_LIST_FILE,
    CHROMADB_DIR,
    site_id,
    trial_id,
    CHROMADB_DOCUMENT_FOLDER_NAME,
    CHROMADB_DOCUMENT_FOLDER_NAME,
    CHROMADB_GUIDELINES_FOLDER_NAME,
)


class IngestionFacade:
    def __init__(self, site_area: str, site_id: str, trial_id: str, ingested_previously=False, reingest_data_flag=False):
        if reingest_data_flag or not ingested_previously:
            logger.debug("Initialising Ingestion Facade...")
        self.site_area = site_area
        self.site_id = site_id
        self.trial_id = trial_id
        self.input_filepaths_dict = input_filepaths_dict[self.site_area]
        self.ingestion_filepaths_dict = ingestion_filepaths_dict[self.site_area]

        self.summary_persist_directory = self.ingestion_filepaths_dict["summary_persist_directory"]
        self.document_persist_directory = self.ingestion_filepaths_dict["document_persist_directory"]
        self.guidelines_persist_directory = self.ingestion_filepaths_dict["guidelines_persist_directory"]

        self.guidelines_pdf_path = self.input_filepaths_dict["guidelines_pdf_path"]
        self.summary_df_file_path = self.input_filepaths_dict["summary_df_file_path"]

        self.filtered_root_dir_path = self.input_filepaths_dict["filtered_root_dir_path"]

        self.extractor = Extraction(ingested_previously=ingested_previously, reingest_data_flag=reingest_data_flag)
        self.extraction_facade = ExtractionFacade(
            site_area=self.site_area,
            site_id=self.site_id,
            trial_id=self.trial_id,
            ingested_previously=ingested_previously,
            reingest_data_flag=reingest_data_flag,
        )
        self.resource_checker = checkResources()
        self.reingest_data_flag = reingest_data_flag

    def ingest_data(self):
        try:
            # Checking if required files have already been generated
            if (
                self.resource_checker.check_file_exists(self.summary_df_file_path)
                and self.resource_checker.check_xlsx_files_in_directory(self.filtered_root_dir_path)
                and not self.reingest_data_flag
            ):
                pass
            else:
                self.extraction_facade.extract_files()

            # Create collection name for MongoDB based on site_area
            collection_name = f"summaries_{self.site_area.lower()}"
            
            # Initialize MongoDB client (this can be done regardless of whether data needs to be loaded)
            try:
                summary_vectorstore = MongoVCoreVectorClient(
                    collection_name=collection_name,
                    embedding_function=embedding_client,
                    # Keep persist_directory for backwards compatibility
                    persist_directory=self.summary_persist_directory,
                )
                
                # Check if we need to populate MongoDB with documents
                # Either the collection doesn't exist/is empty or we're forcing reingestion
                count = summary_vectorstore.count()
                if count == 0 or self.reingest_data_flag:
                    # Load the saved summary DataFrame
                    summary = read_file(
                        file_path=self.summary_df_file_path,
                        file_format="xlsx",
                        index_col=0,
                    )
                    if summary is None:
                        logger.error(f"Summary is not available: {self.summary_df_file_path}")
                        return None, None

                    logger.debug("Successfully read input summary file")
                    # Load Excel data and generate documents and summaries
                    data_docs, data_summaries = self.extractor.excel_data_loading(self.filtered_root_dir_path, summary)
                    logger.debug("Successfully generated data_docs, data_summaries")

                    try:
                        # Create a key-value store for document storage
                        kv_store = LocalFileStore(self.document_persist_directory)
                        
                        doc_ids = [str(uuid.uuid4()) for _ in data_docs]

                        # Creating documents linked to summaries with site_area metadata
                        summary_docs = [
                            Document(
                                page_content=s, 
                                metadata={
                                    "doc_id": doc_ids[i],
                                    "site_area": self.site_area
                                }
                            ) for i, s in enumerate(data_summaries)
                        ]

                        # Create a new vector store with the documents instead of adding to existing one
                        summary_vectorstore = MongoVCoreVectorClient.from_documents(
                            documents=summary_docs,
                            embedding=embedding_client,
                            collection_name=collection_name,
                            persist_directory=self.summary_persist_directory,
                        )
                        
                        # Create the retriever with the new vector store
                        data_retriever = MultiVectorRetriever(
                            vectorstore=summary_vectorstore,
                            byte_store=kv_store,
                            id_key="doc_id",
                        )
                        
                        # Store the document content in the local file store
                        data_retriever.docstore.mset(list(zip(doc_ids, data_docs)))
                        logger.debug("Created Multivector Site Data Retriever")
                        logger.info("Successfully created the Site Data Retriever with MongoDB")
                    except Exception as e:
                        logger.error(f"Could not create the Multivector Site Data Retriever due to error: {e}")
                        return None, None
                else:
                    # Vector store already exists, just create the retriever
                    try:
                        kv_store = LocalFileStore(self.document_persist_directory)
                        id_key = "doc_id"
                        # The retriever
                        data_retriever = MultiVectorRetriever(
                            vectorstore=summary_vectorstore,
                            byte_store=kv_store,
                            id_key=id_key,
                        )
                        logger.debug("Using existing Multivector Site Data Retriever")
                    except Exception as e:
                        logger.error(f"Could not retrieve the MultiVectorRetriever due to error: {e}")
                        return None, None
            except Exception as e:
                logger.error(f"Could not initialize MongoDB vector client due to error: {e}")
                return None, None

            return summary_vectorstore, data_retriever

        except Exception as e:
            logger.error(f"An unexpected error occurred during data ingestion(ingest_data): {e}")
            return None, None

    def ingest_guidelines(self):
        try:
            # Create collection name for MongoDB based on site_area
            collection_name = f"guidelines_{self.site_area.lower()}"
            
            # Initialize MongoDB client
            try:
                guidelines_vectorstore = MongoVCoreVectorClient(
                    collection_name=collection_name,
                    embedding_function=embedding_client,
                    # Keep persist_directory for backwards compatibility
                    persist_directory=self.guidelines_persist_directory,
                )
                
                # Check if we need to populate MongoDB with documents
                # Either the collection doesn't exist/is empty or we're forcing reingestion
                count = guidelines_vectorstore.count()
                if count == 0 or self.reingest_data_flag:
                    # If retriever is being created from scratch, process the
                    # guidelines PDF and split into chunks
                    pdf_loaders = PyPDFLoader(self.guidelines_pdf_path)
                    guidelines_docs = pdf_loaders.load()

                    # Filter and split the PDF documents into manageable chunks
                    filtered_guidelines_docs = filter_complex_metadata(guidelines_docs)
                    text_splitter = RecursiveCharacterTextSplitter(chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP)
                    splits = text_splitter.split_documents(filtered_guidelines_docs)
                    
                    # Add site_area to document metadata for filtering
                    for doc in splits:
                        doc.metadata["site_area"] = self.site_area
                    
                    # Use MongoDB client to store documents - using from_documents instead of add_documents
                    try:
                        # Create a new vector store with the documents
                        guidelines_vectorstore = MongoVCoreVectorClient.from_documents(
                            documents=splits,
                            embedding=embedding_client,
                            collection_name=collection_name,
                            persist_directory=self.guidelines_persist_directory,
                        )
                        logger.info(f"Successfully created the Guidelines Data Retriever using MongoDB for {self.site_area}")
                    except Exception as e:
                        logger.error(f"Could not create guidelines_vectorstore due to error: {e}")
                        return None
                else:
                    logger.info(f"Using existing Guidelines Data Retriever for {self.site_area}")
            except Exception as e:
                logger.error(f"Could not initialize MongoDB vector client due to error: {e}")
                return None
                
            return guidelines_vectorstore
            
        except Exception as e:
            logger.error(f"An unexpected error occurred during data ingestion(ingest_guidelines): {e}")
            return None
