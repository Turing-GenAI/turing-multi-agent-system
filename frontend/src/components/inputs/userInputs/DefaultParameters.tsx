import React, { useState } from 'react';

interface Parameter {
  id: string;
  name: string;
  description: string;
  type: 'number' | 'text' | 'boolean' | 'select';
  value: string | number | boolean;
  options?: string[]; // For select type
  min?: number; // For number type
  max?: number; // For number type
}

const DefaultParameters: React.FC = () => {
  const [parameters, setParameters] = useState<Parameter[]>([
    {
      id: 'param1',
      name: 'Max Retrieval Attempts',
      description: 'Maximum number of times to retry retrieval operations',
      type: 'number',
      value: 3,
      min: 1,
      max: 10
    },
    {
      id: 'param2',
      name: 'Response Format',
      description: 'Default format for agent responses',
      type: 'select',
      value: 'markdown',
      options: ['plain', 'markdown', 'html']
    },
    {
      id: 'param3',
      name: 'Include Citations',
      description: 'Whether to include citations in responses by default',
      type: 'boolean',
      value: true
    },
    {
      id: 'param4',
      name: 'Default Prompt',
      description: 'Default prompt template to use when none is specified',
      type: 'text',
      value: 'Please provide information about {topic} with emphasis on {aspect}.'
    }
  ]);

  const [editingParameter, setEditingParameter] = useState<string | null>(null);

  const handleToggleEdit = (id: string) => {
    setEditingParameter(editingParameter === id ? null : id);
  };

  const handleParameterChange = (id: string, value: string | number | boolean) => {
    setParameters(parameters.map(param => 
      param.id === id ? { ...param, value } : param
    ));
  };

  const handleResetToDefaults = () => {
    // In a real application, this would reset to system defaults
    // For now, we'll just show an alert
    alert('Parameters have been reset to system defaults');
  };

  const renderParameterInput = (parameter: Parameter) => {
    const isEditing = editingParameter === parameter.id;

    switch (parameter.type) {
      case 'number':
        return (
          <div className="flex items-center">
            {isEditing ? (
              <input
                type="number"
                min={parameter.min}
                max={parameter.max}
                value={parameter.value as number}
                onChange={(e) => handleParameterChange(parameter.id, parseInt(e.target.value))}
                className="w-24 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <span className="font-mono">{parameter.value}</span>
            )}
          </div>
        );
      
      case 'text':
        return (
          <div>
            {isEditing ? (
              <textarea
                value={parameter.value as string}
                onChange={(e) => handleParameterChange(parameter.id, e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            ) : (
              <div className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200">
                {parameter.value as string}
              </div>
            )}
          </div>
        );
      
      case 'boolean':
        return (
          <div className="flex items-center">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={parameter.value as boolean}
                onChange={(e) => handleParameterChange(parameter.id, e.target.checked)}
                className="sr-only peer"
                disabled={!isEditing}
              />
              <div className={`relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer ${(parameter.value as boolean) ? 'peer-checked:bg-blue-600' : ''} peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
              <span className="ml-3 text-sm font-medium text-gray-900">
                {(parameter.value as boolean) ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>
        );
      
      case 'select':
        return (
          <div>
            {isEditing ? (
              <select
                value={parameter.value as string}
                onChange={(e) => handleParameterChange(parameter.id, e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {parameter.options?.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-mono">{parameter.value as string}</span>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Default Parameters</h2>
      <p className="text-gray-600 mb-6">
        Configure default parameters for system operations. These parameters control how the system behaves when processing requests.
      </p>

      <div className="space-y-6">
        {/* Parameter List */}
        <div className="border rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parameter
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {parameters.map((parameter) => (
                <tr key={parameter.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{parameter.name}</div>
                    <div className="text-xs text-gray-500">{parameter.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    {renderParameterInput(parameter)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleToggleEdit(parameter.id)}
                      className={`text-${editingParameter === parameter.id ? 'green' : 'blue'}-600 hover:text-${editingParameter === parameter.id ? 'green' : 'blue'}-900`}
                    >
                      {editingParameter === parameter.id ? 'Save' : 'Edit'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Reset Button */}
        <div className="flex justify-end">
          <button
            onClick={handleResetToDefaults}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Reset to Defaults
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1 md:flex md:justify-between">
              <p className="text-sm text-blue-700">
                These parameters affect all agent operations. Changes will apply to new operations only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefaultParameters;
