import os
from pydantic import Field
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    """Application settings."""
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Compliance Review API"
    API_PORT: int = Field(default=8000)
    
    # CORS Settings
    BACKEND_CORS_ORIGINS: list[str] = ["*"]
    
    # Azure OpenAI Settings
    AZURE_OPENAI_API_KEY: str = Field(default=os.getenv("AZURE_OPENAI_API_KEY"))
    AZURE_OPENAI_API_ENDPOINT: str = Field(default=os.getenv("AZURE_OPENAI_API_ENDPOINT"))
    AZURE_OPENAI_API_REGION: str = Field(default=os.getenv("AZURE_OPENAI_API_REGION"))
    AZURE_OPENAI_API_MODEL_NAME: str = Field(default=os.getenv("AZURE_OPENAI_API_MODEL_NAME"))
    AZURE_OPENAI_API_DEPLOYMENT_NAME: str = Field(default=os.getenv("AZURE_OPENAI_API_DEPLOYMENT_NAME"))
    AZURE_OPENAI_API_MODEL_VERSION: str = Field(default=os.getenv("AZURE_OPENAI_API_MODEL_VERSION"))

    # Text Splitting Settings
    CHUNK_SIZE: int = 3500
    CHUNK_OVERLAP: int = 250
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
