from langchain_core.messages import HumanMessage, SystemMessage
from retry import retry

from ....common.descriptions import ref_dict
from ....prompt_hub.inspection_prompts import inspection_prompts
from ....utils.helpers import read_file
from ....utils.langchain_azure_openai import (
    model_with_feedback_structured_output,
    model_with_output_table_columns_structure,
    model_with_output_table_rows_structure,
    model_with_sub_activity_structured_output,
)
from ....utils.log_setup import get_logger
from ....utils.response_classes import FeedbackResponse, SubActivityResponse

# Get the same logger instance set up earlier
logger = get_logger()


class inspectionFunctions:
    def __init__(self):
        logger.debug("Initialising inspectionFunctions...")
        pass

    @retry(tries=2, delay=5)
    def validate_sub_activity(self, sub_activities: SubActivityResponse) -> FeedbackResponse:
        logger.debug("Calling function : validate_sub_activity...")
        """
        Validate the generated sub_activities by providing detailed feedback for improvement.

        This function uses the model to review a set of sub_activities related to a main inspection query.
        It critiques the sub_activities to ensure they are comprehensive, logically sequenced, and focused
        on key aspects of the inspection process.
        The function returns feedback indicating whether any modifications are needed.

        Args:
            sub_activities (SubActivityResponse): The sub_activities generated for the main inspection-related query.

        Returns:
            FeedbackResponse: The feedback indicating if rework is needed and providing suggestions for
            improvement if necessary.
        """

        # Define the reflection prompt to instruct the model on how to review
        # the sub-questions
        REFLECTION_PROMPT = inspection_prompts["REFLECTION_PROMPT"]

        # Join the sub_activities with a separator for the model to review
        content_message = "$$".join(sub_activities.sub_activities)

        # Prepare the messages to be passed to the model
        messages = [
            SystemMessage(content=REFLECTION_PROMPT),
            HumanMessage(content=content_message),
        ]

        # Invoke the model to get the structured feedback response
        try:
            response = model_with_feedback_structured_output.invoke(messages)
        except Exception as e:
            response = f"sub-activity generation failed critique node with error: {e}"
            logger.error(response)
        return response

    @retry(tries=3, delay=5)
    def work_on_feedback(self, feedback: str, activity: str) -> SubActivityResponse:
        logger.debug("Calling function : work_on_feedback...")
        """
        Refine sub_activities based on feedback.

        This function uses the model to generate a refined list of sub_activities for a main inspection-related query,
        focusing on areas that were previously overlooked or need more detailed examination.
        The refinement is based on user feedback.

        Args:
            feedback (str): The feedback received on the initial set of sub_activities.
            activity (str): The main question that the sub_activities are intended to address.

        Returns:
            SubActivityResponse: The refined list of sub_activities after considering the feedback.
        """

        # Define the prompt for refining the sub-questions based on feedback
        RESEARCH_CRITIQUE_PROMPT = inspection_prompts["RESEARCH_CRITIQUE_PROMPT"].format(activity=activity)

        # Prepare the messages to be passed to the model
        messages = [
            SystemMessage(content=RESEARCH_CRITIQUE_PROMPT),
            HumanMessage(content=feedback),
        ]

        # Invoke the model to get the structured response with refined
        # sub_activities
        try:
            response = model_with_sub_activity_structured_output.invoke(messages)
        except Exception as e:
            response = f"sub-activity generation failed during work_on_feedback due to error: {e}"
            logger.error(response)
            return response, 500
        # Return the refined sub_activities
        return response, 200

    def store_output_to_file(self, content, file_path):
        logger.debug("Calling function : store_output_to_file...")
        """
        Opens the specified file, creates it if it doesn't exist, and appends the provided content.

        Args:
        content (str): The content to append to the file.
        file_path (str): The path to the file to append to. Default is 'final_output.txt'.
        """
        import os

        directory = os.path.dirname(file_path)

        # Create the directory if it doesn't exist
        if not os.path.exists(directory):
            os.makedirs(directory)

        # Check if the file exists and create it if necessary
        if not os.path.exists(file_path):
            with open(file_path, "w") as file:
                file.write("")  # Optionally write something to initialize the file

        # Append the new content to the file
        with open(file_path, "w", errors = 'ignore') as file:
            file.write(content + "\n")  # Append content followed by a newline

    def clean_columns(columns):
        """
        Clean the column names of the data by stripping, replacing newlines and spaces with underscores.

        Args:
            columns (list): A list of column names.

        Returns:
            list: A list of cleaned column names.
        """
        logger.debug("Calling function : clean_columns...")
        return [column.strip().replace("\n", "_").replace(" ", "_") for column in columns]

    @retry(tries=2, delay=5)
    def choose_columns_for_output_table(self, file_summary, question, conclusion):
        """
        Filters the columns of the data that are relevant to answer the question and the given conclusion.

        Args:
            file_summary (str): A summary of the data in text format.
            question (str): The question to answer.
            conclusion (str): The conclusion made from the answer.

        Returns:
            list: The names of the columns that are relevant to answer the question.
        """
        logger.debug("Calling function : choose_columns_for_output_table...")
        template = inspection_prompts["RELEVANT_COLUMNS_FOR_OUTPUT_TABLE"]
        messages = [
            SystemMessage(content="You are an expert in filtering data."),
            HumanMessage(
                content=template.format(
                    file_summary=file_summary,
                    question=question,
                    answer=conclusion,
                )
            ),
        ]
        try:
            response = model_with_output_table_columns_structure.invoke(messages)
            return response.columns
        except Exception as e:
            logger.error(f"Could not choose any columns due to {e}")
            return []

    @retry(tries=2, delay=5)
    def choose_relavant_rows(
        self,
        data,
        question,
        conclusion,
        file_summary,
        choose_rows_prompt=inspection_prompts["RELEVANT_ROWS_FOR_OUTPUT_TABLE_FIRST_ITERATION"],
    ):
        """
        Filters the rows of the data that are relevant to answer the question and the given conclusion.

        Args:
        data (pandas.DataFrame): The data to filter.
        question (str): The question to answer.
        conclusion (str): The conclusion made from the answer.
        file_summary (str): A summary of the data in text format.
        choose_rows_prompt (str, optional): The prompt to use for asking the model to filter the rows.
        Defaults to inspection_prompts['RELEVANT_ROWS_FOR_OUTPUT_TABLE_FIRST_ITERATION'].

        Returns:
        list: The row ids of the filtered data.
        """
        logger.debug("Calling function : choose_relavant_rows...")
        human_message = choose_rows_prompt.format(
            data=data,
            question=question,
            answer=conclusion,
            column_descriptions=file_summary,
        )
        messages = [
            SystemMessage(content="You are an expert in filtering data."),
            HumanMessage(content=human_message),
        ]
        try:
            response = model_with_output_table_rows_structure.invoke(messages)
            return response.row_ids
        except Exception as e:
            logger.error(f"Could not fetch any relavant rows due to {e}")
            return []

    def get_file_summary(self, site_area, sheet_name, input_filepaths_dict):
        """
        Reads a summary dataframe from an Excel file and gets the summary for the given sheet name.

        Parameters:
        site_area (str): The site area.
        sheet_name (str): The name of the sheet.
        input_filepaths_dict (dict): A dictionary with file paths to different input files.

        Returns:
        str: The summary of the sheet.
        """
        logger.debug("Calling function : get_file_summary...")
        summary_df = read_file(
            file_path=input_filepaths_dict[site_area]["summary_df_file_path"],
            file_format="xlsx",
            index_col=0,
        )
        summary_df_file_path = input_filepaths_dict[site_area]["summary_df_file_path"]
        if summary_df is None:
            logger.error(f"Summary data is missing. {summary_df_file_path}")
            logger.info("Returning empty string")
            return ""

        file_summary = summary_df.loc[summary_df["SheetName"] == sheet_name + ".xlsx"]["Summary"].values[0]
        return file_summary

    def get_sheet_data_for_siteid_trialid(self, site_area, sheet_name, input_filepaths_dict, site_id, trial_id):
        """
        Reads a sheet from the input file, filters the data based on the given site_id and trial_id,
        and returns the filtered data.

        Args:
            site_area (str): The site area.
            sheet_name (str): The sheet name.
            input_filepaths_dict (dict): A dictionary containing the input file paths.
            site_id (str): The site_id value to filter on.
            trial_id (str): The trial_id value to filter on.

        Returns:
            pd.DataFrame: The filtered data.
        """
        logger.debug("Calling function: get_sheet_data_for_siteid_trialid...")
        df = read_file(
            file_path=input_filepaths_dict[site_area]["input_file_path"],
            file_format="xlsx",
            sheet_name=sheet_name,
        )
        site_id_col = ref_dict[site_area][sheet_name]["site_id"]
        trial_id_col = ref_dict[site_area][sheet_name]["trial_id"]

        if site_id_col:
            df = df[df[site_id_col] == site_id]
        if trial_id_col:
            df = df[df[trial_id_col] == trial_id]
        return df
