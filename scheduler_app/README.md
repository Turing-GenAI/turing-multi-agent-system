# Scheduler API for Agent Runs

# Pre-requisites
- Python >= 3.10
- Poetry
- Docker
- Code repository

# Setup Environment
- `cd scheduler_app`
- `poetry install`

# Setup Redis and Run Docker
- `docker run --name jnjcopilot-redis-container -p 6379:6379 -d redis`

# Run the FastAPI App
- `cd scheduler_app/app`
- `uvicorn app:app --reload`

- Check `http://<url>:<port>/` to confirm if FastAPI is running
- Note: Edit the config.py file to configure Redis (URL, port, DB) and FastAPI URL settings

# Swagger URL to Test the APIs
- Go to browser and check `http://<url>/docs`

# To Run Frontend UI
- For the enhanced React frontend:
  - `cd frontend`
  - `npm install` (first time setup)
  - `npm run dev`
- For the legacy Streamlit UI:
  - `cd scheduler_app/app`
  - `streamlit run streamlit_app.py`

- Note: The FastAPI app must be running in the background for the frontend to work correctly

# Additional:
### Before committing the code to repo, make sure you check these
- To check code formatting and linting - `make check`
- To do code formatting - `make format`
- To do code linting - `make lint`