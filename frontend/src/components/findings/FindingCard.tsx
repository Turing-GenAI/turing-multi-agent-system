import React from 'react';
import { format } from 'date-fns';

interface Finding {
  id: string;
  agent: string;
  content: string;
  timestamp: string;
}

interface FindingCardProps {
  finding: Finding;
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding }) => {
  // Split content by newlines and filter out empty lines
  const contentLines = finding.content.split('\n').filter(line => line.trim().length > 0);
  
  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Top Section with Agent and Timestamp */}
      <div className="border-b bg-gray-50">
        <div className="flex items-center justify-between p-3">
          <span className="px-2 py-1 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200">
            {finding.agent}
          </span>
          <span className="text-xs text-gray-500">
            {format(new Date(finding.timestamp), 'PP p')}
          </span>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="p-4 whitespace-pre-line">
        {contentLines.map((line, index) => (
          <p key={index} className="text-sm text-gray-600 mb-2 last:mb-0">
            {line.trim()}
          </p>
        ))}
      </div>
    </div>
  );
};
