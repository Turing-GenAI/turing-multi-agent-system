import React from 'react';
import { X } from 'lucide-react';

interface Alert {
  trialId: string;
  status: 'In Progress' | 'Completed' | 'On Hold';
  region: string;
  country: string;
  pdAlerts: number;
  aeAlerts: number;
  cssAlerts: number;
  sgrAlerts: number;
}

interface AlertsCardProps {
  alerts: Alert[];
  onClose: () => void;
}

export const AlertsCard: React.FC<AlertsCardProps> = ({ alerts, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white rounded-lg shadow-xl w-[1200px] max-h-[80vh] overflow-hidden flex flex-col animate-slideIn">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Trial Audit Alerts</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trial ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PD Alerts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AE Alerts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CSS Alerts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SGR Alerts</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {alerts.map((alert) => (
                <tr key={alert.trialId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{alert.trialId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      alert.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      alert.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {alert.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.region}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.country}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.pdAlerts}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.aeAlerts}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.cssAlerts}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.sgrAlerts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
