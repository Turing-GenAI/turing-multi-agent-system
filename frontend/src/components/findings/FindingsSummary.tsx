import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, CircleDot } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
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

interface FindingsSummaryProps {
  findings?: {
    findings?: FindingsData;
  };
}

export const FindingsSummary: React.FC<FindingsSummaryProps> = ({findings = {}}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [selectedContent, setSelectedContent] = useState<{conclusion?: string; table?: any[]; type?: 'pd' | 'ae'}>({});

  const findingsData = findings?.findings || {} as FindingsData;

  // Count findings
  const aeFindings = findingsData.discrepancy_data_activity_id_AE_SAE_001?.table?.length || 0;
  const pdFindings = findingsData.discrepancy_data_activity_id_PD_001?.table?.length || 0;

  const handleFindingsClick = (type: 'pd' | 'ae') => {
    if (type === 'ae') {
      setDialogTitle('Adverse Event Findings');
      setSelectedContent({
        conclusion: findingsData.discrepancy_data_activity_id_AE_SAE_001?.conclusion,
        table: findingsData.discrepancy_data_activity_id_AE_SAE_001?.table,
        type: 'ae'
      });
    } else {
      setDialogTitle('Protocol Deviation Findings');
      setSelectedContent({
        conclusion: findingsData.discrepancy_data_activity_id_PD_001?.conclusion,
        table: findingsData.discrepancy_data_activity_id_PD_001?.table,
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
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Site</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Event Term</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Grade</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Outcome</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">End Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Treatment Given</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Serious</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Action (Amivantamab)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {selectedContent.table.map((row: any, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-sm text-gray-900">{row.Subject}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{row.Site}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{row["What is the adverse event term?"]}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{row["Toxicity Grade"]}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{row.outcome}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{formatDate(row["start date"])}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{formatDate(row["end date"]) || 'Not Available'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{row["concomitant treatment given for AE"]}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{row["Serious AE"]}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{row["Action taken with Amivantamab"]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Protocol</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Site</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Severity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deviation</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Days Outstanding</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {selectedContent.table.map((row: any, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 text-sm text-gray-900">{row.Subject}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{row.Protocol_Name}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{row.Site_Name}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{row.Category}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{row.Severity}</td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  <div className="max-w-xs overflow-hidden text-ellipsis">{row.Deviation}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  <div className="max-w-md overflow-hidden text-ellipsis">{row.Description}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{row.Number_Days_Outstanding}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
        <DialogContent className="max-w-[95vw] max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-none border-b pb-4">
            <DialogTitle className="text-xl font-semibold">{dialogTitle}</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            <div className="p-6">
              {selectedContent.conclusion && (
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        h3: ({ children }) => <h3 className="text-lg font-semibold mb-4 text-gray-900">{children}</h3>,
                        p: ({ children }) => <p className="text-gray-700 leading-relaxed mb-4">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-4 space-y-2">{children}</ul>,
                        li: ({ children }) => <li className="text-gray-700">{children}</li>,
                      }}
                    >
                      {selectedContent.conclusion}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
              
              <div className="bg-white rounded-lg shadow">
                {renderTable()}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};