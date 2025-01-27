import React, { useState } from 'react';
import { Eye, ArrowUpCircle, XCircle } from 'lucide-react';
import { Finding } from '../../types';
import { FindingDetailsDialog } from './FindingDetailsDialog';

interface FindingActionsProps {
  finding: Finding;
}

export const FindingActions: React.FC<FindingActionsProps> = ({ finding }) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <>
      <div className="flex items-center space-x-2">
        <button 
          onClick={() => setIsDetailsOpen(true)}
          className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <Eye className="w-3 h-3 mr-1" />
          View
        </button>
        <button className="inline-flex items-center px-2 py-1 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100">
          <ArrowUpCircle className="w-3 h-3 mr-1" />
          Escalate
        </button>
        <button className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100">
          <XCircle className="w-3 h-3 mr-1" />
          Resolve
        </button>
      </div>

      <FindingDetailsDialog 
        finding={finding}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </>
  );
};
