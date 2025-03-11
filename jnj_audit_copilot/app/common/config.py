# ACTIVITY LIST PATH
ACTIVITY_LIST_FILE = "activities.json"  # Path to the JSON file containing a list of activities

# GRAPH
# Graph Configuration
graph_config = {
    "configurable": {"thread_id": 42},  # Thread ID used to manage specific graph configurations
    "recursion_limit": 100,  # Sets a limit on recursion depth to prevent stack overflow
}

# Graph Input Details
graph_inputs = {
    "trigger_list": [
        {
            "site_id": "P73-PL10007",  # Unique ID for the site being inspected
            "trial_id": "CNTO1275PUC3001",  # Trial ID for the clinical study
            "site_areas": [
                # "SGR",
                "PD",
                "AE_SAE",
            ],  # List of inspection areas for the site
            "date": "2024-10-11",  # Date for the scheduled inspection trigger
            "trigger_type": "immediate",  # Type of trigger indicating urgency or timing
            "reingest_data_flag": False,  # Flag to specify if data re-ingestion is required
        },
    ],
    "revision_number": 0,  # Current revision number of the activity generator process
    "max_revisions": 1,  # Maximum allowable revisions for the sub-activity generator
}

# Define the base directories path for input, intermediate outputs, output and chromadb
INPUT_DIR = "./documents"
OUTPUT_DIR = "../outputs/"
CHROMADB_DIR = "chromadb"
INTERMEDIATE_OUTPUTS_DIR = f"{OUTPUT_DIR}/intermediate"

# Agent Scratchpads Path
AGENT_SCRATCHPAD_FOLDER = f"{OUTPUT_DIR}/agent_scratch_pads"  # Directory for storing agent scratchpad files

# Path to the log file "application.log"
LOG_FILE = f"{OUTPUT_DIR}/application.log"

# Base URL for the scheduler API used in the application
SCHEDULER_API_URL = "http://localhost:8000"

# site_data and guidelines input file names
SITE_DATA_INPUT_FILE_NAMES = {
    "PD": {
        "site_data_filename": "PD/data/sample_data_AVA.xlsx",
        "guidelines_data_filename": "PD/guidelines/Inspection Readiness Guidance V4.0.pdf",
    },
    "AE_SAE": {
        "site_data_filename": "AE_SAE/data/RaveReport_example data.xlsx",
        "guidelines_data_filename": "AE_SAE/guidelines/Inspection Readiness Guidance V4.0.pdf",
    },
    "IC": {
        "site_data_filename": "IC/data/Example_siteprofiledata.xlsx",
        "guidelines_data_filename": "IC/guidelines/Inspection Readiness Guidance V4.0.pdf",
    },
}

# SGR input filenames
SGR_INPUT_FILENAMES = {
    "new_desc": "SGR/new_desc.csv",
    "EXAMPLE data for site sponsor inspection": "SGR/EXAMPLE data for site sponsor inspection.xlsx",
    "pd_synthetic_data_filepath": "SGR/pd_synthetic_data.csv",
    "quasar_data": "SGR/quasar_data.csv",
    "sponsor_inspections_data": "SGR/sponsor_inspections_data.csv",
    "sqi_data": "SGR/sqi_data.csv",
    "serious_breach_data": "SGR/serious_breach_data.csv",
    "qis_sbs_data": "SGR/qis_sbs_data.csv",
}

# Risk Score input file name and sheet names
RISK_SCORE_INPUT_FILE = "Risk_Scores/risk_scores.xlsx"
ML_RISK_SCORE_SHEETNAME = "ML_risk_score"
CSS_RISK_SCORE_SHEETNAME = "CSS_risk_score"

SHEET_SELECTION = True
REQUIRED_SHEETS = ["protocol_deviation", "Adverse Events", "3. InformedConsent"]

FEEDBACK_FOR_PLANNER = True

REDIS_HOST = "redis"
REDIS_PORT = 6379
REDIS_DB = 0
REDIS_PWD = ""