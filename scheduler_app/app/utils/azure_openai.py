"""
Azure OpenAI integration utilities.
"""
import os

def get_azure_openai_client():
    """
    Creates and returns an Azure OpenAI client using environment variables.
    """
    # Get configuration from environment variables or use defaults
    azure_chat_openai_client = AzureChatOpenAI(
                model=os.environ.get("AZURE_OPENAI_API_MODEL_NAME"),
                azure_deployment=os.environ.get("AZURE_OPENAI_API_DEPLOYMENT_NAME"),
                api_version=os.environ.get("AZURE_OPENAI_API_MODEL_VERSION"),
                azure_endpoint=os.environ.get("AZURE_OPENAI_API_ENDPOINT"),
                temperature=0
            )
    
    # Create and return the client
    return azure_chat_openai_client