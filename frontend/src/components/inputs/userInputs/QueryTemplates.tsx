import React, { useState } from 'react';

interface Template {
  id: string;
  name: string;
  description: string;
  template: string;
}

const QueryTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: 'template1',
      name: 'Clinical Trial Summary',
      description: 'Summarize key information about a clinical trial',
      template: 'Provide a summary of the clinical trial {trial_id} including objectives, endpoints, and key findings.'
    },
    {
      id: 'template2',
      name: 'Safety Analysis',
      description: 'Analyze safety data from a clinical trial',
      template: 'Analyze the safety profile of {drug_name} in trial {trial_id}, focusing on adverse events and their frequencies.'
    },
    {
      id: 'template3',
      name: 'Efficacy Comparison',
      description: 'Compare efficacy between treatment groups',
      template: 'Compare the efficacy of {treatment_a} versus {treatment_b} in {indication} based on data from trial {trial_id}.'
    }
  ]);

  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [newTemplate, setNewTemplate] = useState<Omit<Template, 'id'>>({
    name: '',
    description: '',
    template: ''
  });
  const [isAdding, setIsAdding] = useState(false);

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
  };

  const handleUpdateTemplate = () => {
    if (editingTemplate) {
      setTemplates(templates.map(t => 
        t.id === editingTemplate.id ? editingTemplate : t
      ));
      setEditingTemplate(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
  };

  const handleAddTemplate = () => {
    if (newTemplate.name && newTemplate.template) {
      const template: Template = {
        id: `template-${Date.now()}`,
        ...newTemplate
      };
      setTemplates([...templates, template]);
      setNewTemplate({
        name: '',
        description: '',
        template: ''
      });
      setIsAdding(false);
    }
  };

  const handleCancelAdd = () => {
    setNewTemplate({
      name: '',
      description: '',
      template: ''
    });
    setIsAdding(false);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Query Templates</h2>
      <p className="text-gray-600 mb-6">
        Configure predefined query templates for common tasks. These templates can be used to standardize queries across your organization.
      </p>

      {/* Template List */}
      <div className="space-y-4 mb-6">
        {templates.map(template => (
          <div key={template.id} className="border border-gray-200 rounded-lg p-4 bg-white">
            {editingTemplate && editingTemplate.id === template.id ? (
              // Edit mode
              <div className="space-y-4">
                <div>
                  <label htmlFor={`edit-name-${template.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name
                  </label>
                  <input
                    id={`edit-name-${template.id}`}
                    type="text"
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor={`edit-desc-${template.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    id={`edit-desc-${template.id}`}
                    type="text"
                    value={editingTemplate.description}
                    onChange={(e) => setEditingTemplate({...editingTemplate, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor={`edit-template-${template.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Template Text
                  </label>
                  <textarea
                    id={`edit-template-${template.id}`}
                    value={editingTemplate.template}
                    onChange={(e) => setEditingTemplate({...editingTemplate, template: e.target.value})}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleUpdateTemplate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // View mode
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-800">{template.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-sm font-mono text-gray-700">{template.template}</p>
                </div>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Template
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add New Template */}
      {isAdding ? (
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <h3 className="font-medium text-gray-800 mb-3">Add New Template</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="new-name" className="block text-sm font-medium text-gray-700 mb-1">
                Template Name
              </label>
              <input
                id="new-name"
                type="text"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                placeholder="Enter template name"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="new-desc" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                id="new-desc"
                type="text"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                placeholder="Enter description"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="new-template" className="block text-sm font-medium text-gray-700 mb-1">
                Template Text
              </label>
              <textarea
                id="new-template"
                value={newTemplate.template}
                onChange={(e) => setNewTemplate({...newTemplate, template: e.target.value})}
                placeholder="Enter template with placeholders like {placeholder_name}"
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
              <p className="text-xs text-gray-500 mt-1">
                Use curly braces for placeholders, e.g., {"{placeholder_name}"}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleAddTemplate}
                disabled={!newTemplate.name || !newTemplate.template}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add Template
              </button>
              <button
                onClick={handleCancelAdd}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Template
        </button>
      )}
    </div>
  );
};

export default QueryTemplates;
