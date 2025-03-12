import uuid
import os

from langchain.agents import create_openai_functions_agent
from langchain_core.messages import ToolMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool
from langgraph.prebuilt.tool_executor import ToolExecutor
from pydantic import BaseModel, Field
from retry import retry

from ....common.constants import bold_end, bold_start
from ....facade.ingestion_facade import IngestionFacade
from ....prompt_hub.selfrag_prompts import selfrag_prompts
from ....utils.helpers import input_filepaths_dict, read_file
from ....utils.langchain_azure_openai import azure_chat_openai_client as model
from ....utils.log_setup import get_logger
from ....utils.retriever import SummaryRetriever


# Get the same logger instance set up earlier
logger = get_logger()


class RetrieverInputs(BaseModel):
    site_id: str = Field(..., description="Site ID for which analysis is being done")
    trial_id: str = Field(..., description="Trial ID for which analysis is being done")
    site_area: str = Field(..., description="Site area for which analysis is being done")
    sub_activity: str = Field(..., description="subquery obtained by decomposing the original query")


@tool(args_schema=RetrieverInputs)
@retry(tries=2, delay=5)
def site_data_retriever_tool(sub_activity: str, site_id: str, trial_id: str, site_area: str) -> dict:
    """
    Retrieves relevant answers from the site data to answer the query
    """
    # ingestor = IngestionFacade(site_area=site_area, site_id=site_id, trial_id=trial_id, ingested_previously=True)
    # summary_vectorstore, data_retriever = ingestor.ingest_data()
    data_retriever = SummaryRetriever(site_area)
    logger.debug("Calling function : site_data_retriever_tool...")

    if data_retriever is not None:
        retriever_response = SummaryRetriever.retrieve_relevant_documents(query=sub_activity, k = 1, site_id=site_id, trial_id=trial_id)
        # retrieved_docs = data_retriever.invoke(sub_activity, n_results=1)
        # retrieved_doc_filename = retrieved_docs[0].metadata["filename"]
        retrieved_docs = [i['original_data'] for i in retriever_response]
        logger.debug(f"Retrieved data from table: {retriever_response["metadata"]["table_name"]}")

        # site_data_context_dict = {}
        # i = 0
        # for doc in retrieved_docs:
        #     site_data_context_dict[i] = {"metadata": doc.metadata, "page_content": doc.page_content}
        #     i += 1
        

        summary_df = read_file(
            file_path=input_filepaths_dict[site_area]["summary_df_file_path"],
            file_format="xlsx",
            index_col=0,
        )
        add_ai_msg = "\nExecuted Tool: site_data_retriever_tool. Retrieved site data"
        
        metadata_list = [doc.metadata for doc in retrieved_docs]

        # Build the output text
        # output = "The retrieved pieces of information have been obtained from the following source(s):\n"

        # for index, metadata in enumerate(metadata_list, start=1):
        #     filename = os.path.basename(metadata['source'])
        #     output += f"{index}. {filename}\n"

        # add_ai_msg += output + "\n"

        if summary_df is None:
            add_ai_msg = (
                f"{bold_start}WARNING!!{bold_end}\nSummary data is missing possibly due to "
                "partial data ingestion, so result might not be up to date. Please try after data reingestion."
            )
            logger.error(add_ai_msg)
            file_summary = ""
        else:
            file_summary = summary_df.loc[summary_df["SheetName"] == retrieved_doc_filename]["Summary"].values[0]

        return {
            "context": [retrieved_docs[0].page_content],
            "retrieved_context_dict": site_data_context_dict,
            "used_site_data_flag": True,
            "file_summary": file_summary,
            "selfrag_messages": ToolMessage(
                name=f"{bold_start}SelfRAG - site_data_retriever tool{bold_end}",
                content=add_ai_msg,
                tool_call_id=str(uuid.uuid4()),  # Generate a unique ID
            ),
        }
    else:
        return {
            "context": [""],
            "used_site_data_flag": True,
            "file_summary": "",
            "selfrag_messages": ToolMessage(
                name=f"{bold_start}SelfRAG - site_data_retriever tool{bold_end}",
                content=f"{bold_start}Executed Tool: site_data_retriever_tool. WARNING!!{bold_end}"
                "\nNo data retriever found. Check if correct files are present to answer the activity.",
                tool_call_id=str(uuid.uuid4()),  # Generate a unique ID
            ),
        }


@tool(args_schema=RetrieverInputs)
def guidelines_retriever_tool(sub_activity: str, site_id: str, trial_id: str, site_area: str) -> dict:
    """
    Retrieves relevant answers from the guidelines data to answer the query
    """
    logger.debug("Calling function : guidelines_retriever_tool..")
    ingestor = IngestionFacade(site_area=site_area, site_id=site_id, trial_id=trial_id, ingested_previously=True)
    guidelines_vectorstore = ingestor.ingest_guidelines()

    if guidelines_vectorstore:
        guidelines_relevant_docs = guidelines_vectorstore.similarity_search(sub_activity, k=3)
        all_metadata = " ,".join([str(doc.metadata) for doc in guidelines_relevant_docs])
        
        guidelines_context_dict = {}
        i = 0
        for doc in guidelines_relevant_docs:
            guidelines_context_dict[i] = {"metadata": doc.metadata, "page_content": doc.page_content}
            i += 1
        
        context = ""
        for i, doc in enumerate(guidelines_relevant_docs):
            i1 = i + 1
            context += f"******************************context_{i1}*****************************************\n"
            context += doc.page_content + "\n"
        logger.debug(f"guidelines_relevant_docs: {all_metadata}")
        add_ai_msg = "Executed Tool: guidelines_retriever_tool. Retrieved guidelines documents"

        # metadata_list = [doc.metadata for doc in guidelines_relevant_docs]

        # # Build the output text
        # output = "The retrieved pieces of information have been obtained from the following source(s):\n"

        # for index, metadata in enumerate(metadata_list, start=1):
        #     filename = os.path.basename(metadata['source'])
        #     page = metadata['page']
        #     output += f"{index}. {filename}, Page {page}\n"

        # add_ai_msg += output + "\n"
    
    else:
        guidelines_relevant_docs = None
        add_ai_msg = f"{bold_start}WARNING!!{bold_end}\nNo guidelines retriever found. "
        "Check if guidelines files are present to answer the activity."
        logger.error(add_ai_msg)
        context = ""

    return {
        "context": [context],
        "retrieved_context_dict": guidelines_context_dict,
        "used_site_data_flag": False,
        "selfrag_messages": ToolMessage(
            name=f"{bold_start}SelfRAG - guidelines_retriever tool{bold_end}",
            content=add_ai_msg,
            tool_call_id=str(uuid.uuid4()),  # Generate a unique ID
        ),
    }


retrieval_tools = [site_data_retriever_tool, guidelines_retriever_tool]
retrieval_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", selfrag_prompts["RETRIEVER_ROUTER_PROMPT"]),
        (
            "system",
            "For this analysis, use the following data: " "site_id: {site_id}, trial_id: {trial_id}, site_area: {site_area}",
        ),
        ("placeholder", "{chat_history}"),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ]
)

retrieval_agent_runnable = create_openai_functions_agent(model, retrieval_tools, retrieval_prompt)
retrieval_tool_executor = ToolExecutor(retrieval_tools)
