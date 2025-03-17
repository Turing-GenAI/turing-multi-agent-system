# from core.rag_agent_subgraph.create_rag_agent_subgraph import graph
import os
from core.supervisor_graph.create_supervisor_graph import supervisor_graph as graph
import argparse
from datetime import datetime
from common.config.config import AGENT_SCRATCHPAD_FOLDER
from common.constants import bold_end, bold_start
from services.feedback_service import FeedbackService
from services.storage_service import StorageService
from utils.log_setup import setup_logger
from web_socket_manager import ws_manager
from langgraph.types import Command

logger = setup_logger()

feedback_service = FeedbackService()

# define state globally
state = None
config = {}
printed = set()


async def _print_event(
    event: dict, chat_id, ws_type, max_length=10000, scratchpad_filename=None
):
    """
    Function to print state messages
    """
    global printed
    if len(event["messages"]) == 0: 
        return
    each_message = event["messages"][-1]

    if each_message.id in printed:
        return
    printed.add(each_message.id)
    msg_repr = each_message.pretty_repr(html=True)
    await ws_manager.send_message(chat_id, {"message": msg_repr.replace(bold_start, "").replace(bold_end, ""), "chat_id": chat_id}, ws_type)
    if len(msg_repr) > max_length:
        msg_repr = (
            msg_repr[:max_length] + " ... (truncated)"
        )
    # print(msg_repr)

    if scratchpad_filename is not None:
        with open(
            os.path.join(
                AGENT_SCRATCHPAD_FOLDER,
                scratchpad_filename,
            ),
            "a+", errors='ignore'
        ) as f:
            f.writelines("\n\n")
            f.writelines(msg_repr.replace(bold_end, "").replace(bold_start, ""))
            f.writelines("\n\n")


def stream_all_events(events, scratchpad_filename=None):
    for event in events:
        _print_event(
            event[-1], scratchpad_filename=scratchpad_filename
        )


def get_human_feedback(feedback_node):
    """
    Collects human feedback for a given feedback node and processes it.

    This function displays the feedback node information and prompts the user
    for feedback using pre-defined messages. If the user approves by typing 'y',
    it returns 'y'. Otherwise, it processes the feedback using a feedback chain
    to generate a refined response.

    Args:
        feedback_node (str): The identifier for the feedback node.

    Returns:
        str: 'y' if approved by the user, otherwise a processed feedback response.
    """
    human_feedback = input("Feedback: ")
    return human_feedback, human_feedback


def save_image(graph):
    image_path = "graph_image.png"
    graph_image = graph.get_graph(xray=4).draw_mermaid_png()
    # Save the image as a file
    with open(image_path, 'wb') as f:
        f.write(graph_image)


def write_to_states_file(*args):
    with open(
        "states.txt",
        "a+", errors='ignore'
    ) as f:
        for message in args:
            f.writelines(message)


async def run_graph_first_run(inputs, config_, scratchpad_filename=None):
    """
    Executes the trial supervisor graph and processes events in a loop until completion or interruption.

    Args:
        inputs (dict): The input data for the graph.
        config (dict): The configuration settings for the graph.
        scratchpad_filename (str, optional): The filename for writing messages.

    The function initializes and runs the trial supervisor graph, streaming events and processing them.
    It continues to stream events until all tasks are completed or an interruption occurs. If user feedback
    is required, it collects feedback, updates the graph state, and proceeds accordingly. Finally, it
    combines text files into a single document.
    """
    global state
    global config

    save_image(graph)
    chat_id = inputs.get("chat_id")
    print(f"Start graph configuration for chat_id: {chat_id}")
    print(f"Config: {config_}")
    for event in graph.stream(
        inputs, config=config_, stream_mode="values", subgraphs=True
    ):
        state = event[-1]
        with open(
            "states.txt",
            "a+", errors='ignore'
        ) as f:
            f.writelines("#####################################################################3")
            f.writelines("\n\n")
            for k, v in state.items():
                if k == "messages": 
                    f.writelines(f"{k} :\n")
                    for message in v:
                        f.writelines(f"{message.name}\n")
                        f.writelines(f"{message.content}\n")
                else:
                    f.writelines(f"{k} : {str(v)[:20]}")
                f.writelines("\n")
            f.writelines("\n\n")
        await _print_event(
            event[-1], chat_id, "process_graph", scratchpad_filename=scratchpad_filename
        )

    sub_graph = state["sub_graph"]
    completed = state.get("completed", False)
    required_inputs = state.get("required_inputs", [])
    logger.debug(f"Completed: {completed}, Required inputs: {required_inputs}")
    storage_service = StorageService()
    storage_service.upload_blob_file(
        os.path.join(AGENT_SCRATCHPAD_FOLDER, scratchpad_filename))

    response = {
        "sub_graph": sub_graph,
    }
    if state is None:
        return {
            "sub_graph": sub_graph,
            "completed": True,
            "required_inputs": {},
        }
    if sub_graph == "rag_subgraph":
        human_revision_number = state.get("human_revision_number", 0)
        max_human_revisions = state.get("max_human_revisions", 0)
        feedback_needed = False
        if not (human_revision_number >= max_human_revisions):
            feedback_needed = True
        response["answer"] = state.get("answer", "No answer found")
        response["completed"] = completed and (not feedback_needed)
        response["required_inputs"] = {val: None for val in required_inputs}
        response["feedback_message"] = "Do you like the response? If no, please specify the changes:"
    elif sub_graph == "email_subgraph":
        current_email = state.get("current_email", "Email not found")
        if current_email != "Email not found":
            email_classification = current_email.email_classification["classification_type"]
            draft = current_email.draft
        response["current_email"] = str(current_email)
        response["completed"] = completed
        response["required_inputs"] = {"choice": "1", "rejection_reason": None, "email_classification": email_classification, "draft": draft}
        response["feedback_message"] = (
            "Please choose a value for what should be done next:\n"
            "1: SEND the Current Draft (goto = send_email_reply)\n"
            "2: SKIP this Email (goto = skip_and_mark_unread)\n"
            "3: RE-DRAFT (goto = draft_email)\n"
            "4: Change Classification Type and Start DRAFT (goto = create_context)"
        )
    else:
        summary = state.get("generation", "No summary found")
        response["completed"] = completed
        response["summary"] = summary
        response["required_inputs"] = {val: None for val in required_inputs}
        response["feedback_message"] = "Do you like the response? If no, please specify the changes:"
    logger.debug(f"send response: {response}")
    return response


async def run_graph_after_interruption(config_, scratchpad_filename=None, interruption_inputs={}):
    """
    Executes the trial supervisor graph and processes events in a loop until completion or interruption.

    Args:
        inputs (dict): The input data for the graph.
        config (dict): The configuration settings for the graph.
        scratchpad_filename (str, optional): The filename for writing messages.

    The function initializes and runs the trial supervisor graph, streaming events and processing them.
    It continues to stream events until all tasks are completed or an interruption occurs. If user feedback
    is required, it collects feedback, updates the graph state, and proceeds accordingly. Finally, it
    combines text files into a single document.
    """
    # # interrupted
    # states = [state for state in graph.get_state_history(config)]

    # # get current state
    # state = states[0].values
    global state
    global config
    tasks = graph.get_state(config_, subgraphs=True).tasks
    # stream_all_events(events, scratchpad_filename=scratchpad_filename)
    config = tasks[0].state.config
    sub_graph = state["sub_graph"]
    print("Interruption from sub_graph: ", sub_graph)
    if sub_graph == "rag_subgraph":
        human_feedback = interruption_inputs.get("feedback", "y")
        print("Cleaning human feedback: ", human_feedback)
        human_feedback = feedback_service.validate_final_response_human(state["answer"], human_feedback)
        continue_state = Command(resume={"feedback": human_feedback})
        print("Cleaned human feedback: ", human_feedback)
    elif sub_graph == "email_subgraph":
        human_feedback = interruption_inputs.get("choice", "1")
        del interruption_inputs["choice"]
        if interruption_inputs.get("email_classification", "") != "":
            email_classification = {
                "classification_type": interruption_inputs["email_classification"],
                "classification_reason": "User decision",
            }
            interruption_inputs["email_classification"] = email_classification
        else:
            del interruption_inputs["email_classification"]
        goto_map = {
            "1": "send_email_reply",
            "2": "skip_and_mark_unread",
            "3": "draft_email",
            "4": "create_context",
        }
        human_feedback = goto_map[human_feedback]
        continue_state = Command(resume={"goto": human_feedback, "email_attributes": interruption_inputs})  # need goto, email_attributes
        # config = config_.copy()
    else:
        human_feedback = interruption_inputs.get("feedback", "y")
        print("Cleaning human feedback: ", human_feedback)
        human_feedback = feedback_service.validate_final_response_human("", human_feedback)
        continue_state = Command(resume={"human_feedback": human_feedback})
        print("Cleaned human feedback: ", human_feedback)

    # get current config for updating state
    graph.update_state(
        config, {"feedback": human_feedback}
    )
    if "chat_id" in state:
        chat_id = state["chat_id"]
    print(f"Interrupted graph configuration for chat_id: {chat_id}")
    print(f"Config: {config_}")
    with open(
        "states.txt",
        "a+", errors='ignore'
    ) as f:
        f.writelines("########### INTERRUPTION ###########\n\n")
    for event in graph.stream(continue_state, config=config_, stream_mode="values", subgraphs=True):
        state = event[-1]
        with open(
            "states.txt",
            "a+", errors='ignore'
        ) as f:
            f.writelines("#####################################################################3")
            f.writelines("\n\n")
            for k, v in state.items():
                if k == "messages": 
                    f.writelines(f"{k} :\n")
                    for message in v:
                        f.writelines(f"{message.name}\n")
                        f.writelines(f"{message.content}\n")
                else:
                    f.writelines(f"{k} : {str(v)[:20]}")
                f.writelines("\n")
            f.writelines("\n\n")
        await _print_event(
            event[-1], chat_id, "process_feedback", scratchpad_filename=scratchpad_filename
        )

    # stream_all_events(events, scratchpad_filename=scratchpad_filename)

    storage_service = StorageService()
    storage_service.upload_blob_file(
        os.path.join(AGENT_SCRATCHPAD_FOLDER, scratchpad_filename))

    # # interrupted
    # states = [state for state in graph.get_state_history(config)]

    # # get current state
    # state = states[0].values
    completed = state.get("completed", False)
    required_inputs = state.get("required_inputs", [])
    response = {
        "sub_graph": sub_graph,
    }
    if state is None:
        return {
            "sub_graph": sub_graph,
            "completed": True,
            "required_inputs": {},
        }
    if sub_graph == "rag_subgraph":
        human_revision_number = state.get("human_revision_number", 0)
        max_human_revisions = state.get("max_human_revisions", 0)
        feedback_needed = False
        if not (human_revision_number >= max_human_revisions):
            feedback_needed = True
        response["answer"] = state.get("answer", "No answer found")
        response["completed"] = completed and (not feedback_needed)
        response["required_inputs"] = {val: None for val in required_inputs}
        response["feedback_message"] = "Do you like the response? If no, please specify the changes:"
    elif sub_graph == "email_subgraph":
        current_email = state.get("current_email", "Email not found")
        if current_email != "Email not found":
            email_classification = current_email.email_classification["classification_type"]
            draft = current_email.draft
        else:
            email_classification = None
            draft = None
        response["current_email"] = str(current_email)
        response["completed"] = completed
        response["required_inputs"] = {"choice": "1", "rejection_reason": None, "email_classification": email_classification, "draft": draft}
        response["feedback_message"] = (
            "Please choose a value for what should be done next:\n"
            "1: SEND the Current Draft (goto = send_email_reply)\n"
            "2: SKIP this Email (goto = skip_and_mark_unread)\n"
            "3: RE-DRAFT (goto = draft_email)\n"
            "4: Change Classification Type and Start DRAFT (goto = create_context)"
        )
    else:
        summary = state.get("generation", "No summary found")
        response["completed"] = completed
        response["summary"] = summary
        response["required_inputs"] = {val: None for val in required_inputs}
        response["feedback_message"] = "Do you like the response? If no, please specify the changes:"
    logger.debug(f"send response: {response}")
    return response

# if __name__ == "__main__":

#     run_id = datetime.now().strftime("%Y%m%d%H%M%S")
#     scratchpad_filename = run_id + ".txt"

#     os.makedirs(AGENT_SCRATCHPAD_FOLDER, exist_ok=True)
#     query = input("Query: ")
#     graph_inputs = {
#         "query": query,
#         "max_revisions": max_revisions,
#         "max_human_revisions": max_human_revisions,
#         "chat_id": chat_id
#     }
#     graph_inputs["run_id"] = run_id
#     run_graph(
#         graph_inputs,
#         config=graph_config,
#         scratchpad_filename=scratchpad_filename,
#     )

if __name__ == "__main__":
    # Create argument parser
    parser = argparse.ArgumentParser(description="Run graph processing script.")
    parser.add_argument("--query", type=str, required=True, help="The query to process.")
    parser.add_argument("--max_revisions", type=int, default=0, help="Maximum number of revisions.")
    parser.add_argument("--max_human_revisions", type=int, default=0, help="Maximum number of human revisions.")
    parser.add_argument("--chat_id", type=str, default=None, help="Chat ID for the query.")
    parser.add_argument("--run_id", type=str, default=None, help="Chat ID for the query.")

    # Parse arguments
    args = parser.parse_args()

    # Generate run ID and scratchpad filename
    if args.run_id is None:
        run_id = datetime.now().strftime("%Y%m%d%H%M%S")
    else:
        run_id = args.run_id
    scratchpad_filename = run_id + ".txt"

    # Ensure the scratchpad folder exists
    # AGENT_SCRATCHPAD_FOLDER = "scratchpad_folder"  # Replace with your folder path
    os.makedirs(AGENT_SCRATCHPAD_FOLDER, exist_ok=True)

    # Prepare graph inputs
    graph_inputs = {
        "query": args.query,
        "max_revisions": args.max_revisions,
        "max_human_revisions": args.max_human_revisions,
        "chat_id": args.chat_id,
        "run_id": run_id,
    }
    # Graph Configuration
    graph_config = {
        "configurable": {"thread_id": run_id},  # Thread ID used to manage specific graph configurations
        "recursion_limit": 100,  # Sets a limit on recursion depth to prevent stack overflow
    }

    run_graph_first_run(
        graph_inputs,
        config=graph_config,
        scratchpad_filename=scratchpad_filename,
    )

    print(f"Graph processed successfully. Run ID: {run_id}, Scratchpad: {scratchpad_filename}")

    run_graph_after_interruption(config=graph_config, scratchpad_filename=scratchpad_filename)

    print(f"Graph processed successfully. Run ID: {run_id}, Scratchpad: {scratchpad_filename}")

# python3 run_graph.py --query "What is agent"
# python3 run_graph.py --query "What is agent" --max_revisions 1 --max_human_revisions 2 --chat_id 1
