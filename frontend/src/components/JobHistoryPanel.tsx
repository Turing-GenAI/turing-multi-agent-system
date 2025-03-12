import React from 'react';
import JobHistory from './JobHistory';

interface JobHistoryPanelProps {
  onClose: () => void;
  onSelectJob?: (jobId: string) => void;
}

/**
 * This is a wrapper component that maintains backward compatibility
 * with the original JobHistoryPanel while using the new modular implementation.
 */
const JobHistoryPanel: React.FC<JobHistoryPanelProps> = ({ onClose, onSelectJob }) => {
  // Pass both props to the new modular JobHistory component
  return <JobHistory onClose={onClose} onSelectJob={onSelectJob} />;
};

export default JobHistoryPanel;
