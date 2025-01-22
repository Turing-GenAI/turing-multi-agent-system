import json
import os

from ..common.risk_score_config import CSS_WEIGHTS
from ..common.config import INPUT_DIR, RISK_SCORE_INPUT_FILE, CSS_RISK_SCORE_SHEETNAME
from ..common.constants import bold_end, bold_start
from ..utils.helpers import read_file


def calculate_css_risk_score(site_id, trial_id, output_path):
    """
    Calculates the CSS Risk Score for a given site based on predefined weights and randomly generated data points,
    and saves the result to a JSON file.

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
        sheet_name=CSS_RISK_SCORE_SHEETNAME,
    )
    if df is None:
        # Prepare the final output
        output = {
            "site_id": site_id,
            "trial_id": trial_id,
            "data_points": None,
            "CSS_Risk_Score": None,
        }
        ai_message = f"{bold_start}WARNING!!{bold_end}\nNo data in {RISK_SCORE_INPUT_FILE} for site_id-{site_id} and trial_id-{trial_id} for CSS_Risk_Score."
    else:
        df_site = df[(df["site_id"] == site_id) & (df["trial_id"] == trial_id)]
        if len(df_site) == 0:
            output = {
                "site_id": site_id,
                "trial_id": trial_id,
                "data_points": None,
                "CSS_Risk_Score": None,
            }
            ai_message = f"{bold_start}WARNING!!{bold_end}\nNo data in {RISK_SCORE_INPUT_FILE} for site_id-{site_id} and trial_id-{trial_id} for CSS_Risk_Score."
        else:
            # Extract values for each factor from the dataframe for the specific
            # site
            data_points = {
                "perc_of_subjects_where_avg_value_is_deviating_in_site": df_site[
                    "perc_of_subjects_where_avg_value_is_deviating_in_site"
                ].values[0],
                "perc_of_patients_with_high_variability_in_test_in_site": df_site[
                    "perc_of_patients_with_high_variability_in_test_in_site"
                ].values[0],
                "perc_of_subjects_with_high_change_over_time_collection_timepoints_in_site": df_site[
                    "perc_of_subjects_with_high_change_over_time_collection_timepoints_in_site"
                ].values[
                    0
                ],
                "perc_of_abnormal_categorical_variable(AE,SAE,PD)_in_site": df_site[
                    "perc_of_abnormal_categorical_variable(AE,SAE,PD)_in_site"
                ].values[
                    0
                ],
            }

            # Calculate the composite score by multiplying each factor with its
            # corresponding weight
            composite_score = sum(
                data_points[factor] * CSS_WEIGHTS[key]
                for factor, key in zip(data_points.keys(), CSS_WEIGHTS.keys())
            )

            # Prepare the final output
            output = {
                "site_id": site_id,
                "trial_id": trial_id,
                "data_points": {
                    factor: round(value, 4)
                    for factor, value in data_points.items()
                },
                "CSS_Risk_Score": round(composite_score, 4),
            }
            ai_message = ""

    # Define the output file path
    output_file = os.path.join(
        output_path, f"{str(site_id)}_CSS_Risk_Score.json"
    )

    # Save the result to the JSON file
    with open(output_file, "w") as file:
        json.dump(output, file, indent=4)

    return ai_message
