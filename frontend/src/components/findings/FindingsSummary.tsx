import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, CircleDot } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import ReactMarkdown from 'react-markdown';

interface Finding {
  id: string;
  agent: string;
  content: string;
  timestamp: string;
}

interface FindingsSummaryProps {
  findings: {
    pd: Finding[];
    ae: Finding[];
    sgr: Finding[];
  };
}

export const FindingsSummary: React.FC<FindingsSummaryProps> = ({ findings }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [selectedContent, setSelectedContent] = useState<{findings?: Finding[]; type?: 'pd' | 'ae'}>({});

  // Count findings
  const aeFindings = findings.ae.length;
  const pdFindings = findings.pd.length;

  const handleFindingsClick = (type: 'pd' | 'ae') => {
    if (type === 'ae') {
      setDialogTitle('Adverse Event Findings');
      setSelectedContent({
        findings: findings.ae,
        type: 'ae'
      });
    } else {
      setDialogTitle('Protocol Deviation Findings');
      setSelectedContent({
        findings: findings.pd,
        type: 'pd'
      });
    }
    setDialogOpen(true);
  };

  const renderTable = () => {
    if (!selectedContent.findings || selectedContent.findings.length === 0) return null;

    return (
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {selectedContent.findings.map((row: Finding, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.agent}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{row.content}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <>
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-6 text-sm">
          <div 
            className="flex items-center cursor-pointer hover:opacity-80"
            onClick={() => handleFindingsClick('pd')}
          >
            <CircleDot className="w-4 h-4 mr-2 text-blue-500" />
            <span className="text-gray-600">Protocol Deviation Alerts:</span>
            <span className="ml-1.5 font-semibold">{pdFindings}</span>
          </div>

          <div 
            className="flex items-center cursor-pointer hover:opacity-80"
            onClick={() => handleFindingsClick('ae')}
          >
            <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" />
            <span className="text-gray-600">Adverse Event Alerts:</span>
            <span className="ml-1.5 font-semibold">{aeFindings}</span>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[90vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {selectedContent.findings && selectedContent.findings.length > 0 && (
              <div className="overflow-x-auto">
                {renderTable()}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
