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
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200 bg-blue-50">
        <h2 className="text-xl font-semibold text-blue-800 mb-2">Query Templates</h2>
        <p className="text-gray-600">
          Configure predefined query templates for common tasks. These templates can be used to standardize queries across your organization.
        </p>
      </div>

      {/* Template List */}
      <div className="p-6">
        <div className="space-y-4 mb-6">
          {templates.map(template => (
            <div key={template.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
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
                      onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                      onChange={e => setEditingTemplate({...editingTemplate, description: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor={`edit-template-${template.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Template Text
                    </label>
                    <textarea
                      id={`edit-template-${template.id}`}
                      value={editingTemplate.template}
                      onChange={e => setEditingTemplate({...editingTemplate, template: e.target.value})}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use {'{parameter_name}'} for variables that will be replaced when using the template.
                    </p>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateTemplate}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-blue-700">{template.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50"
                        title="Edit Template"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50"
                        title="Delete Template"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">{template.template}</pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add New Template */}
        {isAdding ? (
          <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
            <h3 className="text-lg font-medium text-blue-800 mb-3">Add New Template</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="new-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name
                </label>
                <input
                  id="new-name"
                  type="text"
                  value={newTemplate.name}
                  onChange={e => setNewTemplate({...newTemplate, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Adverse Event Analysis"
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
                  onChange={e => setNewTemplate({...newTemplate, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Analyze adverse events from a clinical trial"
                />
              </div>
              <div>
                <label htmlFor="new-template" className="block text-sm font-medium text-gray-700 mb-1">
                  Template Text
                </label>
                <textarea
                  id="new-template"
                  value={newTemplate.template}
                  onChange={e => setNewTemplate({...newTemplate, template: e.target.value})}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Analyze adverse events in trial {trial_id} for drug {drug_name}"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {'{parameter_name}'} for variables that will be replaced when using the template.
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleCancelAdd}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTemplate}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  disabled={!newTemplate.name || !newTemplate.template}
                >
                  Add Template
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors border border-blue-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Template
          </button>
        )}
      </div>
    </div>
  );
};

export default QueryTemplates;
