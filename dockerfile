# Use Ubuntu as the base image
FROM ubuntu:22.04 AS backend

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libreoffice \
    python3.10 \
    python3-pip \
    python3.10-venv \
    build-essential \
    curl \
    cron \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN curl -sSL https://install.python-poetry.org | python3 - && \
    mv /root/.local/bin/poetry /usr/local/bin/

# Add Poetry to PATH
ENV PATH="/usr/local/bin:$PATH"

# Copy project files
COPY . /app

# Install project dependencies
RUN poetry self update && \
    cd /app/scheduler_app && poetry config virtualenvs.create false && \
    poetry install --without dev --no-root && \
    cd /app/jnj_audit_copilot && poetry config virtualenvs.create false && \
    poetry install --without dev --no-root

# Install uvicorn
RUN pip install uvicorn

# Set work directory
WORKDIR /app/scheduler_app

# Set virtual environment activation (for non-interactive mode)
ENV VIRTUAL_ENV="/app/scheduler_app/.venv"
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Build frontend stage
FROM node:20-alpine AS frontend

WORKDIR /app/frontend

# Copy frontend files
COPY ./frontend/package*.json ./
# Install dependencies
RUN npm ci

# Copy the rest of the frontend code
COPY ./frontend .

# Build the frontend application
RUN npm run build

# Final stage: Combine backend and frontend
FROM backend AS final

# Copy the built frontend assets from the frontend stage
COPY --from=frontend /app/frontend/dist /app/frontend/dist

# Install a simple HTTP server to serve the frontend
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

# Copy the nginx configuration
RUN mkdir -p /etc/nginx/sites-available/
COPY ./nginx.conf /etc/nginx/sites-available/default

# Expose ports for backend and frontend
EXPOSE 8000 5173

# Copy startup script
COPY ./start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Start both services
CMD ["/app/start.sh"]