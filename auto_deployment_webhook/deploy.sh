#!/bin/bash
set -e

# Define logfile path
LOGFILE="/home/azureuser/deploy_output.txt"

{
  echo "---------------------------------------------------------------------------------------------------------------------------------------------"
  echo "Deployment started at $(date)"
  
  # Define your repository path
  REPO_PATH="/home/azureuser/launchdpad_demo/turing-multi-agent-system"
  
  # Change to the repository directory
  cd "$REPO_PATH"
  
  echo "Pulling latest code..."
  git pull
  
  echo "Stopping and rebuilding docker-compose services..."
  sudo docker-compose down
  sudo docker-compose up -d --build
  
  # Build and run the frontend container.
  FRONTEND_PATH="${REPO_PATH}/frontend"
  cd "$FRONTEND_PATH"
  
  echo "Building the frontend docker image..."
  sudo docker build -t tmags/frontend:v2_script .
  
  echo "Stopping existing frontend container(s)..."
  # Get container IDs of running containers using the image.
  existing_containers=$(sudo docker ps -q --filter "name=tmags_frontend")
  if [ -n "$existing_containers" ]; then
      echo "Found existing container(s): $existing_containers. Stopping and removing them..."
      sudo docker stop $existing_containers
      sudo docker rm $existing_containers
  else
      echo "No existing frontend container found."
  fi
  
  echo "Starting new frontend container..."
  sudo docker run --name tmags_frontend -p 3000:3000 -itd tmags/frontend:v2_script
  
  echo "Deployment completed at $(date)"
  echo "------------------------------------------------------------------------------------------------------------------------------------------------"
} 2>&1 | tee -a "$LOGFILE"
