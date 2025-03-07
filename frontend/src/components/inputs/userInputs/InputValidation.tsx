import React, { useState } from 'react';

interface ValidationRule {
  id: string;
  fieldName: string;
  ruleType: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value: string | number;
  errorMessage: string;
  enabled: boolean;
}

const InputValidation: React.FC = () => {
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([
    {
      id: 'rule1',
      fieldName: 'Question',
      ruleType: 'required',
      value: 'true',
      errorMessage: 'Question is required',
      enabled: true
    },
    {
      id: 'rule2',
      fieldName: 'Question',
      ruleType: 'minLength',
      value: 10,
      errorMessage: 'Question must be at least 10 characters',
      enabled: true
    },
    {
      id: 'rule3',
      fieldName: 'Site',
      ruleType: 'required',
      value: 'true',
      errorMessage: 'Site selection is required',
      enabled: true
    },
    {
      id: 'rule4',
      fieldName: 'Email',
      ruleType: 'pattern',
      value: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
      errorMessage: 'Please enter a valid email address',
      enabled: false
    }
  ]);

  const [newRule, setNewRule] = useState<Omit<ValidationRule, 'id'>>({
    fieldName: '',
    ruleType: 'required',
    value: '',
    errorMessage: '',
    enabled: true
  });

  const [isAddingRule, setIsAddingRule] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  const handleToggleRule = (id: string) => {
    setValidationRules(validationRules.map(rule => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const handleDeleteRule = (id: string) => {
    setValidationRules(validationRules.filter(rule => rule.id !== id));
  };

  const handleEditRule = (id: string) => {
    const ruleToEdit = validationRules.find(rule => rule.id === id);
    if (ruleToEdit) {
      setEditingRuleId(id);
      setNewRule({
        fieldName: ruleToEdit.fieldName,
        ruleType: ruleToEdit.ruleType,
        value: ruleToEdit.value,
        errorMessage: ruleToEdit.errorMessage,
        enabled: ruleToEdit.enabled
      });
      setIsAddingRule(true);
    }
  };

  const handleAddRule = () => {
    if (newRule.fieldName && newRule.errorMessage) {
      if (editingRuleId) {
        // Update existing rule
        setValidationRules(validationRules.map(rule => 
          rule.id === editingRuleId 
            ? { ...rule, ...newRule }
            : rule
        ));
        setEditingRuleId(null);
      } else {
        // Add new rule
        const rule: ValidationRule = {
          id: `rule-${Date.now()}`,
          ...newRule
        };
        setValidationRules([...validationRules, rule]);
      }
      
      // Reset form
      setNewRule({
        fieldName: '',
        ruleType: 'required',
        value: '',
        errorMessage: '',
        enabled: true
      });
      setIsAddingRule(false);
    }
  };

  const handleCancelAddRule = () => {
    setNewRule({
      fieldName: '',
      ruleType: 'required',
      value: '',
      errorMessage: '',
      enabled: true
    });
    setIsAddingRule(false);
    setEditingRuleId(null);
  };

  const getRuleTypeLabel = (ruleType: string): string => {
    switch (ruleType) {
      case 'required': return 'Required';
      case 'minLength': return 'Min Length';
      case 'maxLength': return 'Max Length';
      case 'pattern': return 'Pattern Match';
      case 'custom': return 'Custom Validation';
      default: return ruleType;
    }
  };

  const renderValueInput = () => {
    switch (newRule.ruleType) {
      case 'required':
        return (
          <select
            value={newRule.value.toString()}
            onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );
      
      case 'minLength':
      case 'maxLength':
        return (
          <input
            type="number"
            min="1"
            value={newRule.value.toString()}
            onChange={(e) => setNewRule({ ...newRule, value: parseInt(e.target.value) })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      
      case 'pattern':
      case 'custom':
        return (
          <input
            type="text"
            value={newRule.value.toString()}
            onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={newRule.ruleType === 'pattern' ? 'Regular expression pattern' : 'Custom validation code'}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Input Validation</h2>
      <p className="text-gray-600 mb-6">
        Configure validation rules for user inputs to ensure data quality and prevent errors.
      </p>

      {/* Validation Rules Table */}
      <div className="mb-6">
        <div className="border rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Field
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rule Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Error Message
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {validationRules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No validation rules defined. Add a rule to get started.
                  </td>
                </tr>
              ) : (
                validationRules.map((rule) => (
                  <tr key={rule.id} className={!rule.enabled ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {rule.fieldName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getRuleTypeLabel(rule.ruleType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rule.value.toString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rule.errorMessage}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {rule.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className={`text-${rule.enabled ? 'yellow' : 'green'}-600 hover:text-${rule.enabled ? 'yellow' : 'green'}-900 mr-3`}
                      >
                        {rule.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleEditRule(rule.id)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Rule Form */}
      {isAddingRule ? (
        <div className="border border-gray-200 rounded-lg p-4 bg-white mb-6">
          <h3 className="font-medium text-gray-800 mb-3">
            {editingRuleId ? 'Edit Validation Rule' : 'Add New Validation Rule'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="field-name" className="block text-sm font-medium text-gray-700 mb-1">
                Field Name
              </label>
              <input
                id="field-name"
                type="text"
                value={newRule.fieldName}
                onChange={(e) => setNewRule({ ...newRule, fieldName: e.target.value })}
                placeholder="e.g., Question, Email, Site"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="rule-type" className="block text-sm font-medium text-gray-700 mb-1">
                Rule Type
              </label>
              <select
                id="rule-type"
                value={newRule.ruleType}
                onChange={(e) => setNewRule({ ...newRule, ruleType: e.target.value as any })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="required">Required</option>
                <option value="minLength">Minimum Length</option>
                <option value="maxLength">Maximum Length</option>
                <option value="pattern">Pattern Match</option>
                <option value="custom">Custom Validation</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="rule-value" className="block text-sm font-medium text-gray-700 mb-1">
              Rule Value
            </label>
            {renderValueInput()}
            {newRule.ruleType === 'pattern' && (
              <p className="text-xs text-gray-500 mt-1">
                Enter a regular expression pattern, e.g., ^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$ for email validation
              </p>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="error-message" className="block text-sm font-medium text-gray-700 mb-1">
              Error Message
            </label>
            <input
              id="error-message"
              type="text"
              value={newRule.errorMessage}
              onChange={(e) => setNewRule({ ...newRule, errorMessage: e.target.value })}
              placeholder="Message to display when validation fails"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={newRule.enabled}
                onChange={(e) => setNewRule({ ...newRule, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-900">Enable this rule</span>
            </label>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleAddRule}
              disabled={!newRule.fieldName || !newRule.errorMessage}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {editingRuleId ? 'Update Rule' : 'Add Rule'}
            </button>
            <button
              onClick={handleCancelAddRule}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingRule(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center mb-6"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Validation Rule
        </button>
      )}

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
              Validation rules help ensure data quality by validating user inputs before they are processed. Rules are applied in the order they appear in the table.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputValidation;
