# Use Ubuntu as the base image
FROM ubuntu:22.04

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

# Specify the command to run the application
CMD ["uvicorn", "app.app:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]
