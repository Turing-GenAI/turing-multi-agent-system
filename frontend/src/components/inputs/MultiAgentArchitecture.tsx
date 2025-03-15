import React from 'react';

const MultiAgentArchitecture: React.FC = () => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">Multi Agent Architecture</h2>
      <p className="text-gray-600 mb-6">
        Overview of the multi-agent system architecture and component interactions.
      </p>
      
      <div className="flex justify-center items-center mt-4">
        <img 
          src="/images/multi-agent-architecture.png" 
          alt="Multi-Agent Architecture Diagram" 
          className="max-w-full shadow-md rounded-md border border-gray-200"
        />
      </div>
      
      <div className="mt-8 bg-blue-50 p-4 rounded-md border border-blue-100">
        <h3 className="text-lg font-medium text-blue-800 mb-2">Architecture Overview</h3>
        <p className="text-blue-700">
          This diagram illustrates the interaction between different components in our multi-agent system,
          showing how data flows between agents, knowledge bases, and external resources.
        </p>
      </div>
    </div>
  );
};

export default MultiAgentArchitecture;
