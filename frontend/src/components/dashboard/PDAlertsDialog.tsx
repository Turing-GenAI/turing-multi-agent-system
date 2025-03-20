import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface D1AlertsDialogProps {
  trialId: string;
  onClose: () => void;
}

interface D1Alert {
  subject: string;
  protocol: string;
  site: string;
  category: string;
  severity: string;
  deviation: string;
  description: string;
  daysOutstanding: number;
}

export const D1AlertsDialog: React.FC<D1AlertsDialogProps> = ({ trialId, onClose }) => {
  // Mock data for Domain 1 alerts
  const mockD1Alerts: D1Alert[] = [
    {
      subject: 'SUB-001',
      protocol: 'PROTO-43',
      site: 'Site 123',
      category: 'Inclusion/Exclusion',
      severity: 'Major',
      deviation: 'Subject did not meet eligibility criteria',
      description: 'The subject did not meet the required inclusion criteria regarding prior treatment history but was enrolled in the trial.',
      daysOutstanding: 14
    },
    {
      subject: 'SUB-045',
      protocol: 'PROTO-43',
      site: 'Site 123',
      category: 'Informed Consent',
      severity: 'Critical',
      deviation: 'Missing informed consent',
      description: 'Informed consent form was not properly completed before the subject began treatment.',
      daysOutstanding: 23
    },
    {
      subject: 'SUB-032',
      protocol: 'PROTO-43',
      site: 'Site 123',
      category: 'Study Procedures',
      severity: 'Minor',
      deviation: 'Visit window deviation',
      description: 'Subject visit occurred outside of the protocol-specified window by 3 days.',
      daysOutstanding: 8
    },
    {
      subject: 'SUB-078',
      protocol: 'PROTO-43',
      site: 'Site 456',
      category: 'Medication',
      severity: 'Major',
      deviation: 'Incorrect dosing',
      description: 'Subject received incorrect medication dose due to pharmacy error.',
      daysOutstanding: 17
    },
    {
      subject: 'SUB-102',
      protocol: 'PROTO-43',
      site: 'Site 456',
      category: 'Regulatory',
      severity: 'Major',
      deviation: 'Missing regulatory documents',
      description: 'Site initiated study procedures without all regulatory approvals in place.',
      daysOutstanding: 30
    }
  ];

  return (
    <div 
      className="fixed inset-0 bg-gray-50 bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col animate-slideIn overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
      >
        <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
              <AlertTriangle size={16} className="text-yellow-500" />
            </div>
            <h2 className="text-xl font-semibold text-yellow-600">Domain 1 Alerts for Trial {trialId}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 focus:outline-none transition-colors text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
              <div className="prose prose-sm max-w-none">
                <h3 className="text-lg font-semibold mb-4 text-yellow-800">Summary of Findings</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Analysis of trial {trialId} has identified {mockD1Alerts.length} Domain 1 alerts that require attention. 
                  These alerts span across multiple categories including informed consent, eligibility criteria, 
                  and medication administration. Specific actions are recommended to address each alert and 
                  prevent similar occurrences in the future.
                </p>
                <ul className="list-disc pl-4 mb-4 space-y-2">
                  <li className="text-gray-700">
                    <strong>Critical alerts:</strong> {mockD1Alerts.filter(a => a.severity === 'Critical').length} issues requiring immediate action
                  </li>
                  <li className="text-gray-700">
                    <strong>Major alerts:</strong> {mockD1Alerts.filter(a => a.severity === 'Major').length} issues requiring prompt attention
                  </li>
                  <li className="text-gray-700">
                    <strong>Minor alerts:</strong> {mockD1Alerts.filter(a => a.severity === 'Minor').length} issues to be addressed according to standard procedures
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow">
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200 border-collapse shadow-sm rounded-lg overflow-hidden">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-24 border border-gray-200">Subject</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-32 border border-gray-200">Protocol</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-32 border border-gray-200">Site</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-32 border border-gray-200">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border border-gray-200">Severity</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border border-gray-200">Alert</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border border-gray-200">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-32 border border-gray-200">Days Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mockD1Alerts.map((alert, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{alert.subject}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{alert.protocol}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{alert.site}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{alert.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600`}>
                            {alert.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">
                          <div className="max-w-xs overflow-hidden text-ellipsis">{alert.deviation}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">
                          <div className="max-w-xs overflow-hidden text-ellipsis">{alert.description}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{alert.daysOutstanding}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-white shadow-sm bg-gray-500 hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
