import os

import pandas as pd
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from retry import retry

from ....common.constants import (
    FINDINGS_OUTPUT_FOLDER,
    bold_end,
    bold_start,
    window_size_for_output_table_generation,
)
from ....common.config import FEEDBACK_FOR_PLANNER
from ....common.descriptions import discrepancy_function_descriptions_for_routing
from ....facade.ingestion_facade import IngestionFacade
from ....prompt_hub.inspection_prompts import inspection_prompts
from ....utils.helpers import input_filepaths_dict
from ....utils.langchain_azure_openai import azure_chat_openai_client as model
from ....utils.langchain_azure_openai import model_with_sub_activity_structured_output
from ....utils.log_setup import get_logger
from ....utils.response_classes import DiscrepancyFunction
from ....utils.state_definitions import InspectionAgentState
from .inspection_functions import inspectionFunctions

# Get the same logger instance set up earlier
logger = get_logger()


class inspectionNodes:
    def __init__(self):
        logger.debug("Initialising inspectionNodes ...")
        logger.debug("Initialising Helper Functions for inspectionNodes ...")
        self.node_functions = inspectionFunctions()
        pass

    def site_area_agent_node(self, state: InspectionAgentState):
        logger.debug("Calling function : site_area_agent_node...")
        site_area_activity_list = state["site_area_activity_list"]

        def get_prev_all_ans():
            prev_master_level_answers = [
                {
                    list(site_area_activity_list.keys())[site_area_activity_list_index]: state["all_answers"][
                        -state["parent_index"] :
                    ]
                }
            ]
            return prev_master_level_answers

        site_area_activity_list_index = state["site_area_activity_list_index"]
        if site_area_activity_list_index is None:
            site_area_activity_list_index = 0
            prev_master_level_answers = []
        else:
            prev_master_level_answers = get_prev_all_ans()
            site_area_activity_list_index += 1

        if site_area_activity_list_index >= len(list(site_area_activity_list.keys())):
            all_activities = []
            return {
                "site_area_activity_list_index": site_area_activity_list_index,
                "parent_index": None,
                "all_activities": all_activities,
                "master_level_answers": prev_master_level_answers,
            }
        else:
            all_activities = site_area_activity_list[list(site_area_activity_list.keys())[site_area_activity_list_index]]
            trial_supervisor_ai_message = "Picked the site area for execution: " + str(
                list(site_area_activity_list.keys())[site_area_activity_list_index]
            ) + f"\n\nGot {len(all_activities)} activities to " "carry out related to " + str(
                list(site_area_activity_list.keys())[site_area_activity_list_index]
            ) + "\n  *" + str(
                ",\n  *".join([x.replace(" ### ", " ") for x in all_activities])
            )

            return {
                "site_area": list(site_area_activity_list.keys())[site_area_activity_list_index],
                "site_area_activity_list_index": site_area_activity_list_index,
                "parent_index": None,
                "all_activities": all_activities,
                "master_level_answers": prev_master_level_answers,
                "inspection_messages": AIMessage(
                    name=f"{bold_start}inspection - site_area_agent_{site_area_activity_list_index}: {bold_end}",
                    content=trial_supervisor_ai_message,
                ),
            }

    def site_area_ingestion_node(self, state: InspectionAgentState):
        site_area = state["site_area"]
        trigger = state["trigger"]
        site_id = trigger["site_id"]
        trial_id = trigger["trial_id"]
        reingest_data_flag = trigger["reingest_data_flag"]
        ingestor = IngestionFacade(
            site_area=site_area, site_id=site_id, trial_id=trial_id, reingest_data_flag=reingest_data_flag
        )
        summary_vectorstore, data_retriever = ingestor.ingest_data()
        guidelines_vectorstore = ingestor.ingest_guidelines()

        add_msg = []
        if summary_vectorstore is None:
            add_msg.append("summary_vectorstore")
        if data_retriever is None:
            add_msg.append("data_retriever")
        if guidelines_vectorstore is None:
            add_msg.append("guidelines_vectorstore")
        error = ""
        if len(add_msg) > 0:
            error = "\nbut could not create" + ", ".join(add_msg) + ". Check applications.log for more info"

        logger.debug(f"Calling site_area_ingestion_node: Data Ingestion for site area-{site_area} completed!")

        site_area_activity_list_index = state["site_area_activity_list_index"]
        return {
            "inspection_messages": AIMessage(
                name=f"{bold_start}inspection - data_ingestion node_{site_area_activity_list_index}:{bold_end}",
                content=(
                    f"Ingestion for Site Area: {site_area},  trial_id-{trial_id} " f"and site_id-{site_id} is Done!{error}"
                ),
            )
        }

    def site_area_router_node(self, state: InspectionAgentState):
        logger.debug("Calling function : site_area_router_node ...")

        def get_prev_answers():
            prev_answers = [{all_activities[parent_index]: state["sub_activities_answers"][-state["child_index"] :]}]
            return prev_answers

        all_activities = state["all_activities"]

        parent_index = state["parent_index"]
        if parent_index is None:
            parent_index = 0
            prev_answers = []
        else:
            prev_answers = get_prev_answers()
            parent_index += 1

        if parent_index <= len(all_activities) - 1:
            activity = all_activities[parent_index]
            site_area_agent_ai_message = f"Invoking the site area agent for below main activity:\n\n{activity}"
        else:
            activity = ""
            site_area_agent_ai_message = "All the main-activities are finished, Now generating findings"

        site_area_activity_list_index = state["site_area_activity_list_index"]
        return {
            "all_activities": all_activities,
            "activity": activity,
            "parent_index": parent_index,
            "child_index": None,
            "q_a_pairs": "",
            "relevancy_check_counter": None,
            "all_answers": prev_answers,
            "inspection_messages": AIMessage(
                name=f"{bold_start}inspection - site_area_router_{site_area_activity_list_index}:{bold_end} ",
                content=site_area_agent_ai_message,
            ),
        }

    def get_discrepancy_function(self, main_question):
        """
        Determines the appropriate discrepancy function based on the provided main question.

        This method uses a structured model to select a function name from a list of available
        discrepancy functions. It constructs a user prompt with the main question and function
        descriptions, invokes the model to choose the most relevant function, and returns the
        function name.

        Args:
            main_question (str): The main inspection activity question to guide function selection.

        Returns:
            str: The name of the selected discrepancy function, or "None" if no appropriate function
            is found.
        """
        logger.debug("Calling function : get_discrepancy_function...")
        user_prompt = inspection_prompts["choose_discrepance_function"]
        messages = [
            SystemMessage(content="You are an expert in routing query to relevant function"),
            HumanMessage(
                content=user_prompt.format(
                    main_question=main_question,
                    function_list=discrepancy_function_descriptions_for_routing,
                )
            ),
        ]
        model_with_required_column_structure = model.with_structured_output(DiscrepancyFunction)

        response = model_with_required_column_structure.invoke(messages)

        return response.function_name

    def discrepancy_data_generator_node_old(self, state: InspectionAgentState):
        """
        This function processes the main inspection activity question from the state
        to determine and execute the appropriate discrepancy function from a predefined list.
        It retrieves the discrepancy function name based on the main question, runs the function
        using the specified site area path and site ID, and saves the resulting discrepancy data
        as a JSON file.

        Args:
            state (InspectionAgentState): The current state of the inspection agent, containing
                details such as activity, trigger information, and run ID.

        Returns:
            None: The function does not return any value but saves the discrepancy data to a file.
        """
        logger.debug("Calling function : save_discrepancy..")
        """
        get discrepancy by running the chosen function from the list:
        [get_ae_discrepancy, get_pd_discrepancy, get_site_pd_trending, get_sae_delay_by_24hrs]
        """
        # defining variables
        main_question = state["activity"].split("###")[1]
        triggr = state["trigger"]
        SITE_ID = triggr["site_id"]
        run_id = state["run_id"]
        site_area = state["site_area"]
        path = input_filepaths_dict[site_area]["input_file_path"]

        # get descrepancy function from main question
        discrepancy_function = self.get_discrepancy_function(main_question)

        # run the chosen function if required
        df = pd.DataFrame()
        if discrepancy_function != "None":
            # get function from string
            discrepancy_function = globals()[discrepancy_function]
            df = discrepancy_function(path, SITE_ID)

        # save the discrepancy data
        folder = os.path.join(FINDINGS_OUTPUT_FOLDER, run_id)
        os.makedirs(folder, exist_ok=True)
        file_name = os.path.join(
            folder,
            f"discrepancy_data_{state['activity'].split(' ### ')[0][1:-1] + '.json'}".replace("#", "_"),
        )
        if len(df) > 0:
            df.to_json(file_name, orient="records", indent=4)

    def discrepancy_data_generator_node(self, state: InspectionAgentState):
        # defining variables
        """
        This node generates the output table for the given main question and conclusion.

        It reads the data from the sheet, filters the columns, and selects the relevant rows
        in two iterations. In the first iteration, it selects all the rows that are relevant
        to the main question. In the second iteration, it selects the relevant rows from the
        filtered dataframe.

        The output table is saved as a json file in the output folder.

        Args:
            state (InspectionAgentState): The current state of the agent.

        Returns:
            None: The function does not return any value.
        """
        logger.debug("Calling function : discrepancy_data_generator_node...")
        main_question = state["activity"].split("###")[1]
        triggr = state["trigger"]
        trial_id = triggr["trial_id"]
        run_id = state["run_id"]
        site_id = triggr["site_id"]
        site_area = state["site_area"]
        conclusion = state["conclusion"]
        if site_area == "PD":
            sheet_name = "protocol_deviation"
        elif site_area == "AE_SAE":
            sheet_name = "Adverse Events"
        elif site_area == "IC":
            sheet_name = "3. InformedConsent"
        else:
            sheet_name = None
        try:
            file_summary = self.node_functions.get_file_summary(site_area, sheet_name, input_filepaths_dict)
        except Exception as e:
            logger.error(f"Error reading summary file file in discrepancy_data_generator_node: {e}")
            add_ai_msg = (
                f"{bold_start}WARNING!!{bold_end}\nSummary file is missing. No output table "
                "will be generated. Check if correct file is present and reingested."
            )

            site_area_activity_list_index = state["site_area_activity_list_index"]
            return {
                "inspection_messages": AIMessage(
                    name=f"{bold_start}Inspection - discrepancy_data_generator_node_{site_area_activity_list_index}:{bold_end}",
                    content=add_ai_msg,
                ),
            }

        # read data and filter columns
        try:
            df = self.node_functions.get_sheet_data_for_siteid_trialid(
                site_area, sheet_name, input_filepaths_dict, site_id, trial_id
            )
        except Exception as e:
            logger.error(f"Error reading data from file in discrepancy_data_generator_node: {e}")
            add_ai_msg = f"{bold_start}WARNING!!{bold_end}\nData file is missing. No output table will be generated."

            site_area_activity_list_index = state["site_area_activity_list_index"]
            return {
                "inspection_messages": AIMessage(
                    name=f"{bold_start}Inspection - discrepancy_data_generator_node_{site_area_activity_list_index}:{bold_end}",
                    content=add_ai_msg,
                ),
            }

        required_columns_for_output_table = self.node_functions.choose_columns_for_output_table(
            file_summary, main_question, conclusion
        )
        # Added to check if there are any irrelavant columns
        dropped_cols = []
        for col in required_columns_for_output_table:
            if col not in df.columns:
                required_columns_for_output_table.remove(col)
                logger.error(f"{col} is not present in {df.columns}, dropping it")
                dropped_cols.append(col)

        df_imp_cols = df[required_columns_for_output_table].copy()

        # first iteration for row selection
        row_ids = []
        n_rows = df_imp_cols.shape[0]
        df_imp_cols["Row_ID"] = df.index
        try:
            for i in range(0, n_rows, window_size_for_output_table_generation):
                temp_df = df_imp_cols[i : i + window_size_for_output_table_generation]

                selected_row_ids = self.node_functions.choose_relavant_rows(
                    temp_df.to_html(),
                    main_question,
                    conclusion,
                    file_summary,
                    choose_rows_prompt=inspection_prompts["RELEVANT_ROWS_FOR_OUTPUT_TABLE_FIRST_ITERATION"],
                )
                row_ids.extend([row.row_id for row in selected_row_ids])
            df_filtered = df_imp_cols[df_imp_cols["Row_ID"].isin(row_ids)].copy()
        except Exception as e:
            logger.error(f"Error in first iteration for row selection: {e}")
            logger.info("Saving empty dataframe...")
            df_filtered = pd.DataFrame(columns=required_columns_for_output_table)

        # second iteration for row selection
        if len(df_filtered) != 0:
            try:
                row_ids = self.node_functions.choose_relavant_rows(
                    df_filtered.to_html(),
                    main_question,
                    conclusion,
                    file_summary,
                    choose_rows_prompt=inspection_prompts["RELEVANT_ROWS_FOR_OUTPUT_TABLE_SECOND_ITERATION"],
                )
                row_ids = [row.row_id for row in row_ids]
                df_filtered = df[df.index.isin(row_ids)]
            except Exception as e:
                logger.error(f"Error in second iteration for row selection: {e}")
                logger.info("Saving empty dataframe...")
                df_filtered = pd.DataFrame(columns=required_columns_for_output_table)

        if len(df_filtered) == 0:
            add_ai_msg = (
                f"{bold_start}WARNING!!{bold_end}\nNo relevant rows selected for output table as per the conclusion. "
                "No output table will be generated."
            )

            site_area_activity_list_index = state["site_area_activity_list_index"]
            return {
                "inspection_messages": AIMessage(
                    name=f"{bold_start}Inspection - discrepancy_data_generator_node_{site_area_activity_list_index}:{bold_end}",
                    content=add_ai_msg,
                ),
            }

        # save the output table
        folder = os.path.join(FINDINGS_OUTPUT_FOLDER, run_id)
        os.makedirs(folder, exist_ok=True)
        file_name = os.path.join(
            folder,
            f"discrepancy_data_{state['activity'].split(' ### ')[0][1:-1] + '.json'}".replace("#", "_"),
        )
        if len(df_filtered) > 0:
            df_filtered.to_json(file_name, orient="records", indent=4)

        if len(dropped_cols) > 0:
            ai_warning = (
                f"{bold_start}WARNING!!{bold_end}\n{col} is not present in {df.columns}"
                " (i.e., Discrepancy Dataset), dropping it."
            )

            site_area_activity_list_index = state["site_area_activity_list_index"]
            return {
                "inspection_messages": AIMessage(
                    name=f"{bold_start}Inspection - discrepancy_data_generator_node_{site_area_activity_list_index}:{bold_end}",
                    content=ai_warning,
                ),
            }

    @retry(tries=3, delay=5)
    def sub_activity_generator_node(self, state: InspectionAgentState):
        logger.debug("Calling function : sub_activity_generator_node")
        """
        Generate sub-activity based on the main inspection-related activity question.

        This function uses the model to decompose the main inspection activity question
        into a list of detailed sub-activities.
        These sub-activities are intended to guide a thorough inspection review.

        Args:
            state (InspectionAgentState): The current state of the planner agent, containing
            the main question (that is, main inspection activity question) and other relevant data.

        Returns:
            dict: A dictionary containing the generated sub-activities and the final response.
        """

        # Define the system prompt to instruct the model on its task
        SYSTEM_PROMPT = inspection_prompts["SUB_ACTIVITY_CREATION_NODE"]

        activity_name = state["activity"].split("###")[1]
        activity_id = state["activity"].split("###")[0]

        prompt = inspection_prompts["GENERATE_SUB_ACTIVITIES_PROMPT"].format(activity=activity_name)

        # Prepare the messages to be passed to the model
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=prompt),
        ]

        # Invoke the model to get the structured response with refined
        # sub_activities
        try:
            response = model_with_sub_activity_structured_output.invoke(messages)
            # Return the generated sub-activities and the final response
            site_area_activity_list_index = state["site_area_activity_list_index"]
            return {
                "sub_activities": response,
                "final_sub_activities": response,
                "inspection_messages": AIMessage(
                    name=f"{bold_start}inspection - planner_agent_{site_area_activity_list_index}:{bold_end}",
                    content=(
                        f"Generating sub-activities for: {activity_id}\n\n"
                        "Below are the generated sub-activities:\n" + "\n".join([f"• {x}" for x in response.sub_activities])
                    ),
                ),
            }
        except Exception as e:
            logger.error(f"sub-activity generation failed due to error: {e}")

            site_area_activity_list_index = state["site_area_activity_list_index"]
            return {
                "inspection_messages": AIMessage(
                    name=f"{bold_start}inspection - planner_agent_{site_area_activity_list_index}:{bold_end}",
                    content=(f"Could not generating sub-activities for: {activity_id} due to error: {e}"),
                ),
            }

    @retry(tries=2, delay=5)
    def validate_sub_activity_node(self, state: InspectionAgentState) -> dict:
        logger.debug("Calling function : validate_sub_activity_node...")
        """
        Validate the sub_activities and determine if further refinement is needed.

        This function validates the sub_activities generated in the current state by using feedback.
        It also checks if the maximum number of revisions has been exceeded, and updates the feedback flag accordingly.

        Args:
            state (InspectionAgentState): The current state of the planner agent, including sub_activities,
            revision numbers, and feedback.

        Returns:
            dict: A dictionary containing the feedback message,
            a flag indicating whether to work on feedback,
                and the updated revision number.
        """
        exception = False
        # Validate the sub_activities using the feedback process
        try:
            response = self.node_functions.validate_sub_activity(state["sub_activities"])
            logger.debug("Obtained response from : validate_sub_activity_node")
        except Exception as e:
            add_ai_msg = f"Faced error in obtaining response from validate_sub_activity_node: {e}"
            logger.error(add_ai_msg)
            exception = True
        if "sub-activity generation failed critique node with error:" in response:
            logger.error(response)
            exception = True
        # Determine if the feedback flag should be set based on the revision
        # count
        if state["revision_number"] >= state["max_revisions"]:
            feedback_flag = False
        else:
            logger.debug("As per response from validate_sub_activity_node, need to rewrite the sub-activities")
            feedback_flag = response.Need_to_rewrite
        
        extra_state_for_next_step = None
        if not feedback_flag:
            extra_state_for_next_step = {
                "last_node": "feedback_agent",
                "next_node": "selfrag_subgraph",
                "purpose": "get_user_feedback",
            }

        if not exception:
            add_ai_msg = (
                "Invoking critique agent for validating sub-activities \n"
                "LLM Feedback on sub-activities: "
                + "\nDo we need to work on feedback"
                + f"-> {['Yes' if feedback_flag else 'No'][0]},"
                + f"\nWhat is the feedback-> {response.Feedback_Value}"
            )

        # Return the feedback, work_on_feedback flag, and updated revision
        site_area_activity_list_index = state["site_area_activity_list_index"]
        state_update = {
            "feedback_from": "critique_agent",
            "feedback": response.Feedback_Value,
            "work_on_feedback": feedback_flag,
            "inspection_messages": AIMessage(
                name=f"{bold_start}inspection - critique_agent_{site_area_activity_list_index}:{bold_end}",
                content=add_ai_msg,
            ),
        }

        if extra_state_for_next_step is not None:
            state_update.update(extra_state_for_next_step)

        return state_update

    def work_on_feedback_node(self, state: InspectionAgentState) -> dict:
        logger.debug("Calling function : work_on_feedback_node")
        """
        Refine sub_activities based on feedback and update the state.

        This function uses the feedback from the current state to generate
        a refined set of sub_activities.
        The refined sub_activities are then updated in the state.

        Args:
            state (InspectionAgentState): The current state of the planner agent,
            including feedback and the main question.

        Returns:
            dict: A dictionary containing the refined sub_activities and the final response.
        """
        # Extract feedback and main question from the current state
        feedback = state["feedback"]

        # Generate refined sub_activities based on the feedback
        response, status = self.node_functions.work_on_feedback(feedback, state["activity"])
        if status == 500:
            add_ai_msg = f"{bold_start}WARNING!!{bold_end}\nWorking on feedback\n{response}"
        else:
            add_ai_msg = "Working on feedback\nUpdated sub-activities:\n" + "".join(
                [f"{i + 1}. {x}\n" for i, x in enumerate(response.sub_activities)]
            )
        # Return the refined sub_activities and the final response
        site_area_activity_list_index = state["site_area_activity_list_index"]
        return {
            "sub_activities": response,
            "final_sub_activities": response,
            "revision_number": state.get("revision_number", 0) + 1,
            "inspection_messages": AIMessage(
                name=f"{bold_start}inspection - feedback_agent node_{site_area_activity_list_index}:{bold_end}",
                content=add_ai_msg,
            ),
        }

    def interrupt_for_planner_feedback(self, state: InspectionAgentState) -> dict:
        logger.debug("Calling function : interrupt_for_planner_feedback...")
        if FEEDBACK_FOR_PLANNER:
            feedback = state["human_feedback"]
        else:
            feedback = "y"
        return {
            "feedback_from": "planner_user_validation",
            "feedback": feedback,
        }

    # def add_human_in_the_loop_node(self, state: InspectionAgentState) -> dict:
    #     if FEEDBACK_FOR_PLANNER:
    #         return {"feedback": state["human_feedback"]}
    #     return {"feedback": "y"}

    def generate_findings(self, state: InspectionAgentState):
        logger.debug("Calling function : generate_findings...")
        special_instruction = state.get("human_feedback", "NA")
        if special_instruction != "NA":
            findings_msg = "Here is the re-generated summary"
        else:
            findings_msg = "Here is the generated summary"

        sub_activities = state["final_sub_activities"].sub_activities
        sub_activities_answers = [v for x in state["sub_activities_answers"] for k, v in x.items()]

        SUMMARY_PROMPT = inspection_prompts["GENERATE_FINDINGS_SUMMARY_PROMPT"]
        chain = ChatPromptTemplate.from_template(SUMMARY_PROMPT) | model | StrOutputParser()

        all_qa = (
            "Main Activity: "
            + state["activity"]
            + "\n\n"
            + "\n\n".join(
                [
                    "Sub Activity: " + q + "\n" + "-> Output: " + a
                    for q, a in zip(
                        sub_activities,
                        sub_activities_answers[-len(sub_activities) :],
                    )
                ]
            )
        )

        conclusion_response = chain.invoke({"QnA_Summary": all_qa, "Special_instruction": special_instruction})
        file_name = state["activity"].split(" ### ")[0][1:-1]
        run_id = state["run_id"]
        file_path = os.path.join(
            FINDINGS_OUTPUT_FOLDER,
            run_id,
            f"{file_name + '.txt'}".replace("#", "_"),
        )
        full_content = all_qa + "\n\nConclusion: \n" + conclusion_response
        self.node_functions.store_output_to_file(content=full_content, file_path=file_path)  # save all findings
        conclusion_file_name = "conclusion_" + state["activity"].split(" ### ")[0][1:-1]
        conclusion_file_path = os.path.join(
            FINDINGS_OUTPUT_FOLDER,
            run_id,
            f"{conclusion_file_name + '.txt'}".replace("#", "_"),
        )
        self.node_functions.store_output_to_file(
            content=state["activity"] + "\n\n" + conclusion_response,
            file_path=conclusion_file_path,
        )  # save conclusion
        activity_findings = state.get("activity_findings", {})
        trigger = state["trigger"]
        trial_id = trigger["trial_id"]
        activity_findings[trial_id] = [all_qa + "\n\nConclusion: \n" + conclusion_response]

        site_area_activity_list_index = state["site_area_activity_list_index"]
        return {
            "last_node": "generate_findings_agent",
            "next_node": "discrepancy_data_generator",
            "purpose": "get_user_feedback",
            "activity_findings": activity_findings,
            "conclusion": conclusion_response,
            "inspection_messages": AIMessage(
                name=f"{bold_start}inspection - generate_findings_agent_{site_area_activity_list_index}:{bold_end}",
                content=(
                    f"Generating findings for the activity"
                    f" \n{findings_msg}:\n"
                    f"\n{bold_start}Conclusion:{bold_end}\n" + conclusion_response
                ),
            ),
        }

    def add_human_in_the_loop_for_validating_findings(self, state: InspectionAgentState):
        logger.debug("Calling function : add_human_in_the_loop_for_validating_findings ...")
        if "human_feedback" in state.keys():
            special_instruction = state["human_feedback"]
        else:
            special_instruction = "NA"
        return {"human_feedback": special_instruction}
