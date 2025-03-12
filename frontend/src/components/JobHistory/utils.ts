// Utility functions for Job History components
import { ProcessedContext } from "./types";

/**
 * Format a date string to a more readable format
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
};

/**
 * Get the appropriate color class for a job status
 */
export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'failed':
    case 'error':
      return 'bg-red-100 text-red-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'queued':
      return 'bg-yellow-100 text-yellow-800';
    case 'take_human_feedback':
      return 'bg-purple-100 text-purple-800';
    case 'got_human_feedback':
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get the appropriate icon for a job status
 */
export const getStatusIcon = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'check-circle';
    case 'error':
    case 'failed':
      return 'alert-circle';
    case 'processing':
      return 'refresh-cw';
    case 'queued':
      return 'clock';
    case 'take_human_feedback':
      return 'message-square';
    case 'got_human_feedback':
      return 'message-square-rotate';
    default:
      return 'clock';
  }
};

/**
 * Process retrieved context to categorize chunks and map fields according to requirements
 */
export const processRetrievedContext = (context: any): ProcessedContext => {
  const pdChunks: any[] = [];
  const aeChunks: any[] = [];
  const otherChunks: any[] = [];
  
  if (!context || !context.chunks) {
    return { pd: [], ae: [], other: [], chunks: [] };
  }
  
  context.chunks.forEach((chunk: any) => {
    if (chunk && typeof chunk === 'object') {
      // Map fields according to requirements
      // Map subActivity as "Activity" and question as "Sub-activity"
      if (chunk.subActivity && !chunk.activity) {
        chunk.activity = chunk.subActivity;
        delete chunk.subActivity;
      }
      
      if (chunk.question && !chunk.subActivity) {
        chunk.subActivity = chunk.question;
        delete chunk.question;
      }
      
      const content = chunk.text?.toLowerCase() || '';
      const source = chunk.source?.toLowerCase() || '';
      
      if (source.includes('pd') || content.includes('protocol deviation') || 
          content.includes('pd_') || content.match(/pd\s+\d+/)) {
        chunk.category = 'PD';
        pdChunks.push(chunk);
      } else if (source.includes('ae') || content.includes('adverse event') || 
                content.includes('ae_') || content.match(/ae\s+\d+/)) {
        chunk.category = 'AE';
        aeChunks.push(chunk);
      } else {
        chunk.category = 'Other';
        otherChunks.push(chunk);
      }
    }
  });
  
  return {
    pd: pdChunks,
    ae: aeChunks,
    other: otherChunks,
    chunks: [...pdChunks, ...aeChunks, ...otherChunks] // Keep the original format for backward compatibility
  };
};
