from typing import Literal

from langgraph.graph import END

from ....utils.log_setup import get_logger
from ....utils.state_definitions import InspectionAgentState

# Get the same logger instance set up earlier
logger = get_logger()


class inspectionConditionalFunctions:
    def __init__(self):
        """
        Initializes the inspectionConditionalFunctions class, setting up
        the logger for debugging.
        """
        logger.debug("Initializing inspectionConditionalFunctions ...")
        pass

    def inspection_events_routing(self, state: InspectionAgentState) -> Literal["data_ingestion", END]:
        """
        Routes inspection events based on the current site area activity index.

        Args:
            state (InspectionAgentState): The current state with site area activity list details.

        Returns:
            Literal["data_ingestion", END]: "data_ingestion" if there are more activities
            to process; otherwise, END.
        """
        logger.debug("Calling function: inspection_events_routing ...")
        site_area_activity_list_index = state["site_area_activity_list_index"]

        # Check if there are more activities in the site area activity list
        if site_area_activity_list_index < len(list(state["site_area_activity_list"].keys())):
            return "data_ingestion"
        else:
            return END

    def should_continue_add_human_in_the_loop_for_data_ingestion(
        self, state: InspectionAgentState
    ) -> Literal["site_area_router", "data_ingestion"]:
        """
        Determines if the workflow should route to data ingestion or site area router
        based on human-in-the-loop validation.

        Args:
            state (InspectionAgentState): Current state, including human-in-the-loop validation.

        Returns:
            Literal["site_area_router", "data_ingestion"]: "site_area_router" if human validation is valid;
            otherwise, "data_ingestion".
        """
        # Check if human-in-the-loop validation for data ingestion is valid
        if state["add_human_in_the_loop_for_data_ingestion_is_valid"]:
            return "site_area_router"
        else:
            return "data_ingestion"

    def site_area_routing(self, state: InspectionAgentState) -> Literal["site_area_agent", "planner_agent"]:
        """
        Routes to the appropriate agent based on the current parent activity index.

        Args:
            state (InspectionAgentState): Current state containing the parent activity index.

        Returns:
            Literal["site_area_agent", "planner_agent"]: "planner_agent" if more activities are available;
            otherwise, "site_area_agent".
        """
        logger.debug("Calling function: site_area_routing... ")
        parent_index = state["parent_index"]

        # Check if there are more activities in the list
        if parent_index < len(state["all_activities"]):
            return "planner_agent"
        else:
            return "site_area_agent"

    def should_continue(self, state: InspectionAgentState) -> Literal["re_work_needed", "no_need_for_re_work"]:
        """
        Determines if rework is required based on feedback from the model.

        Args:
            state (InspectionAgentState): Current state including the feedback flag.

        Returns:
            Literal["re_work_needed", "no_need_for_re_work"]: "re_work_needed" if feedback requires it;
            otherwise, "no_need_for_re_work".
        """
        logger.debug("Calling function: should_continue...")

        # Check if feedback indicates rework is required
        if state["work_on_feedback"]:
            return "re_work_needed"
        return "no_need_for_re_work"

    def should_continue_from_human_feedback_findings(self, state: InspectionAgentState):
        """
        Determines the next node based on human feedback for findings.

        Args:
            state (InspectionAgentState): Current state containing the human feedback flag.

        Returns:
            str: The next node to route to, either the last node or the next node, depending on the human feedback.
        """
        logger.debug("Calling function: should_continue_from_human_feedback_findings ...")
        last_node = state["last_node"]
        next_node = state["next_node"]
        if state["human_feedback"] != "y":
            return last_node
        else:
            return next_node

    def back_to_feedback(
        self, state: InspectionAgentState
    ):
        logger.debug("Calling function: back_to_feedback ...")
        return state["feedback_from"]
