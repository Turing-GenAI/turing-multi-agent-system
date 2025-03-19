import os

from app.common.config import (
    INPUT_DIR,
    INTERMEDIATE_OUTPUTS_DIR,
    OUTPUT_DIR,
    SGR_INPUT_FILENAMES,
    graph_inputs,
)


def get_project_root():
    """
    Get the absolute path to the project root directory.
    """
    # Path to this file
    current_file = os.path.abspath(__file__)
    # Path to utils directory
    utils_dir = os.path.dirname(current_file)
    # Path to app directory
    app_dir = os.path.dirname(utils_dir)
    # Path to jnj_audit_copilot directory
    jnj_dir = os.path.dirname(app_dir)
    # Path to project root
    project_root = os.path.dirname(jnj_dir)
    return project_root

project_root = get_project_root()

# Graph Input Details
site_id = graph_inputs["trigger_list"][0]["site_id"]
trial_id = graph_inputs["trigger_list"][0]["trial_id"]

# Define the filenames for each section in SGR
FINDINGS_OUTPUT_FOLDER = os.path.join(OUTPUT_DIR, "activity_findings")

# Risk Score output folder
RISK_SCORES_OUTPUT_FOLDER = os.path.join(OUTPUT_DIR, "risk_scores")
IR_RISK_SCORE_OUTPUT_FILE = "IR_Risk_Score.json"

# Constants for Formatting
bold_start = "\033[1m"
bold_end = "\033[0m"

window_size_for_output_table_generation = 15

# ChromaDB Folders
CHROMADB_SUMMARY_FOLDER_NAME = "summary"  # ChromaDB directory for storing summary documents
CHROMADB_DOCUMENT_FOLDER_NAME = "document_persist"  # ChromaDB directory for storing document vectors
CHROMADB_GUIDELINES_FOLDER_NAME = "guidelines"  # ChromaDB directory for storing guideline document vectors

# ChromaDB Indexes
CHROMADB_INDEX_SUMMARIES = "summaries"  # ChromaDB index for storing document summaries
# ChromaDB index for storing guideline document vectors
CHROMADB_INDEX_DOCS = "guidelines_vectorstore"
CHROMADB_INDEX_GUIDELINES = "guidelines"

# Box Constants
BOX_ROOT_FOLDER_ID = os.getenv("BOX_ROOT_FOLDER_ID", "0")
BOX_DOWNLOAD_FOLDER = os.path.join(project_root, "jnj_audit_copilot", 'documents')

# PostgreSQL connection
db_url = "postgresql://citus:V3ct0r%243arch%402024%21@c-rag-pg-cluster-vectordb.ohp4jnn4od53fv.postgres.cosmos.azure.com:5432/rag_db?sslmode=require"

CHUNK_SIZE = 3500  # Determines the size of each data chunk when processing documents
# Specifies overlap between chunks to ensure context retention across chunks
CHUNK_OVERLAP = 250

# SGR PATHS
SGR_INTERMEDIATE_FOLDER = os.path.join(INTERMEDIATE_OUTPUTS_DIR, "SGR")
SGR_OUTPUT_FOLDER = os.path.join(OUTPUT_DIR, "SGR")
INTERMEDIATE_PROCESSED_FILE_PATH = os.path.join(INTERMEDIATE_OUTPUTS_DIR, "processed_files")
INTERMEDIATE_SUMMARY_DOCS_PATH = os.path.join(INTERMEDIATE_OUTPUTS_DIR, "summary_docs")

# temp files created for SGR processing
INTERMEDIATE_FILENAMES = {
    "dvdecode": "dvdecode.csv",
    "dvdecode_AT": "dvdecode_AT.csv",
    "pdterm": "pdterm.csv",
    "pdterm_AT": "pdterm_AT.csv",
    "keyobs": "keyobs.txt",
    "pd_section": "pd.txt",
    "site_sponsor_inspections_section": "site_sponsor_inspections.txt",
    "significant_issue_escalations_section": "significant_issue_escalations.txt",
    "qa_audit_section": "qa_audit.txt",
}

# Create the filepaths dictionary
SGR_FILEPATHS = {
    "input": {key: os.path.join(INPUT_DIR, filename) for key, filename in SGR_INPUT_FILENAMES.items()},
    "intermediate": {
        key: os.path.join(SGR_INTERMEDIATE_FOLDER, filename) for key, filename in INTERMEDIATE_FILENAMES.items()
    },
}

# SGR PPT FILENAME
# Filename for the combined presentation in PPTX format
SGR_PPT_FILENAME = "combined_presentation.pptx"

# Final Output
# Filename for the final inspection report in DOCX format
FINAL_OUTPUT_DOCX_FILENAME = "final_inspection_output.docx"
FINAL_OUTPUT_PAGE_TITLE = "JnJ Audit Copilot- Final Outcome"  # Title for the final output document
