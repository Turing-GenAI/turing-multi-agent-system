import React from 'react';
import { AlertCircle, AlertTriangle, CircleDot } from 'lucide-react';
import { Finding } from '../../types';

interface FindingsSummaryProps {
  findings: Finding[];
}

export const FindingsSummary: React.FC<FindingsSummaryProps> = ({ findings }) => {
  const totalDeviations = findings.filter(f => f.category === 'Protocol Deviation').length;
  const openDeviations = findings.filter(f => 
    f.category === 'Protocol Deviation' && 
    f.status === 'Open'
  ).length;
  const highSeverityDeviations = findings.filter(f => 
    f.category === 'Protocol Deviation' && 
    (f.severity === 'Critical' || f.severity === 'Major')
  ).length;

  return (
    <div className="flex items-center space-x-6 text-sm">
      <div className="flex items-center">
        <CircleDot className="w-4 h-4 mr-2 text-blue-500" />
        <span className="text-gray-600">Total Deviations:</span>
        <span className="ml-1.5 font-semibold">{totalDeviations}</span>
      </div>

      <div className="flex items-center">
        <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" />
        <span className="text-gray-600">Open:</span>
        <span className="ml-1.5 font-semibold">{openDeviations}</span>
      </div>

      <div className="flex items-center">
        <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
        <span className="text-gray-600">High Severity:</span>
        <span className="ml-1.5 font-semibold">{highSeverityDeviations}</span>
      </div>
    </div>
  );
};
