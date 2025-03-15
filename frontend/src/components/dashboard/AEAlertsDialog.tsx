import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface AEAlertsDialogProps {
  trialId: string;
  onClose: () => void;
}

interface AEAlert {
  subject: string;
  site: string;
  eventTerm: string;
  grade: number;
  outcome: string;
  startDate: string;
  endDate: string | null;
  treatmentGiven: string;
  serious: string;
  action: string;
}

export const AEAlertsDialog: React.FC<AEAlertsDialogProps> = ({ trialId, onClose }) => {
  // Mock data for adverse event alerts
  const mockAEAlerts: AEAlert[] = [
    {
      subject: 'SUB-012',
      site: 'Site 123',
      eventTerm: 'Neutropenia',
      grade: 3,
      outcome: 'Resolved',
      startDate: '2025-01-15',
      endDate: '2025-01-30',
      treatmentGiven: 'G-CSF',
      serious: 'Yes',
      action: 'Dose Reduction'
    },
    {
      subject: 'SUB-027',
      site: 'Site 123',
      eventTerm: 'Fatigue',
      grade: 2,
      outcome: 'Ongoing',
      startDate: '2025-02-03',
      endDate: null,
      treatmentGiven: 'Supportive Care',
      serious: 'No',
      action: 'Dose Interruption'
    },
    {
      subject: 'SUB-045',
      site: 'Site 456',
      eventTerm: 'Hypertension',
      grade: 2,
      outcome: 'Resolved',
      startDate: '2025-01-20',
      endDate: '2025-02-10',
      treatmentGiven: 'Antihypertensive',
      serious: 'No',
      action: 'No Action'
    },
    {
      subject: 'SUB-056',
      site: 'Site 456',
      eventTerm: 'Pneumonitis',
      grade: 3,
      outcome: 'Improving',
      startDate: '2025-02-12',
      endDate: null,
      treatmentGiven: 'Steroids',
      serious: 'Yes',
      action: 'Study Drug Discontinuation'
    },
    {
      subject: 'SUB-078',
      site: 'Site 789',
      eventTerm: 'Elevated ALT',
      grade: 2,
      outcome: 'Resolved',
      startDate: '2025-01-05',
      endDate: '2025-01-18',
      treatmentGiven: 'None',
      serious: 'No',
      action: 'Dose Interruption'
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
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mr-3">
              <AlertCircle size={16} className="text-orange-500" />
            </div>
            <h2 className="text-xl font-semibold text-orange-600">Adverse Event Alerts for Trial {trialId}</h2>
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
                <h3 className="text-lg font-semibold mb-4 text-orange-800">Summary of Findings</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Analysis of trial {trialId} has identified {mockAEAlerts.length} adverse events that require attention. 
                  These events include cases of neutropenia, fatigue, hypertension, pneumonitis, and elevated liver enzymes.
                  Some of these events were serious and required study drug interruption or discontinuation.
                </p>
                <ul className="list-disc pl-4 mb-4 space-y-2">
                  <li className="text-gray-700">
                    <strong>Grade 3-4 events:</strong> {mockAEAlerts.filter(a => a.grade >= 3).length} serious events requiring close monitoring
                  </li>
                  <li className="text-gray-700">
                    <strong>Ongoing events:</strong> {mockAEAlerts.filter(a => a.endDate === null).length} events still requiring management
                  </li>
                  <li className="text-gray-700">
                    <strong>Dose modifications:</strong> {mockAEAlerts.filter(a => a.action !== 'No Action').length} events requiring dose modification
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
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-32 border border-gray-200">Site</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-40 border border-gray-200">Event Term</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-24 border border-gray-200">Grade</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-32 border border-gray-200">Outcome</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-32 border border-gray-200">Start Date</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-32 border border-gray-200">End Date</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-32 border border-gray-200">Treatment Given</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-24 border border-gray-200">Serious</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-32 border border-gray-200">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mockAEAlerts.map((alert, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{alert.subject}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{alert.site}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{alert.eventTerm}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600`}>
                            Grade {alert.grade}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{alert.outcome}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{alert.startDate}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{alert.endDate || 'Ongoing'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{alert.treatmentGiven}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600`}>
                            {alert.serious}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600`}>
                            {alert.action}
                          </span>
                        </td>
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
