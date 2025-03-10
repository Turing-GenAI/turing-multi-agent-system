from langchain_core.prompts import ChatPromptTemplate

from .langchain_azure_openai import azure_chat_openai_client as model, model_with_sub_activity_structured_output

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


system_prompt_2 = (
    "Go through the user comment input and understand it. The user is answering the question: "\
    "Do you approve of the generated sub-activities?\n{sub_activities_list}\nType 'y' to continue; otherwise,.\nPlease specify the sub-activities you would like.\n\nUser input ->"
    "If the user types in something indicating that it is satisfied, then return 'y' as a response. But if the user types in a list of sub-activities, then return the list of sub-activities. Below are some examples for reference:"
    "Example 1: User comment: Yes/ok/No problem/Great ; Expected Response: 'y'"
    "Example 2: User comment: These are Okay, but the better sub-activities are: A, B, C ; Expected Response: [A, B, C]"
    "Expected Response: Okay, but the response should be in passive voice"
)

prompt_2 = ChatPromptTemplate.from_messages(
    [
        ("system", system_prompt_2),
        ("user", "{input}"),
    ]
)

process_human_feedback_for_sub_activities_chain = prompt_2 | model


system_prompt_3 = (
    "Convert the input text into a list of sub-activities. The input text is a list of sub-activities separated by commas. Below are some examples for reference:"
    "Example 1: User comment: A, B, C ; Expected Response: [A, B, C]"
)

prompt_3 = ChatPromptTemplate.from_messages(
    [
        ("system", system_prompt_3),
        ("user", "{input}"),
    ]
)

process_human_feedback_for_sub_activities_chain_2 = prompt_3 | model_with_sub_activity_structured_output