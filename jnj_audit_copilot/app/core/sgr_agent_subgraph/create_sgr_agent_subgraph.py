from langgraph.graph import END, START, StateGraph

from ...utils.log_setup import get_logger
from ...utils.state_definitions import SGRSubGraphState
from .sgr_agent_subgraph.sgr_agent_nodes import (
    SGRSubGraphNodes,
    execSummaryNodes,
    pdSummaryNodes,
)

# Get the same logger instance set up earlier
logger = get_logger()


class sgrSubGraph:
    def __init__(self):
        logger.debug("Initialising sgrSubGraph..")
        logger.debug("Initialising Helper functions for sgrSubGraph...")
        self.sgr_subgraph_nodes = SGRSubGraphNodes()
        self.pd_summary_nodes = pdSummaryNodes()
        self.exec_summary_nodes = execSummaryNodes()

    def create_sgr_subgraph(self):
        logger.debug("Creating SGR Subgraph ....")
        sgr_builder = StateGraph(SGRSubGraphState)

        sgr_builder.add_node("fetch_sgr_data", self.sgr_subgraph_nodes.fetch_SGR_data)

        sgr_builder.add_node(
            "process_major_deviations",
            self.pd_summary_nodes.process_major_deviations,
        )
        sgr_builder.add_node(
            "generate_findings_agent",
            self.pd_summary_nodes.generate_sgr_pd_findings,
        )

        sgr_builder.add_node("process_pd_section", self.exec_summary_nodes.process_pd_section)
        sgr_builder.add_node(
            "process_site_inspection_section",
            self.exec_summary_nodes.process_site_inspection_section,
        )
        sgr_builder.add_node(
            "process_significant_issue_section",
            self.exec_summary_nodes.process_significant_issue_section,
        )
        sgr_builder.add_node(
            "process_qa_audit_section",
            self.exec_summary_nodes.process_qa_audit_section,
        )
        sgr_builder.add_node(
            "generate_final_report",
            self.sgr_subgraph_nodes.create_sgr_presentation,
        )

        sgr_builder.add_edge(START, "fetch_sgr_data")
        sgr_builder.add_edge("fetch_sgr_data", "process_major_deviations")
        sgr_builder.add_edge("process_major_deviations", "generate_findings_agent")
        sgr_builder.add_edge("process_major_deviations", "process_pd_section")
        sgr_builder.add_edge("process_pd_section", "process_site_inspection_section")
        sgr_builder.add_edge(
            "process_site_inspection_section",
            "process_significant_issue_section",
        )
        sgr_builder.add_edge("process_significant_issue_section", "process_qa_audit_section")
        sgr_builder.add_edge("process_qa_audit_section", "generate_final_report")

        sgr_builder.add_edge(["generate_findings_agent", "generate_final_report"], END)

        sgr_subgraph = sgr_builder.compile()
        logger.info("Successfully created the SGR Subgraph !!!")
        return sgr_subgraph
