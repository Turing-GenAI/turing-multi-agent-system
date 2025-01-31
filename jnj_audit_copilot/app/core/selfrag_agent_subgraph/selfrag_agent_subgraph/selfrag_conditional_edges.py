from typing import Literal

from langchain_core.agents import AgentFinish
from langchain_core.prompts import PromptTemplate
from retry import retry

from ....common.descriptions import site_area_context
from ....prompt_hub.selfrag_prompts import selfrag_prompts
from ....utils.langchain_azure_openai import llm_with_grade_tool
from ....utils.log_setup import get_logger
from ....utils.state_definitions import SelfRAGState

# Get the same logger instance set up earlier
logger = get_logger()


class selfragNodesConditionalFunctions:
    def __init__(self):
        logger.debug("Initialising selfragNodesConditionalFunctions ...")
        pass

    @retry(tries=3, delay=5)
    def grade_documents(self, state: SelfRAGState) -> Literal["generate_response_agent", "reflection_agent"]:
        logger.debug("Calling function : grade_documents..")
        """
        Determines whether the retrieved documents are relevant to the question.
        Args:
            state (messages): The current state
        Returns:
            str: A decision for whether the documents are relevant or not
        """

        # Prompt
        prompt = PromptTemplate(
            template=selfrag_prompts["GRADE_FETCHED_DOCUMENTS_PROMPT"],
            input_variables=[
                "context",
                "question",
                "main_question",
                "site_area",
                "additional_context",
            ],
        )

        # Chain
        chain = prompt | llm_with_grade_tool
        question = state["sub_activity"]
        relevancy_check_counter = state["relevancy_check_counter"]
        docs = state["context"]
        main_question = state["activity"]
        site_area = state["site_area"]
        add_context = site_area_context[site_area]
        try:
            scored_result = chain.invoke(
                {
                    "question": question,
                    "context": docs,
                    "main_question": main_question,
                    "site_area": site_area,
                    "additional_context": add_context,
                }
            )

            score = scored_result.binary_score
            relevancy_check_counter_limit = 1  # selfRAG retriver max iterations
            if relevancy_check_counter < relevancy_check_counter_limit:
                if score == "yes":
                    result = "generate_response_agent"

                else:
                    result = "reflection_agent"
            else:
                result = "generate_response_agent"

            return result
        except Exception as e:
            logger.error(f"grade_documents failed due to {e}, returning default generate_response_agent")
            return "generate_response_agent"

    def self_rag_routing(self, state: SelfRAGState) -> Literal["retrieval_agent", "END"]:
        logger.debug("Calling function : self_rag_routing..")
        child_index = state["child_index"]
        if child_index >= len(state["final_sub_activities"].sub_activities):
            return "END"
        else:
            return "retrieval_agent"

    def should_call_retrieval_tool(self, state: SelfRAGState) -> Literal["continue", "end"]:
        if isinstance(state["agent_outcome"], AgentFinish) or state["tool_call_count"] > 2:
            return "end"
        else:
            return "continue"
