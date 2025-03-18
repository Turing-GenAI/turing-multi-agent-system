import os
import json
from typing import Dict, List, Optional, Any, Tuple
from dotenv import load_dotenv
import numpy as np
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.errors import ConnectionFailure, OperationFailure

from ..common.constants import CHUNK_SIZE, CHUNK_OVERLAP
from .log_setup import get_logger
from .langchain_azure_openai import azure_embedding_openai_client

# Get logger instance
logger = get_logger()

# Load environment variables
load_dotenv()

class MongoVCoreVectorClient:
    """
    Client for Azure Cosmos DB for MongoDB vCore with native vector search capabilities.
    This class provides vector storage and search functionality using the vCore API's
    native vector index and search capabilities.
    """
    
    def __init__(
        self,
        collection_name: str,
        persist_directory: Optional[str] = None,  # Kept for compatibility with ChromaDB
        embedding_function = None,
        vector_dimension: int = None,  # Can be passed explicitly or determined from env
        index_type: str = None,  # Can be passed explicitly or determined from env
        create_vector_index: bool = None  # Can be passed explicitly or determined from env
    ):
        """
        Initialize the MongoDB vCore Vector Client.
        
        Args:
            collection_name (str): Name of the MongoDB collection to use
            persist_directory (str, optional): Ignored, kept for compatibility with ChromaDB
            embedding_function: Function to convert text to embedding vectors
            vector_dimension (int, optional): Dimension of the vectors to be stored
            index_type (str): Type of vector index to create (default from env or "vector-ivf")
            create_vector_index (bool): Whether to create a vector index (default from env or True)
        """
        # MongoDB connection parameters from environment variables
        self.connection_string = os.getenv("MONGODB_CONNECTION_STRING")
        if not self.connection_string:
            raise ValueError("MONGODB_CONNECTION_STRING environment variable is not set")
            
        self.database_name = os.getenv("MONGODB_DATABASE_NAME", "vector_db")
        self.embedding_function = embedding_function or azure_embedding_openai_client
        self.collection_name = collection_name
        
        # Get embedding model name from environment
        embedding_model_name = os.getenv("AZURE_OPENAI_EMBEDDING_API_MODEL_NAME", "")
        
        # Determine vector dimension with priority:
        # 1. Explicitly passed parameter
        # 2. Environment variable VECTOR_DIMENSION
        # 3. From embedding_function.dimension if available
        # 4. Default based on model name
        # 5. Fallback to safe default (1536)
        if vector_dimension is not None:
            self.vector_dimension = vector_dimension
            logger.info(f"Using explicitly provided vector dimension: {self.vector_dimension}")
        else:
            try:
                # Check if dimension is specified in environment
                env_dimension = os.getenv("VECTOR_DIMENSION")
                if env_dimension and env_dimension.strip():
                    self.vector_dimension = int(env_dimension)
                    logger.info(f"Using vector dimension from environment: {self.vector_dimension}")
                # Check if embedding function has dimension attribute
                elif hasattr(self.embedding_function, 'dimension'):
                    self.vector_dimension = self.embedding_function.dimension
                    logger.info(f"Using dimension from embedding function: {self.vector_dimension}")
                # Default based on model name
                else:
                    if "small" in embedding_model_name.lower():
                        self.vector_dimension = 1536  # For text-embedding-3-small
                    elif "large" in embedding_model_name.lower():
                        # Azure Cosmos DB has a 2000 dimension limit
                        self.vector_dimension = 2000
                    else:
                        self.vector_dimension = 1536  # Safe default
                    logger.info(f"Using default dimension for model {embedding_model_name}: {self.vector_dimension}")
            except (ValueError, TypeError) as e:
                logger.error(f"Error determining vector dimension: {e}")
                # Fallback to safe default
                self.vector_dimension = 1536
                logger.warning(f"Falling back to safe default dimension: {self.vector_dimension}")
        
        # Set the vector index type (with priority: parameter, env, default)
        if index_type is not None:
            self.index_type = index_type
        else:
            self.index_type = os.getenv("VECTOR_INDEX_TYPE", "vector-ivf")
        
        # Set vector index creation flag (with priority: parameter, env, default=True)
        if create_vector_index is not None:
            self.create_vector_index = create_vector_index
        else:
            create_vector_index_env = os.getenv("CREATE_VECTOR_INDEX", "true").lower()
            self.create_vector_index = create_vector_index_env not in ("false", "0", "no", "n")
        
        self.vector_field = "embedding"  # Field name where vector embeddings are stored
        
        # Log configuration
        logger.info(f"MongoDB Vector Client Configuration for {collection_name}:")
        logger.info(f"  - Vector Dimension: {self.vector_dimension}")
        logger.info(f"  - Vector Index Type: {self.index_type}")
        logger.info(f"  - Vector Index Creation: {'Enabled' if self.create_vector_index else 'Disabled'}")
        
        try:
            # Create MongoDB client and connect to database
            self.client = MongoClient(self.connection_string)
            # Verify the connection is working
            self.client.admin.command('ping')
            logger.info(f"Successfully connected to MongoDB for collection {collection_name}")
            
            # Get database and collection
            self.db = self.client[self.database_name]
            self.collection = self.db[self.collection_name]
            
            # Create a metadata index for filtering
            try:
                self.collection.create_index([("metadata.site_area", 1)])
                logger.info(f"Created metadata index for collection {collection_name}")
            except Exception as metadata_index_error:
                logger.warning(f"Failed to create metadata index: {str(metadata_index_error)}")
            
            # Create vector index using vCore capabilities if requested
            if self.create_vector_index:
                try:
                    self._create_vector_index()
                except Exception as vector_index_error:
                    logger.error(f"Failed to create vector index: {str(vector_index_error)}")
                    # Raise the exception to make it clear vector search won't work
                    raise
            else:
                logger.info("Skipping vector index creation as requested")
            
        except (ConnectionFailure, OperationFailure) as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            raise
    
    def _create_vector_index(self):
        """
        Create a vector index using Azure Cosmos DB for MongoDB vCore's native vector search capabilities.
        """
        try:
            # Check if the index already exists
            existing_indexes = list(self.collection.list_indexes())
            for index in existing_indexes:
                if "cosmosSearch" in str(index):
                    logger.info(f"Vector index already exists for collection {self.collection_name}")
                    return
            
            # Create a vector index with proper configuration
            logger.info(f"Creating vector index for collection {self.collection_name} with dimension {self.vector_dimension}")
            
            self.collection.create_index(
                [(self.vector_field, "cosmosSearch")],
                cosmosSearchOptions={
                    "kind": self.index_type,
                    "dimensions": self.vector_dimension,
                    "similarity": "COS"  # Cosine similarity
                },
                name="vectorSearchIndex"
            )
            
            logger.info(f"Successfully created vector index for collection {self.collection_name}")
            
        except Exception as e:
            logger.error(f"Failed to create vector index: {str(e)}")
            # Don't swallow the error - raise it so it's clear vector search won't work
            raise
    
    def add_texts(
        self,
        texts: List[str],
        metadatas: Optional[List[Dict[str, Any]]] = None,
        ids: Optional[List[str]] = None
    ) -> List[str]:
        """
        Add texts with their embeddings and metadata to MongoDB.
        
        Args:
            texts (List[str]): List of text documents to add
            metadatas (List[Dict], optional): Metadata for each text
            ids (List[str], optional): IDs for each text
            
        Returns:
            List[str]: List of document IDs
        """
        if not texts:
            return []
        
        # Generate embeddings for all texts
        try:
            embeddings = self.embedding_function.embed_documents(texts)
        except Exception as e:
            logger.error(f"Error generating embeddings: {str(e)}")
            raise
        
        # If no IDs provided, generate sequential IDs
        if ids is None:
            # Get the current count and use as starting ID
            count = self.collection.count_documents({})
            ids = [str(i + count) for i in range(len(texts))]
        
        # If no metadata provided, use empty dicts
        if metadatas is None:
            metadatas = [{} for _ in texts]
        
        # Create documents to insert
        documents = []
        for i, (text, embedding, metadata, doc_id) in enumerate(zip(texts, embeddings, metadatas, ids)):
            doc = {
                "_id": doc_id,
                "page_content": text,
                self.vector_field: embedding,
                "metadata": metadata
            }
            documents.append(doc)
        
        # Insert documents into MongoDB
        try:
            # Use bulk insert for efficiency
            if documents:
                result = self.collection.insert_many(documents)
                logger.info(f"Successfully added {len(result.inserted_ids)} documents to MongoDB vCore")
                return list(result.inserted_ids)
        except Exception as e:
            logger.error(f"Error adding documents to MongoDB vCore: {str(e)}")
            raise
        
        return ids
    
    @classmethod
    def from_texts(
        cls,
        texts: List[str],
        embedding: Any,
        metadatas: Optional[List[dict]] = None,
        collection_name: str = "vectors",
        persist_directory: Optional[str] = None,  # Kept for compatibility
        vector_dimension: int = None,  # Changed from hardcoded 3072 to None
        index_type: str = "vector-ivf",  # Using IVF instead of HNSW for compatibility
        create_vector_index: bool = True,  # Option to skip vector index creation
        **kwargs
    ) -> "MongoVCoreVectorClient":
        """
        Create a new MongoVCoreVectorClient and add texts to it.
        
        Args:
            texts (List[str]): List of text documents to add
            embedding: Function to convert text to embedding vectors
            metadatas (List[Dict], optional): Metadata for each text
            collection_name (str): Name of the MongoDB collection to use
            persist_directory (str, optional): Ignored, kept for compatibility with ChromaDB
            vector_dimension (int, optional): Dimension of the vectors (default: determined from model)
            index_type (str): Type of vector index to create (default: "vector-ivf")
            create_vector_index (bool): Whether to create a vector index (default: True)
            
        Returns:
            MongoVCoreVectorClient: A new client with the added texts
        """
        # Create a new client
        client = cls(
            collection_name=collection_name,
            embedding_function=embedding,
            vector_dimension=vector_dimension,
            index_type=index_type,
            create_vector_index=create_vector_index,
            **kwargs
        )
        
        # Add the texts
        client.add_texts(texts=texts, metadatas=metadatas)
        
        return client
    
    @classmethod
    def from_documents(
        cls,
        documents: List[Any],  # Should be langchain Document objects
        embedding: Any,
        collection_name: str = "vectors",
        persist_directory: Optional[str] = None,  # Kept for compatibility
        vector_dimension: int = None,  # Changed from hardcoded 3072 to None
        index_type: str = "vector-ivf",  # Using IVF instead of HNSW for compatibility
        create_vector_index: bool = True,  # Option to skip vector index creation
        **kwargs
    ) -> "MongoVCoreVectorClient":
        """
        Create a new MongoVCoreVectorClient and add documents to it.
        
        Args:
            documents (List[Document]): List of Langchain Document objects
            embedding: Function to convert text to embedding vectors
            collection_name (str): Name of the MongoDB collection to use
            persist_directory (str, optional): Ignored, kept for compatibility with ChromaDB
            vector_dimension (int, optional): Dimension of the vectors (default: determined from model)
            index_type (str): Type of vector index to create (default: "vector-ivf")
            create_vector_index (bool): Whether to create a vector index (default: True)
            
        Returns:
            MongoVCoreVectorClient: A new client with the added documents
        """
        texts = [doc.page_content for doc in documents]
        metadatas = [doc.metadata for doc in documents]
        
        # Determine vector dimension if possible
        if hasattr(embedding, 'dimension'):
            vector_dimension = embedding.dimension
        
        return cls.from_texts(
            texts=texts,
            embedding=embedding,
            metadatas=metadatas,
            collection_name=collection_name,
            vector_dimension=vector_dimension,
            index_type=index_type,
            create_vector_index=create_vector_index,
            **kwargs
        )
    
    def similarity_search_with_relevance_scores(
        self,
        query: str,
        k: int = 4,
        filter: Optional[Dict[str, Any]] = None
    ) -> List[Tuple[Any, float]]:
        """
        Perform a similarity search using Azure Cosmos DB's vector search capabilities.
        
        Args:
            query (str): Query text
            k (int): Number of results to return
            filter (Dict, optional): Filter to apply to the search
            
        Returns:
            List[Tuple[Document, float]]: List of (document, score) tuples
        """
        from langchain_core.documents import Document
        
        # Convert the query to an embedding
        query_embedding = self.embedding_function.embed_query(query)
        
        # Build the MongoDB aggregation pipeline for vector search
        pipeline = [
            {
                "$search": {
                    "cosmosSearch": {
                        "vector": query_embedding,
                        "path": self.vector_field,
                        "k": k
                    }
                }
            },
            {
                "$project": {
                    "score": {"$meta": "searchScore"},
                    "page_content": 1,
                    "metadata": 1,
                    "_id": 0
                }
            }
        ]
        
        # Add filter if provided
        if filter:
            # Convert filter to MongoDB query format
            filter_condition = {}
            for key, value in filter.items():
                if key.startswith("metadata."):
                    filter_condition[key] = value
                else:
                    filter_condition[f"metadata.{key}"] = value
            
            # Add match stage after the search
            pipeline.append({"$match": filter_condition})
        
        # Execute the search
        search_results = list(self.collection.aggregate(pipeline))
        
        # Transform results to expected format
        results = []
        for result in search_results:
            doc = Document(
                page_content=result.get("page_content", ""),
                metadata=result.get("metadata", {})
            )
            score = result.get("score", 0.0)
            results.append((doc, score))
        
        return results
    
    def similarity_search(
        self,
        query: str,
        k: int = 4,
        filter: Optional[Dict[str, Any]] = None
    ) -> List[Any]:
        """
        Perform a similarity search and return documents.
        
        Args:
            query (str): Query text
            k (int): Number of results to return
            filter (Dict, optional): Filter to apply to the search
            
        Returns:
            List[Document]: List of documents
        """
        results_with_scores = self.similarity_search_with_relevance_scores(
            query=query,
            k=k,
            filter=filter
        )
        
        # Return just the documents without scores
        return [doc for doc, _ in results_with_scores]
    
    def count(self) -> int:
        """
        Get the count of documents in the collection.
        
        Returns:
            int: Number of documents in the collection
        """
        return self.collection.count_documents({})
    
    def __del__(self):
        """
        Close MongoDB connection when the client is deleted.
        """
        if hasattr(self, 'client'):
            self.client.close() 