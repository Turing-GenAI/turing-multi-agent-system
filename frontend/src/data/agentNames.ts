export const agentName = {
  "trial_supervisor_agent": "Supervisor",
  "trial supervisor - crm_master_agent": "Supervisor - CRM Master Agent",
  "trial supervisor - inspection_master_agent": "Supervisor - Master Agent",
  "inspection - site_area_agent_1": "Master Agent 1 - Domain Agent",
  "inspection - site_area_agent_2": "Master Agent 2 - Domain Agent",
  "CRM - fetch_sgr_data node": "CRM - Fetch SGR Data",
  "CRM - process_major_deviations node": "CRM - Process Major Deviations",
  "CRM - generate_findings_agent": "CRM - Generate Findings",
  "CRM - process_pd_section node": "CRM - Process PD Section",
  "CRM - process_site_inspection_section node": "CRM - Process Site Inspection Section",
  "CRM - process_significant_issue_escalation_section node": "CRM - Escalation for Significant Issues",
  "CRM - process_qa_audit_section node": "CRM - Process QA Audit",
  "CRM - generate_final_report node": "CRM - Generate Final Report",
  "inspection - data_ingestion node_1": "Master Agent 1 - Data Ingestion",
  "inspection - site_area_router_1": "Master Agent 1 - Domain Router",
  "inspection - planner_agent_1": "Master Agent 1 - Planner Agent",
  "inspection - critique_agent_1": "Master Agent 1 - Critique Agent",
  "inspection - feedback_agent node_1": "Master Agent 1 - Feedback Agent",
  "inspection - data_ingestion node_2": "Master Agent 2 - Data Ingestion",
  "inspection - site_area_router_2": "Master Agent 2 - Domain Router",
  "inspection - planner_agent_2": "Master Agent 2 - Planner Agent",
  "inspection - critique_agent_2": "Master Agent 2 - Critique Agent",
  "inspection - feedback_agent node_2": "Master Agent 2 - Feedback Agent",
  "SelfRAG - self_rag_agent": "Self RAG",
  "SelfRAG - retrieval_agent": "Self RAG - Retrieval Agent",
  "SelfRAG - site_data_retriever tool": "Self RAG - Domain Data Retriever",
  "SelfRAG - document_grading_agent": "Self RAG - Document Grading",
  "SelfRAG - reflection_agent": "Self RAG - Reflection Agent",
  "SelfRAG - generate_response_agent": "Self RAG - Generate Response ",
  "SelfRAG - guidelines_retriever tool": "Self RAG - Guidelines Retriever",
  "SelfRAG - site_data_retriever": "Self RAG - Domain Data Retriever",
  "inspection - generate_findings_agent_1": "Master Agent 1 - Generate Findings Agent",
  "Inspection - discrepancy_data_generator_node_1": "Master Agent 1 - Discrepancy Data Generator",
  "inspection - generate_findings_agent_2": "Master Agent 2 - Generate Findings Agent",
  "Inspection - discrepancy_data_generator_node_2": "Master Agent 2 - Discrepancy Data Generator",
  "Unknown": "Require Human Feedback"
} as const;

export const agentNodeName = {
  "trial_supervisor_agent": "Supervisor",
  "crm_master_agent": "CRM Master Agent",
  "inspection_master_agent": "Master Agent",
  // "inspection_master_agent_2": "Master Agent 2",
  "site_area_agent": "Domain Area",
  "fetch_sgr_data node": "Fetch SGR Data",
  "process_major_deviations node": "Process Major Deviations",
  "generate_findings_agent": "Generate Findings",
  "process_pd_section node": "Process PD Section",
  "process_site_inspection_section node": "Process Site Inspection Section",
  "process_significant_issue_escalation_section node": "Escalation for Significant Issues",
  "process_qa_audit_section node": "Process QA Audit",
  "generate_final_report node": "Generate Final Report",
  "data_ingestion node": "Data Ingestion",
  "site_area_router": "Domain Router",
  "planner_agent": "Planner",
  "critique_agent": "Critique",
  "feedback_agent node": "Feedback",
  "discrepancy_data_generator_node": "Discrepancy Data Generator",
  "generate_risk_scores node": "Risk Score Generator",
  "updates and notifications": "Updates & Notifications",
  "self_rag_agent": "Self RAG",
  "retrieval_agent": "Retrieval",
  "site_data_retriever tool": "Domain Data Retriever",
  "document_grading_agent": "Document Grading",
  "reflection_agent": "Reflection",
  "generate_response_agent": "Generate Response",
  "guidelines_retriever tool": "Guidelines Retriever",
} as const;

export const getAgentDisplayName = (nodeName?: string): string => {
 if (!nodeName) return 'Assistant';
 return nodeName in agentNodeName ? agentNodeName[nodeName as keyof typeof agentNodeName] : nodeName;
};

export const getAgentDisplayNameByNode = (node?: string): string => {
  if (!node) return 'Assistant';
  return node in agentName ? agentName[node as keyof typeof agentName] : node;
 };