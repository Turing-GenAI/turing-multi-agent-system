import React from 'react';
import { FiCheck, FiX, FiExternalLink } from 'react-icons/fi';

interface ComplianceIssue {
  id: string;
  clinical_text: string;
  compliance_text: string;
  explanation: string;
  suggested_edit: string;
  confidence: 'high' | 'low';
  regulation: string;
  status?: 'accepted' | 'rejected' | 'pending';
}

interface ComplianceWarningCardProps {
  issue: ComplianceIssue;
  onAccept: () => void;
  onReject: () => void;
  onViewRegulation?: () => void;
}

export const ComplianceWarningCard: React.FC<ComplianceWarningCardProps> = ({
  issue,
  onAccept,
  onReject,
  onViewRegulation
}) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium flex items-center gap-2">
          {issue.confidence === 'high' ? (
            <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
              High Confidence
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
              Low Confidence
            </span>
          )}
          <span>Compliance Issue</span>
        </h4>
        <div className="flex gap-2">
          <button 
            className={`flex items-center gap-1 px-3 py-1 rounded border hover:bg-gray-50 ${
              issue.status === 'accepted' ? 'bg-green-50 border-green-300' : ''
            }`}
            onClick={onAccept}
          >
            <FiCheck className="w-4 h-4" />
            Accept
          </button>
          <button 
            className={`flex items-center gap-1 px-3 py-1 rounded border hover:bg-gray-50 ${
              issue.status === 'rejected' ? 'bg-red-50 border-red-300' : ''
            }`}
            onClick={onReject}
          >
            <FiX className="w-4 h-4" />
            Reject
          </button>
        </div>
      </div>
      
      <div className="space-y-4 mt-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Non-compliant text:</p>
          <p className="text-sm bg-gray-100 p-2 rounded">{issue.clinical_text}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Explanation:</p>
          <p className="text-sm bg-gray-100 p-2 rounded">{issue.explanation}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Suggested edit:</p>
          <p className="text-sm bg-green-50 p-2 rounded border-l-2 border-green-400">
            {issue.suggested_edit}
          </p>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-medium">Relevant regulation:</h5>
          {onViewRegulation && (
            <button 
              onClick={onViewRegulation}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View details</span>
              <FiExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
        <p className="text-sm mt-1">{issue.regulation}</p>
      </div>
    </div>
  );
};
