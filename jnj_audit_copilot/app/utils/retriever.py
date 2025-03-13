import os
from typing import Optional, Dict, Any, List
from sqlalchemy import create_engine, text
import pandas as pd
from langchain_community.vectorstores import Chroma
from ..common.constants import CHROMADB_INDEX_SUMMARIES
from .log_setup import get_logger
from .langchain_azure_openai import azure_embedding_openai_client
from ..common.descriptions import ref_dict

# Get logger instance
logger = get_logger()
# PostgreSQL connection
db_url = "postgresql://citus:V3ct0r%243arch%402024%21@c-rag-pg-cluster-vectordb.ohp4jnn4od53fv.postgres.cosmos.azure.com:5432/rag_db?sslmode=require"
class SummaryRetriever:
    def __init__(self, site_area: str):
        """
        Initialize retriever for a specific site area.
        Args:
            site_area (str): Site area name (e.g., 'pd', 'ae_sae')
        """
        self.site_area = site_area
        self.engine = create_engine(db_url)
        
        # Initialize ChromaDB for this site area
        persist_directory = os.path.join("chromadb2", site_area, "summary")
        if not os.path.exists(persist_directory):
            raise ValueError(f"No ChromaDB found for site area: {site_area}")
        self.vectorstore = Chroma(
            persist_directory=persist_directory,
            embedding_function=azure_embedding_openai_client,
            collection_name=CHROMADB_INDEX_SUMMARIES
        )
    def retrieve_relevant_documents(
        self,
        query: str,
        k: int = 1,
        site_id: Optional[str] = None,
        trial_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant documents based on the query and fetch original data from PostgreSQL.
        Args:
            query (str): Search query
            k (int): Number of results to return
            site_id (str, optional): Filter by site ID
            trial_id (str, optional): Filter by trial ID
        Returns:
            List of dictionaries containing both vector search results and original data
        """
        try:
            # Search in ChromaDB
            results = self.vectorstore.similarity_search_with_relevance_scores(query, k=k)
            retrieved_docs = []
            for doc, score in results:
                # Get metadata from ChromaDB result
                metadata = doc.metadata
                database = metadata.get('database_name', 'rag_db')
                schema = metadata.get('schema_name', 'pd')
                table = metadata.get('table_name', 'protocol_deviation')
                # Build SQL query and parameters list
                conditions = ["1=1"]
                params = []
                mapping_dict = {'pd': 'PD', 'ae_sae': 'AE_SAE'}
                site_id_name = ref_dict.get(mapping_dict.get(self.site_area)).get(table)['site_id'] 
                trial_id_name = ref_dict.get(mapping_dict.get(self.site_area)).get(table)['trial_id']
                if site_id and site_id_name:
                    conditions.append(f"\"{site_id_name}\" = '{site_id}'")
                if trial_id and trial_id_name:
                    conditions.append(f"\"{trial_id_name}\" = '{trial_id}'")

                # Construct the final query
                sql_query = f"""
                SELECT * FROM {database}.{schema}.{table}
                WHERE {' AND '.join(conditions)}
                """

                # Execute query using pandas read_sql with params
                with self.engine.connect() as conn:
                    result_table = pd.read_sql(sql_query, conn)
                # Combine vector search results with original data
                print("******************", result_table)
                retrieved_docs.append({
                'relevance_score': score,
                'summary': doc.page_content,
                'metadata': metadata,
                'original_data': result_table.to_dict('records') if not result_table.empty else None
                                })
                return retrieved_docs
        except Exception as e:
            logger.error(f"Error retrieving documents: {str(e)}")
            return []

def test_retriever():
    """
    Test the retriever functionality.
    """
    try:
        # Initialize retriever for protocol deviations
        retriever = SummaryRetriever('pd')

        # Test query
        query = "Show me protocol deviations related to medication"
        results = retriever.retrieve_relevant_documents(
            query=query,
            site_id="P73-PL10007",
            trial_id="CNTO1275PUC3001",
            k=1
        )
        print(results)
        logger.info(f"\nQuery: {query}")
        for i, result in enumerate(results, 1):
            logger.info(f"\nResult {i}:")
            logger.info(f"Relevance Score: {result['relevance_score']}")
            logger.info(f"Summary: {result['summary'][:200]}...")
            logger.info(f"Metadata: {result['metadata']}")
            if result['original_data']:
                logger.info(f"Original Data: {result['original_data']}")
    except Exception as e:
        logger.error(f"Error testing retriever: {e}")

if __name__ == "__main__":
    test_retriever()