from langchain_core.prompts import ChatPromptTemplate

from .langchain_azure_openai import azure_chat_openai_client as model

system_prompt = (
    "Go through the user comment input and understand if the user is satisfied with the model's response."
    "If the user is satisfied, then return 'y' as a response. But if the user is satisfied partially, and has"
    " mentioned any improvement points, then simply return the user comment. Below are some examples for reference:"
    "Example 1: User comment: Yes/ok/No problem/Great ; Expected Response: y"
    "Example 2: User comment: Okay, but the response should be in passive voice ; "
    "Expected Response: Okay, but the response should be in passive voice"
)

prompt = ChatPromptTemplate.from_messages(
    [
        ("system", system_prompt),
        ("user", "{input}"),
    ]
)

process_human_feedback_chain = prompt | model
