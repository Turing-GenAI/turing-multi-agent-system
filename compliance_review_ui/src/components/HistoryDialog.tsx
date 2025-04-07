import React from 'react';
import { FiX, FiCheckCircle, FiXCircle, FiInfo, FiFilter } from 'react-icons/fi';

interface ComplianceDecision {
  id: string;
  issueId: string;
  documentTitle: string;
  reviewId: string;
  text: string;
  regulation: string;
  status: 'accepted' | 'rejected';
  decidedAt: string;
  decidedBy: string;
}

interface HistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  decisions: ComplianceDecision[];
  loading?: boolean;
}

export const HistoryDialog: React.FC<HistoryDialogProps> = ({
  isOpen,
  onClose,
  decisions,
  loading = false
}) => {
  if (!isOpen) return null;

  const acceptedCount = decisions.filter(d => d.status === 'accepted').length;
  const rejectedCount = decisions.filter(d => d.status === 'rejected').length;

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Compliance Review History</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Total:</span>
              <span className="text-sm">{decisions.length} decisions</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">{acceptedCount} Accepted</span>
            </div>
            <div className="flex items-center gap-2">
              <FiXCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm">{rejectedCount} Rejected</span>
            </div>
            
            <div className="ml-auto">
              <button className="flex items-center gap-1 px-3 py-1 text-sm rounded border hover:bg-gray-50">
                <FiFilter className="w-4 h-4" />
                <span>Filter</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading compliance history...</p>
            </div>
          ) : decisions.length > 0 ? (
            <div className="space-y-4">
              {decisions.map(decision => (
                <div key={decision.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{decision.documentTitle}</h4>
                      <p className="text-sm text-gray-500">Review #{decision.reviewId}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {decision.status === 'accepted' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          <FiCheckCircle className="w-3 h-3" />
                          Accepted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                          <FiXCircle className="w-3 h-3" />
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded border mb-2">
                    <p className="text-sm">{decision.text}</p>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500">
                    <div>
                      <span className="font-medium">Regulation:</span> {decision.regulation}
                    </div>
                    <div>
                      <span className="font-medium">Decided by:</span> {decision.decidedBy} on {decision.decidedAt}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FiInfo className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No compliance decisions found</p>
              <p className="text-sm mt-2">Complete a compliance review to see decisions here</p>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
