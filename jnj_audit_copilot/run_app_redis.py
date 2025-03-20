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
from app.utils.tool_nodes import process_human_feedback_chain

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
                "feedback_agent": """
                Do you approve of the generated sub-activities?\n{sub_activities_list}\nType 'y' to continue; otherwise,.\n
                Please specify the sub-activities you would like.\n\nUser input ->""",
                
                "generate_findings_agent": """
                Do you approve of the above generated findings? Type 'y' to continue; otherwise, explain.\n
                Please specify any rephrasing or formatting adjustments you would like.\n\nUser input ->"""   
        }
        self._printed = set()

    def set(self, job_id, payload):
        response = update_job_status(job_id, payload)
        return response

    def get(self, job_id):
        response = get_job_status(job_id)
        return response

    def _write_to_file(self, filename, message, message_type=None):
        all_msg_path = os.path.join(AGENT_SCRATCHPAD_FOLDER, filename)
        with open(all_msg_path, "a+", errors='ignore') as f:
            f.writelines(message + "\n\n")

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
        if findings_feedback.lower() == "y":
            return findings_feedback, "y"
        else:
            return findings_feedback, process_human_feedback_chain.invoke({"input": findings_feedback}).content

    def get_human_feedback_for_sub_activities(self, run_id, feedback_node, sub_activities):
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
        res = self.set(run_id, payload = {"status": "take_human_feedback", "message":self.feedback_messages.get(feedback_node, "Feedback: ")}).format(sub_activities_list=" -> "+"\n -> ".join(sub_activities))

        subactivities_feedback = 'y'
        i=0
        while i<1200:
            i+=1
            res = self.get(run_id)
            status = res.get("status")
            if status == "got_human_feedback":
                subactivities_feedback = res.get("job_details", {}).get("feedback")
                break
            else:
                time.sleep(3)
                continue

        if i>=360:
            res = self.set(run_id, payload = {"status": "got_human_feedback", "feedback":"Agent continued as y, after waiting for 30 seconds"})
        response_dict = {}
        if subactivities_feedback.lower() == "y":
            response_dict.update({"human_feedback": subactivities_feedback, "response_val": "y"})
        else:
            response = process_human_feedback_for_sub_activities_chain.invoke({"input": subactivities_feedback, "sub_activities_list": "\n".join(sub_activities)}).content
            if response.lower() == "y":
                response_dict.update({"human_feedback": subactivities_feedback, "response_val": "y"})
            else:
                sub_activities_updated = process_human_feedback_for_sub_activities_chain_2.invoke({"input": response})
                response_dict.update({"human_feedback": subactivities_feedback, "response_val": sub_activities_updated, "final_sub_activities": sub_activities_updated})
        return response_dict

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
                    human_feedback, agent_feedback = self.get_human_feedback(inputs["run_id"], last_node)
                
                    with open(os.path.join(AGENT_SCRATCHPAD_FOLDER, scratchpad_filename), 'a+') as f:
                        f.writelines("\nUser input -> Human Feedback: " + human_feedback + "\n")
                        f.writelines("\n" + "=" * 35 + " Agent Message " + agent_feedback + "=" * 35)

                    print(f"Human Feedback: {human_feedback}", "\n")
                    print(f"Agent Feedback: {agent_feedback}", "\n")

                    # get current config for updating state
                    config_ = graph.get_state(config, subgraphs=True).tasks[0].state.config
                    graph.update_state(
                        config_, {"human_feedback": agent_feedback}
                    )

        combine_txt_files_to_docx(
            folder_path=FINDINGS_OUTPUT_FOLDER,
            run_id=inputs["run_id"],
            output_filename=FINAL_OUTPUT_DOCX_FILENAME,
            page_title=FINAL_OUTPUT_PAGE_TITLE,
        )

    def run_graph_first_run(self, inputs, config_, scratchpad_filename=None, save_image_flag=False):
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
        self.trial_supervisor_graph = trialSupervisorGraph()
        self.graph = self.trial_supervisor_graph.create_trial_supervisor_graph()

        if save_image_flag:
            save_image(self.graph)
        for event in self.graph.stream(
            inputs, config=config_, stream_mode="values", subgraphs=True
        ):
            state = event[-1]
            _print_event(
                state, _printed, scratchpad_filename=scratchpad_filename
            )
        return state


    def run_graph_after_interruption(self,config_, state_before_interruption, scratchpad_filename=None, interruption_inputs={}):
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

        # get the purpose and last node
        purpose = state_before_interruption["purpose"]
        last_node = state_before_interruption["last_node"]

        if purpose == "get_user_feedback_for_sub_activities":
            # get human feedback
            sub_activities = state_before_interruption["final_sub_activities"].sub_activities
            response_dict = get_human_feedback_for_sub_activities(last_node, sub_activities=sub_activities)
            # human_feedback = response_dict.get("human_feedback", "NA")
            # response_val = response_dict.get("response_val", "NA")
            final_sub_activities = response_dict.get("final_sub_activities", state_before_interruption["final_sub_activities"])
            continue_state = Command(resume = {"final_sub_activities": final_sub_activities})
            
        # if purpose is to get user feedback, then collect user feedback
        if purpose == "get_user_feedback":
            # get human feedback
            human_feedback, agent_feedback = get_human_feedback(last_node)
            print(f"Human Feedback: {bold_start}{human_feedback}{bold_end}", "\n")

            #get current config for updating state
            current_config = self.graph.get_state(config_, subgraphs=True).tasks[0].state.config
            self.graph.update_state(
                current_config, {"human_feedback": agent_feedback}
            )
            continue_state = None
        
        for event in self.graph.stream(continue_state, config=config_, stream_mode="values", subgraphs=True):
            state = event[-1]        
            _print_event(
                state, _printed, scratchpad_filename=scratchpad_filename
            )
        
        tasks = self.graph.get_state(config_, subgraphs=True).tasks
        
        return tasks, state

    def run_graph(self, graph_inputs, graph_config, scratchpad_filename):
        # Run the graph for the first time
        state_before_interruption = run_graph_first_run(
            graph_inputs,
            config_=graph_config,
            scratchpad_filename=scratchpad_filename,
            save_image_flag=True
        )

        while True:
            # Run the graph after an interruption
            tasks, state_before_interruption = run_graph_after_interruption(
                state_before_interruption = state_before_interruption, 
                config_=graph_config, 
                scratchpad_filename=scratchpad_filename)
            
            if len(tasks) == 0:
                # completed
                break
        
        combine_txt_files_to_docx(folder_path = FINDINGS_OUTPUT_FOLDER, run_id=run_id,
                                output_filename = FINAL_OUTPUT_DOCX_FILENAME,
                                page_title = FINAL_OUTPUT_PAGE_TITLE)


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

        # self._process_graph(
        #     inputs = graph_inputs,
        #     config=graph_config,
        #     scratchpad_filename=scratchpad_filename,
        # )
        self.run_graph(
            graph_inputs = graph_inputs,
            graph_config = graph_config,
            scratchpad_filename = scratchpad_filename
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