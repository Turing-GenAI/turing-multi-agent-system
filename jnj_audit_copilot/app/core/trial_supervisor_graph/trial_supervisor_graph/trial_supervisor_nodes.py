import json
import os

from langchain_core.messages import AIMessage

from ....common.config import ACTIVITY_LIST_FILE
from ....common.constants import RISK_SCORES_OUTPUT_FOLDER, bold_end, bold_start
from ....common.descriptions import site_area_mapping_dict
from ....risk_score.css_risk_score import calculate_css_risk_score
from ....risk_score.IR_risk_score import calculate_ir_risk_score
from ....risk_score.ml_risk_score import fetch_ml_risk_score
from ....utils.helpers import (
    generate_unique_activity_id,
    warn_user_for_missing_site_areas_msg,
)
from ....utils.log_setup import get_logger
from ....utils.state_definitions import TrialSupervisorAgentState

# Get the same logger instance set up earlier
logger = get_logger()


class trialSupervisorNodes:
    def __init__(self):
        logger.debug("Initialising trialSupervisorNodes ...")

    def trial_master_agent_node(self, state: TrialSupervisorAgentState):
        logger.info("Starting the Graph!!!")
        logger.debug("Calling function : trial_supervisor_agent_node ..")
        if "trigger_list_index" not in state.keys():
            trigger_list_index = 0
        else:
            trigger_list_index = state["trigger_list_index"] + 1

        trigger_list = state["trigger_list"]
        if len(warn_user_for_missing_site_areas_msg) > 0:
            logger.warning(f"{warn_user_for_missing_site_areas_msg}")
        if trigger_list_index < len(trigger_list):
            trigger = trigger_list[trigger_list_index]
            trigger_site_id = trigger["site_id"]
            trigger_trial_id = trigger["trial_id"]
            trigger_site_areas_list = trigger["site_areas"]
            trigger_flag_list = {}
            for trigger_site_area in trigger_site_areas_list:
                trigger_flag_list[trigger_site_area] = False

            addtl_message = ""
            if "SGR" in trigger_site_areas_list:
                addtl_message += "Invoking SGR Agent\n"
            if "PD" in trigger_site_areas_list or "AE_SAE" in trigger_site_areas_list or "IC" in trigger_site_areas_list:
                addtl_message += "Invoking Inspection Master Agent\n"
            return {
                "trigger": trigger,
                "trigger_flag_list": trigger_flag_list,
                "trigger_list_index": trigger_list_index,
                "trial_master_messages": AIMessage(
                    name=f"{bold_start}trial_supervisor_agent: {bold_end}",
                    content=(
                        "Detected the following trigger events - \n"
                        f"{warn_user_for_missing_site_areas_msg}\n"
                        # f"Site ID: {trigger_site_id} \n"
                        # f"Trial ID: {trigger_trial_id} \n" + addtl_message
                        f"Input X1: {trigger_site_id} \n"
                        f"Input X2: {trigger_trial_id} \n" + addtl_message
                    ),
                ),
            }
        else:
            return {
                "trial_master_messages": AIMessage(
                    name=f"{bold_start}trial_supervisor_agent: {bold_end}",
                    content=("Completed processing all trigger events"),
                ),
            }

    def inspection_master_agent_node(self, state: TrialSupervisorAgentState):
        logger.debug("Calling function : inspection_master_agent_node...")
        trigger_site_areas = state["trigger"]["site_areas"]
        trigger_site_areas_list = [x for x in trigger_site_areas if x != "SGR"]
        site_area_activity_list = state.get("site_area_activity_list", None)
        if site_area_activity_list is None:
            with open(ACTIVITY_LIST_FILE, "r") as f:
                activities_list = json.load(f)
            site_area_activity_list = {}
            for trigger_site_area in trigger_site_areas_list:
                site_area_activity_list[trigger_site_area] = []
                activity_count = 1
                for activity in activities_list[trigger_site_area]:
                    unique_activity_id = generate_unique_activity_id(
                        run_id=state["run_id"],
                        activity_count=activity_count,
                        trigger_site_area=trigger_site_area,
                        site_id=state["trigger"]["site_id"],
                        trial_id=state["trigger"]["trial_id"],
                    )
                    site_area_activity_list[trigger_site_area].append(
                        unique_activity_id + activity)
                    activity_count += 1
        
        site_areas_list = [f"{site_area_mapping_dict[site_area]}({site_area})" for site_area in list(site_area_activity_list.keys())]

        if len(site_areas_list) == 1:
            site_areas_str = site_areas_list[0]
        elif len(site_areas_list) > 1:
            site_areas_str = ", ".join(site_areas_list[:-1]) + " and " + site_areas_list[-1]
        else:
            site_areas_str = ""

        inspection_agent_node_ai_message = (
            "Detected Inspection preparedness requirement.\n"
            "Invoking Master Agent 1 for inspection preparedness.\n "
            # "   -> Detected site review areas for audit inspection: " +
            # str(", ".join(list(site_area_activity_list.keys())))
            f"   -> Further, detected {len(site_area_activity_list.keys())} domain areas for report generation: "
            f"{site_areas_str}"
        )

        return {
            "site_area_activity_list": site_area_activity_list,
            "site_area_activity_list_index": None,
            "trial_master_messages": AIMessage(
                name=f"{bold_start}trial supervisor - inspection_master_agent: {bold_end}",
                content=inspection_agent_node_ai_message,
            ),
        }

    def SGRAgent(self, state: TrialSupervisorAgentState):
        logger.debug("Calling function : SGRAgent...")
        trigger_site_id = state["trigger"]["site_id"]
        trigger_trial_id = state["trigger"]["trial_id"]
        return {
            "trial_master_messages": AIMessage(
                name=f"{bold_start}trial supervisor - crm_master_agent :{bold_end}",
                content=(
                    "Invoking crm_master_agent to start: \na) "
                    "SGR Protocol Deviations activities and \nb) SGR Executive Summary preparation "
                    f"activities findings \nfor site ID: {trigger_site_id}  and trial_id: {trigger_trial_id} "
                ),
            ),
        }

    def generate_risk_scores(self, state: TrialSupervisorAgentState):
        logger.debug("Calling function : generate_risk_scores...")

        SITE_ID = state["trigger"]["site_id"]
        trial_id = state["trigger"]["trial_id"]
        run_id = state["run_id"]

        os.makedirs(os.path.join(
            RISK_SCORES_OUTPUT_FOLDER, run_id), exist_ok=True)

        ai_message_CSS = calculate_css_risk_score(
            SITE_ID, trial_id, os.path.join(RISK_SCORES_OUTPUT_FOLDER, run_id))
        ai_message_ML = fetch_ml_risk_score(
            SITE_ID, trial_id, os.path.join(RISK_SCORES_OUTPUT_FOLDER, run_id))
        calculate_ir_risk_score(SITE_ID, run_id, trial_id)

        ai_message = f"{ai_message_CSS}\n\n{ai_message_ML}\n\nSent Alerts"

        return {
            "trial_master_messages": AIMessage(
                name=f"{bold_start}trial supervisor - generate_risk_scores node:{bold_end}",
                content=ai_message,
            )
        }

    def updates_and_notifications(self, state: TrialSupervisorAgentState):
        logger.debug("Calling function : updates_and_notifications...")
        return {
            "trial_master_messages": AIMessage(
                name="trial supervisor - updates and notifications ",
                content=(
                    f"{bold_start}Invoking updates and notifications node:{bold_end}\n\n" f"Sent all required notifications"
                ),
            ),
        }
