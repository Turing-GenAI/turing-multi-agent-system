import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, CircleDot } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import findingsData from '../../data/findings.json';
import ReactMarkdown from 'react-markdown';

interface AEFinding {
  SiteGroupName: string;
  Site: string;
  Subject: number;
  RecordPosition: number;
  "What is the adverse event term?": string;
  "Toxicity Grade": number;
  outcome: string;
  "Date of Report": number;
  "Date Investigator/ Investigational Staff became aware": number | null;
  "start date": number;
  "start time": number | null;
  "end date": number | null;
  "end time": number | null;
  "concomitant treatment given for AE": string;
  "Serious AE": string;
  "Age at onset of SAE": number | null;
  "death": string | null;
  "date of death": number | null;
  "admission date": number | null;
  "hospital discharge date": number | null;
  "Required Hospitalization": string | null;
  "is this an infection?": string;
  "infection treatment": string | null;
  "Action taken with Amivantamab": string;
  "Action taken with Lazertinib": string;
  "Action taken with Carboplatin": string;
  "Action taken with Pemetrexed": string;
  "Relationship to Amivantamab SC-CF": string;
  "Relationship to Lazertinib": string;
  "Relationship to Carboplatin": string;
  "Relationship to Pemetrexed": string;
  "AE of special interest as per protocol": string;
  page: string;
}

interface PDFinding {
  SiteGroupName: string;
  Site: string;
  Subject: number;
  RecordPosition: number;
  "Deviation Category": string;
  "Deviation Type": string;
  Description: string;
  "Start Date": number;
  "End Date": number;
  "Impact on Subject Safety": string;
  "Impact on Study Data": string;
  "Corrective Action": string;
  "Preventive Action": string;
}

interface FindingsData {
  discrepancy_data_activity_id_AE_SAE_001?: {
    conclusion: string;
    table: AEFinding[];
  };
  discrepancy_data_activity_id_PD_001?: {
    conclusion: string;
    table: PDFinding[];
  };
}

export const FindingsSummary: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [selectedContent, setSelectedContent] = useState<{conclusion?: string; table?: any[]; type?: 'pd' | 'ae'}>({});

  const findings = (findingsData as any).findings as FindingsData;

  // Count findings
  const aeFindings = findings.discrepancy_data_activity_id_AE_SAE_001?.table?.length || 0;
  const pdFindings = findings.discrepancy_data_activity_id_PD_001?.table?.length || 0;

  const handleFindingsClick = (type: 'pd' | 'ae') => {
    if (type === 'ae') {
      setDialogTitle('Adverse Event Findings');
      setSelectedContent({
        conclusion: findings.discrepancy_data_activity_id_AE_SAE_001?.conclusion,
        table: findings.discrepancy_data_activity_id_AE_SAE_001?.table,
        type: 'ae'
      });
    } else {
      setDialogTitle('Protocol Deviation Findings');
      setSelectedContent({
        conclusion: findings.discrepancy_data_activity_id_PD_001?.conclusion,
        table: findings.discrepancy_data_activity_id_PD_001?.table,
        type: 'pd'
      });
    }
    setDialogOpen(true);
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString();
  };

  const renderTable = () => {
    if (!selectedContent.table || selectedContent.table.length === 0) return null;

    if (selectedContent.type === 'ae') {
      return (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Term</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outcome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serious</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action (Amivantamab)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action (Lazertinib)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {selectedContent.table.map((row: AEFinding, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.Subject}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.Site}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row["What is the adverse event term?"]}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row["Toxicity Grade"]}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(row["start date"])}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(row["end date"])}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.outcome}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row["Serious AE"]}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row["Action taken with Amivantamab"]}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row["Action taken with Lazertinib"]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return (
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {selectedContent.table.map((row: PDFinding, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.Subject}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.Site}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row["Deviation Category"]}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row["Deviation Type"]}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.Description}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(row["Start Date"])}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(row["End Date"])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <>
      <div className="flex flex-col space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Findings Summary</h2>
          <p className="text-sm text-gray-500">
            {aeFindings + pdFindings} findings identified
          </p>
        </div>

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
            {selectedContent.conclusion && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <ReactMarkdown className="text-sm text-gray-600 prose">
                  {selectedContent.conclusion}
                </ReactMarkdown>
              </div>
            )}
            {selectedContent.table && selectedContent.table.length > 0 && (
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
