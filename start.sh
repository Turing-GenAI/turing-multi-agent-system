#!/bin/bash

# Start Nginx in the background
service nginx start

# Change to backend directory
cd /app/scheduler_app

# Start the backend server
uvicorn app.app:app --reload --host 0.0.0.0 --port 8000
