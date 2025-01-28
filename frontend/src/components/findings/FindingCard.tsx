import React, { useState } from 'react';
import { format } from 'date-fns';
import { getAgentDisplayName } from '../../data/agentNames';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface Finding {
  id: string;
  agent: string;
  timestamp: string;
  content: string;
}

interface FindingCardProps {
  finding: Finding;
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentLines = finding.content.split('\n').filter(line => line.trim().length > 0);

  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Top Section with Agent and Timestamp */}
      <div className="border-b bg-gray-50">
        <div className="flex items-center justify-between p-3">
          <span className="px-2 py-1 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200">
            {getAgentDisplayName(finding.agent)}
          </span>
          <span className="text-xs text-gray-500">
            {format(new Date(finding.timestamp), 'PP p')}
          </span>
        </div>
      </div>
      
      {/* Main Content */}
      <div className={`relative ${!isExpanded ? 'max-h-48' : ''} overflow-hidden`}>
        <div className="p-4 whitespace-pre-line">
          {contentLines.slice(1).map((line, index) => (
            <p key={index} className="text-sm text-gray-600 mb-2 last:mb-0">
              {line.trim().endsWith(':') && line.trim().length < 50 ? (
                <span className="font-semibold text-base">{line.trim()}</span>
              ) : line.trim().includes(':') ? (
                <>
                  <span className="font-semibold">{line.trim().split(':')[0]}:</span>
                  {line.trim().split(':').slice(1).join(':')}
                </>
              ) : (
                line.trim()
              )}
            </p>
          ))}
        </div>
        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>

      {/* Expand/Collapse Button */}
      <div className="p-2 flex justify-center border-t">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          {isExpanded ? (
            <>
              <ChevronUpIcon className="h-4 w-4 mr-1" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDownIcon className="h-4 w-4 mr-1" />
              Show More
            </>
          )}
        </button>
      </div>
    </div>
  );
};
