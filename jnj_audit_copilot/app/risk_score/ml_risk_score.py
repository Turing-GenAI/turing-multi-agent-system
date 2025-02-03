import json
import os

from ..common.config import INPUT_DIR, RISK_SCORE_INPUT_FILE, ML_RISK_SCORE_SHEETNAME
from ..common.constants import bold_end, bold_start
from ..utils.helpers import read_file


def fetch_ml_risk_score(site_id, trial_id, output_path):
    """
    Fetch the ML Risk Score for a given site and saves the result to a JSON file.

    Args:
    site_id (str): The ID of the site for which the risk score is being calculated.
    output_path (str): The directory where the output JSON file will be saved.

    Returns:
    None
    """
    df = read_file(
        file_path=os.path.join(
            INPUT_DIR, RISK_SCORE_INPUT_FILE
        ),
        file_format="xlsx",
        sheet_name=ML_RISK_SCORE_SHEETNAME,
    )
    if df is None:
        # Prepare the final output
        output = {
            "site_id": site_id,
            "trial_id": trial_id,
            "ML_Risk_Score": None,
        }
        ai_message = f"{bold_start}WARNING!!{bold_end}\nNo data in {RISK_SCORE_INPUT_FILE} for site_id-{site_id} and trial_id-{trial_id} for ML_Risk_Score."
    else:
        df_site = df[(df["site_id"] == site_id) & (df["trial_id"] == trial_id)]

        if len(df_site) == 0:
            # Prepare the final output
            output = {
                "site_id": site_id,
                "trial_id": trial_id,
                "ML_Risk_Score": None,
            }
            ai_message = f"{bold_start}WARNING!!{bold_end}\nNo data in {RISK_SCORE_INPUT_FILE} for site_id-{site_id} and trial_id-{trial_id} for ML_Risk_Score."
        else:

            composite_score = df_site["ML_risk_score"].values[0]

            # Prepare the final output
            output = {
                "site_id": site_id,
                "trial_id": trial_id,
                "ML_Risk_Score": round(composite_score, 4),
            }

            ai_message = ""
    # Define the output file path
    output_file = os.path.join(
        output_path, f"{str(site_id)}_ML_Risk_Score.json"
    )

    # Save the result to the JSON file
    with open(output_file, "w") as file:
        json.dump(output, file, indent=4)

    return ai_message
