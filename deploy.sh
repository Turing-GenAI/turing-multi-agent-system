#!/bin/bash

# Helper script for deploying components

# Set environment variables file
ENV_FILE="./backend/.env"

function print_usage {
  echo "Usage: ./deploy.sh [OPTIONS]"
  echo "Options:"
  echo "  --all             Deploy all components (backend, compliance UI, redis, postgres)"
  echo "  --backend         Deploy only the backend service"
  echo "  --ui              Deploy only the compliance UI service"
  echo "  --down            Stop all services"
  echo "  --help            Show this help message"
}

# Check if no arguments provided
if [ $# -eq 0 ]; then
  print_usage
  exit 1
fi

# Process command-line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --all)
      echo "Deploying all components..."
      docker-compose -f docker-compose.compliance.yml up -d --build
      ;;
    --backend)
      echo "Deploying backend, redis, and postgres..."
      docker-compose -f docker-compose.compliance.yml up -d --build backend redis postgres
      ;;
    --ui)
      echo "Deploying compliance UI only..."
      docker-compose -f docker-compose.compliance.yml up -d --build compliance_ui
      ;;
    --down)
      echo "Stopping all services..."
      docker-compose -f docker-compose.compliance.yml down
      ;;
    --help)
      print_usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      print_usage
      exit 1
      ;;
  esac
  shift
done

echo "Deployment completed successfully."
