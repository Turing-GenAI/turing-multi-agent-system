import os

from ..common.descriptions import ref_dict
from ..utils.helpers import input_filepaths_dict
from ..utils.log_setup import get_logger
from .extraction.extraction import Extraction

# Get the same logger instance set up earlier
logger = get_logger()


class ExtractionFacade:
    def __init__(self, site_area: str, site_id: str, trial_id: str, ingested_previously=False, reingest_data_flag=False):
        if not ingested_previously or reingest_data_flag:
            logger.debug("Initialising ExtractionFacade...")
        self.site_area = site_area
        self.site_id = site_id
        self.trial_id = trial_id

        self.ref_dict = ref_dict[self.site_area]

        self.input_filepaths_dict = input_filepaths_dict[self.site_area]
        self.filtered_input_folderpath = self.input_filepaths_dict["filtered_input_folderpath"]
        self.input_file_path = self.input_filepaths_dict["input_file_path"]
        self.filtered_root_dir_path = self.input_filepaths_dict["filtered_root_dir_path"]
        self.summary_docs_folder = self.input_filepaths_dict["summary_docs_folder"]
        self.summary_df_file_path = self.input_filepaths_dict["summary_df_file_path"]

        self.extractor = Extraction(ingested_previously=ingested_previously, reingest_data_flag=reingest_data_flag)

    def extract_files(self):
        filtered_input_file = self.extractor.filter_excel_sheets_by_site_and_trial(
            input_file_path=self.input_file_path,
            ref_dict=self.ref_dict,
            site_id=self.site_id,
            trial_id=self.trial_id,
            filtered_input_folderpath=self.filtered_input_folderpath,
        )
        logger.info(f"Filtered data has been saved to {filtered_input_file}")

        # Generate documents and metadata from the Excel sheets if needed
        data_documents, data_metadatas = self.extractor.split_excel_file(file_path=filtered_input_file)
        logger.info("Filtered input file successfully split into separate sheets.")

        # Create a summary DataFrame and save it to a file if retriever is
        # being created from scratch
        summary_df = self.extractor.create_summary_df(self.filtered_root_dir_path)
        os.makedirs(self.summary_docs_folder, exist_ok=True)
        summary_df.to_excel(self.summary_df_file_path)

        logger.info("Successfully created Input data Summary file")

        return "Data Extraction Successful"


if __name__ == "__main__":
    extraction_facade = ExtractionFacade()
    data_docs, data_summaries = extraction_facade.extract_files()
