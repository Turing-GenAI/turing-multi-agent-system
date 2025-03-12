import os
import re
import pandas as pd
from sqlalchemy import create_engine, text
from typing import List, Dict, Tuple, Optional

from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate
# from langchain_core.output_parsers import ResponseSchema, StructuredOutputParser

from .log_setup import get_logger
from .langchain_azure_openai import azure_chat_openai_client, azure_embedding_openai_client
from ..common.config import CHROMADB_DIR
from ..common.constants import CHROMADB_SUMMARY_FOLDER_NAME

# Get logger instance
logger = get_logger()

# PostgreSQL connection
db_url = "postgresql://citus:V3ct0r%243arch%402024%21@c-rag-pg-cluster-vectordb.ohp4jnn4od53fv.postgres.cosmos.azure.com:5432/rag_db?sslmode=require"

class SQLGenerator:
    def __init__(self):
        self.engine = create_engine(db_url)
        self.persist_directory = os.path.join(CHROMADB_DIR, CHROMADB_SUMMARY_FOLDER_NAME, "summaries_db")
        
        # Initialize ChromaDB
        self.vectorstore = Chroma(
            persist_directory=self.persist_directory,
            embedding_function=azure_embedding_openai_client
        )
        
        # Define the SQL query generation prompt
        self.sql_prompt = ChatPromptTemplate.from_template("""
        Based on the following table summary and user question, generate a SQL query.
        
        Table Summary:
        {table_summary}
        
        User Question:
        {question}
        
        Additional Context:
        - The schema name is: {schema_name}
        - The table name is: {table_name}
        - Include site_id={site_id} and trial_id={trial_id} in the WHERE clause if these columns exist
        
        Generate a SQL query that:
        1. Uses the correct schema and table names
        2. Selects only necessary columns
        3. Includes appropriate WHERE clauses
        4. Uses proper JOIN statements if needed
        5. Formats the query for readability
        
        Return your response in the following format:
        ```sql
        YOUR_SQL_QUERY_HERE
        ```
        
        Explanation:
        Brief explanation of what the query does and why you chose these columns.
        """)

    def get_relevant_summary(self, question: str, k: int = 1) -> List[Dict]:
        """
        Get the most relevant table summaries for a given question.
        """
        try:
            results = self.vectorstore.similarity_search_with_relevance_scores(
                question,
                k=k
            )
            
            relevant_docs = []
            for doc, score in results:
                relevant_docs.append({
                    'content': doc.page_content,
                    'metadata': doc.metadata,
                    'score': score
                })
            
            return relevant_docs
        except Exception as e:
            logger.error(f"Error getting relevant summary: {e}")
            return []

    def extract_sql_query(self, llm_response: str) -> Optional[str]:
        """
        Extract SQL query from LLM response using regex.
        """
        sql_pattern = r"```sql\n(.*?)```"
        matches = re.findall(sql_pattern, llm_response, re.DOTALL)
        if matches:
            return matches[0].strip()
        return None

    def generate_sql_query(
        self,
        question: str,
        site_id: str = None,
        trial_id: str = None,
        schema_name: str = "summaries"
    ) -> Tuple[Optional[str], Optional[pd.DataFrame]]:
        """
        Generate and execute SQL query based on the question.
        
        Returns:
        Tuple[str, pd.DataFrame]: The generated SQL query and the query results
        """
        try:
            # Get relevant table summary
            relevant_docs = self.get_relevant_summary(question)
            if not relevant_docs:
                logger.error("No relevant table summaries found")
                return None, None

            most_relevant = relevant_docs[0]
            table_name = most_relevant['metadata']['table_name']
            
            # Generate SQL query using LLM
            prompt_response = azure_chat_openai_client.invoke(
                self.sql_prompt.format(
                    table_summary=most_relevant['content'],
                    question=question,
                    schema_name=schema_name,
                    table_name=table_name,
                    site_id=site_id or "NULL",
                    trial_id=trial_id or "NULL"
                )
            )
            
            # Extract SQL query from response
            sql_query = self.extract_sql_query(prompt_response.content)
            if not sql_query:
                logger.error("Could not extract SQL query from LLM response")
                return None, None
            
            # Execute the query
            logger.info(f"Executing query:\n{sql_query}")
            df = pd.read_sql(sql_query, self.engine)
            
            return sql_query, df
            
        except Exception as e:
            logger.error(f"Error generating SQL query: {e}")
            return None, None

def test_sql_generator():
    """
    Test the SQL generator with a sample question.
    """
    try:
        generator = SQLGenerator()
        
        # Test question
        question = "Show me all protocol deviations for site P73-PL10007"
        site_id = "P73-PL10007"
        trial_id = "CNTO1275PUC3001"
        
        # Generate and execute query
        sql_query, results = generator.generate_sql_query(
            question=question,
            site_id=site_id,
            trial_id=trial_id
        )
        
        if sql_query:
            logger.info("\nGenerated SQL Query:")
            logger.info(sql_query)
            
            if results is not None:
                logger.info("\nQuery Results:")
                logger.info(f"Found {len(results)} rows")
                logger.info("\nSample of results:")
                logger.info(results.head())
        
    except Exception as e:
        logger.error(f"Error testing SQL generator: {e}")

if __name__ == "__main__":
    test_sql_generator() 