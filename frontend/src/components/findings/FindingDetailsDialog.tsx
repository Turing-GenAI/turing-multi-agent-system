import React from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Finding } from '../../types';

interface FindingDetailsDialogProps {
  finding: Finding;
  isOpen: boolean;
  onClose: () => void;
}

export const FindingDetailsDialog: React.FC<FindingDetailsDialogProps> = ({
  finding,
  isOpen,
  onClose,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Finding Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Subject ID</p>
                <p className="text-lg font-semibold text-gray-900">{finding.subjectId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Severity</p>
                <p className="text-lg font-semibold text-gray-900">{finding.severity}</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Category</h3>
              <p className="mt-1 text-gray-900">{finding.category}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Comments</h3>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{finding.comments}</p>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Protocol Information</h3>
                <div className="mt-2 space-y-2">
                  <p className="text-gray-900">
                    <span className="font-medium">Name:</span> {finding.protocolName}
                  </p>
                  <p className="text-gray-900">
                    <span className="font-medium">PI:</span> {finding.principalInvestigator}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Timeline</h3>
                <div className="mt-2 space-y-2">
                  <p className="text-gray-900">
                    <span className="font-medium">Start Date:</span>{' '}
                    {format(finding.startDate, 'PPP')}
                  </p>
                  <p className="text-gray-900">
                    <span className="font-medium">End Date:</span>{' '}
                    {finding.endDate ? format(finding.endDate, 'PPP') : 'Ongoing'}
                  </p>
                  <p className="text-gray-900">
                    <span className="font-medium">Days Outstanding:</span>{' '}
                    {finding.daysOutstanding}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
