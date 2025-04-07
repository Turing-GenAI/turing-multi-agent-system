#!/usr/bin/env python
import os
import subprocess
import sys
import platform

def main():
    """
    Set up a virtual environment, install dependencies, and run the FastAPI server.
    """
    print("Setting up the Compliance Review Backend...")
    
    # Current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Define paths
    venv_dir = os.path.join(current_dir, "venv")
    requirements_file = os.path.join(current_dir, "requirements.txt")
    
    # Create virtual environment if it doesn't exist
    if not os.path.exists(venv_dir):
        print("Creating virtual environment...")
        subprocess.run([sys.executable, "-m", "venv", venv_dir], check=True)
    
    # Determine the correct python and pip commands based on OS
    if platform.system() == "Windows":
        python_cmd = os.path.join(venv_dir, "Scripts", "python.exe")
        pip_cmd = os.path.join(venv_dir, "Scripts", "pip.exe")
    else:  # Unix-based systems (Linux, macOS)
        python_cmd = os.path.join(venv_dir, "bin", "python")
        pip_cmd = os.path.join(venv_dir, "bin", "pip")
    
    # Install dependencies
    print("Installing dependencies...")
    subprocess.run([pip_cmd, "install", "--upgrade", "pip"], check=True)
    subprocess.run([pip_cmd, "install", "-r", requirements_file], check=True)
    
    # Check if .env file exists, if not, create one with instructions
    env_file = os.path.join(current_dir, ".env")
    if not os.path.exists(env_file):
        with open(env_file, "w") as f:
            f.write("""# FastAPI Application Settings
API_PORT="<API_PORT>"

# Azure OpenAI Settings
AZURE_OPENAI_API_KEY="<AZURE_OPENAI_API_KEY>"
AZURE_OPENAI_API_ENDPOINT="<AZURE_OPENAI_API_ENDPOINT>"
AZURE_OPENAI_API_REGION="<AZURE_OPENAI_API_REGION>"
AZURE_OPENAI_API_MODEL_NAME="<AZURE_OPENAI_API_MODEL_NAME>"
AZURE_OPENAI_API_DEPLOYMENT_NAME="<AZURE_OPENAI_API_DEPLOYMENT_NAME>"
AZURE_OPENAI_API_MODEL_VERSION="<AZURE_OPENAI_API_MODEL_VERSION>"
""")
        print("\nNOTE: Created a .env file. Please edit it with your Azure OpenAI credentials before running the server.")
        print("You can run the server with 'python setup_and_run.py --run' after updating the .env file.")
        return
    
    # Run the server if requested
    if len(sys.argv) > 1 and sys.argv[1] == "--run":
        print("Starting the FastAPI server...")
        subprocess.run([python_cmd, "run.py"])
    else:
        print("\nSetup complete! Run the server with 'python setup_and_run.py --run'")
        print("Or run 'python run.py' directly if you've already completed the setup.")

if __name__ == "__main__":
    main()
