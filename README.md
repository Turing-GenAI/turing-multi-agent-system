# JnJAuditCopilot and Scheduler API for Agent Runs

## Description

This document provides an overview of the JnJAuditCopilot proof of concept (POC) and the Scheduler API for managing agent runs. It outlines the prerequisites, setup instructions, and operational guidelines for both components.

#### JnJAuditCopilot

- The Core application serves as the backbone of the Web-1 service. It is responsible for processing scheduled jobs, which may include data analysis, report generation, or other computational tasks.
  - This application leverages AI algorithms to generate messages and alerts tailored for various roles, including (PD), (AE), and (SGR) agents.
  - By utilizing advanced processing techniques, the Core application ensures timely and relevant information delivery to users.

#### Scheduler API

    - This application acts as a bridge between the frontend user interface and the backend processing components. - It is responsible for handling all scheduled jobs, ensuring that tasks are executed at the appropriate times.
    - The FastAPI framework provides high performance and easy integration with asynchronous programming, allowing for efficient handling of multiple requests.
    - It also manages communication with Redis, facilitating the storage and retrieval of job statuses and results.

## Pre-requisites

- **Python >= 3.10**: Ensure you have Python version 3.10 or higher installed.
- **Poetry**: A dependency management tool for Python.
- **Docker**: Required for running the Redis service.
- **Code Repository**: Clone the respective repositories for JnJAuditCopilot and Scheduler API.

## Setup Environment

### JnJAuditCopilot

1. Clone the repository.
2. Navigate to the project directory: `cd jnj_audit_copilot`.
3. Install dependencies using Poetry: `poetry install`.
4. Create a `.env` file in the root directory. Refer to `sample_env.txt` for parameters.
5. (Optional) Edit `jnj_audit_copilot/app/common/config.py` to set paths for input and output folders.
6. (Optional) Modify `jnj_audit_copilot/activities.json` to customize PD and AE/SAE questions.

### Scheduler API

1. Navigate to the scheduler app directory: `cd scheduler_app`.
2. Install dependencies using Poetry: `poetry install`.
3. Set up Redis and run Docker:
   ```bash
   sudo docker run --name jnjcopilot-redis-container -p 6379:6379 -d redis
   ```
4. Run the FastAPI app:
   ```bash
   cd scheduler_app/app
   uvicorn app:app --reload
   ```
5. Confirm FastAPI is running by checking `http://<url>:<port>/`.

## Running the Agent Locally

To run the agent in the terminal, execute:

```bash
bash run_agent.sh
```

## Running the Agent with Streamlit UI and Scheduler Integrated

1. Navigate to the project directory: `cd jnj_audit_copilot`.
2. Change `run_app.py` to `run_app_redis.py` in the `run_agent.sh` file.
3. Execute the agent as a cron job:
   ```bash
   bash run_agent.sh
   ```

## Additional Setup

To set up the environment, run:
poetry install

## Code Quality Checks

Before committing code to the repository, ensure to check:

- **Code Formatting and Linting**: `make check`
- **Code Formatting**: `make format`
- **Code Linting**: `make lint`

## Streamlit UI

### Images and Screenshots

This section will include images demonstrating how to schedule a job, user input forms, data tables, and other relevant UI components.

![Job Scheduling](path/to/scheduling_image.png)
![User Input](path/to/user_input_image.png)
![Data Tables](path/to/data_tables_image.png)

### Note

- Ensure both the FastAPI app and Streamlit app are running. Refer to the Scheduler API README for setup instructions.
- Use the Streamlit UI to create jobs for the agent. When the agent starts, it will create the following folders:
  - **outputs/**: Contains all results from the agent.
  - **inputs/**: Temporary directory used by the agent.
  - **chromadb/**: The vector store utilized by the agent.
  - **documents/**: Directory for necessary input documents (e.g., guidelines, sample data).

## Frontend Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Getting Started
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

The application will be available at `http://localhost:5173`.

### Project Structure
```
frontend/
├── src/
│   ├── components/    # Reusable UI components
│   │   ├── findings/  # Components for displaying audit findings
│   │   ├── inputs/    # User input configuration components
│   │   │   └── userInputs/ # Comprehensive input configuration panels
│   │   └── agent/     # Agent interaction components
│   ├── pages/         # Page components (Dashboard, Audit, Inputs)
│   ├── api/           # API services for backend communication
│   ├── styles/        # Global styles and theme
│   └── App.tsx        # Root component with routing
├── public/            # Static assets
└── package.json       # Project dependencies and scripts
```

### Available Scripts
- `npm run dev` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run lint` - Runs the linter
- `npm run start` - Serves the production build on port 3000
- `npm run prod` - Builds and serves the production build

### Frontend Features
- **Dashboard**: Overview of agent activities and system status
- **Audit Page**: View and manage audit findings and retrieved context
- **Inputs Page**: Configure system parameters, query templates, and activity schedules
- **User Interface Components**:
  - Agent interaction window with markdown formatting for important information
  - Findings summary and detailed view with filtering options
  - Retrieved context modal with URL mapping and document links
  - Comprehensive input configuration panels with scheduling capabilities
  - System architecture visualization using ReactFlow

### Integration with Backend
The frontend communicates with both the Scheduler API and the JnJAuditCopilot backend through RESTful API endpoints. Key integrations include:
- Job scheduling and status monitoring
- Retrieving agent messages and findings
- Configuring system parameters and activities
- Managing retrieved context and documentation

## Running the Agent with React UI and Scheduler Integrated
- We have built a dockerized version of the code, where we have redis, agent, scheduler and react UI running in multiple docker connected in a network setup by docker-compose file.
- To run the docker version, follow the below commands:
   - Pre-requisite: Install docker in your system
   - Build the docker:
      `docker-compose up --build -d`
   - Once the docker is built, you can check the images and containers
      - Images
         - `docker images -a`
      - Containers
         - `docker ps -a`
   - You will find all docker container for web, frontend and redis running in your system
- Now, go to browser and check http://localhost:3000/ to use the UI

## Complete System Architecture
The system consists of three main components working together:
1. **JnJAuditCopilot Backend**: AI-powered agent for audit analysis
2. **Scheduler API**: Job management and coordination
3. **React Frontend**: User interface for interaction and visualization

All components can be run individually for development or together using Docker Compose for a production-like environment.