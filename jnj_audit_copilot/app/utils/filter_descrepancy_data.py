import pandas as pd

from ..utils.helpers import read_file
from ..utils.log_setup import get_logger

# Get the same logger instance set up earlier
logger = get_logger()


def get_pd_discrepancy(pd_datapath, site_id):
    """
    Filters records from the 'protocol_deviation' sheet where the 'End_Date'
    is missing, blank, or None for a specified site.

    Parameters:
    pd_datapath (str): File path to the Excel document containing PD data.
    site_id (str): Site identifier used to filter the data by 'Site_Name'.

    Returns:
    pd.DataFrame: DataFrame containing records with missing or blank 'End_Date'.
    """
    # Load the specified Excel sheet; returns None if loading fails
    df = read_file(
        file_path=pd_datapath,
        file_format="xlsx",
        sheet_name="protocol_deviation",
    )
    if df is None:
        logger.error("Could not read {pd_datapath}'s protocol_deviation data.")
        return pd.DataFrame()

    # Filter data to include only records for the given site_id
    df = df[df["Site_Name"] == site_id]

    # Convert 'End_Date' column to string format to standardize handling of
    # blanks and NaN values
    df["End_Date"] = df["End_Date"].astype(str)

    # Select rows where 'End_Date' is missing, blank, or "NaT" (Not a Time)
    df_filtered = df[df["End_Date"].isna() | (df["End_Date"].str.strip() == "") | (df["End_Date"] == "NaT")]

    return df_filtered


def get_site_pd_trending(pd_datapath, site_id):
    """
    Retrieves and filters trending protocol deviations for a specified site,
    showing only the top deviations that occur more than once.

    Parameters:
    pd_datapath (str): Path to the Excel document containing PD data.
    site_id (str): Site identifier for filtering by 'Site_Name'.

    Returns:
    pd.DataFrame: DataFrame of records for the top trending deviations at the site.
    """
    # Load the Excel sheet and exit if unsuccessful
    df = read_file(
        file_path=pd_datapath,
        file_format="xlsx",
        sheet_name="protocol_deviation",
    )
    if df is None:
        logger.error("Could not read {pd_datapath}'s protocol_deviation data.")
        return pd.DataFrame()

    # Filter data to include only records for the specified site_id
    df = df[df["Site_Name"] == site_id]

    # Count occurrences of each deviation and filter those occurring more than
    # once, excluding 'other'
    df_trending_PD = df["Deviation"].value_counts().reset_index()
    df_trending_PD = df_trending_PD[df_trending_PD["Deviation"].fillna("other").str.lower() != "other"]
    df_trending_PD = df_trending_PD[df_trending_PD["count"] > 1].head(3)  # Select top 3 deviations

    # Filter the main DataFrame to only include top trending deviations
    trending_PD = df_trending_PD["Deviation"].unique()
    df = df[df["Deviation"].isin(trending_PD)]

    return df


def get_ae_discrepancy(ae_path, site_id):
    """
    Identifies discrepancies in adverse events for a specified site by checking
    records with missing 'end date' or unresolved outcomes.

    Parameters:
    ae_path (str): Path to the Excel file containing Adverse Events data.
    site_id (str): Site identifier for filtering by 'Site'.

    Returns:
    pd.DataFrame: Combined DataFrame of records with missing 'end date'
    or unresolved 'outcome'.
    """
    # Load the 'Adverse Events' sheet and exit if loading fails
    df = read_file(file_path=ae_path, file_format="xlsx", sheet_name="Adverse Events")
    if df is None:
        logger.error("Could not read {ae_path}'s Adverse Events data.")
        return pd.DataFrame()

    # Filter data for the given site_id
    df = df[df["Site"] == site_id]

    # Convert 'end date' to string to handle blank values consistently
    df["end date"] = df["end date"].astype(str)

    # Filter rows where 'end date' is missing, blank, or None
    df1 = df[df["end date"].isna() | (df["end date"].str.strip() == "")]

    # Filter rows where 'outcome' contains 'Not recovered' or 'Not resolved'
    df2 = df[df["outcome"].str.contains("Not recovered|Not resolved", case=False, na=False)]

    # Combine the two filtered DataFrames and remove duplicates if any
    df_combined = pd.concat([df1, df2]).drop_duplicates()

    return df_combined


def get_sae_delay_by_24hrs(ae_path, site_id):
    """
    Identifies serious adverse events (SAEs) that were reported late (after 24 hours)
    or where the 'Date Investigator/ Investigational Staff became aware' is missing.

    Parameters:
    ae_path (str): Path to the Excel file containing Adverse Events data.
    site_id (str): Site identifier for filtering by 'Site'.

    Returns:
    pd.DataFrame: DataFrame of SAEs reported with a delay or missing awareness date.
    """
    # Load the 'Adverse Events' sheet and exit if unsuccessful
    df = read_file(file_path=ae_path, file_format="xlsx", sheet_name="Adverse Events")
    if df is None:
        logger.error("Could not read {ae_path}'s Adverse Events data.")
        return pd.DataFrame()
    # Filter data to include only records for the specified site_id
    df = df[df["Site"] == site_id]

    # Convert 'Date Investigator/ Investigational Staff became aware' and
    # 'Date of Report' to datetime
    df["Date Investigator/ Investigational Staff became aware"] = pd.to_datetime(
        df["Date Investigator/ Investigational Staff became aware"],
        errors="coerce",
    )
    df["Date of Report"] = pd.to_datetime(df["Date of Report"], errors="coerce")

    # Filter for serious adverse events (SAEs)
    df = df[df["Serious AE"] == "Yes"]

    # Identify SAEs reported more than one day after staff became aware
    df_more_than_1_day = df[
        (df["Date Investigator/ Investigational Staff became aware"].dt.floor("D") - df["Date of Report"].dt.floor("D"))
        > pd.Timedelta(days=1)
    ]

    # Filter for records missing the 'Date Investigator/ Investigational Staff
    # became aware'
    df_missing_aware_date = df[df["Date Investigator/ Investigational Staff became aware"].isna()]

    # Combine delayed SAEs and those missing the awareness date
    df_filtered = pd.concat([df_more_than_1_day, df_missing_aware_date])

    return df_filtered
