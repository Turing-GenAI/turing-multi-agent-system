import React, { useState } from 'react';

interface Prompt {
  id: string;
  name: string;
  description: string;
  template: string;
}

const AgentPrompts: React.FC = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([
    {
      id: 'prompt1',
      name: 'Planner Agent',
      description: 'Responsible for creating a plan of action based on user query',
      template: 'As a Planner Agent, analyze the user query "{query}" and create a detailed plan of action to address it. Break down the task into logical steps, identify required information sources, and outline the approach for solving this problem.'
    },
    {
      id: 'prompt2',
      name: 'Critique Agent',
      description: 'Reviews and provides critical feedback on generated content',
      template: 'As a Critique Agent, review the following content: "{content}". Identify any logical flaws, missing information, potential biases, or areas for improvement. Provide specific, constructive feedback that can be used to enhance the quality and accuracy of the content.'
    },
    {
      id: 'prompt3',
      name: 'RAG Agent',
      description: 'Retrieves and analyzes relevant information from knowledge base',
      template: 'As a RAG (Retrieval-Augmented Generation) Agent, retrieve relevant information from the knowledge base related to "{query}". Analyze the retrieved information, synthesize key insights, and generate a comprehensive response that accurately addresses the query while citing specific sources.'
    },
    {
      id: 'prompt4',
      name: 'Self-Reflection Agent',
      description: 'Evaluates the quality and completeness of its own responses',
      template: 'As a Self-Reflection Agent, evaluate the following response to the query "{query}": "{response}". Assess the response for accuracy, completeness, relevance, and clarity. Identify any gaps in reasoning or information. Suggest specific improvements that would enhance the quality of the response.'
    },
    {
      id: 'prompt5',
      name: 'Generate Findings Agent',
      description: 'Synthesizes information and generates comprehensive findings',
      template: 'As a Generate Findings Agent, analyze all the information gathered related to "{topic}" and synthesize it into a comprehensive set of findings. Identify key patterns, insights, and conclusions. Structure the findings in a clear, logical manner with appropriate headings and supporting evidence for each point.'
    }
  ]);

  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [newPrompt, setNewPrompt] = useState<Omit<Prompt, 'id'>>({
    name: '',
    description: '',
    template: ''
  });
  const [isAdding, setIsAdding] = useState(false);

  const handleEditPrompt = (prompt: Prompt) => {
    setEditingPrompt(prompt);
  };

  const handleUpdatePrompt = () => {
    if (editingPrompt) {
      setPrompts(prompts.map(p => 
        p.id === editingPrompt.id ? editingPrompt : p
      ));
      setEditingPrompt(null);
    }
  };

  const handleDeletePrompt = (id: string) => {
    setPrompts(prompts.filter(p => p.id !== id));
  };

  const handleAddPrompt = () => {
    const newId = `prompt${Date.now()}`;
    setPrompts([...prompts, { ...newPrompt, id: newId }]);
    setNewPrompt({
      name: '',
      description: '',
      template: ''
    });
    setIsAdding(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        {/* <h2 className="text-xl font-semibold">Agent Prompts</h2> */}
        <button
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Prompt
        </button>
      </div>

      {/* Add New Prompt Form */}
      {isAdding && (
        <div className="mb-8 bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Add New Agent Prompt</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="new-name" className="block text-sm font-medium text-gray-700 mb-1">
                Agent Name
              </label>
              <input
                id="new-name"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={newPrompt.name}
                onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="new-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                id="new-description"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={newPrompt.description}
                onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="new-template" className="block text-sm font-medium text-gray-700 mb-1">
                Prompt
              </label>
              <textarea
                id="new-template"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={newPrompt.template}
                onChange={(e) => setNewPrompt({ ...newPrompt, template: e.target.value })}
              />
              <p className="mt-1 text-sm text-gray-500">
                Use curly braces to denote variables, e.g., {'{variable_name}'}
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPrompt}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={!newPrompt.name || !newPrompt.template}
              >
                Save Prompt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Prompt Form */}
      {editingPrompt && (
        <div className="mb-8 bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Edit Agent Prompt</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                Agent Name
              </label>
              <input
                id="edit-name"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={editingPrompt.name}
                onChange={(e) => setEditingPrompt({ ...editingPrompt, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                id="edit-description"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={editingPrompt.description}
                onChange={(e) => setEditingPrompt({ ...editingPrompt, description: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="edit-template" className="block text-sm font-medium text-gray-700 mb-1">
                Prompt
              </label>
              <textarea
                id="edit-template"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={editingPrompt.template}
                onChange={(e) => setEditingPrompt({ ...editingPrompt, template: e.target.value })}
              />
              <p className="mt-1 text-sm text-gray-500">
                Use curly braces to denote variables, e.g., {'{variable_name}'}
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setEditingPrompt(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePrompt}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={!editingPrompt.name || !editingPrompt.template}
              >
                Update Prompt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt List */}
      <div className="space-y-4">
        {prompts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No agent prompts defined yet. Click "Add New Prompt" to create one.
          </div>
        ) : (
          prompts.map((prompt) => (
            <div key={prompt.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{prompt.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{prompt.description}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditPrompt(prompt)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                    title="Edit prompt"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeletePrompt(prompt.id)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md"
                    title="Delete prompt"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="mt-3 bg-gray-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Prompt:</h4>
                <pre className="text-sm text-gray-800 whitespace-pre-wrap">{prompt.template}</pre>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AgentPrompts;
