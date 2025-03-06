from langchain.schema import HumanMessage
from langchain_core.messages import AIMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
import json
import os
import datetime

from ....common.config import AGENT_SCRATCHPAD_FOLDER
from ....common.constants import bold_end, bold_start
from ....common.descriptions import site_area_context
from ....prompt_hub.selfrag_prompts import selfrag_prompts
from ....utils.helpers import choose_relavant_columns, clean_context, format_qa_pair
from ....utils.langchain_azure_openai import azure_chat_openai_client as model
from ....utils.langchain_azure_openai import model_with_required_column_structure
from ....utils.log_setup import get_logger
from ....utils.state_definitions import SelfRAGState
from .selfrag_tool_nodes import retrieval_agent_runnable, retrieval_tool_executor

# Get the same logger instance set up earlier
logger = get_logger()


class selfragNodes:
    def __init__(self):
        logger.debug("Initialising selfragNodes ...")
        pass

    def self_rag_node(self, state: SelfRAGState):
        logger.debug("Calling self_rag_node...")
        sub_activities = state["final_sub_activities"].sub_activities
        child_index = state.get("child_index")
        if child_index is None:
            child_index = 0
        else:
            child_index += 1

        q_a_pairs = state["q_a_pairs"]
        if "relevancy_check_counter" in state.keys():
            relevancy_check_counter = state["relevancy_check_counter"]
        else:
            relevancy_check_counter = 0

        if q_a_pairs is None:
            q_a_pairs = ""

        activity = state["activity"]
        site_area_activity_list = state["site_area_activity_list"]
        site_area_activity_list_index = state["site_area_activity_list_index"]
        site_area = state["site_area"]
        parent_index = state["parent_index"]

        if child_index <= len(sub_activities) - 1:
            sub_activity = sub_activities[child_index]
            relevancy_check_counter = 0
            self_rag_ai_message = AIMessage(
                name=f"{bold_start} SelfRAG - self_rag_agent{bold_end}",
                content="Invoking SelfRAG node for the sub-activity: \n\n" + sub_activity,
            )
            return {
                "activity": activity,
                "sub_activity": sub_activity,
                "child_index": child_index,
                "messages": [("user", sub_activity)],
                "selfrag_messages": self_rag_ai_message,
                "q_a_pairs": q_a_pairs,
                "relevancy_check_counter": relevancy_check_counter,
                "used_site_data_flag": False,
                "tool_call_count": 0,
                "site_area_activity_list_index": site_area_activity_list_index,
                "parent_index": parent_index,
            }
        else:
            sub_activity = ""
            self_rag_ai_message = AIMessage(
                name=f"{bold_start} SelfRAG - self_rag_agent{bold_end}",
                content="All the sub-activities are finished.",
            )
            trigger_flag_list = state["trigger_flag_list"]
            site_area = state["site_area"]
            trigger_flag_list[site_area] = True
            return {
                "activity": activity,
                "sub_activity": sub_activity,
                "child_index": child_index,
                "messages": [("user", sub_activity)],
                "selfrag_messages": self_rag_ai_message,
                "q_a_pairs": q_a_pairs,
                "relevancy_check_counter": relevancy_check_counter,
                "used_site_data_flag": False,
                "trigger_flag_list": trigger_flag_list,
                "tool_call_count": 0,
                "site_area_activity_list_index": site_area_activity_list_index,
                "parent_index": parent_index,
            }

    def retrieval_agent(self, state: SelfRAGState):
        logger.debug("Calling function: retrieval_agent...")
        trigger = state["trigger"]
        site_id = trigger["site_id"]
        trial_id = trigger["trial_id"]
        site_area = state["site_area"]
        sub_activity = state["sub_activity"]
        intermediate_steps = state.get("intermediate_steps", [])
        data = {
            "input": sub_activity,
            "site_area": site_area,
            "trial_id": trial_id,
            "site_id": site_id,
            "intermediate_steps": intermediate_steps,
        }
        agent_outcome = retrieval_agent_runnable.invoke(data)
        tool_call_count = state.get("tool_call_count")
        if tool_call_count > 2:
            logger.error("Tool call count exceeded 2 times")
        return {
            "agent_outcome": agent_outcome,
            "intermediate_steps": intermediate_steps,
            "tool_call_count": tool_call_count,
            "selfrag_messages": AIMessage(
                name=f"{bold_start} SelfRAG - retrieval_agent{bold_end}",
                content=str(agent_outcome.log),
            ),
        }

    def execute_retrieval_tools(self, state: SelfRAGState):
        agent_action = state["agent_outcome"]
        output = retrieval_tool_executor.invoke(agent_action)
        tool_call_count = state.get("tool_call_count") + 1
        context = output.get("context", [""])[0]
        retrieved_context_dict = output.get("retrieved_context_dict", {})
        file_summary = output.get("file_summary", "")
        used_site_data_flag = output.get("used_site_data_flag", False)
        tool_message = output.get("selfrag_messages", False)

        # Prepare the data to be written to the JSON file
        # site_area_index = state["site_area_activity_list_index"]
        site_area_index = str(state["site_area_activity_list_index"]) + "_" +  state["site_area"]
        # activity_index = state["parent_index"]
        activity_index = str(state["parent_index"]) + "_" + state["activity"] 
        # sub_activity_index = state["child_index"]
        sub_activity_index = str(state["child_index"]) + "_" + state["sub_activity"]
        relevancy_check_counter = state["relevancy_check_counter"]
        # context_dict_key = "site_data_context_dict" if used_site_data_flag else "guidelines_context_dict"
        context_dict_key = "context_dict_key"

        # Load existing data from the JSON file
        run_id = state["run_id"]
        filename =  run_id + "_retrieved_context_dict.json"
        json_file_path = f"{AGENT_SCRATCHPAD_FOLDER}/{filename}"
        if os.path.exists(json_file_path):
            with open(json_file_path, "r") as file:
                existing_data = json.load(file)
        else:
            existing_data = {}

        # Update the existing data with the new context dictionary
        if site_area_index not in existing_data:
            existing_data[site_area_index] = {}
        if activity_index not in existing_data[site_area_index]:
            existing_data[site_area_index][activity_index] = {}
        if sub_activity_index not in existing_data[site_area_index][activity_index]:
            existing_data[site_area_index][activity_index][sub_activity_index] = {}
        if relevancy_check_counter not in existing_data[site_area_index][activity_index][sub_activity_index]:
            existing_data[site_area_index][activity_index][sub_activity_index][relevancy_check_counter] = {}

        # existing_data[site_area_index][activity_index][sub_activity_index][relevancy_check_counter] = {
        #     "context": context,
        #     "metadata": {
        #         context_dict_key: retrieved_context_dict,
        #         "file_summary": file_summary,
        #         "used_site_data_flag": used_site_data_flag,
        #         "tool_call_count": tool_call_count
        #     }
        # }
        existing_data[site_area_index][activity_index][sub_activity_index][relevancy_check_counter] = {
                context_dict_key: retrieved_context_dict
        }

        # Write the updated data back to the JSON file
        with open(json_file_path, "w") as file:
            json.dump(existing_data, file, indent=4)
            
        # Add information about the retrieved context to the tool message
        context_info = f"\n\nRetrieved context for sub-activity: {state['sub_activity']}"
        if used_site_data_flag:
            context_info += "\nSource: Site Data"
        else:
            context_info += "\nSource: Guidelines"
            
        # If the tool_message is a ToolMessage object, update its content
        if hasattr(tool_message, 'content'):
            tool_message.content += context_info
        
        return {
            "intermediate_steps": [(agent_action, tool_message)],
            "selfrag_messages": tool_message,
            "context": context,
            "retrieved_context_dict": [retrieved_context_dict] if retrieved_context_dict else [],
            "file_summary": file_summary,
            "used_site_data_flag": used_site_data_flag,
            "tool_call_count": tool_call_count,
        }

    def document_grading_agent(self, state: SelfRAGState):
        logger.debug("Calling function : document_grading_agent...")
        """
        Decides whether the model should generate a response or rewrite the sub-activity
        Args:
            state (messages): The current state
        Returns:
            dict: The updated state with the agent response appended to messages
        """
        return {
            "selfrag_messages": AIMessage(
                name=f"{bold_start} SelfRAG - document_grading_agent{bold_end}",
                content="Checking relevance of fetched data ...",
            )
        }

    def rewrite(self, state: SelfRAGState):
        logger.debug("Calling function: rewrite")
        """
        Transform the query to produce a better question.

        Args:
            state (messages): The current state

        Returns:
            dict: The updated state with re-phrased question
        """
        question = state["sub_activity"]
        relevancy_check_counter = state["relevancy_check_counter"] + 1
        main_question = state["activity"]
        site_area = state["site_area"]
        add_context = site_area_context[site_area]
        msg = [
            HumanMessage(
                content=selfrag_prompts["REWRITE_SUB_ACTIVITY_PROMPT"].format(
                    question=question,
                    main_question=main_question,
                    site_area=site_area,
                    additional_context=add_context,
                ),
            )
        ]
        response = model.invoke(msg)

        if "LLM_RUN_FAILED" in response:
            response = ""
            return {
                "relevancy_check_counter": relevancy_check_counter,
                "selfrag_messages": AIMessage(
                    name=f"{bold_start}SelfRAG - reflection_agent{bold_end}",
                    content=(
                        # "Fetched documents are not relevant. Updating the retrieval for sub-activity\n"
                        "Invoking SelfRAG - reflection_agent :\nFailed to Updated sub-activity: " + response
                    ),
                ),
                "tool_call_count": 0,
            }

        else:
            return {
                "messages": [response],
                "sub_activity": response.content,
                "relevancy_check_counter": relevancy_check_counter,
                "selfrag_messages": AIMessage(
                    name=f"{bold_start}SelfRAG - reflection_agent{bold_end}",
                    content=(
                        # "Fetched documents are not relevant. Updating the retrival for sub-activity\n"
                        "Invoking SelfRAG - reflection_agent :\nUpdated sub-activity: " + response.content
                    ),
                ),
                "tool_call_count": 0,
            }

    def generate(self, state: SelfRAGState):
        logger.debug("Calling function : generate")
        """
        Generate answer

        Args:
            state (messages): The current state

        Returns:
            dict containing the generated answer to the sub-activity
        """
        question = state["sub_activity"]
        context = state["context"]
        q_a_pairs = state["q_a_pairs"]
        main_question = state["activity"]
        site_area = state["site_area"]
        add_context = site_area_context[site_area]

        # Prompt
        if state["used_site_data_flag"]:
            required_columns = choose_relavant_columns(
                selfrag_prompts,
                model_with_required_column_structure,
                state["file_summary"],
                state["sub_activity"],
            )

            # context = clean_context(context[0], required_columns)
            context = clean_context(context, required_columns)

            template = selfrag_prompts["GENERATE_ANSWER_USING_SITE_DATA_VARIATION_PROMPT"]
        else:
            template = selfrag_prompts["GENERATE_SUB_ACTIVITY_ANSWER_USING_DOC_PROMPT"]
        decomposition_prompt = ChatPromptTemplate.from_template(template)

        # Chain
        rag_chain = decomposition_prompt | model | StrOutputParser()

        # Run
        if state["used_site_data_flag"]:
            try:
                response = rag_chain.invoke(
                    {
                        "question": question,
                        "q_a_pairs": q_a_pairs,
                        "context": context,
                        "main_question": main_question,
                        "file_summary": state["file_summary"],
                    }
                )
            except Exception as e:
                logger.error(f"rag_chain failed for site data due to {e}")
                response = "Could not retrieve"
        else:
            try:
                response = rag_chain.invoke(
                    {
                        "question": question,
                        "q_a_pairs": q_a_pairs,
                        "context": context,
                        "main_question": main_question,
                        "site_area": site_area,
                        "additional_context": add_context,
                    }
                )
            except Exception as e:
                logger.error(
                    f"rag_chain failed for guidelines data due to {e}")
                response = "Could not retrieve"

        q_a_pair = format_qa_pair(question, response)
        q_a_pairs = q_a_pairs + "\n---\n" + q_a_pair

        return {
            "sub_activity_answer": response,
            "sub_activities_answers": [{state["sub_activity"]: response}],
            "messages": [response],
            "q_a_pairs": q_a_pairs,
            "selfrag_messages": AIMessage(
                name=f"{bold_start}SelfRAG - generate_response_agent{bold_end}",
                content=(
                    # "Fetched documents are relevant.\n"
                    "\n* Sub-Activity: " + question +
                    "\n\n* Sub-Activity Outcome:\n" + str(response)
                ),
            ),
        }