# Reference dictionary for mapping different source formats
ref_dict = {
    "PD": {
        "gap_site": {
            "site_id": "site_number",
            "trial_id": "audit_subject_trial",
        },
        "gap_trial": {"site_id": "", "trial_id": "audit_subject_trial"},
        "pan_site": {"site_id": "site_id", "trial_id": "trial_id"},
        "pan_trial": {"site_id": "", "trial_id": "trial_id"},
        "atlas": {"site_id": "ssid", "trial_id": ""},
        "pat": {"site_id": "", "trial_id": "protocol_id_pat"},
        "adverse_event": {"site_id": "SiteNumber", "trial_id": ""},
        "bll": {"site_id": "", "trial_id": "trial_id"},
        "driver_report": {"site_id": "", "trial_id": "protocol_id"},
        "quasar": {"site_id": "", "trial_id": "trial_id"},
        "serious_breach": {"site_id": "site_id", "trial_id": "trial_id"},
        "issue_escalation": {
            "site_id": "Site_Name",
            "trial_id": "Protocol_Name",
        },
        "sqi": {"site_id": "site_id", "trial_id": "trial_id"},
        "protocol_deviation": {
            "site_id": "Site_Name",
            "trial_id": "Protocol_Name",
        },
        "sae_report": {"site_id": "site_id", "trial_id": "trial_id"},
        "ae_report": {"site_id": "site_id", "trial_id": "trial_id"},
    },
    "AE_SAE": {
        "FileDetails": {"site_id": "", "trial_id": ""},
        "Protocol - HA - EC": {"site_id": "", "trial_id": ""},
        "IB": {"site_id": "", "trial_id": ""},
        "MVR and FUL": {"site_id": "", "trial_id": ""},
        "1572-US-FDF-CV": {"site_id": "", "trial_id": ""},
        "Visit Dates_demographics": {"site_id": "Site", "trial_id": ""},
        "Adverse Events": {"site_id": "Site", "trial_id": ""},
        "Medical History": {"site_id": "Site", "trial_id": ""},
        "Pharmacokinetics": {"site_id": "Site", "trial_id": ""},
        "IP admin": {"site_id": "Site", "trial_id": ""},
        "Vital Signs": {"site_id": "Site", "trial_id": ""},
        "Local Labs": {"site_id": "Site", "trial_id": ""},
        "Study Level": {"site_id": "", "trial_id": ""},
        "Country Level -": {"site_id": "Site", "trial_id": ""},
        "Site Level for Selected Sites": {
            "site_id": "Site",
            "trial_id": "Study",
        },
    },
    "IC": {
        "Site review template summary": {"site_id": "", "trial_id": ""},
        "1. SiteStaffContact": {
            "site_id": "Site number",
            "trial_id": "Primary investigator PID",
        },
        "2. PIHandover&Transfers": {"site_id": "", "trial_id": ""},
        "3. InformedConsent": {"site_id": "", "trial_id": ""},
        "4. PXLTeam List": {
            "site_id": "PAREXEL Site Number",
            "trial_id": "Protocol Number",
        },
        "5 SIV&MVR": {"site_id": "PXL Site Reference Number", "trial_id": ""},
        "6. FUL": {"site_id": "", "trial_id": ""},
        "7. IH issues": {"site_id": "Site Reference Number", "trial_id": ""},
        "8. PDs": {"site_id": "Site Number", "trial_id": ""},
        "9. Site Staff Training": {
            "site_id": "Site Number",
            "trial_id": "Trial Name",
        },
        "10. CluePoints signals list": {"site_id": "Center", "trial_id": ""},
        "11. QIs and SBs": {"site_id": "site_id", "trial_id": "record_id"},
        "12.EC-IRB submissions&appr": {"site_id": "", "trial_id": ""},
        "Copy of Site review template su": {"site_id": "", "trial_id": ""},
    },
}


# Protocol deviation terms for the first part - SGR Report (PPT)
pd_terms = [
    "Entered but did not satisfy criteria",
    "Received wrong treatment or incorrect dose",
    "Received wrong treatment or incorrect dose- regional crisis-related",
    "Developed withdrawal criteria but not withdrawn",
    "Received a disallowed concomitant treatment",
    "Other*",
    "Other - COVID-19",
    "Other - Major Disruption",
]

# Protocol Deviation terms for the second part (Other* category) - SGR
# Report (PPT)
PD_Term_DVTERM = [
    "Clinical laboratory assessments not taken for two or more consecutive visits up to and including Week 48",
    "Deviations from approved IPPI process for preparation and administration of study drug",
    "Video ileocolonoscopy was not performed at Week 12 and/or Week 48 unless not feasible based on medical decision",
    "Subject consented with incorrect initial main ICF",
    "Accidental unblinding of treatment group of a subject or a blinded staff member prior to final analyses",
    "CDAI calculated in error at Week 0 or Week 12 which impacts the clinical response/ non-response",
    "Administration of IP deemed unacceptable for use",
    "CRP or CALPRO done at local lab 2 consecutive collection visits",
    "Non-delegated personnel or non-study personnel at the site performed study-related assessments or procedures",
    "Re-consent of subjects not done",
    "Subject missed two consecutive visits due to reasons other than AE or SAE",
    "Deviation from IP process for preparation and administration of study drug",
]

# Site area data with column description - used by LLM
column_and_file_descriptions = {
    "protocol_deviation.xlsx": {
        "End_Date": ("End date of deviation, when it was actually resolved/closed. " "If missing, assume today's date."),
        "Number_Days_Outstanding": (
            "Calculates resolving time by subtracting start_date from end_date. "
            "If End_Date is missing, consider ongoing, using today's date as End_Date."
        ),
        "Number_Days_to_Become_Aware_of_the_Issue": (
            "Measures days taken to become aware of the deviation, unrelated to closure duration."
        ),
        "Created_Date": ("Date when deviation was first documented, for documentation only; not related to closure."),
    },
    "3. InformedConsent.xlsx": {
        "Master Version Date (DD/MMM/YYYY) / Version # or Addendum #": (
            "Date, version, or addendum identifier of master ICF, used as identifier and for version control checks."
        ),
        "Country Version Date (DD/MMM/YYYY) / Version # or Addendum #": (
            "Date, version, or addendum identifier of country-specific ICF version, tailored for local requirements."
        ),
        "HA Approval Date (DD/MMM/YYYY) (If applicable)": (
            "Approval date of ICF by Health Authority (HA), to confirm compliance before recruitment start."
        ),
        "IEC/IRB Approval Date (DD/MMM/YYYY) (If applicable)": (
            "Approval date by IEC/IRB, ensuring compliance before recruitment. Related to HA Approval."
        ),
        "Date When Written Approval Received": (
            "Date of final written approval for ICF, verifying all requirements before consent at each site."
        ),
        "Summary of Changes: Section/Reason For Change": (
            "Details of ICF amendments, tracking history and reasons for changes. Related to version updates."
        ),
    },
    "issue_escalation.xlsx": {
        "file_summary": (
            "Details escalated issues, including protocols, authorities, sites, timelines, aiding issue management."
        ),
        "Category": ("Category of issues like 'Health Authority', 'IEC/IRB', 'Investigational', 'Other', etc."),
    },
}

# Discrepancy data functions - routed by LLM
discrepancy_function_descriptions_for_routing = {
    "get_pd_discrepancy": (
        """Filters records in "protocol_deviation" where "End_Date" is missing for a site, used for queries on
        discrepancy in protocol deviation closure times."""
    ),
    "get_site_pd_trending": (
        """Filters records in "protocol_deviation" with trending deviations for a site, used for queries on
        protocol deviation trends."""
    ),
    "get_ae_discrepancy": (
        """Filters records in "Adverse Events" where "End_Date" is missing for a site, used for queries on AE or
        SAE end date discrepancies."""
    ),
    "get_sae_delay_by_24hrs": (
        """Filters "Adverse Events" records where SAE report is delayed by over a day for a site, used in SAE
        delay queries."""
    ),
}


# site area's metadata
site_area_context = {
    "PD": "Protocol deviations (PD) refer to instances where the study procedures differ from the "
    "approved protocol, which can have significant implications for data integrity and patient "
    "safety. They are categorized based on their severity, and major deviations may require "
    "immediate reporting to Regulatory Authorities (RA). The process of managing protocol "
    "deviations involves documenting, classifying, and timely resolving them to ensure "
    "compliance. Key abbreviations include PD (Protocol Deviation), RA (Regulatory Authority), "
    "and CAPA (Corrective and Preventive Action).\n"
    "- Report something as a discrepancy only if it is not resolved within the acceptable "
    "time frame.\n"
    "- PDs are unresolved if there is no End date mentioned.\n"
    "- When looking for Trends in Protocol Deviation, one should focus on points like: Common "
    "Types of Issues, repetitive faults/problems (check the variation with time), and events "
    "that reveal problems or errors addressable during the clinical trial.\n"
    "- Always calculate the number of days from the data (e.g., duration should be the "
    "difference between end date and start date).",
    "AE_SAE": "Adverse Events (AE) encompass any undesired medical occurrence in a study subject, "
    "and Serious Adverse Events (SAE) are events that result in death, hospitalization, or "
    "significant disability. SAEs require expedited reporting to ensure subject safety. A "
    "comprehensive system is in place for timely collection, assessment, and reporting of "
    "these events. Abbreviations like AE (Adverse Event), SAE (Serious Adverse Event), and "
    "SUSAR (Suspected Unexpected Serious Adverse Reaction) are key to the reporting process.\n"
    "- For AE/SAEs, there is a delay if the time difference between the reporting date and "
    "the date the investigator became aware is over 24 hours, provided the reporting date is "
    "earlier. Also, an AE/SAE is not in final disposition if there is no end date in the "
    "RAVE report.",
    "IC": "Informed Consent (IC) is the process of providing potential trial participants with "
    "comprehensive information about the study to enable them to make a voluntary, informed "
    "decision about their participation.",
}

site_area_mapping_dict = {'PD': 'Protocol Deviations', 'AE_SAE': 'Adverse/Serious Adverse Events', 'IC': 'Informed Consent'}