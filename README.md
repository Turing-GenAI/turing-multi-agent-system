# Turing Multi-Agent System

## Overview

This document provides an overview of the Turing Multi-Agent System, which consists of three main components:

1. **JnJAuditCopilot** - AI-powered backend for audit analysis
2. **Scheduler API** - Job management and coordination service
3. **React Frontend** - User interface for interaction and visualization

This proof of concept (POC) outlines the prerequisites, setup instructions, and operational guidelines for all components.

---

## JnJAuditCopilot

The Core application serves as the backbone of the Web-1 service. It is responsible for processing scheduled jobs, which may include data analysis, report generation, or other computational tasks.

- Leverages AI algorithms to generate messages and alerts tailored for various roles, including (PD), (AE), and (SGR) agents
- Utilizes advanced processing techniques for timely and relevant information delivery to users
- Processes audit data and generates comprehensive findings

## Scheduler API

- Acts as a bridge between the frontend user interface and the backend processing components
- Handles all scheduled jobs, ensuring tasks are executed at the appropriate times
- Provides high-performance API endpoints using FastAPI framework with easy integration for asynchronous programming
- Manages communication with Redis, facilitating the storage and retrieval of job statuses and results

---

## Pre-requisites

| Component | Requirement |
|-----------|-------------|
| Python    | >= 3.10     |
| Poetry    | Latest version |
| Docker    | Latest stable version |
| Node.js   | >= v16      |
| npm/yarn  | Latest version |

---

## Setup Environment

### JnJAuditCopilot

1. Clone the repository
2. Navigate to the project directory:
   ```bash
   cd jnj_audit_copilot
   ```
3. Install dependencies using Poetry:
   ```bash
   poetry install
   ```
4. Create a `.env` file in the root directory (refer to `sample_env.txt` for parameters)
5. (Optional) Edit configuration files:
   - `jnj_audit_copilot/app/common/config.py` - Set paths for input and output folders
   - `jnj_audit_copilot/activities.json` - Customize domain questions for PD and AE/SAE

### Scheduler API

1. Navigate to the scheduler app directory:
   ```bash
   cd scheduler_app
   ```
2. Install dependencies using Poetry:
   ```bash
   poetry install
   ```
3. Set up Redis and run Docker:
   ```bash
   docker run --name jnjcopilot-redis-container -p 6379:6379 -d redis
   ```
4. Run the FastAPI app:
   ```bash
   cd scheduler_app/app
   uvicorn app:app --reload
   ```
5. Confirm FastAPI is running by checking `http://<url>:<port>/`

---

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

| Command | Description |
|---------|-------------|
| `npm run dev` | Runs the app in development mode |
| `npm run build` | Builds the app for production |
| `npm run lint` | Runs the linter |
| `npm run start` | Serves the production build on port 3000 |
| `npm run prod` | Builds and serves the production build |

### Frontend Features

- **Dashboard**: Overview of agent activities and system status
- **Audit Page**: View and manage audit findings and retrieved context
- **Inputs Page**: Configure system parameters, query templates, and activity schedules

#### Key Components
- Agent interaction window with markdown formatting for important information
- Findings summary and detailed view with filtering options
- Retrieved context modal with URL mapping and document links
- Comprehensive input configuration panels with scheduling capabilities
- System architecture visualization using ReactFlow

---

## Running the Application

### Running the Agent Locally

To run the agent in the terminal, execute:

```bash
bash run_agent.sh
```

### Running with Streamlit UI and Scheduler

1. Navigate to the project directory: `cd jnj_audit_copilot`
2. Change `run_app.py` to `run_app_redis.py` in the `run_agent.sh` file
3. Execute the agent as a cron job:
   ```bash
   bash run_agent.sh
   ```

> **Note:** Ensure both the FastAPI app and Streamlit app are running. Refer to the Scheduler API README for setup instructions.

### Additional Setup

To set up the environment, run:
```bash
poetry install
```

### Running with Docker (Recommended for Production)

We have built a dockerized version of the code with Redis and the backend service running in containers connected in a network.

1. Prerequisites: Install Docker in your system
2. Build and start the containers:
   ```bash
   docker-compose up --build -d
   ```
3. Verify the setup:
   - Check images: `docker images -a`
   - Check containers: `docker ps -a`
4. Access the backend API at `http://localhost:8000/docs` (Note: This only provides access to the backend API, not the frontend UI)

> **Note:** The frontend is not currently included in the docker-compose.yml file. To use the UI with the dockerized backend, you'll need to run the frontend separately following the Frontend Development Setup instructions above.
> 
> The original design included Redis, agent, scheduler, and React UI running in multiple docker containers. The current implementation uses a new, enhanced frontend with improved UI components and features. To use this new frontend with the dockerized backend, run the frontend development server and configure it to connect to the backend API at http://localhost:8000.

---

## Directory Structure

When the agent starts, it will create the following folders:

- **outputs/**: Contains all results from the agent
- **inputs/**: Temporary directory used by the agent
- **chromadb/**: The vector store utilized by the agent
- **documents/**: Directory for necessary input documents (e.g., guidelines, sample data)

---

## System Architecture

The system consists of three main components working together:

1. **JnJAuditCopilot Backend**: AI-powered agent for audit analysis
2. **Scheduler API**: Job management and coordination
3. **React Frontend**: User interface for interaction and visualization

All components can be run individually for development or together using Docker Compose for a production-like environment.

---

## Code Quality

Before committing code to the repository, ensure to check:

- **Code Formatting and Linting**: `make check`
- **Code Formatting**: `make format`
- **Code Linting**: `make lint`