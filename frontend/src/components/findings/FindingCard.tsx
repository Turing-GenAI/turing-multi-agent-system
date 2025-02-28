import React from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Finding {
  id: string;
  agent: string;
  content: string;
  timestamp: string;
}

interface FindingCardProps {
  finding: Finding;
  isExpanded: boolean;
  onToggle: () => void;
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding, isExpanded, onToggle }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-4">
          <button className="text-gray-500">
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>
          <div>
            <div className="text-sm font-medium text-gray-900">
              Finding #{finding.id}
            </div>
            <div className="text-sm text-gray-500">
              {finding.agent} • {format(new Date(finding.timestamp), 'MMM d, yyyy HH:mm')}
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2">
          <div className="text-sm text-gray-700 whitespace-pre-wrap">
            {finding.content}
          </div>
        </div>
      )}
    </div>
  );
};
