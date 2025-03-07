# JnJAuditCopilot

# Description
JnJAuditCopilot is the core application of the Turing Multi-Agent System that processes scheduled jobs using AI algorithms to generate messages and alerts for various roles (PD, AE, SGR).

# Pre-requisites
- Python >= 3.10
- Poetry
- Code repository

# Setup Environment
- `cd jnj_audit_copilot`
- `poetry install`
- Create .env file in the repo root directory path. Refer to sample_env.txt to create a copy of .env with the same parameters
- (if required) Edit `jnj_audit_copilot/app/common/config.py` file to change the path to your inputs and outputs folders. These the agent will use in the code
- (if required) Edit `jnj_audit_copilot/activities.json` to add or remove PD and AE/SAE questions
- In the .env file ensure we have below keys from Azure:
    * AZURE_OPENAI_API_KEY
    * AZURE_OPENAI_API_ENDPOINT
    * AZURE_OPENAI_API_MODEL_NAME
    * AZURE_OPENAI_API_DEPLOYMENT_NAME
    * AZURE_OPENAI_API_MODEL_VERSION
    * AZURE_OPENAI_EMBEDDING_API_DEPLOYMENT_NAME
    * AZURE_OPENAI_EMBEDDING_API_MODEL_NAME
    
# To Run Agent Locally on Terminal
- `bash run_agent.sh`

# To Run Agent with Scheduler Integration
- Go to folder - `cd jnj_audit_copilot`
- Change `run_app.py` to `run_app_redis.py` inside `run_agent.sh` file 
- Execute `bash run_agent.sh` on terminal as a cron job

Note:
- To run this, make sure your scheduler FastAPI app and frontend are running. Check the readme under the scheduler_app folder to set it up
- Use the frontend interface to create and manage jobs for the agent
- When your agent starts, it will create folders like:
    - `outputs/` - Will have all the results of the agent
    - `intermediate_outputs/` - Will contain all the intermediate outputs which agents need to execute
    - `chromadb/` - This will be the vector store the agent will be using
- `documents/` - This folder is where all the necessary raw input documents like guidelines PDF, sample data AVA, RAVE report, etc. will be stored

Always make sure to change the config.py as convenient to store outputs

## To Setup Environment:
- `poetry install`

# Additional:
### Before committing the code to repo, make sure you check these
- To check code formatting and linting - `make check`
- To do code formatting - `make format`
- To do code linting - `make lint`