import os

import pandas as pd
from langchain_community.document_loaders import UnstructuredExcelLoader

from ...common.descriptions import column_and_file_descriptions
from ...prompt_hub.extraction_prompts import DETAILED_DATAFRAME_SUMMARY_GENERATOR_PROMPT
from ...utils.helpers import read_file
from ...utils.langchain_azure_openai import azure_chat_openai_client as model
from ...utils.log_setup import get_logger
from ...common.config import SHEET_SELECTION, REQUIRED_SHEETS

# Initialize the logger instance
logger = get_logger()


class Extraction:
    def __init__(self, ingested_previously=False, reingest_data_flag=False):
        if not ingested_previously or reingest_data_flag:
            logger.debug("Initializing Extraction core class ...")

    def filter_excel_sheets_by_site_and_trial(
        self,
        input_file_path,
        ref_dict,
        site_id,
        trial_id,
        filtered_input_folderpath,
        filtered_input_file_name=None,
    ):
        """
        Filters the sheets of an input Excel file based on the given site_id and trial_id,
        and saves the filtered data to a new Excel file with the same sheet names.

        Parameters:
        input_file_path (str): Path to the input Excel file.
        ref_dict (dict): A dictionary where keys are sheet names and values are dictionaries with keys
                        'site_id' and 'trial_id' specifying column names.
        site_id (str): The site_id value to filter on.
        trial_id (str): The trial_id value to filter on.
        filtered_input_folderpath (str): Folder to store filtered input
        filtered_input_file_name (str, Optional): Name of the input file, optional

        Returns:
        str: Path to the output file.
        """
        # Convert ref_dict to a reference dataframe
        ref_df = pd.DataFrame.from_dict(ref_dict, orient="index")

        # Set default output file name if not provided
        if filtered_input_file_name is None:
            base_name = os.path.basename(input_file_path)
            filtered_input_file_name = f"filtered_{base_name}"
        # Define output file path
        output_file_path = os.path.join(os.path.join(filtered_input_folderpath), filtered_input_file_name)
        os.makedirs(filtered_input_folderpath, exist_ok=True)
        logger.debug(f"Generated output_file_path: {output_file_path}")

        # Load the Excel file
        logger.debug(f"Reading the input file from the path: {input_file_path}")
        xls = pd.ExcelFile(input_file_path)

        # Initialize a dictionary to hold the filtered data
        filtered_data = {}

        # Loop through each sheet in the Excel file
        sheetnames = xls.sheet_names
        if SHEET_SELECTION:
            sheetnames = [sheet for sheet in sheetnames if sheet in REQUIRED_SHEETS]
        for sheet_name in sheetnames:
            df = read_file(file_path=xls, file_format="xlsx", sheet_name=sheet_name)
            # Get the corresponding column names from the reference dataframe
            site_id_col = ref_df.at[sheet_name, "site_id"]
            trial_id_col = ref_df.at[sheet_name, "trial_id"]
            # Apply filtering based on site_id and trial_id values
            if site_id_col and trial_id_col:
                filtered_df = df[(df[site_id_col] == site_id) & (df[trial_id_col] == trial_id)]
            elif site_id_col:
                filtered_df = df[df[site_id_col] == site_id]
            elif trial_id_col:
                filtered_df = df[df[trial_id_col] == trial_id]
            else:
                filtered_df = df.copy()  # No filtering if both columns are empty
            # Store the filtered dataframe
            filtered_data[sheet_name] = filtered_df

        # Write the filtered data to a new Excel file
        with pd.ExcelWriter(output_file_path) as writer:
            for sheet_name, data in filtered_data.items():
                data.to_excel(writer, sheet_name=sheet_name, index=False)

        logger.info(f"Filtered input file written to: {output_file_path}")
        # self.output_file_path = output_file_path
        return output_file_path

    def split_excel_file(self, file_path):
        """
        Splits an Excel file into individual sheets and saves them as separate Excel files.
        Additionally, saves the first five rows of each sheet in a separate folder.

        Parameters:
        file_path (str): Path to the Excel file to be split.

        Returns:
        tuple: Two lists, one containing the file paths of the split sheets and the other containing
                metadata for each sheet.
        """
        # Extract the base filename and create an output folder
        base_filename = os.path.splitext(os.path.basename(file_path))[0]
        output_folder = os.path.join(os.path.dirname(file_path), base_filename)

        os.makedirs(output_folder, exist_ok=True)

        # Load the Excel file
        excel_file = pd.ExcelFile(file_path)
        # Initialize lists for documents and metadata
        documents = []
        metadatas = []
        # Iterate through each sheet in the Excel file
        for sheet_name in excel_file.sheet_names:
            df = read_file(file_path=excel_file, file_format="xlsx", sheet_name=sheet_name)
            # Create file paths for the full and head data
            output_file_path = os.path.join(output_folder, f"{sheet_name}.xlsx")

            # Save the full and head DataFrames
            df.to_excel(output_file_path, index=False, sheet_name=sheet_name)

            # Append the file paths and metadata
            documents.append(output_file_path)
            metadata = {
                "sheetname": sheet_name,
                "filename": base_filename,
            }
            metadatas.append(metadata)

        logger.info(f"Filtered input file successfully split into individual sheets. Files stored at: {output_folder}")
        return documents, metadatas

    def create_summary_df(self, filtered_root_dir):
        """
        Creates a summary dataframe by generating summaries for each sheet in the filtered directory.

        Parameters:
        filtered_root_dir (str): Directory path containing filtered Excel files.

        Returns:
        pd.DataFrame: A summary dataframe containing the sheet name and generated summary.
        """
        summary_df = pd.DataFrame(columns=["SheetName", "Summary"])

        # Iterate through files in the directory
        for _, _, filenames in os.walk(filtered_root_dir):
            logger.debug(f"filtered_root_dir: {filtered_root_dir}")
            for file in filenames:
                logger.debug(f"Creating summary for file: {file}")
                df = read_file(
                    file_path=os.path.join(filtered_root_dir, file),
                    file_format="xlsx",
                )
                df_cols = str(list(df.columns))

                # Generate a detailed summary using the Azure OpenAI client
                response = model.invoke(
                    DETAILED_DATAFRAME_SUMMARY_GENERATOR_PROMPT.format(
                        dataframe=df,
                        name=file,
                        col_names=df_cols,
                        user_column_description=column_and_file_descriptions.get(file, ""),
                    )
                )
                summary = response.content
                if "LLM_RUN_FAILED" in summary:
                    summary = "summary not available."
                # Append the summary to the dataframe
                summary_df.loc[len(summary_df.index)] = [file, summary]
        logger.info("Summary file generated successfully")
        return summary_df

    def excel_data_loading(self, filtered_root_dir, summary):
        """
        Loads Excel files from the filtered directory and generates document objects.

        Parameters:
        filtered_root_dir (str): Directory path containing filtered Excel files.
        summary (pd.DataFrame): DataFrame containing the summaries of each sheet.

        Returns:
        tuple: A list of document objects and a list of summaries.
        """
        empty_flag = True
        summaries = []
        docs = []
        # Iterate through files in the directory
        for _, _, file_names in os.walk(filtered_root_dir):
            for file in file_names:
                summaries.append(summary.loc[summary["SheetName"] == file, ["Summary"]].values[0][0])

                # Load the Excel file using the UnstructuredExcelLoader
                loader = UnstructuredExcelLoader(os.path.join(filtered_root_dir, file), mode="elements")
                if empty_flag:
                    docs = loader.load()
                    empty_flag = False
                else:
                    docs.extend(loader.load())
        logger.info("Docs and Summaries generated")
        self.docs, self.summaries = docs, summaries
        return self.docs, self.summaries
