import React from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  NodeTypes,
  ConnectionLineType,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom node component
const CustomNode = ({ data }: { data: any }) => {
  const bgColor = data.bgColor || '#ffffff';
  const borderColor = data.borderColor || '#e2e8f0';
  const width = data.width || 150;
  const height = data.height || 'auto';
  
  return (
    <div 
      className="border rounded-md p-2 shadow-sm" 
      style={{ 
        background: bgColor,
        borderColor: borderColor,
        borderWidth: '1px',
        width: width,
        height: height,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        fontSize: '12px',
      }}
    >
      <div className="font-bold text-center">{data.label}</div>
      {data.description && (
        <div className="text-xs mt-1 text-center whitespace-pre-line">{data.description}</div>
      )}
    </div>
  );
};

// Container node component (for the big yellow boxes)
const ContainerNode = ({ data }: { data: any }) => {
  const bgColor = data.bgColor || '#ffffcc';
  const width = data.width || 300;
  const height = data.height || 200;
  
  return (
    <div 
      className="border rounded-md p-2" 
      style={{ 
        background: bgColor,
        borderColor: '#e2e8f0',
        borderWidth: '1px',
        width: width,
        height: height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        fontSize: '14px',
        position: 'relative',
      }}
    >
      <div className="font-bold text-center absolute top-2">{data.label}</div>
    </div>
  );
};

// Define node types
const nodeTypes: NodeTypes = {
  custom: CustomNode,
  container: ContainerNode,
};

// Initial nodes and edges for the visualization based on the image
const initialNodes: Node[] = [
  // Container nodes (big yellow boxes)
  {
    id: 'processing_contracts_container',
    type: 'container',
    data: { 
      label: 'Processing & Contracts', 
      bgColor: '#ffffcc',
      width: 350,
      height: 250,
    },
    position: { x: 430, y: 30 },
    style: { zIndex: 0 },
  },
  {
    id: 'user_interaction_container',
    type: 'container',
    data: { 
      label: 'User Interaction', 
      bgColor: '#ffffcc',
      width: 250,
      height: 200,
    },
    position: { x: 10, y: 250 },
    style: { zIndex: 0 },
  },
  {
    id: 'document_storage_container',
    type: 'container',
    data: { 
      label: 'Document Storage', 
      bgColor: '#ffffcc',
      width: 400,
      height: 200,
    },
    position: { x: 280, y: 380 },
    style: { zIndex: 0 },
  },
  {
    id: 'data_vector_store_container',
    type: 'container',
    data: { 
      label: 'Data & Vector Store', 
      bgColor: '#ffffcc',
      width: 350,
      height: 250,
    },
    position: { x: 800, y: 190 },
    style: { zIndex: 0 },
  },
  {
    id: 'logging_monitoring_container',
    type: 'container',
    data: { 
      label: 'Logging & Monitoring', 
      bgColor: '#ffffcc',
      width: 250,
      height: 120,
    },
    position: { x: 800, y: 120 },
    style: { zIndex: 0 },
  },
  {
    id: 'notification_container',
    type: 'container',
    data: { 
      label: 'Notification', 
      bgColor: '#ffffcc',
      width: 250,
      height: 120,
    },
    position: { x: 800, y: 20 },
    style: { zIndex: 0 },
  },
  
  // Inner nodes (purple/lavender boxes)
  {
    id: 'multi_agent_llm',
    type: 'custom',
    data: { 
      label: 'Multi-Agent LLM API', 
      description: 'Planner/Orchestrator\nRAG Sys\nRecord/UI Agent App\nService / Controller\nExtractor / LMM',
      bgColor: '#e6e6fa',
      width: 180,
    },
    position: { x: 620, y: 170 },
    style: { zIndex: 1 },
  },
  {
    id: 'ingestion_scheduling',
    type: 'custom',
    data: { 
      label: 'Ingestion & Scheduling', 
      description: 'Azure Function / Logic App',
      bgColor: '#e6e6fa',
      width: 180,
    },
    position: { x: 450, y: 300 },
    style: { zIndex: 1 },
  },
  {
    id: 'notification_service',
    type: 'custom',
    data: { 
      label: 'Notification Service', 
      description: 'Logic Apps / Email/SMS / Teams',
      bgColor: '#e6e6fa',
      width: 180,
    },
    position: { x: 835, y: 70 },
    style: { zIndex: 1 },
  },
  {
    id: 'event_monitor',
    type: 'custom',
    data: { 
      label: 'Event Monitor / App Insights', 
      bgColor: '#e6e6fa',
      width: 180,
    },
    position: { x: 835, y: 150 },
    style: { zIndex: 1 },
  },
  {
    id: 'azure_blob_storage',
    type: 'custom',
    data: { 
      label: 'Azure Blob Storage', 
      bgColor: '#e6e6fa',
      width: 180,
    },
    position: { x: 320, y: 425 },
    style: { zIndex: 1 },
  },
  {
    id: 'cosmos_db',
    type: 'custom',
    data: { 
      label: 'Cosmos DB / SharePoint / Enterprise DB', 
      bgColor: '#e6e6fa',
      width: 180,
    },
    position: { x: 860, y: 370 },
    style: { zIndex: 1 },
  },
  {
    id: 'vector_store',
    type: 'custom',
    data: { 
      label: 'Vector Store', 
      description: 'e.g. Azure Cognitive Search or MongoDB',
      bgColor: '#e6e6fa',
      width: 180,
    },
    position: { x: 860, y: 240 },
    style: { zIndex: 1 },
  },
  {
    id: 'application_db',
    type: 'custom',
    data: { 
      label: 'Application DB', 
      description: 'Azure SQL or Mongo DB or Redis',
      bgColor: '#e6e6fa',
      width: 180,
    },
    position: { x: 860, y: 310 },
    style: { zIndex: 1 },
  },
  
  // Light blue boxes
  {
    id: 'azure_front_end',
    type: 'custom',
    data: { 
      label: 'Azure Front-End', 
      bgColor: '#e6f3ff',
      width: 120,
    },
    position: { x: 30, y: 260 },
    style: { zIndex: 1 },
  },
  {
    id: 'user_registration',
    type: 'custom',
    data: { 
      label: 'User Registration/User', 
      bgColor: '#e6f3ff',
      width: 120,
    },
    position: { x: 30, y: 350 },
    style: { zIndex: 1 },
  },
  {
    id: 'front_end_web_ui',
    type: 'custom',
    data: { 
      label: 'Front_End_Web_UI_App\nReact.js / React_Web_App', 
      bgColor: '#e6f3ff',
      width: 150,
    },
    position: { x: 120, y: 350 },
    style: { zIndex: 1 },
  },
];

// Define edges with custom styling
const initialEdges: Edge[] = [
  // Connections from Processing & Contracts
  { 
    id: 'e-pc-ma', 
    source: 'multi_agent_llm', 
    target: 'notification_service', 
    animated: false, 
    label: 'Sends Alerts',
    style: { stroke: '#000000', strokeWidth: 1.5 },
  },
  { 
    id: 'e-ma-em', 
    source: 'multi_agent_llm', 
    target: 'event_monitor', 
    animated: false, 
    label: 'Logs',
    style: { stroke: '#000000', strokeWidth: 1.5 },
  },
  { 
    id: 'e-ma-vs', 
    source: 'multi_agent_llm', 
    target: 'vector_store', 
    animated: false, 
    label: 'Business Vector Data',
    style: { stroke: '#000000', strokeWidth: 1.5 },
  },
  { 
    id: 'e-ma-ad', 
    source: 'multi_agent_llm', 
    target: 'application_db', 
    animated: false, 
    label: 'Writes/Reads',
    style: { stroke: '#000000', strokeWidth: 1.5 },
  },
  { 
    id: 'e-ma-cd', 
    source: 'multi_agent_llm', 
    target: 'cosmos_db', 
    animated: false, 
    label: 'Writes/Reads',
    style: { stroke: '#000000', strokeWidth: 1.5 },
  },
  
  // Connections from Ingestion & Scheduling
  { 
    id: 'e-is-ma', 
    source: 'ingestion_scheduling', 
    target: 'multi_agent_llm', 
    animated: false,
    style: { stroke: '#000000', strokeWidth: 1.5 },
  },
  { 
    id: 'e-is-ad', 
    source: 'ingestion_scheduling', 
    target: 'application_db', 
    animated: false, 
    label: 'Metadata',
    style: { stroke: '#000000', strokeWidth: 1.5 },
  },
  { 
    id: 'e-is-cd', 
    source: 'ingestion_scheduling', 
    target: 'cosmos_db', 
    animated: false, 
    label: 'UI metadata',
    style: { stroke: '#000000', strokeWidth: 1.5 },
  },
  
  // User Interaction connections
  { 
    id: 'e-ui-afe', 
    source: 'user_interaction_container', 
    target: 'azure_front_end', 
    animated: false,
    style: { stroke: '#000000', strokeWidth: 1.5 },
  },
  { 
    id: 'e-ui-ur', 
    source: 'user_interaction_container', 
    target: 'user_registration', 
    animated: false,
    style: { stroke: '#000000', strokeWidth: 1.5 },
  },
  { 
    id: 'e-ui-fe', 
    source: 'user_interaction_container', 
    target: 'front_end_web_ui', 
    animated: false,
    style: { stroke: '#000000', strokeWidth: 1.5 },
  },
  { 
    id: 'e-ui-is', 
    source: 'user_interaction_container', 
    target: 'ingestion_scheduling', 
    animated: false, 
    label: 'Scheduler/Triggers',
    style: { stroke: '#000000', strokeWidth: 1.5 },
  },
  
  // Document Storage connections
  { 
    id: 'e-ds-abs', 
    source: 'document_storage_container', 
    target: 'azure_blob_storage', 
    animated: false,
    style: { stroke: '#000000', strokeWidth: 1.5 },
  },
  { 
    id: 'e-ds-is', 
    source: 'document_storage_container', 
    target: 'ingestion_scheduling', 
    animated: false, 
    label: 'Document Storage',
    style: { stroke: '#000000', strokeWidth: 1.5 },
  },
  
  // Azure Blob Storage connections
  { 
    id: 'e-abs-is', 
    source: 'azure_blob_storage', 
    target: 'ingestion_scheduling', 
    animated: false, 
    label: 'Extract/Trigger on File',
    style: { stroke: '#000000', strokeWidth: 1.5 },
  },
  { 
    id: 'e-abs-ma', 
    source: 'azure_blob_storage', 
    target: 'multi_agent_llm', 
    animated: false, 
    label: 'Upload Documents',
    style: { stroke: '#000000', strokeWidth: 1.5 },
  },
  { 
    id: 'e-abs-cd', 
    source: 'azure_blob_storage', 
    target: 'cosmos_db', 
    animated: false, 
    label: 'Store Final docs, results',
    style: { stroke: '#000000', strokeWidth: 1.5 },
  },
  
  // Additional connections
  { 
    id: 'e-vs-ad', 
    source: 'vector_store', 
    target: 'application_db', 
    animated: false,
    style: { stroke: '#000000', strokeWidth: 1.5 },
  },
  { 
    id: 'e-pc-container-ma', 
    source: 'processing_contracts_container', 
    target: 'multi_agent_llm', 
    animated: false,
    style: { stroke: '#000000', strokeWidth: 1.5 },
  },
  { 
    id: 'e-pc-container-ns', 
    source: 'processing_contracts_container', 
    target: 'notification_service', 
    animated: false, 
    label: 'Sends Alerts',
    style: { stroke: '#000000', strokeWidth: 1.5 },
  },
];

export const Data: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">System Architecture Visualization</h1>
      <div className="border rounded-lg shadow-lg" style={{ height: '80vh' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
          defaultEdgeOptions={{
            style: { stroke: '#000000', strokeWidth: 1.5 },
          }}
          connectionLineType={ConnectionLineType.SmoothStep}
          minZoom={0.2}
          maxZoom={1.5}
          defaultZoom={0.5}
          fitViewOptions={{ padding: 0.2 }}
        >
          <Controls />
          <MiniMap />
          <Background color="#f8f8f8" gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
};

export default Data;
