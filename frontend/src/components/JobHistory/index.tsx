import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Job, ProcessedContext } from './types';
import { processRetrievedContext } from './utils';
import JobHistoryList from './JobHistoryList';
import JobDetailsView from './JobDetailsView';
import { auditService } from '../../api/services/auditService';

interface JobHistoryProps {
  onClose: () => void;
  onSelectJob?: (jobId: string) => void;
}

const JobHistory: React.FC<JobHistoryProps> = ({ onClose, onSelectJob }) => {
  // State for job list
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // State for selected job details
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [aiMessages, setAiMessages] = useState<string[]>([]);
  const [findings, setFindings] = useState<any>(null);
  const [retrievedContext, setRetrievedContext] = useState<ProcessedContext | null>(null);
  
  // Loading states for different data types
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingFindings, setLoadingFindings] = useState(false);
  const [loadingContext, setLoadingContext] = useState(false);
  
  // Error states
  const [messageError, setMessageError] = useState<string | null>(null);
  const [findingsError, setFindingsError] = useState<string | null>(null);
  const [contextError, setContextError] = useState<string | null>(null);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<'messages' | 'pd' | 'ae' | 'context'>('messages');

  // In-memory cache for job details
  const [jobCache, setJobCache] = useState<Record<string, any>>({});

  // Fetch jobs from API
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsRefreshing(true);
    
    try {
      const response = await auditService.getJobs();
      if (response.data && response.data.jobs) {
        // Sort jobs by creation date (newest first)
        const sortedJobs = response.data.jobs.sort((a, b) => {
          return new Date(b.run_at).getTime() - new Date(a.run_at).getTime();
        });
        setJobs(sortedJobs.map(job => ({
          id: job.job_id,
          status: job.status,
          created_at: job.run_at,
          completed_at: job.completed_time,
          trial_id: job.trial_id,
          site_id: job.site_id,
          date: job.date
        })));
      } else {
        setJobs([]);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch retrieved context data for a specific job
  const fetchRetrievedContextData = async (jobId: string) => {
    setLoadingContext(true);
    setContextError(null);
    
    try {
      const response = await auditService.getRetrievedContext(jobId);
      if (response.data) {
        const processedContext = processRetrievedContext(response.data);
        setRetrievedContext(processedContext);
        return processedContext;
      }
      return null;
    } catch (err) {
      console.error('Error fetching context:', err);
      setContextError('Failed to fetch retrieved context');
      return null;
    } finally {
      setLoadingContext(false);
    }
  };

  // Fetch job details when a job is selected
  const fetchJobDetails = useCallback(async (jobId: string) => {
    // Try to use localStorage cache first
    const localStorageKey = `job_cache_${jobId}`;
    try {
      const cachedDataStr = localStorage.getItem(localStorageKey);
      
      if (cachedDataStr) {
        const cachedData = JSON.parse(cachedDataStr);
        // Check if cache is still valid (7 days)
        const now = Date.now();
        if (cachedData.timestamp && (now - cachedData.timestamp < 7 * 24 * 60 * 60 * 1000)) {
          console.log(`Using localStorage cached data for job ${jobId}`);
          setAiMessages(cachedData.aiMessages || []);
          setFindings(cachedData.findings);
          setRetrievedContext(cachedData.retrievedContext);
          
          // Also update the in-memory cache
          setJobCache(prevCache => ({
            ...prevCache,
            [jobId]: {
              aiMessages: cachedData.aiMessages || [],
              findings: cachedData.findings,
              retrievedContext: cachedData.retrievedContext,
              timestamp: cachedData.timestamp
            }
          }));
          return;
        } else {
          console.log(`Cached data for job ${jobId} has expired, fetching fresh data`);
        }
      }
    } catch (err) {
      console.error("Error reading from localStorage:", err);
      // Continue with API call if localStorage fails
    }
    
    // Reset states
    setAiMessages([]);
    setFindings(null);
    setRetrievedContext(null);
    
    // Set loading states
    setLoadingMessages(true);
    setLoadingFindings(true);
    setLoadingContext(true);
    setMessageError(null);
    setFindingsError(null);
    setContextError(null);
    
    try {
      // Fetch both AI messages and findings
      const messagesResponse = await auditService.getAIMessages(jobId, true);
      
      if (messagesResponse && messagesResponse.data) {
        const responseData = messagesResponse.data;
        
        // Handle ai_messages which can be a string or an array of strings
        let aiMessagesData: string[] = [];
        
        if (responseData.ai_messages) {
          if (typeof responseData.ai_messages === 'string') {
            // If it's a single string, put it in an array
            aiMessagesData = [responseData.ai_messages];
          } else if (Array.isArray(responseData.ai_messages)) {
            // If it's already an array, use it directly
            aiMessagesData = responseData.ai_messages;
          }
        }
        
        setAiMessages(aiMessagesData);
        
        // Process findings if available
        let findingsData = null;
        if (responseData.findings) {
          try {
            const pdFindings: any[] = [];
            const aeFindings: any[] = [];
            
            Object.keys(responseData.findings).forEach(key => {
              if (!responseData.findings) return;
              
              const finding = responseData.findings[key];
              if (finding && finding.conclusion) {
                if (key.toLowerCase().includes('pd')) {
                  pdFindings.push({
                    id: key,
                    content: finding.conclusion,
                    table: finding.table || []
                  });
                } else if (key.toLowerCase().includes('ae')) {
                  aeFindings.push({
                    id: key,
                    content: finding.conclusion,
                    table: finding.table || []
                  });
                }
              }
            });
            
            findingsData = {
              pd: pdFindings,
              ae: aeFindings
            };
            setFindings(findingsData);
          } catch (err) {
            console.error("Error processing findings:", err);
            setFindingsError("Failed to process findings data.");
          }
        } else {
          // No findings in the response
          setFindings(null);
        }
        
        // Fetch the retrieved context for this job
        const contextData = await fetchRetrievedContextData(jobId);
        
        // Cache the job data with timestamp
        const cacheData = {
          aiMessages: aiMessagesData,
          findings: findingsData,
          retrievedContext: contextData,
          timestamp: Date.now()
        };
        
        // Update in-memory cache
        setJobCache(prevCache => ({
          ...prevCache,
          [jobId]: cacheData
        }));
        
        // Update localStorage cache
        try {
          localStorage.setItem(localStorageKey, JSON.stringify(cacheData));
        } catch (err) {
          console.error("Error writing to localStorage:", err);
          // Continue if localStorage fails
        }
      }
    } catch (err) {
      console.error('Error fetching job details:', err);
      setMessageError('Failed to fetch job details');
    } finally {
      setLoadingMessages(false);
      setLoadingFindings(false);
    }
  }, []);

  // Handle job selection
  const handleJobClick = useCallback((jobId: string) => {
    setSelectedJob(jobId);
    fetchJobDetails(jobId);
    
    // Call the onSelectJob prop if provided (for backward compatibility)
    if (onSelectJob) {
      onSelectJob(jobId);
    }
  }, [fetchJobDetails, onSelectJob]);

  // Handle tab change
  const handleTabChange = useCallback((tab: 'messages' | 'pd' | 'ae' | 'context') => {
    setActiveTab(tab);
  }, []);

  // Handle close details
  const handleCloseDetails = useCallback(() => {
    setSelectedJob(null);
    setAiMessages([]);
    setFindings(null);
    setRetrievedContext(null);
    setActiveTab('messages');
  }, []);

  // Fetch jobs on component mount
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-[90vw] w-full max-h-[85vh] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">Job History</h2>
        <div className="flex space-x-2">
          <button
            onClick={fetchJobs}
            className="p-1 rounded-full hover:bg-gray-100 transition-all disabled:opacity-50"
            title="Refresh job list"
            disabled={loading || isRefreshing}
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
            title="Close panel"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Job List */}
      <div className="overflow-y-auto flex-1">
        <JobHistoryList
          jobs={jobs}
          loading={loading}
          error={error}
          selectedJobId={selectedJob}
          onJobSelect={handleJobClick}
        />
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseDetails();
            }
          }}
        >
          <div className="animate-fadeIn bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
            <JobDetailsView
              jobId={selectedJob}
              onClose={handleCloseDetails}
              aiMessages={aiMessages}
              findings={findings}
              retrievedContext={retrievedContext}
              loadingMessages={loadingMessages}
              loadingFindings={loadingFindings}
              loadingContext={loadingContext}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default JobHistory;
