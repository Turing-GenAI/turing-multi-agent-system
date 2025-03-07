# Project Documentation

## Overview

This document provides an overview of the files and directories in the repository, explaining their purpose and functionality.

## Root Directory

- **.dockerignore**: Specifies files and directories to be ignored by Docker.
- **.env**: Environment variables file (not included in version control).
- **.gitignore**: Specifies files and directories to be ignored by Git.
- **docker-compose.yml**: Docker Compose configuration file for setting up and running multi-container Docker applications.
- **dockerfile**: Dockerfile for building the Docker image.
- **frontend/**: Directory containing the frontend application.
- **graph_image (1).png**: Image file (likely a graph or diagram).
- **jnj_audit_copilot/**: Directory containing the main application code.
- **outputs/**: Directory for storing output files.
- **react_app/**: Directory containing the React application.
- **README.md**: Main README file with project overview and setup instructions.
- **sample_env.txt**: Sample environment variables file.
- **scheduler_app/**: Directory containing the scheduler application.

## Frontend Directory

- **.env.example**: Example environment variables file for the frontend.
- **dockerfile**: Dockerfile for building the frontend Docker image.
- **eslint.config.js**: ESLint configuration file.
- **index.html**: Main HTML file for the frontend application.
- **package.json**: Node.js package configuration file.
- **postcss.config.js**: PostCSS configuration file.
- **public/**: Directory for public assets.
- **README.md**: README file for the frontend application.
- **src/**: Directory containing the source code for the frontend application.
- **tailwind.config.js**: Tailwind CSS configuration file.
- **tsconfig.app.json**: TypeScript configuration file for the application.
- **tsconfig.json**: TypeScript configuration file.
- **tsconfig.node.json**: TypeScript configuration file for Node.js.
- **vite.config.ts**: Vite configuration file.

## JnJ Audit Copilot Directory

- **activities.json**: JSON file containing a list of activities.
- **app/**: Directory containing the application code.
- **chromadb/**: Directory for storing ChromaDB data.
- **documents/**: Directory for storing input documents.
- **makefile**: Makefile for running code quality checks and formatting.
- **poetry.lock**: Poetry lock file for managing dependencies.
- **README.md**: README file with setup and usage instructions.

## Scheduler App Directory

- **pyproject.toml**: Poetry configuration file for the scheduler application.
- **README.md**: README file with setup and usage instructions.
- **makefile**: Makefile for running code quality checks and formatting.

## Config.py

- **config.py**: Configuration file containing various settings and paths used in the application.

## Additional Files

- **graph_image (1).png**: Image file (likely a graph or diagram).
- **sample_env.txt**: Sample environment variables file.

## Ignored Files and Directories

- **.mypy_cache/**: Cache directory for mypy.
- **.dmypy.json**: JSON file for dmypy.
- **.pyre/**: Directory for Pyre type checker.
- **.pytype/**: Directory for pytype static type analyzer.
- **cython_debug/**: Directory for Cython debug symbols.
- **.DS_Store**: macOS Finder metadata files.
- **__pycache__/**: Python bytecode cache directories.
- **ipynb_checkpoints/**: Jupyter notebook checkpoints.
- **.env**: Environment variables file.
- **.venv**: Virtual environment directory.
- **test*.ipynb**: Jupyter notebook test files.
- **.vscode**: Visual Studio Code settings directory.
- **.txt**: Text files.
- **.zip**: Zip files.
- **.ipynb**: Jupyter notebook files.
- **jnj_outputs/**: Directory for storing output files.
- **node_modules/**: Node.js dependencies directory.
- **build/**: Build directory for production files.
- **site/**: Directory for mkdocs documentation.

## Notes

- Ensure to update the `.env` file with the necessary environment variables.
- Refer to the respective README files for detailed setup and usage instructions.