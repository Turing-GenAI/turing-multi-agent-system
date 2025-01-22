# Scheduler API for Agent runs

# pre-requisites
- python >= 3.10
- poetry
- docker
- code repo

# setup environment
- `cd scheduler_app`
- `poetry install`

# setup Redis and run docker
- `sudo docker run --name jnjcopilot-redis-container -p 6379:6379 -d redis`

# run the fastapi app
- `cd scheduler_app/app`
- `uvicorn app:app --reload`

- check `http://<url>:<port>/` to confirm if fastapi is running
- Note: change the config.py here to configure redis (url, port, db) and fastapi url.

# swagger url to test the apis
- go to browser and check `http://<url>/docs`

# to run streamlit UI
- `cd scheduler_app/app`
- `streamlit run streamlit_app.py`

- Note: the fastapi app should be running in background for the for the streamlit app to work

# Additional:
### before committing the code to repo, make sure you check these
- To check code formatting and linting - `make check`
- To do code Formatting - `make format`
- To do code Linting - `make lint`