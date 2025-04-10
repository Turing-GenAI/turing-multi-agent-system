# Docker Deployment Guide

This guide explains how to deploy the Audit Copilot components (backend and compliance review UI) separately using Docker.

## Prerequisites

Ensure you have the following installed on your system:
- Docker
- Docker Compose
- Git

## Project Structure

The deployment is organized as follows:
- `backend/` - Contains the Python API backend
- `compliance_review_ui/` - Contains the React frontend
- `docker-compose.compliance.yml` - Main deployment configuration
- `deploy.bat` / `deploy.sh` - Helper scripts for deployment

## Environment Setup

1. Create or update the `.env` file in the `backend/` directory with necessary configuration:

```
# API settings
API_HOST=0.0.0.0
API_PORT=8000

# Database settings
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=auditcopilot

# Redis settings
REDIS_HOST=redis
REDIS_PORT=6379
```

## Deployment Options

You can deploy components together or separately using the helper scripts.

### Using the helper scripts (Windows)

```bash
# Deploy all components
deploy.bat --all

# Deploy only the backend (with Redis and Postgres)
deploy.bat --backend

# Deploy only the compliance UI
deploy.bat --ui

# Stop all services
deploy.bat --down
```

### Using the helper scripts (Linux/Mac)

```bash
# Make the script executable
chmod +x deploy.sh

# Deploy all components
./deploy.sh --all

# Deploy only the backend (with Redis and Postgres)
./deploy.sh --backend

# Deploy only the compliance UI
./deploy.sh --ui

# Stop all services
./deploy.sh --down
```

### Using Docker Compose directly

```bash
# Deploy all components
docker-compose -f docker-compose.compliance.yml up -d --build

# Deploy specific services
docker-compose -f docker-compose.compliance.yml up -d --build backend redis postgres
docker-compose -f docker-compose.compliance.yml up -d --build compliance_ui

# Stop all services
docker-compose -f docker-compose.compliance.yml down
```

## Accessing the Services

- Compliance Review UI: http://localhost
- Backend API: http://localhost:8000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Troubleshooting

### Viewing Logs

```bash
# View logs for all services
docker-compose -f docker-compose.compliance.yml logs

# View logs for a specific service
docker-compose -f docker-compose.compliance.yml logs backend
docker-compose -f docker-compose.compliance.yml logs compliance_ui
```

### Common Issues

1. **Port conflicts**: If ports are already in use, modify the port mappings in `docker-compose.compliance.yml`.
2. **Environment variables**: Ensure all required environment variables are set in the `.env` file.
3. **API connectivity**: The compliance UI attempts to connect to the backend at `http://localhost:8000`. If you deploy them to different hosts, update the `VITE_API_URL` environment variable in the docker-compose file.
