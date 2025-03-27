import React, { useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  NodeTypes,
  addEdge,
  Connection,
  MarkerType,
  Position,
  Handle,
  Panel,
  EdgeTypes,
  getBezierPath,
  EdgeLabelRenderer,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// New component to display the system architecture image
const SystemArchitectureImage: React.FC = () => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">System Architecture</h2>
      <p className="text-gray-600 mb-6">
        Diagram showing the components and data flow of the Turing Multi-Agent System.
      </p>
      <div className="flex justify-center">
        <img 
          src="/images/system-architecture.png" 
          alt="System Architecture Diagram" 
          className="max-w-full h-auto border rounded-lg shadow-sm"
        />
      </div>
    </div>
  );
};

// Smaller “child” node component
const CustomNode = ({ data }: { data: any }) => {
  const bgColor = data.bgColor || '#ffffff';
  const width = data.width || 150;
  const isDataNode = data.label && (
    data.label.includes('Cosmos') || 
    data.label.includes('Vector Store') || 
    data.label.includes('Application DB')
  );
  
  return (
    <div
      className={`border rounded-md shadow-md text-xs relative ${isDataNode ? 'z-[999]' : 'z-[5]'} pointer-events-auto`}
      style={{
        background: bgColor,
        width,
        borderWidth: '1px',
      }}
    >
      {/* Top handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="bg-neutral-600"
        id="top"
      />
      
      {/* Left handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="bg-neutral-600"
        id="left"
      />
      
      <div className="font-bold text-center p-1 border-b border-gray-200">{data.label}</div>
      {data.description && (
        <div className="text-xs p-2 text-center whitespace-pre-line">
          {data.description}
        </div>
      )}
      
      {/* Right handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="bg-neutral-600"
        id="right"
      />
      
      {/* Bottom handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="bg-neutral-600"
        id="bottom"
      />
    </div>
  );
};

// Larger “container” node component (yellow placeholders)
const ContainerNode = ({ data }: { data: any }) => {
  const bgColor = data.bgColor || '#ffffcc';
  const width = data.width || 350;
  const height = data.height || 200;

  return (
    <div
      className={`border rounded-md shadow-sm text-sm relative z-0 overflow-visible pointer-events-none`}
      style={{
        background: bgColor,
        width,
        height,
        borderWidth: '1px',
      }}
    >
      {/* Optionally remove handles if you don't want to connect lines to the container itself */}
      <Handle
        type="target"
        position={Position.Top}
        className="bg-neutral-600 invisible"
      />
      <div className="font-bold text-center py-1 border-b border-gray-300">{data.label}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="bg-neutral-600 invisible"
      />
    </div>
  );
};

// Custom edge (Bezier path with optional label)
const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  label,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          strokeWidth: 2,
          stroke: '#333',
          zIndex: 1000,
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              fontSize: 10,
              pointerEvents: 'all',
              backgroundColor: 'white',
              padding: '2px 4px',
              borderRadius: 4,
              border: '1px solid #333',
              zIndex: 1001,
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

// Define node types
const nodeTypes: NodeTypes = {
  custom: CustomNode,
  container: ContainerNode,
};

// Define edge types
const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

// Initial nodes (containers + child nodes)
const initialNodes: Node[] = [
  // ==========================================
  // 1) User Interaction (Container + Children)
  // ==========================================
  {
    id: 'user_container',
    type: 'container',
    data: {
      label: 'User Interaction',
      bgColor: '#ffffcc',
      width: 210,
      height: 200,
    },
    position: { x: 10, y: 280 },
    draggable: false,
    selectable: false,
  },
  {
    id: 'user_reg',
    type: 'custom',
    parentId: 'user_container',
    extent: 'parent',
    position: { x: 10, y: 40 },
    data: {
      label: 'User Registration',
      bgColor: '#e6f3ff',
      width: 130,
    },
  },
  {
    id: 'web_ui',
    type: 'custom',
    parentId: 'user_container',
    extent: 'parent',
    position: { x: 10, y: 100 },
    data: {
      label: 'Front-End Web UI App',
      description: 'React, Node App',
      bgColor: '#e6f3ff',
      width: 130,
    },
  },
  {
    id: 'azure_fe',
    type: 'custom',
    parentId: 'user_container',
    extent: 'parent',
    position: { x: 10, y: 160 },
    data: {
      label: 'Azure Front-End',
      bgColor: '#e6f3ff',
      width: 130,
    },
  },

  // =============================================
  // 2) Processing & Contracts (Container + Child)
  // =============================================
  {
    id: 'processing_container',
    type: 'container',
    data: {
      label: 'Processing & Compute',
      bgColor: '#ffffcc',
      width: 380,
      height: 320,
    },
    position: { x: 430, y: 60 },
    draggable: false,
    selectable: false,
  },
  {
    id: 'multi_agent',
    type: 'custom',
    parentId: 'processing_container',
    extent: 'parent',
    position: { x: 80, y: 60 },
    data: {
      label: 'Multi-Agent LLM API',
      description: 'Planner/Orchestrator\nRAG Sys\nRecord/UI Agent App\nService / Container / Kubernetes / API',
      bgColor: '#e6e6fa',
      width: 220,
    },
  },
  {
    id: 'ingestion',
    type: 'custom',
    parentId: 'processing_container',
    extent: 'parent',
    position: { x: 80, y: 200 },
    data: {
      label: 'Ingestion & Scheduling',
      description: 'Azure Function / Logic App',
      bgColor: '#e6e6fa',
      width: 220,
    },
  },

  // ===========================
  // 3) Notification (Container)
  // ===========================
  {
    id: 'notification_container',
    type: 'container',
    data: {
      label: 'Notifications',
      bgColor: '#ffffcc',
      width: 220,
      height: 150, // Increased height from 100 to 150
    },
    position: { x: 860, y: 50 },
    draggable: false,
    selectable: false,
  },
  {
    id: 'notification',
    type: 'custom',
    parentId: 'notification_container',
    extent: 'parent',
    position: { x: 20, y: 40 },
    data: {
      label: 'Notification Service',
      description: 'Logic Apps / SendGrid / Teams',
      bgColor: '#e6e6fa',
      width: 180,
    },
  },

  // ==================================
  // 4) Logging & Monitoring (Container)
  // ==================================
  {
    id: 'logging_container',
    type: 'container',
    data: {
      label: 'Logging & Monitoring',
      bgColor: '#ffffcc',
      width: 220,
      height: 150, // Increased height from 100 to 150 for consistency
    },
    position: { x: 860, y: 220 }, // Adjusted position to account for taller notification container
    draggable: false,
    selectable: false,
  },
  {
    id: 'event_monitor',
    type: 'custom',
    parentId: 'logging_container',
    extent: 'parent',
    position: { x: 20, y: 40 },
    data: {
      label: 'Event Monitor',
      description: 'Azure Monitor / App Insights',
      bgColor: '#e6e6fa',
      width: 180,
    },
  },

  // ===================================
  // 5) Data & Vector Store (Container)
  // ===================================
  {
    id: 'data_container',
    type: 'container',
    data: {
      label: 'Data & Vector Store',
      bgColor: '#ffffcc',
      width: 600, // Increased width further to accommodate horizontal layout
      height: 200, // Reduced height since nodes are now horizontal
    },
    position: { x: 860, y: 400 }, // Moved further down to avoid touching the logging container
    draggable: false,
    selectable: false,
    style: { overflow: 'visible' }, // Ensure children can overflow if needed
  },
  // Vector Store node - positioned horizontally
  {
    id: 'vector_store',
    type: 'custom',
    position: { x: 870, y: 450 }, // Adjusted vertical position
    draggable: true, // Make it draggable
    data: {
      label: 'Vector Store',
      description: 'e.g. Azure Cognitive Search or Mongo DB',
      bgColor: '#e6e6fa',
      width: 180,
      zIndex: 999, // High z-index to ensure visibility
    },
    zIndex: 999,
    style: { zIndex: 999 },
  },
  // Application DB node - positioned horizontally
  {
    id: 'app_db',
    type: 'custom',
    position: { x: 1070, y: 450 }, // Adjusted vertical position
    draggable: true, // Make it draggable
    data: {
      label: 'Application DB',
      description: 'Azure SQL or MongoDB or Postgres DB',
      bgColor: '#e6e6fa',
      width: 180,
      zIndex: 998, // High z-index to ensure visibility
    },
    zIndex: 998,
    style: { zIndex: 998 },
  },
  // Cosmos DB node - positioned horizontally
  {
    id: 'cosmos_db',
    type: 'custom',
    position: { x: 1270, y: 450 }, // Adjusted vertical position
    draggable: true, // Make it draggable
    data: {
      label: 'Cosmos DB / PostgreSQL / Federated DB',
      bgColor: '#e6e6fa',
      width: 180,
      zIndex: 999, // Extremely high z-index to ensure visibility
    },
    zIndex: 999, // Node-level z-index
    style: { zIndex: 999 }, // Additional style z-index
  },

  // ==================================
  // 6) Document Storage (Container)
  // ==================================
  {
    id: 'document_container',
    type: 'container',
    data: {
      label: 'Document Storage',
      bgColor: '#ffffcc',
      width: 420,
      height: 180,
    },
    position: { x: 280, y: 400 },
    draggable: false,
    selectable: false,
  },
  {
    id: 'blob_storage',
    type: 'custom',
    parentId: 'document_container',
    extent: 'parent',
    position: { x: 120, y: 70 },
    data: {
      label: 'Azure Blob Storage',
      bgColor: '#e6e6fa',
      width: 180,
    },
  },

  // ==================================
  // 7) Data & Vector Store (Container)
  // ==================================
];

// Edges between the smaller nodes (containers are just placeholders)
const initialEdges: Edge[] = [
  // Connections from Multi-Agent to other components
  {
    id: 'e1',
    source: 'web_ui',
    sourceHandle: 'bottom',
    target: 'multi_agent',
    targetHandle: 'top',
    type: 'smoothstep',
    animated: true,
    label: 'User Requests',
    style: { stroke: '#333', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#333',
    },
  },
  {
    id: 'e2',
    source: 'multi_agent',
    sourceHandle: 'right',
    target: 'notification',
    targetHandle: 'left',
    type: 'smoothstep',
    animated: true,
    label: 'Sends Notifications',
    style: { stroke: '#333', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#333',
    },
  },
  {
    id: 'e3',
    source: 'multi_agent',
    sourceHandle: 'right', // Use right handle of source
    target: 'vector_store',
    targetHandle: 'left', // Use left handle of target
    type: 'smoothstep',
    animated: true,
    label: 'Semantic Search',
    style: { stroke: '#333', strokeWidth: 2, zIndex: 500 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#333',
    },
  },
  {
    id: 'e4',
    source: 'vector_store',
    sourceHandle: 'right', // Use right handle of source
    target: 'app_db',
    targetHandle: 'left', // Use left handle of target
    type: 'smoothstep',
    animated: true,
    label: 'Data Flow',
    style: { stroke: '#333', strokeWidth: 2, zIndex: 500 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#333',
    },
  },
  {
    id: 'e5',
    source: 'app_db',
    sourceHandle: 'right', // Use right handle of source
    target: 'cosmos_db',
    targetHandle: 'left', // Use left handle of target
    type: 'smoothstep',
    animated: true,
    label: 'Stores Final Results',
    style: { stroke: '#333', strokeWidth: 2, zIndex: 500 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#333',
    },
  },
  // Ingestion connections
  {
    id: 'e6',
    source: 'multi_agent',
    sourceHandle: 'right',
    target: 'event_monitor',
    targetHandle: 'left',
    type: 'smoothstep',
    animated: true,
    label: 'Logs Events',
    style: { stroke: '#333', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#333',
    },
  },
  {
    id: 'e7',
    source: 'multi_agent',
    sourceHandle: 'right',
    target: 'blob_storage',
    targetHandle: 'left',
    type: 'smoothstep',
    animated: true,
    label: 'Stores Documents',
    style: { stroke: '#333', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#333',
    },
  },
  // User interface connections
  {
    id: 'e8',
    source: 'ingestion',
    sourceHandle: 'top',
    target: 'multi_agent',
    targetHandle: 'bottom',
    type: 'smoothstep',
    animated: true,
    label: 'Scheduler/Triggers',
    style: { stroke: '#333', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#333',
    },
  },
  {
    id: 'e9',
    source: 'user_reg',
    sourceHandle: 'right',
    target: 'multi_agent',
    targetHandle: 'left',
    type: 'smoothstep',
    animated: true,
    label: 'Auth',
    style: { stroke: '#333', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#333',
    },
  },
  {
    id: 'e10',
    source: 'azure_fe',
    sourceHandle: 'right',
    target: 'multi_agent',
    targetHandle: 'left',
    type: 'smoothstep',
    animated: true,
    label: 'API Calls',
    style: { stroke: '#333', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#333',
    },
  },
  // Blob storage connections
  {
    id: 'e11',
    source: 'blob_storage',
    sourceHandle: 'right',
    target: 'multi_agent',
    targetHandle: 'left',
    type: 'smoothstep',
    animated: true,
    label: 'Document Retrieval',
    style: { stroke: '#333', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#333',
    },
  },
  // Vector store connections
  {
    id: 'e12',
    source: 'vector_store',
    sourceHandle: 'right',
    target: 'app_db',
    targetHandle: 'left',
    type: 'smoothstep',
    animated: true,
    label: 'Data Integration',
    style: { stroke: '#333', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#333',
    },
  },
  // Additional connections from reference image
  {
    id: 'e13',
    source: 'multi_agent',
    sourceHandle: 'right', // Use right handle of source
    target: 'vector_store',
    targetHandle: 'left', // Use left handle of target
    type: 'smoothstep',
    animated: true,
    label: 'Retrieves Vector Data',
    style: { stroke: '#333', strokeWidth: 2, strokeDasharray: '5,5' },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#333',
    },
  },
  {
    id: 'e14',
    source: 'multi_agent',
    sourceHandle: 'right', // Use right handle of source
    target: 'app_db',
    targetHandle: 'left', // Use left handle of target
    type: 'smoothstep',
    animated: true,
    label: 'Metadata',
    style: { stroke: '#333', strokeWidth: 2, strokeDasharray: '5,5' },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#333',
    },
  },
  {
    id: 'e15',
    source: 'multi_agent',
    sourceHandle: 'right', // Use right handle of source
    target: 'cosmos_db',
    targetHandle: 'left', // Use left handle of target
    type: 'smoothstep',
    animated: true,
    label: 'Writes Results',
    style: { stroke: '#333', strokeWidth: 2, strokeDasharray: '5,5', zIndex: 500 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#333',
    },
  },
  {
    id: 'e16',
    source: 'blob_storage',
    sourceHandle: 'right', // Use right handle of source
    target: 'cosmos_db',
    targetHandle: 'left', // Use left handle of target
    type: 'smoothstep',
    animated: true,
    label: 'Store Path/Blob, Metadata',
    style: { stroke: '#333', strokeWidth: 2, zIndex: 500 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#333',
    },
  },
  // Add new connections for Ingestion and Scheduling based on the reference image
  {
    id: 'e17',
    source: 'web_ui',
    sourceHandle: 'bottom',
    target: 'ingestion',
    targetHandle: 'top',
    type: 'smoothstep',
    animated: true,
    label: 'Scheduled/Triggers',
    style: { stroke: '#333', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#333',
    },
  },
  {
    id: 'e18',
    source: 'ingestion',
    sourceHandle: 'right',
    target: 'multi_agent',
    targetHandle: 'bottom',
    type: 'smoothstep',
    animated: true,
    label: 'Scheduler/Triggers',
    style: { stroke: '#333', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#333',
    },
  },
  {
    id: 'e19',
    source: 'ingestion',
    sourceHandle: 'right',
    target: 'blob_storage',
    targetHandle: 'left',
    type: 'smoothstep',
    animated: true,
    label: 'Uploads',
    style: { stroke: '#333', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#333',
    },
  },
  {
    id: 'e20',
    source: 'blob_storage',
    sourceHandle: 'top',
    target: 'ingestion',
    targetHandle: 'bottom',
    type: 'smoothstep',
    animated: true,
    label: 'Extract & Process',
    style: { stroke: '#333', strokeWidth: 2, strokeDasharray: '5,5' },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#333',
    },
  },
];

export const SystemArchitecture: React.FC = () => {
  // const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  // const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  // const reactFlowInstance = useRef(null);

  // const onConnect = useCallback(
  //   (params: Connection) =>
  //     setEdges((eds) =>
  //       addEdge(
  //         {
  //           ...params,
  //           type: 'bezier',
  //           animated: true,
  //           style: { stroke: '#333', strokeWidth: 2 },
  //           markerEnd: {
  //             type: MarkerType.ArrowClosed,
  //             width: 15,
  //             height: 15,
  //             color: '#333',
  //           },
  //           zIndex: 1000,
  //         },
  //         eds
  //       )
  //     ),
  //   [setEdges]
  // );

  // const defaultEdgeOptions = {
  //   type: 'bezier',
  //   animated: true,
  //   style: { stroke: '#333', strokeWidth: 2 },
  //   markerEnd: {
  //     type: MarkerType.ArrowClosed,
  //     width: 15,
  //     height: 15,
  //     color: '#333',
  //   },
  //   zIndex: 1000,
  // };

  // // Ensure nodes are properly positioned on initial render and data nodes are always on top
  // React.useEffect(() => {
  //   // Small delay to ensure the flow is rendered before positioning
  //   const timer = setTimeout(() => {
  //     setNodes((nds) => 
  //       nds.map(node => {
  //         // Special handling for data nodes
  //         if (node.id === 'cosmos_db' || node.id === 'vector_store' || node.id === 'app_db') {
  //           return {
  //             ...node,
  //             data: {
  //               ...node.data,
  //               zIndex: 999,
  //             },
  //             zIndex: 999,
  //             style: { 
  //               ...node.style,
  //               zIndex: 999 
  //             },
  //             selectable: true,
  //             draggable: true, // Make data nodes draggable
  //           };
  //         }
          
  //         return {
  //           ...node,
  //           // Ensure all nodes have proper z-index
  //           data: {
  //             ...node.data,
  //             zIndex: node.type === 'container' ? 0 : 10,
  //           },
  //           // Ensure nodes are selectable and draggable as needed
  //           selectable: node.type !== 'container',
  //           draggable: node.type !== 'container',
  //         };
  //       })
  //     );
  //   }, 100);
    
  //   return () => clearTimeout(timer);
  // }, [setNodes]);

  // // Update the fitView options to better handle the new layout
  // React.useEffect(() => {
  //   // Fit view after a short delay to ensure all elements are rendered
  //   const timer = setTimeout(() => {
  //     if (reactFlowInstance.current) {
  //       reactFlowInstance.current.fitView({
  //         padding: 0.2,
  //         includeHiddenNodes: true,
  //         minZoom: 0.6,
  //         maxZoom: 1.0
  //       });
  //     }
  //   }, 200);
    
  //   return () => clearTimeout(timer);
  // }, [reactFlowInstance]);

  return (
    // <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
    //   <h2 className="text-xl font-semibold mb-4">System Architecture</h2>
    //   <p className="text-gray-600 mb-6">
    //     Interactive diagram showing the components and data flow of the Turing Multi-Agent System.
    //   </p>
    //   <div className="border rounded-md shadow-md bg-white" style={{ height: '70vh' }}>
    //     <ReactFlow
    //       nodes={nodes}
    //       edges={edges}
    //       onNodesChange={onNodesChange}
    //       onEdgesChange={onEdgesChange}
    //       onConnect={onConnect}
    //       nodeTypes={nodeTypes}
    //       edgeTypes={edgeTypes}
    //       defaultEdgeOptions={defaultEdgeOptions}
    //       connectionLineComponent={({ fromX, fromY, toX, toY }) => (
    //         <g>
    //           <path
    //             d={`M${fromX},${fromY} L${toX},${toY}`}
    //             stroke="#333"
    //             strokeWidth={2}
    //             fill="none"
    //             strokeDasharray="5,5"
    //             style={{ zIndex: 1000 }}
    //           />
    //           <circle cx={toX} cy={toY} fill="#333" r={3} />
    //         </g>
    //       )}
    //       elevateEdgesOnSelect={true}
    //       fitView
    //       minZoom={0.5}
    //       maxZoom={1.5}
    //       defaultZoom={0.7} // Slightly smaller default zoom to see more
    //       fitViewOptions={{ 
    //         padding: 0.2,
    //         includeHiddenNodes: true
    //       }}
    //       onInit={instance => reactFlowInstance.current = instance}
    //       proOptions={{ hideAttribution: true }}
    //       nodesDraggable={false} // Default for most nodes
    //       nodesConnectable={false} // Prevent new connections by default
    //       elementsSelectable={true} // Allow selection for better interaction
    //       zoomOnScroll={true}
    //       panOnScroll={true}
    //       preventScrolling={false}
    //       onNodeClick={(event, node) => {
    //         // When a node is clicked, ensure it's brought to the front
    //         if (node.id === 'cosmos_db' || node.id === 'vector_store' || node.id === 'app_db') {
    //           setNodes((nds) =>
    //             nds.map((n) => {
    //               if (n.id === node.id) {
    //                 return {
    //                   ...n,
    //                   zIndex: 999,
    //                   style: { ...n.style, zIndex: 999 },
    //                   data: { ...n.data, zIndex: 999 }
    //                 };
    //               }
    //               return n;
    //             })
    //           );
    //         }
    //       }}
    //       onNodeDragStop={(event, node) => {
    //         // When a node is dragged, ensure edges follow it properly
    //         if (node.id === 'cosmos_db' || node.id === 'vector_store' || node.id === 'app_db') {
    //           // Update the node's position in the state
    //           setNodes((nds) =>
    //             nds.map((n) => {
    //               if (n.id === node.id) {
    //                 return {
    //                   ...n,
    //                   position: node.position,
    //                   zIndex: 999, // Ensure high z-index is maintained
    //                   style: { ...n.style, zIndex: 999 }
    //                 };
    //               }
    //               return n;
    //             })
    //           );
    //         }
    //       }}
    //     >
    //       <Controls showInteractive={false} />
    //       <MiniMap 
    //         nodeStrokeColor={(n) => {
    //           return '#fff';
    //         }}
    //         nodeColor={(n) => {
    //           return n.data.bgColor;
    //         }}
    //         nodeBorderRadius={2}
    //       />
    //       <Background color="#f8f8f8" gap={16} />
    //       <Panel position="top-right">
    //         <div className="bg-white p-3 rounded shadow-md border border-gray-200">
    //           <h3 className="font-bold text-sm text-gray-800 mb-2">Legend</h3>
    //           <div className="space-y-2">
    //             <div className="flex items-center">
    //               <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded mr-2"></div>
    //               <span className="text-xs text-gray-700">User Interface</span>
    //             </div>
    //             <div className="flex items-center">
    //               <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
    //               <span className="text-xs text-gray-700">Agent System</span>
    //             </div>
    //             <div className="flex items-center">
    //               <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded mr-2"></div>
    //               <span className="text-xs text-gray-700">Data Storage</span>
    //             </div>
    //             <div className="flex items-center">
    //               <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded mr-2"></div>
    //               <span className="text-xs text-gray-700">External Systems</span>
    //             </div>
    //           </div>
    //         </div>
    //       </Panel>
    //     </ReactFlow>
    //   </div>
    // </div>
    <SystemArchitectureImage />
  );
};

export default SystemArchitecture;
