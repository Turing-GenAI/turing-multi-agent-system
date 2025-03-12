import React, { useState, useEffect } from 'react';
import { X, ExternalLink, RefreshCw, AlertCircle, CheckCircle, Clock, MessageSquare, Database, FileWarning, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { auditService } from '../api/services/auditService';
import { agentName } from '../data/agentNames';

interface Job {
  id: string;
  status: string;
  created_at: string;
  completed_at?: string;
  trial_id: string;
  site_id: string;
  date: string;
}

interface JobHistoryPanelProps {
  onClose: () => void;
  onSelectJob: (jobId: string) => void;
}

// Cache interfaces
interface JobCache {
  aiMessages: string[];
  findings: any;
  retrievedContext: any;
  timestamp: number; // Add timestamp for cache invalidation if needed
}

// Local storage key for the job cache
const JOB_CACHE_KEY = 'turing_job_cache';
// Cache expiration time (7 days in milliseconds)
const CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

const JobHistoryPanel: React.FC<JobHistoryPanelProps> = ({ onClose, onSelectJob }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [aiMessages, setAiMessages] = useState<string[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  
  // New state variables for findings and context
  const [findings, setFindings] = useState<any>(null);
  const [loadingFindings, setLoadingFindings] = useState<boolean>(false);
  const [findingsError, setFindingsError] = useState<string | null>(null);
  const [retrievedContext, setRetrievedContext] = useState<any>(null);
  const [loadingContext, setLoadingContext] = useState<boolean>(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const [showPDFindings, setShowPDFindings] = useState<boolean>(false);
  const [showAEFindings, setShowAEFindings] = useState<boolean>(false);
  const [showContext, setShowContext] = useState<boolean>(false);
  const [showAgentMessages, setShowAgentMessages] = useState<boolean>(true);
  const [pdExpanded, setPdExpanded] = useState(false);
  const [aeExpanded, setAeExpanded] = useState(false);
  const [otherExpanded, setOtherExpanded] = useState(false);
  
  // Cache for job data to prevent refetching
  const [jobCache, setJobCache] = useState<Record<string, JobCache>>({});

  useEffect(() => {
    initialFetchJobs();
  }, []);

  // Initial fetch jobs with loading state
  const initialFetchJobs = async () => {
    setLoading(true);
    setError(null);
    
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
      console.error("Error fetching jobs:", err);
      setError("Failed to load job history. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Refresh jobs with a separate refreshing state
  const fetchJobs = async () => {
    // Prevent multiple fetches
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setError(null);
    
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
      console.error("Error fetching jobs:", err);
      setError("Failed to load job history. Please try again later.");
    } finally {
      // Small delay before removing the refreshing state to make animation smoother
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  // Fetch AI messages and findings for a specific job
  const fetchJobDetail = async (jobId: string) => {
    // First check component state cache
    if (jobCache[jobId]) {
      console.log(`Using in-memory cached data for job ${jobId}`);
      setAiMessages(jobCache[jobId].aiMessages);
      setFindings(jobCache[jobId].findings);
      setRetrievedContext(jobCache[jobId].retrievedContext);
      return;
    }
    
    // Then check localStorage cache
    try {
      const localStorageKey = `job_cache_${jobId}`;
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
    
    setLoadingMessages(true);
    setLoadingFindings(true);
    setLoadingContext(true); // Always set context loading when getting job details
    setMessageError(null);
    setFindingsError(null);
    setContextError(null);
    
    try {
      // Fetch both AI messages and findings in parallel
      const [messagesResponse] = await Promise.all([
        auditService.getAIMessages(jobId, true)
      ]);
      
      if (messagesResponse && messagesResponse.data) {
        const responseData = messagesResponse.data;
        const aiMessagesData = responseData.ai_messages || [];
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
        
        // Save to localStorage
        try {
          const localStorageKey = `job_cache_${jobId}`;
          localStorage.setItem(localStorageKey, JSON.stringify(cacheData));
          console.log(`Saved job ${jobId} data to localStorage`);
        } catch (err) {
          console.error("Error saving to localStorage:", err);
        }
      } else {
        // No data in the response
        setAiMessages([]);
        setFindings(null);
      }
    } catch (err) {
      console.error("Error fetching job details:", err);
      setMessageError("Failed to load messages for this job.");
    } finally {
      setLoadingMessages(false);
      setLoadingFindings(false);
    }
  };

  // Fetch retrieved context data and return it (for caching)
  const fetchRetrievedContextData = async (jobId: string) => {
    setLoadingContext(true);
    setContextError(null);
    
    try {
      const response = await auditService.getRetrievedContext(jobId);
      
      if (response && response.data) {
        const contextData = processRetrievedContext(response.data);
        setRetrievedContext(contextData);
        return contextData;
      } else {
        setRetrievedContext(null);
        return null;
      }
    } catch (err) {
      console.error("Error fetching retrieved context:", err);
      setContextError("Failed to load retrieved context for this job.");
      return null;
    } finally {
      setLoadingContext(false);
    }
  };
  
  // Fetch retrieved context for a specific job (now just uses the cached data or calls fetchRetrievedContextData)
  const fetchRetrievedContext = async (jobId: string) => {
    // If we already have cached data, use it
    if (jobCache[jobId] && jobCache[jobId].retrievedContext) {
      setRetrievedContext(jobCache[jobId].retrievedContext);
      return;
    }
    
    // Otherwise fetch the data
    await fetchRetrievedContextData(jobId);
  };

  // Helper function to filter metadata that should be shown
  const shouldShowMetadataField = (key: string, metadata: any) => {
    // Fields to always exclude
    const excludeFields = ['text_as_html'];
    if (excludeFields.includes(key)) return false;
    
    // Hide empty values or irrelevant fields
    const value = metadata[key];
    if (value === undefined || value === null || value === '') return false;
    
    // List of fields to hide for spreadsheet-type documents
    const fieldsToHide = [
      'file_directory',
      'page_name',
      'page_number',
      'languages',
      'filetype',
      'category',
      'element_id',
      'last_modified'
    ];
    
    // Check if this is a spreadsheet-type document
    const isSpreadsheetDoc = metadata.filename && 
      (metadata.filename.endsWith('.xlsx') || 
       metadata.filename.endsWith('.xls') || 
       metadata.filename.endsWith('.csv') ||
       (metadata.filetype && 
        (metadata.filetype.includes('excel') || 
         metadata.filetype.includes('spreadsheet') || 
         metadata.filetype.includes('csv'))));
    
    // If it's a spreadsheet document and the field is in the hide list, don't show it
    if (isSpreadsheetDoc && fieldsToHide.includes(key)) {
      return false;
    }
    
    return true;
  };
  
  // Helper function to map source URLs
  const mapSourceUrl = (url: string, metadata?: any): string => {
    // For debugging
    console.log('Source URL mapping:', { url, metadata });
    
    let mappedUrl = url;
    
    // Map for known URLs
    if (url.includes('protocol_deviation.xlsx')) {
      mappedUrl = 'https://app.box.com/s/vh13jqxkobcn2munalyn99fb660uwmp6';
    } else if (url.includes('AE_SAE/data/filtered_RaveReport_example') && url.includes('Adverse Events.xlsx')) {
      mappedUrl = 'https://app.box.com/s/yhpjlgh9obecc9y4yv2ulwsfeahobmdg';
    } else if (url.includes('Inspection Readiness Guidance V4.0.pdf')) {
      // For PDF documents in Box, use the base URL
      mappedUrl = 'https://app.box.com/s/tj41ww272kasc6cczqra6m8y7ljipeik';
    }
    
    return mappedUrl;
  };

  // Function to handle source link click
  const handleSourceLinkClick = (url: string, metadata?: any) => {
    const mappedUrl = mapSourceUrl(url, metadata);
    console.log('Handling source link click:', { url, mappedUrl, metadata });
    
    // Open the URL in a new window
    window.open(mappedUrl, '_blank');
    return false; // Prevent default link behavior
  };

  // Helper function to clean subactivity values
  const cleanSubactivityValue = (value: string | undefined) => {
    if (!value) return '';
    
    // Extract activity ID if present
    const activityIdMatch = value.match(/<activity_id#([^>]+)>/);
    const activityId = activityIdMatch ? activityIdMatch[1] : '';
    
    // Remove the activity ID tag, hash marks, and trim
    const cleanedText = value
      .replace(/<activity_id#[^>]+>/, '')
      .replace(/###/, '')
      .trim()
      .replace(/^\d+_/, '') // Remove numeric prefixes (e.g., "1_")
      .replace(/^(sub[-_\s]?activity|activity)[:;]?\s*/i, ''); // Remove activity/subactivity prefix
    
    // Return formatted string with activity ID if available
    return activityId ? `${activityId} - ${cleanedText}` : cleanedText;
  };

  // Function to clean up text content from the backend
  const cleanTextContent = (text: string): string => {
    if (!text) return '';
    
    // Only fix common encoding issues without changing formatting
    return text
      .replace(/�/g, 'ti') // Fix common encoding issues like "Inspec�on" -> "Inspection"
      .replace(/�/g, 'i'); // Another common encoding issue
  };

  // Handle job click to view details
  const handleJobClick = (jobId: string) => {
    setSelectedJob(jobId);
    fetchJobDetail(jobId);
  };

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  // Helper function to get status color
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
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

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'queued':
        return <Clock className="w-4 h-4" />;
      case 'take_human_feedback':
        return <MessageSquare className="w-4 h-4" />;
      case 'got_human_feedback':
        return <MessageSquare className="w-4 h-4 text-indigo-600 rotate-180" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Format agent messages for display
  const formatAgentMessage = (message: string) => {
    try {
      // Split the message by "================================== Ai Message =================================="
      const parts = message.split(/==+ Ai Message ==+/);
      
      return parts.filter(part => part.trim()).map((part, idx) => {
        // Extract agent name if present
        const nameMatch = part.match(/Name: ([^:]+):/);
        const rawAgentName = nameMatch ? nameMatch[1].trim() : "Unknown";
        
        // Use the direct agentName mapping from agentNames.ts
        const displayName = rawAgentName in agentName 
          ? agentName[rawAgentName as keyof typeof agentName] 
          : rawAgentName;
        
        // Clean up the content
        let content = part.replace(/Name: [^:]+:/, '').trim();
        
        // Extract and format activity and subactivity information
        const activityMatch = content.match(/Activity: ([^\n]+)/i);
        const subActivityMatch = content.match(/Subactivity: ([^\n]+)/i);
        
        // Format activity and subactivity if present
        if (activityMatch || subActivityMatch) {
          let formattedMetadata = '';
          
          if (activityMatch) {
            const activityValue = cleanSubactivityValue(activityMatch[1]);
            if (activityValue) {
              formattedMetadata += `<div class="text-sm text-blue-600 mb-1">Activity: ${activityValue}</div>`;
            }
          }
          
          if (subActivityMatch) {
            const subActivityValue = cleanSubactivityValue(subActivityMatch[1]);
            if (subActivityValue) {
              formattedMetadata += `<div class="text-sm text-blue-600 mb-1">Sub-Activity: ${subActivityValue}</div>`;
            }
          }
          
          if (formattedMetadata) {
            content = `${formattedMetadata}<div class="mt-2">${content}</div>`;
          }
        }
        
        // Convert HTML-like formatting to markdown but using normal text formatting instead of ReactMarkdown
        content = content.replace(/Input X\d+: ([^\s]+)/g, 'Input: $1');
        content = content.replace(/<activity_id#([^>]+)>/g, 'Activity #$1');
        content = content.replace(/-> ([^:]+):/g, '→ $1:');
        
        // Bold important information such as trial ID, site ID, date ranges using HTML tags
        content = content.replace(/([Tt]rial ID:?)\s+([^,\s]+)/g, '$1 <strong>$2</strong>');
        content = content.replace(/([Ss]ite ID:?)\s+([^,\s]+)/g, '$1 <strong>$2</strong>');
        content = content.replace(/(\d{4}-\d{2}-\d{2}\s*-\s*\d{4}-\d{2}-\d{2})/g, '<strong>$1</strong>');
        
        return (
          <div key={idx} className="border-b border-gray-200 last:border-0 py-3">
            <div className="font-medium text-blue-600 mb-1">{displayName}</div>
            <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        );
      });
    } catch (error) {
      console.error("Error formatting agent message:", error, message);
      return <div className="text-red-500">Error displaying message</div>;
    }
  };

  const htmlTableStyles = `
    .html-table-container table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .html-table-container th {
      padding: 0.75rem;
      text-align: left;
      font-weight: 600;
      background-color: var(--header-bg-color, #f3f4f6);
      color: var(--header-text-color, #374151);
      border: 1px solid #e5e7eb;
    }
    .html-table-container td {
      padding: 0.5rem 0.75rem;
      border: 1px solid #e5e7eb;
    }
    .html-table-container tr:nth-child(even) {
      background-color: #f9fafb;
    }
    .html-table-container tr:hover {
      background-color: #f3f4f6;
    }
  `;

  // Format date for display
  const formatDateForTable = (timestamp: number | string | null) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleDateString();
    } catch (e) {
      return String(timestamp);
    }
  };

  // Render PD findings table
  const renderPDTable = (findingData: any) => {
    if (!findingData.table || findingData.table.length === 0) return null;
    
    return (
      <div className="overflow-x-auto mt-4">
        <table className="w-full divide-y divide-gray-200 border-collapse shadow-sm rounded-lg overflow-hidden">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24 border border-gray-200">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32 border border-gray-200">Protocol</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32 border border-gray-200">Site</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32 border border-gray-200">Category</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">Severity</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">Deviation</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32 border border-gray-200">Description</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32 border border-gray-200">Days Outstanding</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {findingData.table.map((row: any, index: number) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{row.Subject}</td>
                <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{row.Protocol_Name}</td>
                <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{row.Site_Name}</td>
                <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{row.Category}</td>
                <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{row.Severity}</td>
                <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">
                  <div className="max-w-xs overflow-hidden text-ellipsis">{row.Deviation}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">
                  <div className="max-w-md overflow-hidden text-ellipsis">{row.Description}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{row.Number_Days_Outstanding}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render AE findings table
  const renderAETable = (findingData: any) => {
    if (!findingData.table || findingData.table.length === 0) return null;
    
    return (
      <div className="overflow-x-auto mt-4">
        <table className="w-full divide-y divide-gray-200 border-collapse shadow-sm rounded-lg overflow-hidden">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24 border border-gray-200">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32 border border-gray-200">Site</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-40 border border-gray-200">Event Term</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24 border border-gray-200">Grade</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32 border border-gray-200">Outcome</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32 border border-gray-200">Start Date</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32 border border-gray-200">End Date</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32 border border-gray-200">Treatment Given</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24 border border-gray-200">Serious</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-40 border border-gray-200">Action (Amivantamab)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {findingData.table.map((row: any, index: number) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{row.Subject}</td>
                <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{row.Site}</td>
                <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{row["What is the adverse event term?"]}</td>
                <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{row["Toxicity Grade"]}</td>
                <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{row.outcome}</td>
                <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{formatDateForTable(row["start date"])}</td>
                <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{formatDateForTable(row["end date"]) || 'Not Available'}</td>
                <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{row["concomitant treatment given for AE"]}</td>
                <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{row["Serious AE"]}</td>
                <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{row["Action taken with Amivantamab"]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Process the retrieved context data
  const processRetrievedContext = (contextData: any) => {
    const pdChunks: any[] = [];
    const aeChunks: any[] = [];
    const otherChunks: any[] = [];
    
    // Navigate through the deeply nested structure to extract context
    Object.keys(contextData).forEach(key1 => {
      const level1 = contextData[key1];
      if (level1 && typeof level1 === 'object') {
        Object.keys(level1).forEach(key2 => {
          const level2 = level1[key2];
          if (level2 && typeof level2 === 'object') {
            Object.keys(level2).forEach(key3 => {
              const level3 = level2[key3];
              if (level3 && typeof level3 === 'object') {
                Object.keys(level3).forEach(key4 => {
                  const level4 = level3[key4];
                  if (level4 && level4.context_dict_key && typeof level4.context_dict_key === 'object') {
                    Object.keys(level4.context_dict_key).forEach(contextKey => {
                      const contextItem = level4.context_dict_key[contextKey];
                      if (contextItem && contextItem.metadata && contextItem.page_content) {
                        // Debug: Log the context item and its metadata
                        console.log('Context Item:', contextItem);
                        console.log('Context Item Metadata:', contextItem.metadata);
                        console.log('Context Key:', contextKey);
                        console.log('Key1:', key1);
                        console.log('Key2:', key2);
                        console.log('Key3:', key3);
                        
                        // Check if there's HTML table content
                        let htmlTable = null;
                        if (contextItem.metadata.text_as_html) {
                          htmlTable = contextItem.metadata.text_as_html;
                        } else if (contextItem.metadata.source && 
                                  (contextItem.metadata.source.toLowerCase().includes('.xlsx') || 
                                   contextItem.metadata.source.toLowerCase().includes('.xls') || 
                                   contextItem.metadata.source.toLowerCase().includes('.csv'))) {
                          // Try to detect if content might be tabular
                          const lines = contextItem.page_content.split('\n');
                          const potentialHeaders = lines[0]?.split(',') || [];
                          
                          if (potentialHeaders.length > 2) {
                            // Simple CSV detection heuristic: if first line has commas and we have multiple lines
                            const tableRows = lines.map(line => {
                              const cells = line.split(',');
                              return `<tr>${cells.map(cell => `<td>${cell.trim()}</td>`).join('')}</tr>`;
                            });
                            
                            htmlTable = `<table class="w-full border-collapse">
                              <thead>
                                ${tableRows[0]?.replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>') || ''}
                              </thead>
                              <tbody>
                                ${tableRows.slice(1).join('')}
                              </tbody>
                            </table>`;
                          }
                        }
                        
                        // Try to extract activity and subActivity info
                        let activity = '';
                        let subActivity = '';
                        let question = '';
                        
                        // Try to extract activity from the context key or path
                        if (contextKey.includes('PD') || key1.includes('PD') || key2.includes('PD') || key3.includes('PD')) {
                          activity = 'PD';
                        } else if (contextKey.includes('AE_SAE') || contextKey.includes('AE') || 
                                  key1.includes('AE_SAE') || key1.includes('AE') || 
                                  key2.includes('AE_SAE') || key2.includes('AE') || 
                                  key3.includes('AE_SAE') || key3.includes('AE')) {
                          activity = 'AE_SAE';
                        }
                        
                        // Try to extract the sub-activity from keys using a pattern similar to RetrievedContextModal
                        if (key2.includes('<activity_id#') || key3.includes('<activity_id#')) {
                          subActivity = key2.includes('<activity_id#') ? key2 : key3;
                          // Remove numerical prefix if present (like "0_", "1_", etc.)
                          subActivity = subActivity.replace(/^\d+_/, '');
                          console.log('Found subActivity with activity_id pattern:', subActivity);
                        } else if (key2.includes('activity') || key3.includes('activity')) {
                          // Fallback to the original method
                          subActivity = key2.includes('activity') ? key2 : key3;
                          console.log('Found subActivity with fallback method:', subActivity);
                        }
                        
                        // Try to extract question from metadata or from keys
                        if (contextItem.metadata.question) {
                          question = contextItem.metadata.question;
                          console.log('Found question in metadata:', question);
                        } else {
                          // Try to find a question in the keys after the subActivity
                          // This is similar to how RetrievedContextModal extracts questions
                          if (subActivity && key3 && !key3.includes('<activity_id#') && !key3.includes('activity')) {
                            question = key3.replace(/^\d+_/, '');
                            console.log('Found question in keys:', question);
                          }
                        }
                        
                        const chunk = {
                          source: contextItem.metadata.source || 'Unknown',
                          content: contextItem.page_content,
                          metadata: contextItem.metadata,
                          htmlTable: htmlTable,
                          category: 'Other',
                          activity,
                          subActivity,
                          question
                        };
                        
                        // Debug: Log the final chunk with extracted fields
                        console.log('Final chunk:', {
                          activity: chunk.activity,
                          subActivity: chunk.subActivity,
                          question: chunk.question
                        });
                        
                        // Categorize chunks based on their source or content
                        const source = chunk.source.toLowerCase();
                        const content = chunk.content.toLowerCase();
                        
                        if (source.includes('pd') || content.includes('protocol deviation') || 
                            content.includes('pd_') || content.match(/pd\s+\d+/)) {
                          chunk.category = 'PD';
                          pdChunks.push(chunk);
                        } else if (source.includes('ae') || content.includes('adverse event') || 
                                  content.includes('ae_') || content.match(/ae\s+\d+/)) {
                          chunk.category = 'AE';
                          aeChunks.push(chunk);
                        } else {
                          otherChunks.push(chunk);
                        }
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
    
    console.log('Extracted context chunks:', { pd: pdChunks.length, ae: aeChunks.length, other: otherChunks.length });
    return {
      pd: pdChunks,
      ae: aeChunks,
      other: otherChunks,
      chunks: [...pdChunks, ...aeChunks, ...otherChunks] // Keep the original format for backward compatibility
    };
  };

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
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

      {/* Content */}
      <div className="overflow-y-auto flex-1 p-4">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md text-red-700 flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No job history found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <div 
                key={job.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleJobClick(job.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Job ID: <span className="font-mono font-bold">{job.id}</span></h3>
                    <div className="text-sm text-gray-600 mb-2">
                      <p>Trial: <strong>{job.trial_id}</strong></p>
                      <p>Site: <strong>{job.site_id}</strong></p>
                      <p>Date Range: <strong>{job.date}</strong></p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(job.status)}`}>
                    {getStatusIcon(job.status)}
                    <span className="ml-1">{job.status}</span>
                  </div>
                </div>
                <div className="border-t pt-2 text-xs text-gray-500 flex justify-between">
                  <div>Created: {formatDate(job.created_at)}</div>
                  {job.completed_at && <div>Completed: {formatDate(job.completed_at)}</div>}
                </div>
                <div className="mt-2 flex items-center text-blue-600 text-sm">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  <span>View agent messages</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Job Detail Modal */}
      {selectedJob && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedJob(null);
              setAiMessages([]);
              setFindings(null);
              setRetrievedContext(null);
              setShowPDFindings(false);
              setShowAEFindings(false);
              setShowContext(false);
              setShowAgentMessages(true);
            }
          }}
        >
          <div className="animate-fadeIn bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">
                Agent Messages for Job: <span className="font-mono">{selectedJob}</span>
              </h2>
              <button
                onClick={() => {
                  setSelectedJob(null);
                  setAiMessages([]);
                  setFindings(null);
                  setRetrievedContext(null);
                  setShowPDFindings(false);
                  setShowAEFindings(false);
                  setShowContext(false);
                  setShowAgentMessages(true);
                }}
                className="p-1 rounded-full hover:bg-gray-100"
                title="Close panel"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {/* Findings and Context Buttons */}
            <div className="p-4 bg-gray-50 border-b flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setShowAgentMessages(true);
                  setShowPDFindings(false);
                  setShowAEFindings(false);
                  setShowContext(false);
                }}
                disabled={loadingMessages}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                  showAgentMessages ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                } ${loadingMessages ? 'opacity-50' : ''}`}
              >
                <MessageSquare className="w-4 h-4" />
                {loadingMessages ? (
                  <span className="flex items-center">
                    <RefreshCw className="w-3 h-3 mr-2 animate-spin" /> Loading Messages...
                  </span>
                ) : (
                  <span>Agent Messages</span>
                )}
              </button>
              <button
                onClick={() => {
                  setShowPDFindings(true);
                  setShowAEFindings(false);
                  setShowContext(false);
                  setShowAgentMessages(false);
                }}
                disabled={loadingFindings}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                  showPDFindings ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                } ${loadingFindings ? 'opacity-50' : ''}`}
              >
                <FileWarning className="w-4 h-4" />
                {loadingFindings ? (
                  <span className="flex items-center">
                    <RefreshCw className="w-3 h-3 mr-2 animate-spin" /> Loading PD...
                  </span>
                ) : (
                  <span>Protocol Deviations</span>
                )}
              </button>
              
              <button
                onClick={() => {
                  setShowAEFindings(true);
                  setShowPDFindings(false);
                  setShowContext(false);
                  setShowAgentMessages(false);
                }}
                disabled={loadingFindings}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                  showAEFindings ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                } ${loadingFindings ? 'opacity-50' : ''}`}
              >
                <AlertCircle className="w-4 h-4" />
                {loadingFindings ? (
                  <span className="flex items-center">
                    <RefreshCw className="w-3 h-3 mr-2 animate-spin" /> Loading AE...
                  </span>
                ) : (
                  <span>Adverse Events</span>
                )}
              </button>
              
              <button
                onClick={() => {
                  setShowContext(true);
                  setShowPDFindings(false);
                  setShowAEFindings(false);
                  setShowAgentMessages(false);
                }}
                disabled={loadingContext}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                  showContext ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                } ${loadingContext ? 'opacity-50' : ''}`}
              >
                <Database className="w-4 h-4" />
                {loadingContext ? (
                  <span className="flex items-center">
                    <RefreshCw className="w-3 h-3 mr-2 animate-spin" /> Loading context...
                  </span>
                ) : (
                  <span>Retrieved Context</span>
                )}
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4">
              {/* Show Agent Messages */}
              {showAgentMessages && (
                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4 text-blue-700 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Agent Messages
                  </h3>
                  {loadingMessages ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></div>
                    </div>
                  ) : messageError ? (
                    <div className="bg-red-50 p-4 rounded-md text-red-700 flex items-start">
                      <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <p>{messageError}</p>
                    </div>
                  ) : !aiMessages || aiMessages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No agent messages found for this job</p>
                    </div>
                  ) : (
                    <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                      {Array.isArray(aiMessages) ? aiMessages.map((message, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                          {formatAgentMessage(message)}
                        </div>
                      )) : (
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          {typeof aiMessages === 'string' ? formatAgentMessage(aiMessages) : 
                            <div className="text-red-500">Invalid message format</div>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Show PD Findings */}
              {showPDFindings && (
                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4 text-yellow-600 flex items-center">
                    <FileWarning className="w-5 h-5 mr-2" />
                    Protocol Deviation Findings
                  </h3>
                  {loadingFindings ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></div>
                    </div>
                  ) : findingsError ? (
                    <div className="bg-red-50 p-4 rounded-md text-red-700 flex items-start">
                      <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <p>{findingsError}</p>
                    </div>
                  ) : !findings || !findings.pd || findings.pd.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No Protocol Deviation findings for this job</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden shadow-sm mb-4 bg-white">
                      <div className="bg-gray-100 p-3 cursor-pointer flex items-center justify-between transition-colors">
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                            <AlertTriangle size={14} className="text-yellow-500" />
                          </div>
                          <h4 className="font-medium text-yellow-600">Protocol Deviations</h4>
                          <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full ml-2">
                            {findings.pd.length} {findings.pd.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="divide-y divide-gray-100">
                        {findings.pd.map((finding, index) => (
                          <div key={`pd-${index}`} className="p-4 hover:bg-gray-50 transition-colors">
                            {/* Item Number */}
                            <div className="mb-2">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-700 font-medium text-sm mr-2 shadow-sm">
                                {index + 1}
                              </span>
                              <span className="text-sm text-gray-500">Finding {index + 1} of {findings.pd.length}</span>
                            </div>
                            
                            {/* Content */}
                            <div className="relative">
                              <div className="text-sm bg-white border rounded-md p-4 max-h-80 overflow-auto">
                                <div className="whitespace-pre-line text-gray-800">
                                  <ReactMarkdown>
                                    {cleanTextContent(finding.content).replace(/Protocol Deviation|PD:|Subject:|Site:|Category:|Description:/gi, match => `**${match}**`)}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            </div>
                            
                            {/* Table data if available */}
                            {finding.table && finding.table.length > 0 && (
                              <div className="mt-4">
                                <h5 className="font-medium text-gray-700 mb-2">Tabular Data:</h5>
                                {renderPDTable(finding)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Show AE Findings */}
              {showAEFindings && (
                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4 text-orange-600 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Adverse Event Findings
                  </h3>
                  {loadingFindings ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></div>
                    </div>
                  ) : findingsError ? (
                    <div className="bg-red-50 p-4 rounded-md text-red-700 flex items-start">
                      <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <p>{findingsError}</p>
                    </div>
                  ) : !findings || !findings.ae || findings.ae.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No Adverse Event findings for this job</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden shadow-sm mb-4 bg-white">
                      <div className="bg-gray-100 p-3 cursor-pointer flex items-center justify-between transition-colors">
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                            <AlertCircle size={14} className="text-orange-500" />
                          </div>
                          <h4 className="font-medium text-orange-600">Adverse Events / Serious Adverse Events</h4>
                          <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full ml-2">
                            {findings.ae.length} {findings.ae.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="divide-y divide-gray-100">
                        {findings.ae.map((finding, index) => (
                          <div key={`ae-${index}`} className="p-4 hover:bg-gray-50 transition-colors">
                            {/* Item Number */}
                            <div className="mb-2">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-700 font-medium text-sm mr-2 shadow-sm">
                                {index + 1}
                              </span>
                              <span className="text-sm text-gray-500">Finding {index + 1} of {findings.ae.length}</span>
                            </div>
                            
                            {/* Content */}
                            <div className="relative">
                              <div className="text-sm bg-white border rounded-md p-4 max-h-80 overflow-auto">
                                <div className="whitespace-pre-line text-gray-800">
                                  <ReactMarkdown>
                                    {cleanTextContent(finding.content).replace(/Adverse Event|AE:|SAE:|Subject:|Site:|Event:|Grade:|Start Date:|End Date:|Seriousness:|Treatment:/gi, match => `**${match}**`)}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            </div>
                            
                            {/* Table data if available */}
                            {finding.table && finding.table.length > 0 && (
                              <div className="mt-4">
                                <h5 className="font-medium text-gray-700 mb-2">Tabular Data:</h5>
                                {renderAETable(finding)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Show Retrieved Context */}
              {showContext && (
                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4 text-blue-700 flex items-center">
                    <Database className="w-5 h-5 mr-2" />
                    Retrieved Context
                  </h3>
                  {loadingContext ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></div>
                    </div>
                  ) : contextError ? (
                    <div className="bg-red-50 p-4 rounded-md text-red-700 flex items-start">
                      <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <p>{contextError}</p>
                    </div>
                  ) : !retrievedContext ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No retrieved context available for this job</p>
                    </div>
                  ) : (
                    <div className="bg-white p-2 rounded-lg">
                      {/* PD Section */}
                      {retrievedContext.pd && retrievedContext.pd.length > 0 && (
                        <div className="border rounded-lg overflow-hidden shadow-sm mb-4 bg-white">
                          <div className="bg-gray-100 p-3 cursor-pointer flex items-center justify-between transition-colors"
                               onClick={() => setPdExpanded(!pdExpanded)}>
                            <div className="flex items-center">
                              {pdExpanded ? 
                                <ChevronDown className="w-4 h-4 text-yellow-500" /> : 
                                <ChevronRight className="w-4 h-4 text-yellow-500" />
                              }
                              <div className="flex items-center">
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                                  <AlertTriangle size={14} className="text-yellow-500" />
                                </div>
                                <h4 className="font-medium text-yellow-600">Protocol Deviations</h4>
                                <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full ml-2">
                                  {retrievedContext.pd.length} {retrievedContext.pd.length === 1 ? 'item' : 'items'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {pdExpanded && (
                            <div className="divide-y divide-gray-100 animate-slideDown">
                              {retrievedContext.pd.map((chunk, index) => (
                                <div key={`pd-${index}`} className="p-4 hover:bg-gray-50 transition-colors">
                                  {/* Item Number */}
                                  <div className="mb-2">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-700 font-medium text-sm mr-2 shadow-sm">
                                      {index + 1}
                                    </span>
                                    <span className="text-sm text-gray-500">Item {index + 1} of {retrievedContext.pd.length}</span>
                                  </div>
                                  
                                  {/* Metadata */}
                                  <div className="mb-3 overflow-x-auto">
                                    <table className="min-w-full text-xs border-collapse shadow-sm rounded-lg overflow-hidden">
                                      <thead>
                                        <tr className="bg-gray-50">
                                          <th className="px-4 py-3 text-left font-bold text-gray-700 border border-gray-200">Property</th>
                                          <th className="px-4 py-3 text-left font-bold text-gray-700 border border-gray-200">Value</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {/* Display subActivity as Activity - always show even if empty */}
                                        <tr className="border-t border-gray-200 bg-white hover:bg-gray-50">
                                          <td className="px-4 py-3 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                            <strong>Activity</strong>
                                          </td>
                                          <td className="px-4 py-3 align-top text-gray-800 border border-gray-200">
                                            {chunk.subActivity ? cleanSubactivityValue(chunk.subActivity) : (chunk.activity || 'Unknown')}
                                          </td>
                                        </tr>
                                        
                                        {/* Display question as Sub-activity - always show even if empty */}
                                        <tr className="border-t border-gray-200 bg-white hover:bg-gray-50">
                                          <td className="px-4 py-3 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                            <strong>Sub-activity</strong>
                                          </td>
                                          <td className="px-4 py-3 align-top text-gray-800 border border-gray-200">
                                            {chunk.question || 'Unknown'}
                                          </td>
                                        </tr>
                                        
                                        {/* Display other metadata fields */}
                                        {Object.entries(chunk.metadata)
                                          .filter(([metaKey]) => metaKey !== 'text_as_html') // Exclude text_as_html from metadata table
                                          .filter(([metaKey]) => shouldShowMetadataField(metaKey, chunk.metadata))
                                          .map(([metaKey, metaValue]) => (
                                          <tr key={metaKey} className="border-t border-gray-200 bg-white hover:bg-gray-50">
                                            <td className="px-4 py-3 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                              {metaKey}
                                            </td>
                                            <td className="px-4 py-3 align-top text-gray-800 border border-gray-200">
                                              {metaKey === 'source' ? (
                                                <a 
                                                  href={mapSourceUrl(metaValue as string, chunk.metadata)} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  className="text-blue-600 hover:underline flex items-center"
                                                  onClick={(e) => {
                                                    if (!handleSourceLinkClick(metaValue as string, chunk.metadata)) {
                                                      e.preventDefault();
                                                    }
                                                  }}
                                                >
                                                  {String(metaValue).substring(0, 50)}
                                                  {String(metaValue).length > 50 ? '...' : ''}
                                                  <ExternalLink className="w-3 h-3 ml-1 inline" />
                                                </a>
                                              ) : (
                                                String(metaValue)
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  
                                  {/* Content */}
                                  <div className="relative">
                                    {/* HTML Table Section */}
                                    {chunk.htmlTable && (
                                      <div className="mb-4">
                                        <h5 className="font-medium text-gray-700 mb-2">Table Data:</h5>
                                        <div className="overflow-x-auto border rounded max-h-96">
                                          <style dangerouslySetInnerHTML={{ __html: htmlTableStyles }} />
                                          <div 
                                            className="p-2 text-sm html-table-container" 
                                            style={{
                                              '--header-bg-color': '#f3f4f6',
                                              '--header-text-color': '#374151'
                                            } as React.CSSProperties}
                                            dangerouslySetInnerHTML={{ __html: chunk.htmlTable }}
                                          />
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Raw Content */}
                                    {!chunk.htmlTable && (
                                      <div className="text-sm bg-white border rounded-md p-4 max-h-80 overflow-auto">
                                        <div className="font-medium text-gray-700 mb-2">Content:</div>
                                        <div className="whitespace-pre-line text-gray-800">
                                          {cleanTextContent(chunk.content).split('\n').map((paragraph, i) => (
                                            <p key={i} className={i > 0 ? 'mt-2' : ''}>
                                              {paragraph}
                                            </p>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* AE Section */}
                      {retrievedContext.ae && retrievedContext.ae.length > 0 && (
                        <div className="border rounded-lg overflow-hidden shadow-sm mb-4 bg-white">
                          <div className="bg-gray-100 p-3 cursor-pointer flex items-center justify-between transition-colors"
                               onClick={() => setAeExpanded(!aeExpanded)}>
                            <div className="flex items-center">
                              {aeExpanded ? 
                                <ChevronDown className="w-4 h-4 text-orange-500" /> : 
                                <ChevronRight className="w-4 h-4 text-orange-500" />
                              }
                              <div className="flex items-center">
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                                  <AlertCircle size={14} className="text-orange-500" />
                                </div>
                                <h4 className="font-medium text-orange-600">Adverse Events / Serious Adverse Events</h4>
                                <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full ml-2">
                                  {retrievedContext.ae.length} {retrievedContext.ae.length === 1 ? 'item' : 'items'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {aeExpanded && (
                            <div className="divide-y divide-gray-100 animate-slideDown">
                              {retrievedContext.ae.map((chunk, index) => (
                                <div key={`ae-${index}`} className="p-4 hover:bg-gray-50 transition-colors">
                                  {/* Item Number */}
                                  <div className="mb-2">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-700 font-medium text-sm mr-2 shadow-sm">
                                      {index + 1}
                                    </span>
                                    <span className="text-sm text-gray-500">Item {index + 1} of {retrievedContext.ae.length}</span>
                                  </div>
                                  
                                  {/* Metadata */}
                                  <div className="mb-3 overflow-x-auto">
                                    <table className="min-w-full text-xs border-collapse shadow-sm rounded-lg overflow-hidden">
                                      <thead>
                                        <tr className="bg-gray-50">
                                          <th className="px-4 py-3 text-left font-bold text-gray-700 border border-gray-200">Property</th>
                                          <th className="px-4 py-3 text-left font-bold text-gray-700 border border-gray-200">Value</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {/* Display subActivity as Activity - always show even if empty */}
                                        <tr className="border-t border-gray-200 bg-white hover:bg-gray-50">
                                          <td className="px-4 py-3 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                            <strong>Activity</strong>
                                          </td>
                                          <td className="px-4 py-3 align-top text-gray-800 border border-gray-200">
                                            {chunk.subActivity ? cleanSubactivityValue(chunk.subActivity) : (chunk.activity || 'Unknown')}
                                          </td>
                                        </tr>
                                        
                                        {/* Display question as Sub-activity - always show even if empty */}
                                        <tr className="border-t border-gray-200 bg-white hover:bg-gray-50">
                                          <td className="px-4 py-3 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                            <strong>Sub-activity</strong>
                                          </td>
                                          <td className="px-4 py-3 align-top text-gray-800 border border-gray-200">
                                            {chunk.question || 'Unknown'}
                                          </td>
                                        </tr>
                                        
                                        {/* Display other metadata fields */}
                                        {Object.entries(chunk.metadata)
                                          .filter(([metaKey]) => metaKey !== 'text_as_html') // Exclude text_as_html from metadata table
                                          .filter(([metaKey]) => shouldShowMetadataField(metaKey, chunk.metadata))
                                          .map(([metaKey, metaValue]) => (
                                          <tr key={metaKey} className="border-t border-gray-200 bg-white hover:bg-gray-50">
                                            <td className="px-4 py-3 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                              {metaKey}
                                            </td>
                                            <td className="px-4 py-3 align-top text-gray-800 border border-gray-200">
                                              {metaKey === 'source' ? (
                                                <a 
                                                  href={mapSourceUrl(metaValue as string, chunk.metadata)} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  className="text-blue-600 hover:underline flex items-center"
                                                  onClick={(e) => {
                                                    if (!handleSourceLinkClick(metaValue as string, chunk.metadata)) {
                                                      e.preventDefault();
                                                    }
                                                  }}
                                                >
                                                  {String(metaValue).substring(0, 50)}
                                                  {String(metaValue).length > 50 ? '...' : ''}
                                                  <ExternalLink className="w-3 h-3 ml-1 inline" />
                                                </a>
                                              ) : (
                                                String(metaValue)
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  
                                  {/* Content */}
                                  <div className="relative">
                                    {/* HTML Table Section */}
                                    {chunk.htmlTable && (
                                      <div className="mb-4">
                                        <h5 className="font-medium text-gray-700 mb-2">Table Data:</h5>
                                        <div className="overflow-x-auto border rounded max-h-96">
                                          <style dangerouslySetInnerHTML={{ __html: htmlTableStyles }} />
                                          <div 
                                            className="p-2 text-sm html-table-container" 
                                            style={{
                                              '--header-bg-color': '#f3f4f6',
                                              '--header-text-color': '#374151'
                                            } as React.CSSProperties}
                                            dangerouslySetInnerHTML={{ __html: chunk.htmlTable }}
                                          />
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Raw Content */}
                                    {!chunk.htmlTable && (
                                      <div className="text-sm bg-white border rounded-md p-4 max-h-80 overflow-auto">
                                        <div className="font-medium text-gray-700 mb-2">Content:</div>
                                        <div className="whitespace-pre-line text-gray-800">
                                          {cleanTextContent(chunk.content).split('\n').map((paragraph, i) => (
                                            <p key={i} className={i > 0 ? 'mt-2' : ''}>
                                              {paragraph}
                                            </p>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Other Section */}
                      {retrievedContext.other && retrievedContext.other.length > 0 && (
                        <div className="border rounded-lg overflow-hidden shadow-sm mb-4 bg-white">
                          <div className="bg-gray-100 p-3 cursor-pointer flex items-center justify-between transition-colors"
                               onClick={() => setOtherExpanded(!otherExpanded)}>
                            <div className="flex items-center">
                              {otherExpanded ? 
                                <ChevronDown className="w-4 h-4 text-gray-700" /> : 
                                <ChevronRight className="w-4 h-4 text-gray-700" />
                              }
                              <div className="flex items-center">
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                                  <Database size={14} className="text-gray-700" />
                                </div>
                                <h4 className="font-medium text-gray-700">Other Context</h4>
                                <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full ml-2">
                                  {retrievedContext.other.length} {retrievedContext.other.length === 1 ? 'item' : 'items'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {otherExpanded && (
                            <div className="divide-y divide-gray-100 animate-slideDown">
                              {retrievedContext.other.map((chunk, index) => (
                                <div key={`other-${index}`} className="p-4 hover:bg-gray-50 transition-colors">
                                  {/* Item Number */}
                                  <div className="mb-2">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-700 font-medium text-sm mr-2 shadow-sm">
                                      {index + 1}
                                    </span>
                                    <span className="text-sm text-gray-500">Item {index + 1} of {retrievedContext.other.length}</span>
                                  </div>
                                  
                                  {/* Metadata */}
                                  <div className="mb-3 overflow-x-auto">
                                    <table className="min-w-full text-xs border-collapse shadow-sm rounded-lg overflow-hidden">
                                      <thead>
                                        <tr className="bg-gray-50">
                                          <th className="px-4 py-3 text-left font-bold text-gray-700 border border-gray-200">Property</th>
                                          <th className="px-4 py-3 text-left font-bold text-gray-700 border border-gray-200">Value</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {/* Display subActivity as Activity - always show even if empty */}
                                        <tr className="border-t border-gray-200 bg-white hover:bg-gray-50">
                                          <td className="px-4 py-3 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                            <strong>Activity</strong>
                                          </td>
                                          <td className="px-4 py-3 align-top text-gray-800 border border-gray-200">
                                            {chunk.subActivity ? cleanSubactivityValue(chunk.subActivity) : (chunk.activity || 'Unknown')}
                                          </td>
                                        </tr>
                                        
                                        {/* Display question as Sub-activity - always show even if empty */}
                                        <tr className="border-t border-gray-200 bg-white hover:bg-gray-50">
                                          <td className="px-4 py-3 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                            <strong>Sub-activity</strong>
                                          </td>
                                          <td className="px-4 py-3 align-top text-gray-800 border border-gray-200">
                                            {chunk.question || 'Unknown'}
                                          </td>
                                        </tr>
                                        
                                        {/* Display other metadata fields */}
                                        {Object.entries(chunk.metadata)
                                          .filter(([metaKey]) => metaKey !== 'text_as_html') // Exclude text_as_html from metadata table
                                          .filter(([metaKey]) => shouldShowMetadataField(metaKey, chunk.metadata))
                                          .map(([metaKey, metaValue]) => (
                                          <tr key={metaKey} className="border-t border-gray-200 bg-white hover:bg-gray-50">
                                            <td className="px-4 py-3 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                              {metaKey}
                                            </td>
                                            <td className="px-4 py-3 align-top text-gray-800 border border-gray-200">
                                              {metaKey === 'source' ? (
                                                <a 
                                                  href={mapSourceUrl(metaValue as string, chunk.metadata)} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  className="text-blue-600 hover:underline flex items-center"
                                                  onClick={(e) => {
                                                    if (!handleSourceLinkClick(metaValue as string, chunk.metadata)) {
                                                      e.preventDefault();
                                                    }
                                                  }}
                                                >
                                                  {String(metaValue).substring(0, 50)}
                                                  {String(metaValue).length > 50 ? '...' : ''}
                                                  <ExternalLink className="w-3 h-3 ml-1 inline" />
                                                </a>
                                              ) : (
                                                String(metaValue)
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  
                                  {/* Content */}
                                  <div className="relative">
                                    {/* HTML Table Section */}
                                    {chunk.htmlTable && (
                                      <div className="mb-4">
                                        <h5 className="font-medium text-gray-700 mb-2">Table Data:</h5>
                                        <div className="overflow-x-auto border rounded max-h-96">
                                          <style dangerouslySetInnerHTML={{ __html: htmlTableStyles }} />
                                          <div 
                                            className="p-2 text-sm html-table-container" 
                                            style={{
                                              '--header-bg-color': '#f3f4f6',
                                              '--header-text-color': '#374151'
                                            } as React.CSSProperties}
                                            dangerouslySetInnerHTML={{ __html: chunk.htmlTable }}
                                          />
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Raw Content */}
                                    {!chunk.htmlTable && (
                                      <div className="text-sm bg-white border rounded-md p-4 max-h-80 overflow-auto">
                                        <div className="font-medium text-gray-700 mb-2">Content:</div>
                                        <div className="whitespace-pre-line text-gray-800">
                                          {cleanTextContent(chunk.content).split('\n').map((paragraph, i) => (
                                            <p key={i} className={i > 0 ? 'mt-2' : ''}>
                                              {paragraph}
                                            </p>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* No chunks at all fallback */}
                      {(!retrievedContext.pd || retrievedContext.pd.length === 0) &&
                       (!retrievedContext.ae || retrievedContext.ae.length === 0) &&
                       (!retrievedContext.other || retrievedContext.other.length === 0) && (
                        <div className="text-center py-8 text-gray-500">
                          <p>No retrieved context available for this job</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="border-t p-4">
              <button
                onClick={() => {
                  setSelectedJob(null);
                  setAiMessages([]);
                  setFindings(null);
                  setRetrievedContext(null);
                  setShowPDFindings(false);
                  setShowAEFindings(false);
                  setShowContext(false);
                  setShowAgentMessages(true);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobHistoryPanel;
