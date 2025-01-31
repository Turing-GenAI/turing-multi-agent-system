from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph

from ...utils.log_setup import get_logger
from ...utils.state_definitions import TrialSupervisorAgentState
from ..inspection_subgraph.create_inspection_subgraph import inspectionSubgraph
from ..sgr_agent_subgraph.create_sgr_agent_subgraph import sgrSubGraph
from .trial_supervisor_graph.trial_supervisor_conditional_edges import (
    trialSupervisorAgentConditionalFunctions,
)
from .trial_supervisor_graph.trial_supervisor_nodes import trialSupervisorNodes

# Get the same logger instance set up earlier
logger = get_logger()

memory = MemorySaver()


class trialSupervisorGraph:
    def __init__(self):
        logger.debug("Initialising trialSupervisorGraph ...")
        logger.debug("Initialising helper functions for trialSupervisorGraph ... ")
        self.trial_supervisor_agent_nodes = trialSupervisorNodes()
        self.trial_supervisor_agent_conditional_functions = trialSupervisorAgentConditionalFunctions()
        inspection_subgraph = inspectionSubgraph()
        self.inspection_subgraph = inspection_subgraph.create_inspection_subgraph()
        sgr_subgraph = sgrSubGraph()
        self.sgr_subgraph = sgr_subgraph.create_sgr_subgraph()

    def create_trial_supervisor_graph(self):
        logger.debug("Creating trial supervisor graph ..")

        trial_supervisor_graph_builder = StateGraph(TrialSupervisorAgentState)

        trial_supervisor_graph_builder.add_node(
            "trial_supervisor_agent",
            self.trial_supervisor_agent_nodes.trial_master_agent_node,
        )
        trial_supervisor_graph_builder.add_node(
            "inspection_master_agent",
            self.trial_supervisor_agent_nodes.inspection_master_agent_node,
        )
        trial_supervisor_graph_builder.add_node("crm_master_agent", self.trial_supervisor_agent_nodes.SGRAgent)
        trial_supervisor_graph_builder.add_node("inspection_subgraph", self.inspection_subgraph)
        trial_supervisor_graph_builder.add_node("sgr_subgraph", self.sgr_subgraph)
        trial_supervisor_graph_builder.add_node(
            "generate_risk_scores",
            self.trial_supervisor_agent_nodes.generate_risk_scores,
        )
        trial_supervisor_graph_builder.add_node(
            "updates_and_notifications",
            self.trial_supervisor_agent_nodes.updates_and_notifications,
        )

        trial_supervisor_graph_builder.add_edge(START, "trial_supervisor_agent")
        trial_supervisor_graph_builder.add_conditional_edges(
            "trial_supervisor_agent",
            self.trial_supervisor_agent_conditional_functions.trial_supervisor_routing_tools,
        )

        trial_supervisor_graph_builder.add_edge("inspection_master_agent", "inspection_subgraph")
        trial_supervisor_graph_builder.add_edge("crm_master_agent", "sgr_subgraph")
        trial_supervisor_graph_builder.add_edge(["inspection_subgraph", "sgr_subgraph"], "generate_risk_scores")

        trial_supervisor_graph_builder.add_edge("generate_risk_scores", "updates_and_notifications")
        trial_supervisor_graph_builder.add_edge("updates_and_notifications", END)

        graph = trial_supervisor_graph_builder.compile(checkpointer=memory)
        logger.info("Successfully created the entire Trial Supervisor graph!!!")
        return graph
