# risk score helper functions
import json
import os
from datetime import datetime

import pandas as pd

from app.common.risk_score_config import (
    ACTION_TAKEN_CONFIG,
    COMPLIANCE_WITH_GUIDELINES_CONFIG,
    DAYS_OUTSTANDING_CONFIG,
    NUMBER_OF_AES_CONFIG,
    NUMBER_OF_PDS_CONFIG,
    RESOLUTION_STATUS_CONFIG,
    SEVERITY_OF_AES_CONFIG,
    SEVERITY_OF_PDS_CONFIG,
    TIMELINESS_OF_DETECTION_CONFIG,
    TREATMENT_GIVEN_FOR_AE_CONFIG,
    WEIGHTS_FOR_AE,
    WEIGHTS_FOR_PD,
)
from ..common.constants import FINDINGS_OUTPUT_FOLDER, RISK_SCORES_OUTPUT_FOLDER


# Scoring functions for each factor
def score_number_of_pds(num_pds):
    """
    Assigns a risk score based on the number of protocol deviations (PDs).

    Args:
        num_pds (int): The number of protocol deviations.

    Returns:
        int: The risk score associated with the given number of PDs.
    """
    if num_pds <= NUMBER_OF_PDS_CONFIG["No risk threshold"]:
        return 0
    elif num_pds <= NUMBER_OF_PDS_CONFIG["Low risk threshold"]:
        return NUMBER_OF_PDS_CONFIG["Low risk score"]
    elif num_pds <= NUMBER_OF_PDS_CONFIG["Medium risk threshold"]:
        return NUMBER_OF_PDS_CONFIG["Medium risk score"]
    return NUMBER_OF_PDS_CONFIG["High risk score"]


def score_severity_of_pds(severity):
    """
    Assigns a risk score based on the severity of protocol deviations (PDs).

    Args:
        severity (str): The severity of the PDs.

    Returns:
        int: The risk score associated with the given severity.
    """
    return SEVERITY_OF_PDS_CONFIG.get(severity, 0)


def score_number_of_aes(num_aes):
    """
    Assigns a risk score based on the number of adverse events (AEs).

    Args:
        num_aes (int): The number of adverse events.

    Returns:
        int: The risk score associated with the given number of AEs.
    """
    if num_aes <= NUMBER_OF_AES_CONFIG["No risk threshold"]:
        return 0
    elif num_aes <= NUMBER_OF_AES_CONFIG["Low risk threshold"]:
        return NUMBER_OF_AES_CONFIG["Low risk score"]
    elif num_aes <= NUMBER_OF_AES_CONFIG["Medium risk threshold"]:
        return NUMBER_OF_AES_CONFIG["Medium risk score"]
    return NUMBER_OF_AES_CONFIG["High risk score"]


def score_severity_of_aes(severity):
    """
    Assigns a risk score based on the severity of adverse events (AEs).

    Args:
        severity (str): The severity of the AEs.

    Returns:
        int: The risk score associated with the given severity.
    """
    return SEVERITY_OF_AES_CONFIG.get(severity, 0)


# Function to convert Unix timestamp (in milliseconds) to datetime
def convert_unix_to_datetime(unix_timestamp):
    try:
        return datetime.utcfromtimestamp(unix_timestamp / 1000)
    except Exception:
        for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%m/%d/%Y", "%Y/%m/%d"):
            try:
                return datetime.strptime(str(unix_timestamp), fmt)
            except ValueError:
                continue  # Try next format
        return None


def score_days_outstanding(start_date, end_date):
    """
    Assigns a risk score based on the number of days outstanding for a protocol deviation (PD).

    Args:
        start_date (datetime): The date when the PD was first identified.
        end_date (datetime or NaT): The date when the PD was resolved. If NaT, the current date is used.

    Returns:
        int: The risk score associated with the given number of days outstanding.
    """
    start_date = convert_unix_to_datetime(start_date)
    end_date = convert_unix_to_datetime(end_date)
    if end_date is None:
        end_date = datetime.utcnow()
    days = (end_date - start_date).days
    if days <= DAYS_OUTSTANDING_CONFIG["No risk threshold"]:
        return 0
    elif days <= DAYS_OUTSTANDING_CONFIG["Low risk threshold"]:
        return DAYS_OUTSTANDING_CONFIG["Low risk score"]
    elif days <= DAYS_OUTSTANDING_CONFIG["Medium risk threshold"]:
        return DAYS_OUTSTANDING_CONFIG["Medium risk score"]
    return DAYS_OUTSTANDING_CONFIG["High risk score"]


def score_resolution_status(status):
    """
    Assigns a risk score based on the resolution status of a protocol deviation (PD).

    Args:
        status (str): The resolution status of the PD.

    Returns:
        int: The risk score associated with the given resolution status.
    """
    return RESOLUTION_STATUS_CONFIG.get(status, 0)


def score_action_taken(action):
    """
    Assigns a risk score based on the action taken to resolve a protocol deviation (PD).

    Args:
        action (str): The action taken to resolve the PD.

    Returns:
        int: The risk score associated with the given action taken.
    """
    return ACTION_TAKEN_CONFIG.get(action, 0)


def score_timeliness_detection(Number_Days_to_Become_Aware_of_the_Issue):
    """
    Assigns a risk score based on the timeliness of detection of an issue.

    Args:
        Number_Days_to_Become_Aware_of_the_Issue (int): Number of days taken to become aware of the issue.

    Returns:
        int: The risk score associated with the timeliness of issue detection.
    """
    if (
        Number_Days_to_Become_Aware_of_the_Issue
        <= TIMELINESS_OF_DETECTION_CONFIG["No risk threshold"]
    ):
        return 0
    elif (
        Number_Days_to_Become_Aware_of_the_Issue
        <= TIMELINESS_OF_DETECTION_CONFIG["Low risk threshold"]
    ):
        return TIMELINESS_OF_DETECTION_CONFIG["Low risk score"]
    elif (
        Number_Days_to_Become_Aware_of_the_Issue
        <= TIMELINESS_OF_DETECTION_CONFIG["Medium risk threshold"]
    ):
        return TIMELINESS_OF_DETECTION_CONFIG["Medium risk score"]
    return TIMELINESS_OF_DETECTION_CONFIG["High risk score"]


def score_compliance_with_guidelines(compliance):
    """
    Assigns a risk score based on the compliance level with guidelines.

    Args:
        compliance (str): The compliance level with guidelines.

    Returns:
        int: The risk score associated with the given compliance level.
    """
    return COMPLIANCE_WITH_GUIDELINES_CONFIG.get(compliance, 0)


def score_concomitant_treatment_for_ae(concomitant_treatment):
    """
    Assigns a risk score based on the concomitant treatment given for an adverse event (AE).

    Args:
        concomitant_treatment (str): The concomitant treatment given for the AE.

    Returns:
        int: The risk score associated with the given concomitant treatment.
    """
    return TREATMENT_GIVEN_FOR_AE_CONFIG.get(concomitant_treatment, 0)


def severity_for_ae(row):
    """
    Assigns a severity level to an adverse event (AE) based on the values in the given row.

    Args:
        row (pandas Series): A row of data from a Pandas DataFrame with columns
            'death', 'Required Hospitalization', and 'Seriou AEs'.

    Returns:
        str: The severity level of the AE, which is one of 'Life Threatening',
            'Hospitalized', 'Serious', or 'Non-serious'.
    """
    if row["death"]:
        return "Life Threatening"
    if row["Required Hospitalization"]:
        return "Hospitalized"
    if row["Serious AE"] == "Yes":
        return "Serious"
    return "Non-serious"


def calculate_pd_risk_score(pd_data):
    """
    Calculate risk score for protocol deviations (PDs).

    Parameters:
    pd_data (pandas.DataFrame): DataFrame containing data about protocol deviations.
        Columns:
            - 'Severity': str, severity of PDs
            - 'Start_Date': str, start date of PD
            - 'End_Date': str, end date of PD
            - 'Number of Days to Become Aware of the Issue': int, days taken to become aware of the issue

    Returns:
    float: risk score for PDs
    """
    num_pd_score = score_number_of_pds(len(pd_data))
    pd_severity_score = (
        pd_data["Severity"].apply(lambda x: score_severity_of_pds(x)).mean()
    )
    total_days_outstanding_score = pd_data.apply(
        lambda row: score_days_outstanding(row["Start_Date"], row["End_Date"]),
        axis=1,
    ).mean()
    total_days_to_become_aware_score = (
        pd_data["Number_Days_to_Become_Aware_of_the_Issue"]
        .apply(score_timeliness_detection)
        .mean()
    )

    SCORES = {
        "Number of PDs": num_pd_score,
        "Severity of PDs": pd_severity_score,
        "Days Outstanding": total_days_outstanding_score,
        "Days to Become Aware": total_days_to_become_aware_score,
    }
    # Calculate overall risk score
    weighted_risk_score = sum(
        [
            SCORES.get(factor, 0) * weight
            for factor, weight in WEIGHTS_FOR_PD.items()
        ]
    ) / sum(WEIGHTS_FOR_PD.values())

    return weighted_risk_score


def calculate_ae_risk_score(ae_sae_data):
    """
    Calculate risk score for adverse events (AEs).

    Parameters:
    ae_sae_data (pandas.DataFrame): DataFrame containing data about adverse events.
        Columns:
            - 'Toxicity Grade': str, toxicity grade of AE
            - 'Start_Date': str, start date of AE
            - 'End_Date': str, end date of AE
            - 'Severity': str, severity of AE
            - 'concomitant treatment given for AE': str, whether concomitant treatment was given for AE
            - 'is this an infection?': str, whether AE is an infection
            - 'infection treatment': str, whether infection treatment was given

    Returns:
    float: risk score for AEs
    """
    weights = WEIGHTS_FOR_AE.copy()

    number_of_ae = len(ae_sae_data)
    num_ae_score = score_number_of_aes(number_of_ae)

    ae_sae_data["Severity"] = ae_sae_data.apply(
        lambda row: severity_for_ae(row), axis=1
    )
    ae_severity_score = (
        ae_sae_data["Severity"]
        .apply(lambda x: score_severity_of_aes(x))
        .mean()
    )

    toxicity_grade_score = ae_sae_data["Toxicity Grade"].mean()

    total_days_outstanding_score = ae_sae_data.apply(
        lambda row: score_days_outstanding(row["start date"], row["end date"]),
        axis=1,
    ).mean()

    concomitant_treatment_given_score = (
        ae_sae_data["concomitant treatment given for AE"]
        .apply(score_concomitant_treatment_for_ae)
        .mean()
    )

    infection_score = 0
    count = 0
    for i, row in ae_sae_data.iterrows():
        if row["is this an infection?"] == "Yes":
            count += 1
            if row["infection treatment"] == "Yes":
                infection_score += 0
            else:
                infection_score += 10

    if count > 0:
        infection_score = infection_score / count
    else:
        weights["infection treatment"] = 0

    SCORES = {
        "Number of AEs": num_ae_score,
        "Severity of AEs": ae_severity_score,
        "Toxicity Grade": toxicity_grade_score,
        "Days Outstanding": total_days_outstanding_score,
        "concomitant treatment given for AE": concomitant_treatment_given_score,
        "infection treatment": infection_score,
    }
    # Calculate overall risk score
    weighted_risk_score = sum(
        [SCORES.get(factor, 0) * weight for factor, weight in weights.items()]
    ) / sum(weights.values())

    return weighted_risk_score


def calculate_ir_risk_score(site_id, run_id, trial_id):
    """
    Calculate risk score for a given site and run id.

    Parameters:
    site_id (str): The ID of the site for which the risk score is being calculated.
    run_id (str): The ID of the run for which the risk score is being calculated.

    Returns:
    None
    """
    input_folder = os.path.join(FINDINGS_OUTPUT_FOLDER, run_id)

    # get list of json files starting with "discrepancy"
    json_files = [
        f for f in os.listdir(input_folder) if f.startswith("discrepancy")
    ]

    PD_Scores = []
    AE_Scores = []

    for json_file in json_files:
        # if file name contains 'PD', read it as dataframe and pass it to
        # calculate_pd_risk_score
        if "PD" in json_file:
            pd_data = pd.read_json(os.path.join(input_folder, json_file))
            pd_score = calculate_pd_risk_score(pd_data)
            PD_Scores.append(pd_score / 10)
        # if file name contains 'AE', read it as dataframe and pass it to
        # calculate_ae_risk_score
        elif "AE" in json_file:
            ae_sae_data = pd.read_json(os.path.join(input_folder, json_file))
            ae_score = calculate_ae_risk_score(ae_sae_data)
            AE_Scores.append(ae_score / 10)

    if len(PD_Scores) == 0:
        pd_mean = 0
    else:
        pd_mean = sum(PD_Scores) / len(PD_Scores)

    if len(AE_Scores) == 0:
        ae_mean = 0
    else:
        ae_mean = sum(AE_Scores) / len(AE_Scores)

    if pd_mean == 0 and ae_mean == 0:
        weighted_risk_score = 0
    else:
        weighted_risk_score = (sum(PD_Scores) + sum(AE_Scores)) / (
            len(PD_Scores) + len(AE_Scores)
        )

    # write output to json file
    output_file = os.path.join(
        RISK_SCORES_OUTPUT_FOLDER, run_id, f"{site_id}_IR_Risk_Score.json"
    )
    with open(output_file, "w") as f:
        json.dump(
            {
                "site_id": site_id,
                "trial_id": trial_id,
                "PD_Risk_Score": round(pd_mean, 4),
                "AE_Risk_Score": round(ae_mean, 4),
                "IR_Risk_Score": round(weighted_risk_score, 4),
            },
            f,
            indent=4,
        )
