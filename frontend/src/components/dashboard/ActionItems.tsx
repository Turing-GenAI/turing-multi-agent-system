import React from 'react';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed';
}

interface ActionItemsProps {
  actions: ActionItem[];
}

export const ActionItems: React.FC<ActionItemsProps> = ({ actions }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4">Action Items</h2>
      <div className="space-y-4">
        {actions.map((action) => (
          <div
            key={action.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">{action.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{action.description}</p>
                <div className="mt-2 flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full capitalize ${getPriorityColor(
                      action.priority
                    )}`}
                  >
                    {action.priority}
                  </span>
                  <span className="text-xs text-gray-500">
                    Due: {action.dueDate.toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="ml-4">{getStatusIcon(action.status)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
