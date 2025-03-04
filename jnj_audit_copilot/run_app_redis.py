import os
from datetime import datetime
import requests
from app.utils.helpers import (
    combine_txt_files_to_docx,
    create_directory_structure,
)
from app.utils.log_setup import setup_logger, get_logger
from app.utils.api_requests import get_job_status, update_job_status
from app.common.constants import (
    FINAL_OUTPUT_DOCX_FILENAME,
    FINAL_OUTPUT_PAGE_TITLE,
    FINDINGS_OUTPUT_FOLDER,
)
from app.common.config import (
    graph_config,
    graph_inputs,
    AGENT_SCRATCHPAD_FOLDER,
    SCHEDULER_API_URL,
    OUTPUT_DIR
)
from app.core.trial_supervisor_graph.create_trial_supervisor_graph import (
    trialSupervisorGraph,
)
import time

os.makedirs(OUTPUT_DIR, exist_ok=True)
setup_logger()
logger = get_logger()


class RedisAppRunner:
    def __init__(self):
        self.message_types = [
            "trial_master_messages",
            "inspection_messages",
            "selfrag_messages",
            "selfrag_tool_messages",
            "sgr_agent_messages",
            "sgr_exec_agent_messages",
        ]
        self.feedback_messages = {
            "generate_findings_agent": """
            Do you approve of the above generated findings?\nType 'y' to continue; otherwise, explain.\n
            Please specify any rephrasing or formatting \nadjustments you would like.\n\nUser input -> """,
            "feedback_agent": """
            Do you approve of the above sub-activities?\nType 'y' to continue; otherwise, explain.\n
            Please specify the adjustments you would like.\n\nUser input -> """,
        }
        self._printed = set()

    def set(self, job_id, payload):
        response = update_job_status(job_id, payload)
        return response

    def get(self, job_id):
        response = get_job_status(job_id)
        return response

    def _print_event(self, event, scratchpad_filename=None, max_length=15000):
        for message_type in self.message_types:
            if message_type in event.keys():
                message = event.get(message_type)
                if (
                    message
                    and isinstance(message, list)
                    and message_type != "trial_master_messages"
                ):
                    message = [message[-1]]
                for each_message in message:
                    if each_message.id not in self._printed:
                        msg_repr = each_message.pretty_repr(html=True)
                        if len(msg_repr) > max_length:
                            msg_repr = msg_repr[:max_length] + " ... (truncated)"
                        self._printed.add(each_message.id)
                        if scratchpad_filename:
                            self._write_to_file(
                                scratchpad_filename, msg_repr, message_type
                            )

    def stream_all_events(self, events, scratchpad_filename):
        for event in events:
            self._print_event(event[-1], scratchpad_filename=scratchpad_filename)

    def _write_to_file(self, filename, message, message_type=None):
        all_msg_path = os.path.join(AGENT_SCRATCHPAD_FOLDER, filename)
        with open(all_msg_path, "a+", errors='ignore') as f:
            f.writelines(message + "\n\n")

    def run_agent(self, job):
        run_id = str(job.get("job_id"))
        site_id = job.get("site_id")
        trial_id = job.get("trial_id")
        input_date = job.get("date")
        scratchpad_filename = f"{run_id}.txt"

        create_directory_structure(
            run_id=run_id,
        )
        os.makedirs(AGENT_SCRATCHPAD_FOLDER, exist_ok=True)

        graph_inputs["run_id"] = run_id
        graph_inputs["trigger_list"][0].update(
            {"site_id": site_id, "trial_id": trial_id, "date": input_date}
        )
        graph_config = {
           "configurable": {"thread_id": run_id},  # Thread ID used to manage specific graph configurations
           "recursion_limit": 100,  # Sets a limit on recursion depth to prevent stack overflow
        }

        self._process_graph(
            graph_inputs,
            config=graph_config,
            scratchpad_filename=scratchpad_filename,
        )

    def get_human_feedback(self, run_id, feedback_node):
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
        res = self.set(run_id, payload = {"status": "take_human_feedback", "message":self.feedback_messages.get(feedback_node, "Feedback: ")})

        findings_feedback = 'y'
        i=0
        while i<1200:
            i+=1
            res = self.get(run_id)
            status = res.get("status")
            if status == "got_human_feedback":
                findings_feedback = res.get("job_details", {}).get("feedback")
                break
            else:
                time.sleep(3)
                continue

        if i>=360:
            res = self.set(run_id, payload = {"status": "got_human_feedback", "feedback":"Agent continued as y, after waiting for 30 seconds"})

        return findings_feedback

    def _process_graph(self, inputs, config, scratchpad_filename):
        trial_supervisor_graph = trialSupervisorGraph()
        graph = trial_supervisor_graph.create_trial_supervisor_graph()
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

            self.stream_all_events(events, scratchpad_filename=scratchpad_filename)

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

                print()

                # if purpose is to get user feedback, then collect user feedback
                if purpose == "get_user_feedback":
                    with open(os.path.join(AGENT_SCRATCHPAD_FOLDER, scratchpad_filename), 'a+') as f:
                        f.writelines("\n" + "=" * 35 + " Ai Message " + "=" * 35)
                        f.writelines(f"\nName: inspection - user_agent: \n\nInvoking user for validating output from {last_node}.")
                        f.writelines("\n" + self.feedback_messages.get(last_node, "Feedback: "))

                    # get human feedback
                    human_feedback = self.get_human_feedback(inputs["run_id"], last_node)
                
                    with open(os.path.join(AGENT_SCRATCHPAD_FOLDER, scratchpad_filename), 'a+') as f:
                        f.writelines("\nUser input -> Human Feedback: " + human_feedback + "\n")

                    print(f"Human Feedback: {human_feedback}", "\n")

                    # get current config for updating state
                    config_ = graph.get_state(config, subgraphs=True).tasks[0].state.config
                    graph.update_state(
                        config_, {"human_feedback": human_feedback}
                    )

        combine_txt_files_to_docx(
            folder_path=FINDINGS_OUTPUT_FOLDER,
            run_id=inputs["run_id"],
            output_filename=FINAL_OUTPUT_DOCX_FILENAME,
            page_title=FINAL_OUTPUT_PAGE_TITLE,
        )


if __name__ == "__main__":
    try:
        runner = RedisAppRunner()
        current_time = datetime.now()
        params = {"status": "queued"}
        response = requests.get(f"{SCHEDULER_API_URL}/jobs/", params=params)
        job_id = None

        if response.status_code == 200:
            jobs = response.json().get("jobs", [])
            logger.info(f"Found {len(jobs)} job(s) due for processing.")
            if jobs:
                job = jobs[0]
                job_id = job.get("job_id")
                processing_start_time = current_time.strftime("%Y-%m-%d %H:%M:%S")
                runner.set(
                    job_id,
                    {
                        "status": "processing",
                        "processing_start_time": processing_start_time,
                    },
                )
                runner.run_agent(job)
                runner.set(
                    job_id,
                    {
                        "status": "completed",
                        "completed_time": datetime.now().strftime(
                            "%Y-%m-%d %H:%M:%S"
                        ),
                    },
                )
            else:
                logger.info("No jobs to process.")
        else:
            logger.error(f"Failed to fetch jobs: {response.text}")
    except Exception as e:
        logger.error(f"run_app Agent Error: {str(e)}")
        error_payload = {
                        "status": "error",
                        "completed_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "error_details": f"run_app Agent Error: {str(e)}"
                    }
        update_response = requests.put(f"{SCHEDULER_API_URL}/update-job/{job_id}", json=error_payload)
