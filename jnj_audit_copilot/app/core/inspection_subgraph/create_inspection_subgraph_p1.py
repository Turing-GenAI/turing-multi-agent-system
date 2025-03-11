from langgraph.graph import START, StateGraph

from ...utils.log_setup import get_logger
from ...utils.state_definitions import InspectionAgentState
from ..selfrag_agent_subgraph.create_selfrag_agent_subgraph import selfragAgentSubgraph
from .inspection_subgraph.inspection_conditional_edges import (
    inspectionConditionalFunctions,
)
from .inspection_subgraph.inspection_nodes import inspectionNodes

# Get the same logger instance set up earlier
logger = get_logger()


class inspectionSubgraph_p1:
    def __init__(self):
        logger.debug("Initialising inspectionSubgraph p1...")
        logger.debug("Initialising helper functions for inspectionSubgraph p1...")
        self.inspection_nodes = inspectionNodes()
        self.inspection_conditional_functions = inspectionConditionalFunctions()
        selfrag_agent_subgraph = selfragAgentSubgraph()
        self.child_graph = selfrag_agent_subgraph.create_selfrag_agent_subgraph()

    def create_inspection_subgraph(self):
        logger.debug("Creating inspection subgraph")
        builder = StateGraph(InspectionAgentState)
        builder.add_node("site_area_agent", self.inspection_nodes.site_area_agent_node)
        builder.add_node("site_area_router", self.inspection_nodes.site_area_router_node)
        builder.add_node("planner_agent", self.inspection_nodes.sub_activity_generator_node)
        builder.add_node("critique_agent", self.inspection_nodes.validate_sub_activity_node)
        builder.add_node("feedback_agent", self.inspection_nodes.work_on_feedback_node)
        builder.add_node("planner_user_validation", self.inspection_nodes.interrupt_for_planner_feedback)
        # Add the save_sub_activities_to_redis node as the final node in part 1
        builder.add_node("save_sub_activities_to_redis", self.inspection_nodes.save_sub_activities_to_redis)

        # builder.add_node("add_human_in_the_loop", self.inspection_nodes.add_human_in_the_loop_node)
        # builder.add_node("selfrag_subgraph", self.child_graph)
        # builder.add_node("generate_findings_agent", self.inspection_nodes.generate_findings)
        # builder.add_node(
        #     "user_agent_validator",
        #     self.inspection_nodes.add_human_in_the_loop_for_validating_findings,
        # )
        # builder.add_node("data_ingestion", self.inspection_nodes.site_area_ingestion_node)
        # builder.add_node(
        #     "discrepancy_data_generator",
        #     self.inspection_nodes.discrepancy_data_generator_node,
        # )

        builder.add_edge(START, "site_area_agent")
        builder.add_conditional_edges(
            "site_area_agent",
            self.inspection_conditional_functions.inspection_events_routing,
        )
        builder.add_edge("data_ingestion", "site_area_router")
        builder.add_conditional_edges(
            "site_area_router",
            self.inspection_conditional_functions.site_area_routing,
        )
        builder.add_edge("planner_agent", "critique_agent")
        builder.add_conditional_edges(
            "critique_agent",
            self.inspection_conditional_functions.should_continue,
            {
                "re_work_needed": "feedback_agent",
                "no_need_for_re_work": "planner_user_validation",
            },
        )

        builder.add_conditional_edges(
            "feedback_agent",
            self.inspection_conditional_functions.back_to_feedback,
            {
                "planner_user_validation": "planner_user_validation",
                "critique_agent": "critique_agent",
            }
        )

        # builder.add_edge("planner_user_validation", "add_human_in_the_loop")

        builder.add_conditional_edges(
            "planner_user_validation",
            self.inspection_conditional_functions.should_continue_from_human_feedback_findings,
            {
                # "selfrag_subgraph": "selfrag_subgraph",
                "selfrag_subgraph":"save_sub_activities_to_redis",
                "feedback_agent": "feedback_agent",
            },
        )

        # builder.add_edge("selfrag_subgraph", "generate_findings_agent")
        # builder.add_edge("generate_findings_agent", "user_agent_validator")
        # builder.add_conditional_edges(
        #     "user_agent_validator",
        #     self.inspection_conditional_functions.should_continue_from_human_feedback_findings,
        #     {
        #         "generate_findings_agent": "generate_findings_agent",
        #         "discrepancy_data_generator": "discrepancy_data_generator",
        #     },
        # )
        # builder.add_edge("discrepancy_data_generator", "site_area_router")
        inspection_subgraph = builder.compile(
            interrupt_before=["planner_user_validation"],
            # interrupt_after=["generate_findings_agent"],
        )

        logger.info("Successfully created the inspection_subgraph_p1!!!")
        return inspection_subgraph
