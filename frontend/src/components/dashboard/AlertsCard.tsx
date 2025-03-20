import React, { useState } from 'react';
import { X, AlertCircle, RefreshCw } from 'lucide-react';
import { D1AlertsDialog } from './PDAlertsDialog';
import { D2AlertsDialog } from './AEAlertsDialog';

// Function to convert a trial ID to a numeric index for maintaining the ordering logic
const getTrialIndex = (trialId: string): number => {
  // Extract the last 3 digits if possible, or return a random large number
  const match = trialId.match(/(\d{3})$/);
  if (match) {
    return parseInt(match[1], 10);
  }
  // Fallback for incompatible formats
  return Math.floor(Math.random() * 1000);
};

interface Alert {
  trialId: string;
  status: 'In Progress' | 'Audited';
  region: string;
  country: string;
  pdAlerts: number;
  aeAlerts: number;
}

interface AlertsCardProps {
  alerts: Alert[];
  onClose: () => void;
  onRefresh?: () => Alert[]; // Optional refresh function to generate new alerts
}

export const AlertsCard: React.FC<AlertsCardProps> = ({ alerts: initialAlerts, onClose, onRefresh }) => {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [selectedTrialForPD, setSelectedTrialForPD] = useState<string | null>(null);
  const [selectedTrialForAE, setSelectedTrialForAE] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Sort alerts so "In Progress" trials appear at the top
  const sortedAlerts = [...alerts].sort((a, b) => {
    if (a.status === 'In Progress' && b.status !== 'In Progress') return -1;
    if (a.status !== 'In Progress' && b.status === 'In Progress') return 1;
    
    // Then sort by trial number using the last 3 digits of the trial ID
    const aNum = getTrialIndex(a.trialId);
    const bNum = getTrialIndex(b.trialId);
    return aNum - bNum;
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedAlerts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedAlerts.slice(indexOfFirstItem, indexOfLastItem);

  const handlePDAlertClick = (trialId: string) => {
    setSelectedTrialForPD(trialId);
  };

  const closePDDialog = () => {
    setSelectedTrialForPD(null);
  };

  const handleAEAlertClick = (trialId: string) => {
    setSelectedTrialForAE(trialId);
  };

  const closeAEDialog = () => {
    setSelectedTrialForAE(null);
  };

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-[1200px] max-h-[80vh] overflow-hidden flex flex-col animate-slideIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
            Trial Audit Alerts 
            <div className="flex ml-3">
              <span className="mr-2 px-2 py-0.5 text-sm font-medium bg-blue-100 text-blue-800 rounded-full flex items-center">
                <span className="mr-1">{alerts.filter(a => a.status === 'In Progress').length}</span>
                <span className="text-xs">In Progress</span>
              </span>
              <span className="px-2 py-0.5 text-sm font-medium bg-green-100 text-green-800 rounded-full flex items-center">
                <span className="mr-1">{alerts.filter(a => a.status === 'Audited').length}</span>
                <span className="text-xs">Audited</span>
              </span>
            </div>
          </h2>
          <div className="flex items-center">
            {onRefresh && (
              <button 
                onClick={() => {
                  setIsRefreshing(true);
                  const newAlerts = onRefresh();
                  setAlerts(newAlerts);
                  setCurrentPage(1); // Reset to first page after refresh
                  setTimeout(() => setIsRefreshing(false), 500); // Visual feedback
                }}
                className="text-yellow-600 hover:text-yellow-800 mr-4"
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trial ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status 
                  <div className="inline-block ml-2">
                    <span className="mr-1 px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-800 rounded-full inline-block">
                      {sortedAlerts.filter(a => a.status === 'In Progress').length}
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-800 rounded-full inline-block">
                      {sortedAlerts.filter(a => a.status === 'Audited').length}
                    </span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">D1 Alerts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">D2 Alerts</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((alert) => (
                <tr 
                  key={alert.trialId} 
                  className={`hover:bg-gray-50 ${alert.status === 'In Progress' ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{alert.trialId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      alert.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {alert.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.region}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.country}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {alert.status === 'Audited' && alert.pdAlerts > 0 ? (
                      <button 
                        onClick={() => handlePDAlertClick(alert.trialId)}
                        className="text-yellow-600 font-medium hover:text-yellow-800 hover:underline focus:outline-none"
                      >
                        {alert.pdAlerts}
                      </button>
                    ) : (
                      alert.pdAlerts
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {alert.status === 'Audited' && alert.aeAlerts > 0 ? (
                      <button 
                        onClick={() => handleAEAlertClick(alert.trialId)}
                        className="text-orange-600 font-medium hover:text-orange-800 hover:underline focus:outline-none"
                      >
                        {alert.aeAlerts}
                      </button>
                    ) : (
                      alert.aeAlerts
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, sortedAlerts.length)}</span> of <span className="font-medium">{sortedAlerts.length}</span> results
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <select
                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="15">15 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
              <div className="flex space-x-1">
                <button 
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 border rounded text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Calculate page numbers to show (centered around current page)
                  const pageOffset = Math.max(0, Math.min(totalPages - 5, currentPage - 3));
                  const pageNum = i + 1 + pageOffset;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      className={`w-8 h-8 text-sm ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      } rounded`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button 
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 border rounded text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {selectedTrialForPD && (
        <D1AlertsDialog
          trialId={selectedTrialForPD}
          onClose={closePDDialog}
        />
      )}

      {selectedTrialForAE && (
        <D2AlertsDialog
          trialId={selectedTrialForAE}
          onClose={closeAEDialog}
        />
      )}
    </div>
  );
};
