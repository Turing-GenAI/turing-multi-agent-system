import os
import pandas as pd
from sqlalchemy import create_engine, inspect

from ..common.config import CHROMADB_DIR
from ..common.constants import CHROMADB_SUMMARY_FOLDER_NAME
from .langchain_azure_openai import azure_embedding_openai_client
from .log_setup import get_logger
from langchain.schema import Document
from langchain_community.vectorstores import Chroma

# Get logger instance
logger = get_logger()

# PostgreSQL connection
db_url = "postgresql://citus:V3ct0r%243arch%402024%21@c-rag-pg-cluster-vectordb.ohp4jnn4od53fv.postgres.cosmos.azure.com:5432/rag_db?sslmode=require"

def get_all_tables_from_summaries_schema():
    """
    Get all tables from the summaries schema and combine them into a single DataFrame
    with table name as an additional column.
    """
    try:
        engine = create_engine(db_url)
        inspector = inspect(engine)
        
        # Get all tables in the summaries schema
        tables = inspector.get_table_names(schema='summaries')
        logger.info(f"Found {len(tables)} tables in summaries schema")
        
        all_data = []
        for table in tables:
            # Read each table
            query = f'SELECT * FROM summaries."{table}"'
            df = pd.read_sql(query, engine)
            logger.info(f"Read {len(df)} rows from table {table}")
            logger.info(f"Columns in {table}: {df.columns.tolist()}")
            
            # Add table_name column
            df['table_name'] = table
            
            all_data.append(df)
        
        # Combine all tables
        if all_data:
            combined_df = pd.concat(all_data, ignore_index=True)
            logger.info(f"Combined {len(combined_df)} total rows from all tables")
            logger.info(f"Final columns: {combined_df.columns.tolist()}")
            return combined_df
        return None
    except Exception as e:
        logger.error(f"Error getting tables from summaries schema: {e}")
        return None

def create_summaries_chromadb():
    """
    Create a new ChromaDB collection for summaries and store embeddings.
    """
    try:
        # Get the combined data
        logger.info("Fetching data from PostgreSQL...")
        combined_df = get_all_tables_from_summaries_schema()

        if combined_df is None or combined_df.empty:
            logger.error("No data found in summaries schema")
            return
        
        # Generate embeddings for the "Summary" column
        logger.info("Generating embeddings...")
        summaries = combined_df["Summary"].tolist()
        
        # Define ChromaDB persistence directory
        persist_directory = os.path.join(CHROMADB_DIR, CHROMADB_SUMMARY_FOLDER_NAME, "summaries_db")
        os.makedirs(persist_directory, exist_ok=True)
        logger.info(f"Created directory at: {persist_directory}")

        # Store embeddings in ChromaDB
        logger.info("Storing summaries in ChromaDB...")
        vectorstore = Chroma.from_texts(
            texts=summaries,
            embedding=azure_embedding_openai_client,
            metadatas=[{
                "table_name": row["table_name"],
                "source_file": row.get("source_file", "unknown"),  # Use get() to handle missing columns
                "upload_timestamp": str(row.get("upload_timestamp", pd.Timestamp.now()))
            } for _, row in combined_df.iterrows()],
            persist_directory=persist_directory
        )

        logger.info(f"Successfully stored {len(summaries)} embeddings in ChromaDB")
        return vectorstore
    except Exception as e:
        logger.error(f"Error storing summaries in ChromaDB: {e}")
        logger.error(f"Error details: {str(e)}")
        return None

def test_chromadb_query():
    """
    Test the ChromaDB by performing a sample query.
    """
    try:
        persist_directory = os.path.join(CHROMADB_DIR, CHROMADB_SUMMARY_FOLDER_NAME, "summaries_db")
        if not os.path.exists(persist_directory):
            logger.error(f"ChromaDB directory not found at {persist_directory}")
            return
        
        # Load the existing ChromaDB
        vectorstore = Chroma(
            persist_directory=persist_directory,
            embedding_function=azure_embedding_openai_client
        )
        
        # Get collection stats
        collection = vectorstore._collection
        count = collection.count()
        logger.info(f"Total documents in ChromaDB: {count}")
        
        # Perform a sample query
        if count > 0:
            sample_query = "Show me a summary"
            results = vectorstore.similarity_search_with_relevance_scores(
                sample_query,
                k=2  # Get top 2 results
            )
            
            logger.info("\nSample Query Results:")
            for doc, score in results:
                logger.info(f"\nRelevance Score: {score}")
                logger.info(f"Content: {doc.page_content[:200]}...")  # Show first 200 chars
                logger.info(f"Metadata: {doc.metadata}")
                
        return vectorstore
    except Exception as e:
        logger.error(f"Error testing ChromaDB: {e}")
        return None

if __name__ == "__main__":
    # Create the database
    db = create_summaries_chromadb()
    if db is not None:
        # Test querying the database
        test_chromadb_query()
    