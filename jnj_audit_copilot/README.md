# JnJAuditCopilot

## Description
JnJAuditCopilot is a Proof of Concept for an AI-powered audit assistant that leverages various cloud services to process, store, and analyze audit-related documentation.

## Prerequisites
- Python >= 3.10
- Poetry (dependency management)
- Git (for repository access)

## Cloud Integrations
The application integrates with three major cloud services:

1. **Box.com Integration**
   - Used for input data management
   - Downloads files from Box to local storage
   - Supports smart downloading (only changed files), overwrite, and skip modes
   - Required environment variables:
     * BOX_CLIENT_ID
     * BOX_CLIENT_SECRET
     * BOX_ENTERPRISE_ID
     * BOX_JWT_KEY_ID
     * BOX_PRIVATE_KEY
     * BOX_PASSPHRASE
     * BOX_ROOT_FOLDER_ID

2. **Azure Cosmos PostgreSQL**
   - Stores structured tabular data
   - Organizes data in proper schemas and tables
   - Used for storing summary data and metadata
   - Connection string format: `postgresql://<username>:<password>@<host>:<port>/<database>?sslmode=require`

3. **Azure MongoDB (vCore)**
   - Used for vector storage with native vector search capabilities
   - Stores embeddings in different collections per site area
   - Supports similarity search with metadata filtering
   - Required environment variables:
     * MONGODB_CONNECTION_STRING
     * MONGODB_DATABASE_NAME
     * VECTOR_DIMENSION (optional)
     * VECTOR_INDEX_TYPE (optional)
     * CREATE_VECTOR_INDEX (optional)

## Utility Scripts
The application includes several standalone scripts for data management:

1. **box_copy_files.py**
   - Downloads files from Box.com to local storage
   - Usage: `python -m app.scripts.box_copy_files`

2. **transfer_to_postgre.py**
   - Transfers Excel files to Azure Cosmos PostgreSQL
   - Usage: `python -m app.scripts.transfer_to_postgre`

3. **transfer_summaries_to_postgre.py**
   - Transfers summary documents to PostgreSQL
   - Usage: `python -m app.scripts.transfer_summaries_to_postgre`

4. **inspect_mongodb.py**
   - Provides tools to inspect and manage MongoDB collections
   - Usage: `python -m app.utils.inspect_mongodb`

5. **create_vector_store.py**
   - Creates and populates vector store in MongoDB
   - Downloads data from Box if needed
   - Usage: `python -m app.utils.create_vector_store`

## Setup & Installation
1. Clone the repository
2. Navigate to the project directory:
   ```
   cd jnj_audit_copilot
   ```
3. Install dependencies:
   ```
   poetry install
   ```
4. Create `.env` file in the repo root directory based on `sample_env.txt`
5. Configure environment variables for:
   - Azure OpenAI
   - Box.com
   - MongoDB
   - PostgreSQL

## Configuration
- Edit `jnj_audit_copilot/app/common/config.py` to configure input/output folders
- Edit `jnj_audit_copilot/activities.json` to configure PD and AE/SAE questions
- Ensure the following Azure OpenAI keys are in your `.env` file:
  * AZURE_OPENAI_API_KEY
  * AZURE_OPENAI_API_ENDPOINT
  * AZURE_OPENAI_API_MODEL_NAME
  * AZURE_OPENAI_API_DEPLOYMENT_NAME
  * AZURE_OPENAI_API_MODEL_VERSION
  * AZURE_OPENAI_EMBEDDING_API_DEPLOYMENT_NAME
  * AZURE_OPENAI_EMBEDDING_API_MODEL_NAME

## Running the Application

# To run agent with streamlit UI and scheduler integrated
- go to folder - `cd jnj_audit_copilot`
- change `run_app.py` to `run_app_redis.py` inside `run_agent.sh` file. 
- and execute `bash run_agent.sh` on terminal as a cron job

### With Streamlit UI and Scheduler
1. Navigate to the project directory:
   ```
   cd jnj_audit_copilot
   ```
2. Update `run_agent.sh` to use `run_app_redis.py` instead of `run_app.py`
3. Execute as a cron job:
   ```
   bash run_agent.sh
   ```

**Note:**
- Ensure the scheduler FastAPI app and Streamlit app are running (see scheduler app README)
- Create jobs via the Streamlit UI
- The agent creates the following directories:
  * `intermediate_outputs/` - contains intermediate outputs
  * `outputs/` - stores agent results
  * `chromadb/` - for local vector storage
  * `documents/` - location for input documents like guidelines PDF, AVA data, RAVE reports

## Project Structure
```
jnj_audit_copilot/
├── app/
│   ├── agents/         # Agent implementation
│   ├── common/         # Shared configurations and constants
│   ├── scripts/        # Utility scripts
│   └── utils/          # Helper functions and cloud integrations
├── documents/          # Input document storage
├── outputs/            # Agent output storage
└── intermediate_outputs/ # Temporary data storage
```

## To setup environment:
- `poetry install`


## Troubleshooting
- **Box.com Connection Issues**: Verify Box credentials in `.env` file
- **Database Connection Errors**: Check connection strings and network access
- **Vector Search Problems**: Ensure MONGODB_CONNECTION_STRING is correctly configured
- **Missing Input Files**: Run box_copy_files.py to download required files

## Development
Before committing code:
- Check formatting and linting: `make check`
- Format code: `make format`
- Lint code: `make lint`