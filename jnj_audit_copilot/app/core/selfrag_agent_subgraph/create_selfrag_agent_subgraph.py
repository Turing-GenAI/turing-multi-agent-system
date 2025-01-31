from langgraph.graph import END, StateGraph

from ...utils.log_setup import get_logger
from ...utils.state_definitions import SelfRAGState
from .selfrag_agent_subgraph.selfrag_conditional_edges import (
    selfragNodesConditionalFunctions,
)
from .selfrag_agent_subgraph.selfrag_nodes import selfragNodes

# Get the same logger instance set up earlier
logger = get_logger()


class selfragAgentSubgraph:
    def __init__(self):
        logger.debug("Initialising selfragAgentSubgraph ... ")
        logger.debug("Initialising Helper functions for selfragAgentSubgraph ...")
        self.selfrag_nodes = selfragNodes()
        self.selfrag_conditional_functions = selfragNodesConditionalFunctions()

    def create_selfrag_agent_subgraph(self):
        logger.debug("Creating selfrag agent subgraph ...")
        child_builder = StateGraph(SelfRAGState)

        child_builder.add_node("self_rag_agent", self.selfrag_nodes.self_rag_node)
        child_builder.set_entry_point("self_rag_agent")
        child_builder.add_node("retrieval_agent", self.selfrag_nodes.retrieval_agent)
        child_builder.add_node("retrieval_agent_tools", self.selfrag_nodes.execute_retrieval_tools)
        child_builder.add_node("document_grading_agent", self.selfrag_nodes.document_grading_agent)
        child_builder.add_node("reflection_agent", self.selfrag_nodes.rewrite)  # Re-writing the question
        child_builder.add_node("generate_response_agent", self.selfrag_nodes.generate)

        # Conditional node to decide to continue towards sub_activity_router
        # node or END
        child_builder.add_conditional_edges(
            "self_rag_agent",
            self.selfrag_conditional_functions.self_rag_routing,
            {"retrieval_agent": "retrieval_agent", "END": END},
        )
        child_builder.add_conditional_edges(
            "retrieval_agent",
            self.selfrag_conditional_functions.should_call_retrieval_tool,
            {"continue": "retrieval_agent_tools", "end": "document_grading_agent"},
        )
        child_builder.add_conditional_edges(
            "document_grading_agent",
            self.selfrag_conditional_functions.grade_documents,
            {"reflection_agent": "reflection_agent", "generate_response_agent": "generate_response_agent"},
        )
        child_builder.add_edge("retrieval_agent_tools", "retrieval_agent")
        child_builder.add_edge("reflection_agent", "retrieval_agent")
        child_builder.add_edge("generate_response_agent", "self_rag_agent")

        child_graph = child_builder.compile()
        logger.info("Successfully created the selfragAgent Subgraph!!!")
        return child_graph
