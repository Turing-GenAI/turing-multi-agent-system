# JnJAuditCopilot

# Description
JnJAuditCopilot POC

# pre-requisites
- python >= 3.10
- poetry
- code repo

# setup environment
- `cd jnj_audit_copilot`
- `poetry install`
- create .env file in the repo root directory path. Refer to sample_env.txt to create a copy of .env with the same parameters
- (if required) edit `jnj_audit_copilot/app/common/config.py` file to change the path to your inputs and outputs folders. These the agent will use in the code
- (if required) edit ``jnj_audit_copilot/activities.json` to add or remove PD and AE/SAE questions
- In the .env file ensure we have below keys from Azure:
    * AZURE_OPENAI_API_KEY
    * AZURE_OPENAI_API_ENDPOINT
    * AZURE_OPENAI_API_MODEL_NAME
    * AZURE_OPENAI_API_DEPLOYMENT_NAME
    * AZURE_OPENAI_API_MODEL_VERSION
    * AZURE_OPENAI_EMBEDDING_API_DEPLOYMENT_NAME
    * AZURE_OPENAI_EMBEDDING_API_MODEL_NAME
    
# To run agent locally on terminal
- `bash run_agent.sh`

# To run agent with streamlit UI and scheduler integrated
- go to folder - `cd jnj_audit_copilot`
- change `run_app.py` to `run_app_redis.py` inside `run_agent.sh` file. 
- and execute `bash run_agent.sh` on terminal as a cron job

Note:
- to run this, make sure your scheduler fastapi app and streamlit app is running. Check the readme under the schduler app to set it up
- Go to streamlit UI and create jobs for agent pick. Check screenshots.
- when your agent starts, it will be creating folder like `intermediate_outputs/, outputs/ chromadb/`
    - outputs/ - will have all the results of the agent
    - intermediate_outputs/ - will contains all the intermediate outputs which agents need to execute
    - chromadb/ - this will be the vectorstore the agent will be using
- documents/ - this folder is where all the necessary raw input documents like guidelines pdf, sample data AVA, rave report, etc will be sitting

Always make sure to change the config.py as convenient to store outputs

## To setup environment:
- `poetry install`

# Additional:
### before committing the code to repo, make sure you check these
- To check code formatting and linting - `make check`
- To do code Formatting - `make format`
- To do code Linting - `make lint`