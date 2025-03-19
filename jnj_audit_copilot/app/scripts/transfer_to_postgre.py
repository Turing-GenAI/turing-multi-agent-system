import os
import pandas as pd
from sqlalchemy import create_engine, text
from ..common.config import db_url

# PostgreSQL connection
engine = create_engine(db_url)

# Base directory where folders containing Excel files are located
base_directory = "C:/Users/prash/Documents/sample_azure_rag/documents/"

# Function to process each Excel file
def process_excel_file(file_path, schema_name):
    print(f"Processing file: {file_path}")
    
    # Read the Excel file
    xls = pd.ExcelFile(file_path)

    for sheet_name in xls.sheet_names:
        print(f"Processing sheet: {sheet_name}")

        # Read each sheet into a DataFrame
        df = pd.read_excel(xls, sheet_name=sheet_name)

        # Generate a clean table name
        table_name = sheet_name.lower().replace(" ", "_")

        # Insert into PostgreSQL
        df.to_sql(table_name, engine, schema=schema_name, if_exists="replace", index=False)
        print(f"Uploaded {sheet_name} -> {schema_name}.{table_name}")

# Loop through all folders in the base directory
for folder in os.listdir(base_directory):
    folder_path = os.path.join(base_directory, folder)

    if os.path.isdir(folder_path):  # Ensure it's a folder
        schema_name = folder.lower().replace(" ", "_")  # Use folder name as schema
        print(f"********** Processing folder: {folder} -> Schema: {schema_name} **********")

        # Create schema in PostgreSQL (if not exists)
        with engine.connect() as conn:
            conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS {schema_name}'))
            conn.commit()

        print(f"Processing folder: {folder} -> Schema: {schema_name}")

        # Use os.walk to find all Excel files in folder and subfolders
        excel_files_found = False
        for root, dirs, files in os.walk(folder_path):
            for file in files:
                if file.endswith(".xlsx") or file.endswith(".xls"):  # Only Excel files
                    excel_files_found = True
                    file_path = os.path.join(root, file)
                    process_excel_file(file_path, schema_name)
        
        if not excel_files_found:
            print(f"⚠️ No Excel files found in {folder_path} or its subfolders")

print("All Excel files uploaded successfully!")
