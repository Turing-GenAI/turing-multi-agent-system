import React from 'react';
import { MessageSquare, CheckCircle, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { Job } from './types';
import { formatDate, getStatusColor, getStatusIcon } from './utils';

interface JobHistoryListProps {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  selectedJobId: string | null;
  onJobSelect: (jobId: string) => void;
}

const JobHistoryList: React.FC<JobHistoryListProps> = ({
  jobs,
  loading,
  error,
  selectedJobId,
  onJobSelect
}) => {
  // Render the appropriate icon based on the icon name
  const renderStatusIcon = (iconName: string) => {
    switch (iconName) {
      case 'check-circle':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'alert-circle':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'refresh-cw':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'clock':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'message-square':
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      case 'message-square-rotate':
        return <MessageSquare className="w-4 h-4 text-indigo-600 rotate-180" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-700 flex items-start min-h-[400px]">
        <div className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5">⚠️</div>
        <p>{error}</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 min-h-[400px] flex items-center justify-center">
        <p>No job history found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map(job => (
        <div 
          key={job.id}
          className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
            selectedJobId === job.id ? 'bg-blue-50 border-blue-300' : ''
          }`}
          onClick={() => onJobSelect(job.id)}
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-medium text-gray-900 mb-1">
                Job ID: <span className="font-mono font-bold">{job.id}</span>
              </h3>
              <div className="text-sm text-gray-600 mb-2">
                <p>Trial: <strong>{job.trial_id}</strong></p>
                <p>Site: <strong>{job.site_id}</strong></p>
                <p>Date Range: <strong>{job.date}</strong></p>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(job.status)}`}>
              {renderStatusIcon(getStatusIcon(job.status))}
              <span className="ml-1">{job.status}</span>
            </div>
          </div>
          <div className="border-t pt-2 text-xs text-gray-500 flex justify-between">
            <div>Created: {formatDate(job.created_at)}</div>
            {job.completed_at && <div>Completed: {formatDate(job.completed_at)}</div>}
          </div>
          <div className="mt-2 flex items-center text-blue-600 text-sm">
            <MessageSquare className="w-4 h-4 mr-1" />
            <span>View details</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default JobHistoryList;
