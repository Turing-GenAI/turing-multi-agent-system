import os

from dotenv import load_dotenv
from langchain_core.language_models.llms import create_base_retry_decorator
from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings
from litellm import APIConnectionError, APIError, RateLimitError, Timeout

from ..utils.log_setup import get_logger
from .response_classes import (
    FeedbackResponse,
    RequiredColumns,
    SelectedColumnsOutputTable,
    SelectedRowsOutputTable,
    SubActivityResponse,
    grade,
    retriever_router,
)

load_dotenv()

logger = get_logger()

azure_chat_openai_client = AzureChatOpenAI(
    model=os.environ.get("AZURE_OPENAI_API_MODEL_NAME"),
    azure_deployment=os.environ.get("AZURE_OPENAI_API_DEPLOYMENT_NAME"),
    api_version=os.environ.get("AZURE_OPENAI_API_MODEL_VERSION"),
    azure_endpoint=os.environ.get("AZURE_OPENAI_API_ENDPOINT"),
    temperature=0,
    # max_tokens=None,
    # timeout=None,
    # max_retries=2,
    # other params...
)


azure_embedding_openai_client = AzureOpenAIEmbeddings(
    model=os.environ.get("AZURE_OPENAI_EMBEDDING_API_MODEL_NAME"),
    azure_endpoint=os.environ.get("AZURE_OPENAI_API_ENDPOINT"),
    api_key=os.environ.get("AZURE_OPENAI_API_KEY"),
    openai_api_version=os.environ.get("AZURE_OPENAI_API_MODEL_VERSION"),
    azure_deployment=os.environ.get("AZURE_OPENAI_EMBEDDING_API_DEPLOYMENT_NAME"),
    # model="text-embedding-3-large",
    # dimensions: Optional[int] = None, # Can specify dimensions with new text-embedding-3 models
    # azure_endpoint="https://<your-endpoint>.openai.azure.com/", If not provided,
    # will read env variable AZURE_OPENAI_ENDPOINT
    # api_key=... # Can provide an API key directly. If missing read env variable AZURE_OPENAI_API_KEY
    # openai_api_version=..., # If not provided, will read env variable
    # AZURE_OPENAI_API_VERSION
)

model_with_sub_activity_structured_output = azure_chat_openai_client.with_structured_output(SubActivityResponse)
model_with_feedback_structured_output = azure_chat_openai_client.with_structured_output(FeedbackResponse)
model_with_required_column_structure = azure_chat_openai_client.with_structured_output(RequiredColumns)
model_with_output_table_columns_structure = azure_chat_openai_client.with_structured_output(SelectedColumnsOutputTable)
model_with_output_table_rows_structure = azure_chat_openai_client.with_structured_output(SelectedRowsOutputTable)
llm_with_retriever_router_tool = azure_chat_openai_client.with_structured_output(retriever_router)
llm_with_grade_tool = azure_chat_openai_client.with_structured_output(grade)


class OpenAILLMWithRetry(AzureChatOpenAI):
    def __init__(self, azure_endpoint, azure_deployment, openai_api_version, max_retries):
        # Initialize the base class
        super().__init__(
            azure_endpoint=azure_endpoint,
            azure_deployment=azure_deployment,
            openai_api_version=openai_api_version,
        )
        self.max_retries = max_retries

    def _create_retry_decorator(self, max_retries):
        errors = [Timeout, APIError, APIConnectionError, RateLimitError]
        return create_base_retry_decorator(error_types=errors, max_retries=max_retries)

    # Base invoke function
    def _invoke_with_retry_base(self, *args, **kwargs):
        return super().invoke(*args, **kwargs)

    # Main invoke method with retry functionality
    def invoke(self, *args, **kwargs):
        retry_decorator = self._create_retry_decorator(self.max_retries)
        try:
            # Apply retry decorator to _invoke_with_retry_base
            response = retry_decorator(self._invoke_with_retry_base)(*args, **kwargs)
            return response
        except Exception as e:
            # Print an error message and halt the process
            print(f"\nProcess halted due to error: {e}")
            error_text = f"LLM_RUN_FAILED. Error: {e}"
            logger.error(error_text)
            return error_text


# Instantiate the LLM with retry functionality
azure_chat_openai_client = OpenAILLMWithRetry(
    azure_endpoint=os.environ.get("AZURE_OPENAI_API_ENDPOINT"),
    azure_deployment=os.environ.get("AZURE_OPENAI_API_DEPLOYMENT_NAME"),
    openai_api_version=os.environ.get("AZURE_OPENAI_API_MODEL_VERSION"),
    max_retries=3,  # Adjust as needed
)
