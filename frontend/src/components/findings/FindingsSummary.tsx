import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, CircleDot, Database, FileWarning, X } from 'lucide-react';
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
  onRetrievedContextClick?: () => void;
  hasRetrievedContext?: boolean;
}

export const FindingsSummary: React.FC<FindingsSummaryProps> = ({
  findings = {}, 
  onRetrievedContextClick,
  hasRetrievedContext = false
}) => {
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
          <table className="w-full divide-y divide-gray-200 border-collapse shadow-sm rounded-lg overflow-hidden">
            <thead className={`bg-orange-50/70 sticky top-0`}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-orange-600 uppercase tracking-wider w-24 border border-gray-200">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-orange-600 uppercase tracking-wider w-32 border border-gray-200">Site</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-orange-600 uppercase tracking-wider w-40 border border-gray-200">Event Term</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-orange-600 uppercase tracking-wider w-24 border border-gray-200">Grade</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-orange-600 uppercase tracking-wider w-32 border border-gray-200">Outcome</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-orange-600 uppercase tracking-wider w-32 border border-gray-200">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-orange-600 uppercase tracking-wider w-32 border border-gray-200">End Date</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-orange-600 uppercase tracking-wider w-32 border border-gray-200">Treatment Given</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-orange-600 uppercase tracking-wider w-24 border border-gray-200">Serious</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-orange-600 uppercase tracking-wider w-40 border border-gray-200">Action (Amivantamab)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {selectedContent.table.map((row: any, index) => (
                <tr key={index} className="hover:bg-orange-50/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{row.Subject}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{row.Site}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{row["What is the adverse event term?"]}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{row["Toxicity Grade"]}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{row.outcome}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{formatDate(row["start date"])}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{formatDate(row["end date"]) || 'Not Available'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{row["concomitant treatment given for AE"]}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{row["Serious AE"]}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{row["Action taken with Amivantamab"]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200 border-collapse shadow-sm rounded-lg overflow-hidden">
          <thead className={`bg-yellow-50/70 sticky top-0`}>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-yellow-600 uppercase tracking-wider w-24 border border-gray-200">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-yellow-600 uppercase tracking-wider w-32 border border-gray-200">Protocol</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-yellow-600 uppercase tracking-wider w-32 border border-gray-200">Site</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-yellow-600 uppercase tracking-wider w-32 border border-gray-200">Category</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-yellow-600 uppercase tracking-wider w-32 border border-gray-200">Severity</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-yellow-600 uppercase tracking-wider border border-gray-200">Deviation</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-yellow-600 uppercase tracking-wider border border-gray-200">Description</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-yellow-600 uppercase tracking-wider w-32 border border-gray-200">Days Outstanding</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {selectedContent.table.map((row: any, index) => (
              <tr key={index} className="hover:bg-yellow-50/30 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{row.Subject}</td>
                <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{row.Protocol_Name}</td>
                <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{row.Site_Name}</td>
                <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{row.Category}</td>
                <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{row.Severity}</td>
                <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">
                  <div className="max-w-xs overflow-hidden text-ellipsis">{row.Deviation}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">
                  <div className="max-w-md overflow-hidden text-ellipsis">{row.Description}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{row.Number_Days_Outstanding}</td>
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
            className={`flex items-center ${pdFindings > 0 ? 'cursor-pointer hover:opacity-80' : 'opacity-50 cursor-not-allowed'}`}
            onClick={pdFindings > 0 ? () => handleFindingsClick('pd') : undefined}
          >
            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mr-2">
              <AlertTriangle size={16} className="text-yellow-500" />
            </div>
            <div>
              <div className="font-medium text-gray-700">Protocol Deviations</div>
              <div className="text-gray-500">{pdFindings} findings</div>
            </div>
          </div>
          
          <div 
            className={`flex items-center ${aeFindings > 0 ? 'cursor-pointer hover:opacity-80' : 'opacity-50 cursor-not-allowed'}`}
            onClick={aeFindings > 0 ? () => handleFindingsClick('ae') : undefined}
          >
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mr-2">
              <AlertCircle size={16} className="text-orange-500" />
            </div>
            <div>
              <div className="font-medium text-gray-700">Adverse Events</div>
              <div className="text-gray-500">{aeFindings} findings</div>
            </div>
          </div>
          
          {onRetrievedContextClick && (
            <div 
              className={`flex items-center ${hasRetrievedContext ? 'cursor-pointer hover:opacity-80' : 'opacity-50 cursor-not-allowed'}`}
              onClick={hasRetrievedContext ? onRetrievedContextClick : undefined}
            >
              <Database className="w-4 h-4 mr-2 text-blue-500" />
              <span className="text-gray-600">Retrieved Context</span>
            </div>
          )}
        </div>
      </div>

      {dialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className={`rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col animate-slideIn ${
            selectedContent.type === 'pd' ? 'bg-yellow-50' : 'bg-orange-50'
          }`}>
            <div className={`flex justify-between items-center p-4 border-b ${
              selectedContent.type === 'pd' ? 'border-yellow-100 bg-yellow-100' : 'border-orange-100 bg-orange-100'
            }`}>
              <h2 className={`text-xl font-semibold ${
                selectedContent.type === 'pd' ? 'text-yellow-700' : 'text-orange-700'
              }`}>{dialogTitle}</h2>
              <button 
                onClick={() => setDialogOpen(false)}
                className={`p-2 rounded-full hover:bg-white focus:outline-none transition-colors ${
                  selectedContent.type === 'pd' ? 'text-yellow-500 hover:text-yellow-700' : 'text-orange-500 hover:text-orange-700'
                }`}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto">
              <div className="p-6">
                {selectedContent.conclusion && (
                  <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          h3: ({ children }) => <h3 className={`text-lg font-semibold mb-4 ${
                            selectedContent.type === 'pd' ? 'text-yellow-800' : 'text-orange-800'
                          }`}>{children}</h3>,
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
            
            <div className={`p-4 border-t ${
              selectedContent.type === 'pd' ? 'border-yellow-100 bg-yellow-100' : 'border-orange-100 bg-orange-100'
            } flex justify-end`}>
              <button
                onClick={() => setDialogOpen(false)}
                className={`px-4 py-2 rounded-md text-white shadow-sm ${
                  selectedContent.type === 'pd' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-orange-500 hover:bg-orange-600'
                } transition-colors`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};