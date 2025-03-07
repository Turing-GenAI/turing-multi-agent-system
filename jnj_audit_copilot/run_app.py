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


if __name__ == "__main__":

    run_id = datetime.now().strftime("%Y%m%d%H%M%S")
    scratchpad_filename = run_id + ".txt"

    create_directory_structure(
        run_id=run_id,
    )
    os.makedirs(AGENT_SCRATCHPAD_FOLDER, exist_ok=True)

    graph_inputs = clean_graph_inputs(graph_inputs.copy())
    graph_inputs["run_id"] = run_id
    run_graph(
        graph_inputs,
        config=graph_config,
        scratchpad_filename=scratchpad_filename,
    )
