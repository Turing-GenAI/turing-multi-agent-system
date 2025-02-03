#!/bin/bash

# Path to the .env file
ENV_FILE="../.env"

# Check if the .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found. Please refer to sample_env.txt file for reference."
    exit 1
fi


FOLDER_PATH=${1:-"outputs/terminal_outputs/"}

# Check if the folder exists
if [ ! -d "$FOLDER_PATH" ]; then
  echo "Creating directory: $FOLDER_PATH"
  mkdir -p "$FOLDER_PATH"
else
  echo "Directory already exists: $FOLDER_PATH"
fi


CURRENT_TIMESTAMP=$(date +"%Y%m%d%H%M%S")
FILE_PATH="$FOLDER_PATH/"file_"$CURRENT_TIMESTAMP.txt"

PYTHON_INTERPRETER=$(which python3)
PYTHON_FILE="run_app_redis.py" 
# PYTHON_FILE="run_app.py" 

$PYTHON_INTERPRETER $PYTHON_FILE 2>&1 | tee >(sed 's/\x1b\[[0-9;]*m//g' > $FILE_PATH)
echo ">>> Agent Executed successfully!"
