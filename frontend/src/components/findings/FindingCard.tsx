import React from 'react';
import { format } from 'date-fns';
import { Finding } from '../../types';
import { FindingActions } from './FindingActions';

interface FindingCardProps {
  finding: Finding;
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding }) => {
  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Top Section with Status and Actions */}
      <div className="border-b bg-gray-50">
        <div className="flex items-center justify-between p-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityStyles(finding.severity)}`}>
            {finding.severity}
          </span>
          <FindingActions finding={finding} />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Subject ID and Category */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Subject ID: {finding.subjectId}
            </h3>
            <span className="text-xs text-gray-500">
              {finding.daysOutstanding} days outstanding
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600">
            Category: {finding.category}
          </p>
        </div>

        {/* Description */}
        <div>
          <p className="text-sm text-gray-600 line-clamp-2">{finding.comments}</p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
          <div className="space-y-1">
            <p>
              <span className="font-medium">Protocol:</span> {finding.protocolName}
            </p>
            <p>
              <span className="font-medium">PI:</span> {finding.principalInvestigator}
            </p>
          </div>
          <div className="space-y-1">
            <p>
              <span className="font-medium">Start Date:</span>{' '}
              {format(finding.startDate, 'PP')}
            </p>
            <p>
              <span className="font-medium">End Date:</span>{' '}
              {finding.endDate ? format(finding.endDate, 'PP') : 'Ongoing'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const getSeverityStyles = (severity: string) => {
  switch (severity) {
    case 'Critical':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Major':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }
};
