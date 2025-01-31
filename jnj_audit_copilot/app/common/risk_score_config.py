# CSS weights for calculating CSS risk scores
CSS_WEIGHTS = {
    "Average Value": 0.30,
    "Patient Variability": 0.25,
    "Collection Timepoint": 0.15,
    "Categorical Data": 0.30,
}

# Configurations for IR risk scoring
NUMBER_OF_PDS_CONFIG = {
    "No risk threshold": 0,
    "Low risk score": 3,
    "Low risk threshold": 5,
    "Medium risk score": 7,
    "Medium risk threshold": 10,
    "High risk score": 10,
}

SEVERITY_OF_PDS_CONFIG = {
    "Minor": 3,
    "Potentially Major": 7,
    "Major": 10,
}

NUMBER_OF_AES_CONFIG = {
    "No risk threshold": 0,
    "Low risk score": 3,
    "Low risk threshold": 3,
    "Medium risk score": 7,
    "Medium risk threshold": 6,
    "High risk score": 10,
}

SEVERITY_OF_AES_CONFIG = {
    "Non-serious": 3,
    "Serious": 5,
    "Hospitalized": 7,
    "Life Threatening": 10,
}

DAYS_OUTSTANDING_CONFIG = {
    "No risk threshold": 0,
    "Low risk score": 3,
    "Low risk threshold": 30,
    "Medium risk score": 7,
    "Medium risk threshold": 90,
    "High risk score": 10,
}

RESOLUTION_STATUS_CONFIG = {
    "Completed": 3,
    "In Progress": 5,
    "Not Applicable": 10,
}

ACTION_TAKEN_CONFIG = {
    "None": 10,
    "Corrective": 5,
    "Treatment": 5,
    "Monitoring": 5,
    "Immediate": 3,
}

TIMELINESS_OF_DETECTION_CONFIG = {
    "No risk threshold": 0,
    "Low risk score": 3,
    "Low risk threshold": 5,
    "Medium risk score": 7,
    "Medium risk threshold": 20,
    "High risk score": 10,
}

COMPLIANCE_WITH_GUIDELINES_CONFIG = {
    "Fully compliant": 3,
    "Partially compliant": 7,
    "Non-compliant": 10,
}

TREATMENT_GIVEN_FOR_AE_CONFIG = {
    "Yes": 0,
    "No": 10,
}

# Weights for PD factors
WEIGHTS_FOR_PD = {
    "Number of PDs": 3,
    "Severity of PDs": 3,
    "Days Outstanding": 2,
    "Days to Become Aware": 2,
}

# Weights for AE factors
WEIGHTS_FOR_AE = {
    "Number of AEs": 3,
    "Toxicity Grade": 1,  # Used directly in calculations
    "Days Outstanding": 2,
    "Severity of AE": 3,  # Calculated based on hospitalization, death, and seriousness
    "Concomitant treatment given for AE": 1,
    "Infection treatment": 2,  # Considered only if infection is present
}
