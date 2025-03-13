import os
import pandas as pd
from sqlalchemy import create_engine, inspect

from ..common.config import CHROMADB_DIR
from ..common.constants import CHROMADB_SUMMARY_FOLDER_NAME, CHROMADB_INDEX_SUMMARIES
from .langchain_azure_openai import azure_embedding_openai_client
from .log_setup import get_logger
from langchain.schema import Document
from langchain_chroma import Chroma

# Get logger instance
logger = get_logger()

# PostgreSQL connection
db_url = "postgresql://citus:V3ct0r%243arch%402024%21@c-rag-pg-cluster-vectordb.ohp4jnn4od53fv.postgres.cosmos.azure.com:5432/rag_db?sslmode=require"

def get_all_tables_from_summaries_schema(site_area: str):
    """
    Get all tables from the summaries schema and combine them into a single DataFrame
    with table name as an additional column.
    """

    try:
        engine = create_engine(db_url)
        inspector = inspect(engine)
        table_name = site_area.lower()
        query = f'SELECT * FROM summaries."{table_name}"'
        df = pd.read_sql(query, engine)
        logger.info(f"Read {len(df)} rows from table {table_name}")
        logger.info(f"Columns in {table_name}: {df.columns.tolist()}")
        
        return df
    except Exception as e:
        logger.error(f"Error getting tables from summaries schema: {e}")
        return None

def create_summaries_chromadb(site_area: str):
    """
    Create a new ChromaDB collection for summaries and store embeddings.
    Each site area gets its own folder structure with document_persist, guidelines, and summary folders.
    
    Args:
        site_area (str): Name of the site area (e.g., 'pd', 'ae_sae')
    """
    try:
        # Get the data for this site area
        logger.info(f"Fetching data from PostgreSQL for {site_area}...")
        df = get_all_tables_from_summaries_schema(site_area)

        if df is None or df.empty:
            logger.error(f"No data found for site area: {site_area}")
            return None

        # Generate embeddings for the "Summary" column
        logger.info("Generating embeddings...")
        summaries = df["Summary"].tolist()
        
        # Define base directory structure
        base_dir = os.path.join("chromadb2", site_area)
        
        # Create all required directories
        folders = ["summary"]
        for folder in folders:
            os.makedirs(os.path.join(base_dir, folder), exist_ok=True)
            
        # Define ChromaDB persistence directory for summaries
        persist_directory = os.path.join(base_dir, "summary")
        logger.info(f"Created directory structure at: {base_dir}")

        # Store embeddings in ChromaDB with site-specific collection name
        logger.info(f"Storing summaries in ChromaDB for {site_area}...")
        vectorstore = Chroma.from_texts(
            texts=summaries,
            embedding=azure_embedding_openai_client,
            collection_name=CHROMADB_INDEX_SUMMARIES,  # Unique collection name for each site area
            metadatas=[{
                "site_area": site_area,
                "database_name": row.get("database_name"),
                "schema_name": row.get("schema_name"),
                "table_name": row.get("table_name")
            } for _, row in df.iterrows()],
            persist_directory=persist_directory
        )

        logger.info(f"Successfully stored {len(summaries)} embeddings in ChromaDB for {site_area}")
        return vectorstore
    except Exception as e:
        logger.error(f"Error storing summaries in ChromaDB for {site_area}: {e}")
        logger.error(f"Error details: {str(e)}")
        return None

def process_all_site_areas():
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
            create_summaries_chromadb(site_area)
            
    except Exception as e:
        logger.error(f"Error processing site areas: {e}")

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
    # Process all site areas
    process_all_site_areas()
    # # Create the database
    # db = create_summaries_chromadb("ae_sae")
    # if db is not None:
    #     # Test querying the database
    #     test_chromadb_query()
    