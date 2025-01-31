from typing import Literal

from ....utils.log_setup import get_logger
from ....utils.state_definitions import TrialSupervisorAgentState

# Get the same logger instance set up earlier
logger = get_logger()


class trialSupervisorAgentConditionalFunctions:
    def __init__(self):
        logger.debug("Initialising trialSupervisorAgentConditionalFunctions ...")
        pass

    def trial_supervisor_routing_tools(
        self, state: TrialSupervisorAgentState
    ) -> Literal["inspection_master_agent", "crm_master_agent"]:
        logger.debug("Calling function : trial_master_routing_tools ...")
        output_nodes = []
        trigger = state["trigger"]
        trigger_site_areas = trigger["site_areas"]
        if "SGR" in trigger_site_areas:
            output_nodes.append("crm_master_agent")
        if ("PD" in trigger_site_areas) or ("AE_SAE" in trigger_site_areas) or ("IC" in trigger_site_areas):
            output_nodes.append("inspection_master_agent")
        return output_nodes
