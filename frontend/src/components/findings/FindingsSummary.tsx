import React from 'react';
import { AlertCircle, AlertTriangle, CircleDot } from 'lucide-react';

interface Finding {
  id: string;
  agent: string;
  content: string;
  timestamp: string;
}

interface FindingsSummaryProps {
  findings: Finding[];
}

export const FindingsSummary: React.FC<FindingsSummaryProps> = ({ findings }) => {
  // Count findings by agent type
  const pdAlerts = findings.filter(f => f.agent.toLowerCase().includes('pd')).length;
  const aeAlerts = findings.filter(f => f.agent.toLowerCase().includes('ae')).length;
  const sgrAlerts = findings.filter(f => f.agent.toLowerCase().includes('sgr')).length;

  return (
    <div className="flex flex-col space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Findings Summary</h2>
        <p className="text-sm text-gray-500">
          {findings.length} {findings.length === 1 ? 'finding' : 'findings'} identified
        </p>
      </div>

      <div className="flex items-center space-x-6 text-sm">
        <div className="flex items-center">
          <CircleDot className="w-4 h-4 mr-2 text-blue-500" />
          <span className="text-gray-600">PD Alerts:</span>
          <span className="ml-1.5 font-semibold">{pdAlerts}</span>
        </div>

        <div className="flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" />
          <span className="text-gray-600">AE/SAE Alerts:</span>
          <span className="ml-1.5 font-semibold">{aeAlerts}</span>
        </div>

        <div className="flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
          <span className="text-gray-600">SGR Alerts:</span>
          <span className="ml-1.5 font-semibold">{sgrAlerts}</span>
        </div>
      </div>
    </div>
  );
};
