import os
import pandas as pd
from sqlalchemy import create_engine, text
from datetime import datetime

# PostgreSQL connection (using the existing database)
db_url = "postgresql://citus:V3ct0r%243arch%402024%21@c-rag-pg-cluster-vectordb.ohp4jnn4od53fv.postgres.cosmos.azure.com:5432/rag_db?sslmode=require"
engine = create_engine(db_url)

# Base directory where the summaries folder is located
summaries_directory = "C:/Users/prash/Documents/sample_azure_rag/summary_docs/"

def process_summary_file(file_path, table_name):
    """Process each summary file and add it to the appropriate table with metadata"""
    print(f"Processing summary file: {file_path}")
    
    try:
        # Read the summary file
        df = pd.read_excel(file_path)
        
        # Add metadata columns
        file_name = os.path.basename(file_path)
        df['source_file'] = file_name
        df['upload_timestamp'] = datetime.now()
        
        # Insert into PostgreSQL under summaries schema
        df.to_sql(
            table_name, 
            engine, 
            schema='summaries',
            if_exists="append", 
            index=False
        )
        print(f"✓ Uploaded summary from {file_name} to summaries.{table_name}")
        
        return True
    except Exception as e:
        print(f"❌ Error processing {file_path}: {str(e)}")
        return False

def main():
    # Create summaries schema if it doesn't exist
    with engine.connect() as conn:
        conn.execute(text('CREATE SCHEMA IF NOT EXISTS summaries'))
        conn.commit()
        print("✓ Ensured 'summaries' schema exists")

    # Track statistics
    processed_files = 0
    failed_files = 0
    processed_tables = set()

    # Process each folder in the summaries directory
    for folder in os.listdir(summaries_directory):
        folder_path = os.path.join(summaries_directory, folder)

        if os.path.isdir(folder_path):
            # Use folder name as table name (cleaned)
            table_name = folder.lower().replace(" ", "_")
            print(f"\n********** Processing folder: {folder} -> Table: summaries.{table_name} **********")

            # Track if we found any files
            files_found = False

            # Process all Excel files in the folder and its subfolders
            for root, dirs, files in os.walk(folder_path):
                for file in files:
                    if file.endswith((".xlsx", ".xls")):
                        files_found = True
                        file_path = os.path.join(root, file)
                        
                        success = process_summary_file(file_path, table_name)
                        if success:
                            processed_files += 1
                            processed_tables.add(table_name)
                        else:
                            failed_files += 1

            if not files_found:
                print(f"⚠️ No Excel files found in {folder_path} or its subfolders")

    # Print summary statistics
    print("\n=== Processing Summary ===")
    print(f"Tables created/updated: {len(processed_tables)}")
    print("Tables processed:")
    for table in sorted(processed_tables):
        print(f"  - summaries.{table}")
    print(f"Files processed successfully: {processed_files}")
    print(f"Files failed: {failed_files}")
    print("\n✅ Summary processing completed!")

def get_table_structure(table_name):
    """Print the structure of a table"""
    with engine.connect() as conn:
        result = conn.execute(text(f"""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'summaries' 
            AND table_name = '{table_name}'
        """))
        return result.fetchall()

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"❌ An error occurred: {str(e)}")
