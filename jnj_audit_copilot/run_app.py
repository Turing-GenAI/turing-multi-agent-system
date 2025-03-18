from app.utils.helpers import (
    combine_txt_files_to_docx,
    create_directory_structure,
)
from app.utils.log_setup import setup_logger, get_logger
from app.utils.tool_nodes import process_human_feedback_chain
from app.common.constants import (
    bold_start,
    bold_end,
    FINAL_OUTPUT_DOCX_FILENAME,
    FINAL_OUTPUT_PAGE_TITLE,
    FINDINGS_OUTPUT_FOLDER,
)
from app.common.config import (
    graph_config,
    graph_inputs,
    AGENT_SCRATCHPAD_FOLDER,
)
from app.core.trial_supervisor_graph.create_trial_supervisor_graph import (
    trialSupervisorGraph,
)
from datetime import datetime
from app.utils.helpers import clean_graph_inputs
import os
from langchain_core.runnables.graph import MermaidDrawMethod
setup_logger()
logger = get_logger()

message_types = [
    "trial_master_messages",
    "inspection_messages",
    "selfrag_messages",
    "sgr_agent_messages",
    "sgr_exec_agent_messages",
]


def _print_event(
    event: dict, _printed: set, max_length=15000, scratchpad_filename=None
):
    """
    Function to print state messages
    """
    for message_type in message_types:
        if message_type in event.keys():
            message = event.get(message_type)
            if message:
                if isinstance(message, list):
                    if message_type != "trial_master_messages":
                        message = [message[-1]]
                for each_message in message:     
                    if each_message.id not in _printed:
                        msg_repr = each_message.pretty_repr(html=True)
                        if len(msg_repr) > max_length:
                            msg_repr = (
                                msg_repr[:max_length] + " ... (truncated)"
                            )
                        print(msg_repr)
                        _printed.add(each_message.id)

                        if scratchpad_filename is not None:
                            with open(
                                os.path.join(
                                    AGENT_SCRATCHPAD_FOLDER,
                                    scratchpad_filename,
                                ),
                                "a+", errors = 'ignore'
                            ) as f:
                                f.writelines(msg_repr)


def stream_all_events(events, _printed: set, scratchpad_filename=None):
    for event in events:
        _print_event(
            event[-1], _printed, scratchpad_filename=scratchpad_filename
        )

feedback_messages = {
    "generate_findings_agent": """
    Do you approve of the above generated findings? Type 'y' to continue; otherwise, explain.\n
    Please specify any rephrasing or formatting adjustments you would like.\n\nUser input ->""",
    "feedback_agent": """
    Do you approve of the above sub-activities? Type 'y' to continue; otherwise, explain.\n
    Please specify the adjustments you would like.\n\nUser input ->""",
}

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
    human_feedback = input(feedback_messages.get(feedback_node, "Feedback: "))
    if human_feedback.lower() == "y":
        return human_feedback, "y"
    else:
        return human_feedback, process_human_feedback_chain.invoke({"input": human_feedback}).content

def save_image(graph):
    image_path = "graph_image.png"
    graph_image = graph.get_graph(xray=4).draw_mermaid_png(
        # draw_method=MermaidDrawMethod.API,
        )
    # Save the image as a file
    with open(image_path, 'wb') as f:
        f.write(graph_image)

def run_graph(inputs, config, scratchpad_filename=None):
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
    trial_supervisor_graph = trialSupervisorGraph()
    graph = trial_supervisor_graph.create_trial_supervisor_graph()
    save_image(graph)
    _printed = set()
    first_run = True
    while True:
        if first_run:
            # Run the graph
            events = graph.stream(
                inputs, config=config, stream_mode="values", subgraphs=True
            )
            first_run = False
        else:
            events = graph.stream(None, config=config, stream_mode="values", subgraphs=True)

        stream_all_events(events, _printed, scratchpad_filename=scratchpad_filename)

        # if completed or interrupted
        tasks = graph.get_state(config, subgraphs=True).tasks
        if len(tasks) == 0:
            # completed
            break
        else:
            # interrupted

            # get current state
            state = graph.get_state(config, subgraphs=True).tasks[0].state.values

            # get the purpose and last node
            purpose = state["purpose"]
            last_node = state["last_node"]

            # if purpose is to get user feedback, then collect user feedback
            if purpose == "get_user_feedback":
                # get human feedback
                human_feedback, agent_feedback = get_human_feedback(last_node)
                print(f"Human Feedback: {bold_start}{human_feedback}{bold_end}", "\n")

                # get current config for updating state
                config_ = graph.get_state(config, subgraphs=True).tasks[0].state.config
                graph.update_state(
                    config_, {"human_feedback": agent_feedback}
                )
            # for other purposes, add the code below
        
    combine_txt_files_to_docx(folder_path = FINDINGS_OUTPUT_FOLDER, run_id=run_id,
                              output_filename = FINAL_OUTPUT_DOCX_FILENAME,
                              page_title = FINAL_OUTPUT_PAGE_TITLE)


# define state globally
state = None
config = {}
printed = set()


def run_graph_first_run(inputs, config_, scratchpad_filename=None):
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
        _print_event(
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



def run_graph_after_interruption(config_, scratchpad_filename=None, interruption_inputs={}):
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
        _print_event(
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


if __name__ == "__main__":

    run_id = datetime.now().strftime("%Y%m%d%H%M%S")
    scratchpad_filename = run_id + ".txt"

    create_directory_structure(
        run_id=run_id,
    )
    os.makedirs(AGENT_SCRATCHPAD_FOLDER, exist_ok=True)

    graph_inputs = clean_graph_inputs(graph_inputs.copy())
    graph_inputs["run_id"] = run_id
    
    trial_supervisor_graph = trialSupervisorGraph()
    graph = trial_supervisor_graph.create_trial_supervisor_graph()
    
    run_graph_first_run(
        graph_inputs,
        config_=graph_config,
        scratchpad_filename=scratchpad_filename,
    )

    print(f"Graph processed successfully. Run ID: {run_id}, Scratchpad: {scratchpad_filename}")

    run_graph_after_interruption(config_=graph_config, scratchpad_filename=scratchpad_filename)

    print(f"Graph processed successfully. Run ID: {run_id}, Scratchpad: {scratchpad_filename}")
