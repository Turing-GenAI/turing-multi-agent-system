import React, { useState, useEffect } from 'react';
import { X, ExternalLink, RefreshCw, AlertCircle, CheckCircle, Clock, MessageSquare, Database, FileWarning, ChevronDown, ChevronRight, AlertTriangle, FileText, Copy, History, ClipboardList } from 'lucide-react';
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
  onJobCountChange?: (count: number) => void; // Add new prop to expose job count
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

const JobHistoryPanel: React.FC<JobHistoryPanelProps> = ({ onClose, onSelectJob, onJobCountChange }) => {
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
  const [retrievedContext, setRetrievedContext] = useState<{
    pd: any[];
    ae: any[];
    chunks: any[]
  }>({ pd: [], ae: [], chunks: [] });
  const [loadingContext, setLoadingContext] = useState<boolean>(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showD1Findings, setShowD1Findings] = useState<boolean>(false);
  const [showD2Findings, setShowD2Findings] = useState<boolean>(false);
  const [showContext, setShowContext] = useState<boolean>(false);
  const [showAgentMessages, setShowAgentMessages] = useState<boolean>(true);
  const [d1Expanded, setD1Expanded] = useState(false);
  const [d2Expanded, setD2Expanded] = useState(false);
  
  // Cache for job data to prevent refetching
  const [jobCache, setJobCache] = useState<Record<string, JobCache>>({});

  useEffect(() => {
    initialFetchJobs();
  }, []);

  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      .html-table-container table {
        border-collapse: collapse;
        width: 100%;
        margin-bottom: 1rem;
        font-size: 0.875rem;
        table-layout: auto;
      }
      .html-table-container th,
      .html-table-container td {
        border: 1px solid #e2e8f0;
        padding: 0.75rem 0.5rem;
        text-align: left;
        vertical-align: top;
        word-break: normal;
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .html-table-container th {
        background-color: var(--header-bg-color, #f8fafc);
        font-weight: 600;
        color: var(--header-text-color, #334155);
        position: sticky;
        top: 0;
        z-index: 1;
        white-space: nowrap;
      }
      .html-table-container tr:nth-child(even) {
        background-color: #f8fafc;
      }
      .html-table-container tr:hover {
        background-color: #f1f5f9;
      }
      .html-table-container tbody tr:hover td {
        background-color: rgba(236, 253, 245, 0.4);
      }
    `;
    document.head.appendChild(styleTag);
    
    // Clean up when component unmounts
    return () => {
      if (styleTag.parentNode) {
        styleTag.parentNode.removeChild(styleTag);
      }
    };
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
        if (onJobCountChange) {
          onJobCountChange(sortedJobs.length);
        }
      } else {
        // Successfully contacted the API but no jobs were returned
        setJobs([]);
        if (onJobCountChange) {
          onJobCountChange(0);
        }
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError("Failed to load job history. The backend API may be unavailable or experiencing issues. Please try again later.");
      // Don't modify the jobs array when there's an API error
      // This ensures we show the error message instead of "No jobs found"
    } finally {
      setLoading(false);
    }
  };

  // Refresh jobs with a separate refreshing state
  const fetchJobs = async () => {
    // Prevent multiple fetches
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    
    // Keep the previous error state until we confirm success or a new error
    // Don't clear error right away to prevent flickering to "No jobs found" state
    
    try {
      const response = await auditService.getJobs();
      // Only clear error state when we have a successful response
      setError(null);
      
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
        if (onJobCountChange) {
          onJobCountChange(sortedJobs.length);
        }
      } else {
        // Successfully contacted the API but no jobs were returned
        setJobs([]);
        if (onJobCountChange) {
          onJobCountChange(0);
        }
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError("Failed to load job history. The backend API may be unavailable or experiencing issues. Please try again later.");
      // Don't modify the jobs array when there's an API error
      // This ensures we show the error message instead of "No jobs found"
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
          setJobCache(prevCache => {
            const updatedCache: Record<string, JobCache> = {
              ...prevCache,
              [jobId]: cachedData as JobCache
            };
            return updatedCache;
          });
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
        setJobCache(prevCache => {
          const updatedCache: Record<string, JobCache> = {
            ...prevCache,
            [jobId]: cacheData as JobCache
          };
          return updatedCache;
        });
        
        // Save to localStorage
        try {
          const localStorageKey = `job_cache_${jobId}`;
          
          // Limit the size of data saved to localStorage by extracting
          // only essential fields to avoid quota errors
          const essentialCacheData = {
            aiMessages: cacheData.aiMessages?.map(msg => ({
              id: msg.id,
              role: msg.role,
              content: msg.content && msg.content.length > 500 ? 
                msg.content.substring(0, 500) + '...' : msg.content
            })) || [],
            
            // Store simplified findings data
            findings: {
              pd: (cacheData.findings?.pd || []).map(item => ({
                id: item.id,
                content: item.content && item.content.length > 500 ? 
                  item.content.substring(0, 500) + '...' : item.content
              })),
              ae: (cacheData.findings?.ae || []).map(item => ({
                id: item.id,
                content: item.content && item.content.length > 500 ? 
                  item.content.substring(0, 500) + '...' : item.content
              }))
            },
            
            // Skip storing large retrieved context in localStorage
            retrievedContext: null,
            
            timestamp: cacheData.timestamp
          };
          
          localStorage.setItem(localStorageKey, JSON.stringify(essentialCacheData));
          console.log(`Saved job ${jobId} data to localStorage (limited size)`);
        } catch (err) {
          console.error("Error saving to localStorage:", err);
          // If localStorage fails, try to clear some old entries and try again
          try {
            // Clear old entries that might be taking up space
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('job_cache_') && key !== `job_cache_${jobId}`) {
                keysToRemove.push(key);
              }
            }
            
            // Remove a few old entries to make space
            if (keysToRemove.length > 0) {
              // Remove oldest 5 entries or fewer if we have less
              const toRemove = keysToRemove.slice(0, Math.min(5, keysToRemove.length));
              toRemove.forEach(key => localStorage.removeItem(key));
              console.log(`Cleared ${toRemove.length} old entries from localStorage`);
            }
          } catch (clearErr) {
            console.error("Error clearing localStorage:", clearErr);
          }
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
        setRetrievedContext({ pd: [], ae: [], chunks: [] });
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
    
    // Always hide site_area regardless of document type
    if (key === 'site_area') {
      return false;
    }
    
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

  // Helper function to map metadata keys to user-friendly display names
  const getMetadataDisplayName = (key: string): string => {
    const displayNameMap: Record<string, string> = {
      'source': 'Source',
      'chunk_index': 'Page Number',
      'file_name': 'File Name',
      'relative_path': 'Relative Path',
      'sql_query': 'SQL Query',
    };
    
    return displayNameMap[key] || key;
  };

  // Helper function to map source URLs for external links
  const mapSourceUrl = (url: string, metadata?: any): string => {
    // If URL is already a valid URL, return it
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    let mappedUrl = url;
    
    // Map specific sources to Box URLs
    if (url === 'rag_db.ae_sae.adverse_events') {
      mappedUrl = 'https://app.box.com/s/yhpjlgh9obecc9y4yv2ulwsfeahobmdg';
    } else if (url === 'rag_db.pd.protocol_deviation') {
      mappedUrl = 'https://app.box.com/s/vh13jqxkobcn2munalyn99fb660uwmp6';
    }
    
    // Check for specific file names in metadata
    if (metadata) {
      // Check both filename and file_name fields
      const fileName = metadata.filename || metadata.file_name;
      
      if (fileName) {
        console.log('Found filename in metadata:', fileName);
        
        // Handle specific filenames
        if (fileName === 'Inspection Readiness Guidance V4.0.pdf' || url === 'Inspection Readiness Guidance V4.0.pdf') {
          mappedUrl = 'https://app.box.com/s/tj41ww272kasc6cczqra6m8y7ljipeik';
        }
        
        // Handle Excel files related to adverse events
        if (fileName.includes('Adverse Events.xlsx') || fileName.toLowerCase().includes('adverse_events')) {
          mappedUrl = 'https://app.box.com/s/yhpjlgh9obecc9y4yv2ulwsfeahobmdg';
        }
        
        // Handle Excel files related to protocol deviations
        if (fileName.includes('protocol_deviation.xlsx') || fileName.toLowerCase().includes('protocol_deviation')) {
          mappedUrl = 'https://app.box.com/s/vh13jqxkobcn2munalyn99fb660uwmp6';
        }
      }
    }
    
    // Legacy mappings for backward compatibility
    if (url.includes('protocol_deviation.xlsx')) {
      mappedUrl = 'https://app.box.com/s/vh13jqxkobcn2munalyn99fb660uwmp6';
    } else if (url.includes('AE_SAE/data/filtered_RaveReport_example') && url.includes('Adverse Events.xlsx')) {
      mappedUrl = 'https://app.box.com/s/yhpjlgh9obecc9y4yv2ulwsfeahobmdg';
    } else if (url.includes('Inspection Readiness Guidance V4.0.pdf')) {
      mappedUrl = 'https://app.box.com/s/tj41ww272kasc6cczqra6m8y7ljipeik';
    }
    
    return mappedUrl;
  };

  // Format relevance score as percentage
  const formatRelevanceScore = (score?: number): string => {
    if (score === undefined) return 'N/A';
    return `${(score * 100).toFixed(1)}%`;
  };

  // Function to handle source link click
  const handleSourceLinkClick = (url: string, metadata?: any): boolean => {
    console.log('Handling source link click:', { url, metadata });
    
    // If source is already a URL, allow default behavior
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return true;
    }
    
    // Check for specific file names in metadata
    if (metadata) {
      const fileName = metadata.filename || metadata.file_name;
      
      // Handle specific file types
      if (fileName) {
        // Check if it's an Excel file or other supported file type
        const isExcelFile = fileName.toLowerCase().endsWith('.xlsx') || 
                           fileName.toLowerCase().endsWith('.xls') ||
                           fileName.toLowerCase().includes('adverse_events') ||
                           fileName.toLowerCase().includes('protocol_deviation');
                           
        const isPdfFile = fileName.toLowerCase().endsWith('.pdf');
        
        // For Excel files and PDFs, allow default behavior to open Box URL
        if (isExcelFile || isPdfFile) {
          return true;
        }
      }
    }
    
    // For other file paths, allow default behavior
    return true;
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
      .replace(/^\d+_/, '') // Remove numeric prefixes (e.g., "1_", "2_", etc.)
      .replace(/^(sub[-_\s]?activity|activity)[:;]?\s*/i, ''); // Remove activity/subactivity prefix
    
    // Return formatted string with activity ID if available
    return activityId ? `${activityId} - ${cleanedText}` : cleanedText;
  };

  // Function to clean up text content from the backend
  const cleanTextContent = (text: string, extractTable: boolean = false): { cleanedText: string, extractedTable?: string } => {
    if (!text) return { cleanedText: '' };
    
    // First check if the content has HTML tables
    if (text.includes('<table') && text.includes('</table>')) {
      // Extract the table if needed
      let extractedTable: string | undefined = undefined;
      
      if (extractTable) {
        const tableMatch = text.match(/(<table[\s\S]*?<\/table>)/);
        if (tableMatch) {
          let tableHtml = tableMatch[1];
            
          // Make sure the table has proper class for styling
          if (!tableHtml.includes('class=')) {
            tableHtml = tableHtml.replace('<table', '<table class="table"');
          }
            
          // Ensure thead and tbody are present
          if (!tableHtml.includes('<thead>')) {
            tableHtml = tableHtml.replace(/<tr>\s*(<th[\s\S]*?<\/tr>)/, '<thead>$&</thead>');
          }
            
          if (!tableHtml.includes('<tbody>')) {
            // If there's a thead, add tbody after it
            if (tableHtml.includes('</thead>')) {
              tableHtml = tableHtml.replace('</thead>', '</thead><tbody>') + '</tbody>';
            } 
            // Otherwise wrap all content except the first row in tbody (assuming first row is header)
            else {
              const firstRowEnd = tableHtml.indexOf('</tr>') + 5;
              tableHtml = 
                tableHtml.substring(0, firstRowEnd) + 
                '<tbody>' + 
                tableHtml.substring(firstRowEnd) + 
                '</tbody>';
            }
          }
          
          extractedTable = tableHtml;
        }
      }
      
      // Remove HTML tables from content to avoid displaying them as raw HTML
      return {
        cleanedText: text
          .replace(/<table[\s\S]*?<\/table>/g, '[TABLE_DATA]')
          .replace(/�/g, 'ti')
          .replace(/�/g, 'i'),
        extractedTable
      };
    }
    
    // Only fix common encoding issues without changing formatting
    return {
      cleanedText: text
        .replace(/�/g, 'ti') // Fix common encoding issues like "Inspec�on" -> "Inspection"
        .replace(/�/g, 'i') // Another common encoding issue
    };
  };

  // Get timezone string in format UTC+/-XX:XX
  const getTimeZoneString = () => {
    const offset = new Date().getTimezoneOffset();
    const hours = Math.abs(Math.floor(offset / 60));
    const minutes = Math.abs(offset % 60);
    const sign = offset <= 0 ? '+' : '-';
    return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    // Format: Jan 15, 2025, 10:30 AM (UTC+5:30)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date) + ' (' + getTimeZoneString() + ')';
  };

  // Format date range to a more readable format
  const formatDateRange = (dateRange: string) => {
    if (!dateRange) return '';
    
    // Helper function to format a date string in YYYY-MM-DD format
    const formatSingleDate = (dateStr: string) => {
      // Check if it matches YYYY-MM-DD format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(dateStr)) {
        try {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            // Format: Jan 15, 2025
            const options: Intl.DateTimeFormatOptions = {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            };
            return date.toLocaleDateString('en-US', options);
          }
        } catch (e) {
          // If parsing fails, return the original string
          return dateStr;
        }
      }
      return dateStr; // Return original if not in YYYY-MM-DD format
    };
    
    // If it contains "to", split and format each part
    if (dateRange.includes('to')) {
      const [start, end] = dateRange.split('to').map(d => d.trim());
      return `${formatSingleDate(start)} - ${formatSingleDate(end)}`;
    } 
    // If it contains "-" as a separator (not within a date), split and format
    else if (dateRange.includes(' - ')) {
      const [start, end] = dateRange.split(' - ').map(d => d.trim());
      return `${formatSingleDate(start)} - ${formatSingleDate(end)}`;
    }
    // If it's a single date, just format it
    else if (/^\d{4}-\d{2}-\d{2}$/.test(dateRange)) {
      return formatSingleDate(dateRange);
    }
    
    // If it's not in any recognized format, return as is
    return dateRange;
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
        let formattedMetadata = '';
        if (activityMatch || subActivityMatch) {
          if (activityMatch) {
            const activityValue = cleanSubactivityValue(activityMatch[1]);
            if (activityValue) {
              formattedMetadata += `<div class="text-sm font-medium text-blue-600 mb-1">Activity: ${activityValue}</div>`;
            }
          }
          
          if (subActivityMatch) {
            const subActivityValue = cleanSubactivityValue(subActivityMatch[1]);
            if (subActivityValue) {
              formattedMetadata += `<div class="text-sm font-medium text-blue-600 mb-1">Sub-Activity: ${subActivityValue}</div>`;
            }
          }
        }
        
        // Check if content contains HTML table
        const hasHtmlTable = content.includes('<table') && content.includes('</table>');
        let htmlTableContent = null;
        
        // Extract the table element if present and ensure it has proper format
        if (hasHtmlTable) {
          const tableMatch = content.match(/(<table[\s\S]*?<\/table>)/);
          if (tableMatch) {
            // Process the table to ensure it has proper structure
            let tableHtml = tableMatch[1];
            
            // Make sure the table has proper class for styling
            if (!tableHtml.includes('class=')) {
              tableHtml = tableHtml.replace('<table', '<table class="table"');
            }
            
            // Ensure thead and tbody are present
            if (!tableHtml.includes('<thead>')) {
              tableHtml = tableHtml.replace(/<tr>\s*(<th[\s\S]*?<\/tr>)/, '<thead>$&</thead>');
            }
            
            if (!tableHtml.includes('<tbody>')) {
              // If there's a thead, add tbody after it
              if (tableHtml.includes('</thead>')) {
                tableHtml = tableHtml.replace('</thead>', '</thead><tbody>') + '</tbody>';
              } 
              // Otherwise wrap all content except the first row in tbody (assuming first row is header)
              else {
                const firstRowEnd = tableHtml.indexOf('</tr>') + 5;
                tableHtml = 
                  tableHtml.substring(0, firstRowEnd) + 
                  '<tbody>' + 
                  tableHtml.substring(firstRowEnd) + 
                  '</tbody>';
              }
            }
            
            htmlTableContent = tableHtml;
            
            // Remove the table from the content to avoid duplication
            content = content.replace(tableMatch[0], '[TABLE_DATA]');
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
        
        // Split the content by the [TABLE_DATA] placeholder
        const contentParts = hasHtmlTable && content.includes('[TABLE_DATA]') 
          ? content.split('[TABLE_DATA]') 
          : [content];
        
        return (
          <div key={idx} className="rounded-lg shadow-sm bg-white border border-gray-200 mb-3 overflow-hidden transition-all hover:shadow-md">
            <div className="font-medium px-4 py-2 bg-white border-b border-gray-200 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-blue-600" />
              <span className="text-blue-700">{displayName}</span>
            </div>
            <div className="px-4 py-3 text-gray-800">
              {/* Render metadata */}
              {formattedMetadata && (
                <div dangerouslySetInnerHTML={{ __html: formattedMetadata }} />
              )}
              
              {/* Render first part of content */}
              <div className="whitespace-pre-wrap mb-2" dangerouslySetInnerHTML={{ __html: contentParts[0] }} />
              
              {/* Render HTML table if present */}
              {htmlTableContent && (
                <div className="mb-4">
                  <h5 className="font-medium text-gray-700 mb-2">Table Data:</h5>
                  <div className="overflow-x-auto border rounded shadow-sm">
                    <style dangerouslySetInnerHTML={{ __html: `
                      .html-table-container {
                        max-height: 400px;
                        overflow-y: auto;
                      }
                      .html-table-container table {
                        border-collapse: collapse;
                        width: 100%;
                        margin-bottom: 1rem;
                        font-size: 0.875rem;
                        table-layout: auto;
                      }
                      .html-table-container th,
                      .html-table-container td {
                        border: 1px solid #e2e8f0;
                        padding: 0.75rem 0.5rem;
                        text-align: left;
                        vertical-align: top;
                        word-break: normal;
                        max-width: 300px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                      }
                      .html-table-container th {
                        background-color: var(--header-bg-color, #f8fafc);
                        font-weight: 600;
                        color: var(--header-text-color, #334155);
                        position: sticky;
                        top: 0;
                        z-index: 1;
                        white-space: nowrap;
                      }
                      .html-table-container tr:nth-child(even) {
                        background-color: #f8fafc;
                      }
                      .html-table-container tr:hover {
                        background-color: #f1f5f9;
                      }
                      .html-table-container tbody tr:hover td {
                        background-color: rgba(236, 253, 245, 0.4);
                      }
                    ` }} />
                    <div 
                      className="p-2 text-sm html-table-container" 
                      style={{
                        '--header-bg-color': '#f7f7f7',
                        '--header-text-color': '#333'
                      } as React.CSSProperties}
                      dangerouslySetInnerHTML={{ __html: htmlTableContent }} 
                    />
                  </div>
                </div>
              )}
              
              {/* Render remaining content if split by table */}
              {contentParts.length > 1 && (
                <div className="whitespace-pre-wrap mt-2" dangerouslySetInnerHTML={{ __html: contentParts[1] }} />
              )}
            </div>
          </div>
        );
      });
    } catch (error) {
      console.error("Error formatting agent message:", error, message);
      return <div className="text-red-500">Error displaying message</div>;
    }
  };

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
  const renderD1Table = (findingData: any) => {
    if (!findingData.table || findingData.table.length === 0) return null;
    
    return (
      <div className="overflow-x-auto overflow-y-auto mt-4" style={{ maxHeight: '350px' }}>
        <table className="w-full divide-y divide-gray-200 border-collapse shadow-sm rounded-lg overflow-hidden">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24 border border-gray-200">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32 border border-gray-200">Protocol</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32 border border-gray-200">Site</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">Category</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">Severity</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32 border border-gray-200">Deviation</th>
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
  const renderD2Table = (findingData: any) => {
    if (!findingData.table || findingData.table.length === 0) return null;
    
    return (
      <div className="overflow-x-auto overflow-y-auto mt-4" style={{ maxHeight: '350px' }}>
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
    const d1Chunks: any[] = [];
    const d2Chunks: any[] = [];
    
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
                        const sourceStr = contextItem.metadata.source ? contextItem.metadata.source.toLowerCase() : '';
                        
                        // First check for pre-rendered HTML table in metadata
                        if (contextItem.metadata.text_as_html) {
                          htmlTable = contextItem.metadata.text_as_html;
                        } 
                        // Check if the content itself contains an HTML table
                        else if (contextItem.page_content && 
                                 typeof contextItem.page_content === 'string' && 
                                 contextItem.page_content.includes('<table') && 
                                 contextItem.page_content.includes('</table>')) {
                          
                          // Extract the table using our cleanTextContent function
                          const { extractedTable } = cleanTextContent(contextItem.page_content, true);
                          if (extractedTable) {
                            htmlTable = extractedTable;
                          }
                        }
                        // For spreadsheet files, try to generate an HTML table if one doesn't exist
                        else if (sourceStr && 
                               (sourceStr.endsWith('.xlsx') || 
                                sourceStr.endsWith('.xls') || 
                                sourceStr.endsWith('.csv'))) {
                          // Try to detect if content might be tabular
                          const lines = contextItem.page_content.split('\n');
                          const potentialHeaders = lines[0]?.split(',') || [];
                          
                          if (potentialHeaders.length > 2) {
                            // Simple CSV detection heuristic: if first line has commas and we have multiple lines
                            const tableRows = lines.map((line: string) => {
                              const cells = line.split(',');
                              return `<tr>${cells.map((cell: string) => `<td>${cell.trim()}</td>`).join('')}</tr>`;
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
                        // For PDF files, we'll show raw content (htmlTable remains null)
                        
                        // Try to extract activity and subActivity info
                        let activity = '';
                        let subActivity = '';
                        let question = '';
                        let relevanceScore = undefined;
                        let summary = null;
                        
                        // Try to extract activity from the context key or path
                        if (contextKey.includes('PD') || key1.includes('PD') || key2.includes('PD') || key3.includes('PD')) {
                          activity = 'D1';
                        } else if (contextKey.includes('AE_SAE') || contextKey.includes('AE') || 
                                  key1.includes('AE_SAE') || key1.includes('AE') || 
                                  key2.includes('AE_SAE') || key2.includes('AE') || 
                                  key3.includes('AE_SAE') || key3.includes('AE')) {
                          activity = 'D2';
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
                        
                        // Extract relevance score if available
                        if (contextItem.metadata.relevance_score !== undefined) {
                          relevanceScore = parseFloat(contextItem.metadata.relevance_score);
                        }
                        
                        // Extract summary if available
                        if (contextItem.metadata.summary) {
                          summary = contextItem.metadata.summary;
                        }
                        
                        const chunk = {
                          source: contextItem.metadata?.source || sourceStr || 'Unknown Source',
                          sourcePath: contextItem.metadata?.source_path || sourceStr,
                          activity,
                          subActivity,
                          question,
                          relevanceScore,
                          summary,
                          content: contextItem.page_content || '',
                          htmlTable,
                          metadata: contextItem.metadata || {} // Ensure metadata is always defined
                        };
                        
                        // Add to the appropriate list based on activity type
                        if (activity === 'D1') {
                          d1Chunks.push(chunk);
                        } else if (activity === 'D2') {
                          d2Chunks.push(chunk);
                        }
                        
                        console.log('Added chunk:', chunk);
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
    
    return {
      pd: d1Chunks,
      ae: d2Chunks,
      chunks: [...d1Chunks, ...d2Chunks] // Keep the original format for backward compatibility
    };
  };

  // Function to copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(text);
      setTimeout(() => {
        setCopiedText(null);
      }, 2000);
    });
  };

  // Handle job click to view details
  const handleJobClick = (jobId: string) => {
    setSelectedJob(jobId);
    fetchJobDetail(jobId);
  };

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[85vh] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-5 border-b">
        <h2 className="text-xl font-semibold flex items-center">
          <History className="w-5 h-5 mr-2 text-blue-600" />
          Job History
        </h2>
        <div className="flex space-x-3">
          <button
            onClick={fetchJobs}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-all disabled:opacity-50"
            title="Refresh job list"
            disabled={loading || isRefreshing}
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100"
            title="Close panel"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1 p-6">
        {loading ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm min-h-[400px] min-w-[600px] w-full flex flex-col justify-center items-center bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading job history...</p>
          </div>
        ) : error ? (
          <div className="space-y-6">
            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md min-w-[600px] w-full">
              {/* Card header with status - similar to job card header */}
              <div className="flex justify-between items-center px-5 py-3 bg-white border-b border-gray-200">
                <div className="flex items-center">
                  <div className="w-8 h-8 flex items-center justify-center bg-red-100 rounded-full mr-3">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <h3 className="font-medium text-gray-800">Connection Error</h3>
                </div>
              </div>
              
              {/* Card body with error message - maintaining consistency with job cards */}
              <div className="px-5 py-6 bg-white">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 text-red-600" />
                  <div>
                    <p className="text-red-700 font-medium mb-2">Failed to load job history</p>
                    <p className="text-gray-600">{error}</p>
                    <button 
                      onClick={fetchJobs}
                      className="mt-4 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md flex items-center"
                      disabled={isRefreshing}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="space-y-6">
            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md min-w-[600px] w-full">
              {/* Card header with status - similar to job card header */}
              <div className="flex justify-between items-center px-5 py-3 bg-white border-b border-gray-200">
                <div className="flex items-center">
                  <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full mr-3">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <h3 className="font-medium text-gray-800">Job History</h3>
                </div>
              </div>
              
              {/* Card body with no jobs message - maintaining consistency with job cards */}
              <div className="px-5 py-12 bg-white">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                    <ClipboardList className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="text-xl font-medium text-gray-700 mb-3">No job history found</p>
                  <p className="text-gray-500 max-w-md">Jobs will appear here when you run them</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map(job => (
              <div 
                key={job.id}
                className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md group"
                onClick={() => handleJobClick(job.id)}
              >
                {/* Card header with status */}
                <div className="flex justify-between items-center px-5 py-3 bg-white border-b border-gray-200">
                  <div className="flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full mr-3">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h3 className="font-medium text-gray-800">
                      Job <span className="font-mono font-bold text-blue-700">{job.id}</span>
                      <button 
                        className="ml-1 inline-flex items-center justify-center p-1 rounded-full hover:bg-gray-200 focus:outline-none"
                        title="Copy Job ID"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent job click
                          copyToClipboard(job.id);
                        }}
                      >
                        {copiedText === job.id ? 
                          <CheckCircle className="w-3 h-3 text-green-500" /> : 
                          <Copy className="w-3 h-3 text-blue-600/70" />
                        }
                      </button>
                    </h3>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center ${getStatusColor(job.status)}`}>
                    {getStatusIcon(job.status)}
                    <span className="ml-1.5">{job.status}</span>
                  </div>
                </div>
                
                {/* Card body with details */}
                <div className="px-5 py-4 hover:bg-gray-50/80 transition-all cursor-pointer">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    {/* Left column */}
                    <div>
                      <div className="flex">
                        <div className="w-24 text-xs font-medium text-gray-500 uppercase tracking-wider pt-1">Trial</div>
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="font-medium text-gray-800">{job.trial_id}</span>
                            <button 
                              className="ml-1 inline-flex items-center justify-center p-1 rounded-full hover:bg-gray-200 focus:outline-none"
                              title="Copy Trial ID"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent job click
                                copyToClipboard(job.trial_id);
                              }}
                            >
                              {copiedText === job.trial_id ? 
                                <CheckCircle className="w-3 h-3 text-green-500" /> : 
                                <Copy className="w-3 h-3 text-blue-600/70" />
                              }
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex mt-3">
                        <div className="w-24 text-xs font-medium text-gray-500 uppercase tracking-wider pt-1">Site</div>
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="font-medium text-gray-800">{job.site_id}</span>
                            <button 
                              className="ml-1 inline-flex items-center justify-center p-1 rounded-full hover:bg-gray-200 focus:outline-none"
                              title="Copy Site ID"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent job click
                                copyToClipboard(job.site_id);
                              }}
                            >
                              {copiedText === job.site_id ? 
                                <CheckCircle className="w-3 h-3 text-green-500" /> : 
                                <Copy className="w-3 h-3 text-blue-600/70" />
                              }
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right column */}
                    <div>
                      <div className="flex">
                        <div className="w-24 text-xs font-medium text-gray-500 uppercase tracking-wider pt-1">Date Range</div>
                        <div className="flex-1">
                          <span className="font-medium text-gray-800">{formatDateRange(job.date)}</span>
                        </div>
                      </div>
                      
                      <div className="flex mt-3">
                        <div className="w-24 text-xs font-medium text-gray-500 uppercase tracking-wider pt-1">Created</div>
                        <div className="flex-1">
                          <span className="text-gray-700">{formatDate(job.created_at)}</span>
                        </div>
                      </div>
                      
                      {job.completed_at && (
                        <div className="flex mt-3">
                          <div className="w-24 text-xs font-medium text-gray-500 uppercase tracking-wider pt-1">Completed</div>
                          <div className="flex-1">
                            <span className="text-gray-700">{formatDate(job.completed_at)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Card footer with action */}
                <div className="px-5 py-3 border-t border-gray-200 bg-white flex justify-end">
                  <div className="text-blue-600 text-sm font-medium flex items-center group-hover:text-blue-700 transition-colors cursor-pointer hover">
                    <span>View details</span>
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform duration-200" />
                  </div>
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
              setRetrievedContext({ pd: [], ae: [], chunks: [] });
              setShowD1Findings(false);
              setShowD2Findings(false);
              setShowContext(false);
              setShowAgentMessages(true);
            }
          }}
        >
          <div className="animate-fadeIn bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Job Details: <span className="font-mono font-bold text-blue-700 ml-1">{selectedJob}</span>
                <button 
                  className="ml-1 inline-flex items-center justify-center p-1 rounded-full hover:bg-gray-200 focus:outline-none"
                  title="Copy Job ID"
                  onClick={() => {
                    copyToClipboard(selectedJob || '');
                  }}
                >
                  {copiedText === selectedJob ? 
                    <CheckCircle className="w-3 h-3 text-green-500" /> : 
                    <Copy className="w-3 h-3 text-blue-600/70" />
                  }
                </button>
              </h2>
              <button
                onClick={() => {
                  setSelectedJob(null);
                  setAiMessages([]);
                  setFindings(null);
                  setRetrievedContext({ pd: [], ae: [], chunks: [] });
                  setShowD1Findings(false);
                  setShowD2Findings(false);
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
            <div className="p-4 bg-white border-b flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setShowAgentMessages(true);
                  setShowD1Findings(false);
                  setShowD2Findings(false);
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
                  setShowD1Findings(true);
                  setShowD2Findings(false);
                  setShowContext(false);
                  setShowAgentMessages(false);
                }}
                disabled={loadingFindings}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                  showD1Findings ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                } ${loadingFindings ? 'opacity-50' : ''}`}
              >
                <AlertTriangle className="w-4 h-4" />
                {loadingFindings ? (
                  <span className="flex items-center">
                    <RefreshCw className="w-3 h-3 mr-2 animate-spin" /> Loading D1...
                  </span>
                ) : (
                  <span>Domain 1 Findings</span>
                )}
              </button>
              
              <button
                onClick={() => {
                  setShowD2Findings(true);
                  setShowD1Findings(false);
                  setShowContext(false);
                  setShowAgentMessages(false);
                }}
                disabled={loadingFindings}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                  showD2Findings ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                } ${loadingFindings ? 'opacity-50' : ''}`}
              >
                <AlertCircle className="w-4 h-4" />
                {loadingFindings ? (
                  <span className="flex items-center">
                    <RefreshCw className="w-3 h-3 mr-2 animate-spin" /> Loading D2...
                  </span>
                ) : (
                  <span>Domain 2 Findings</span>
                )}
              </button>
              
              <button
                onClick={() => {
                  setShowContext(true);
                  setShowD1Findings(false);
                  setShowD2Findings(false);
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
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="px-4 py-3 border-b bg-white flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-blue-700 flex items-center">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Agent Messages
                    </h3>
                    {/* Optional actions could go here */}
                  </div>
                  
                  {loadingMessages ? (
                    <div className="flex justify-center items-center h-32 bg-white">
                      <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mr-2" />
                      <span className="text-gray-600">Loading messages...</span>
                    </div>
                  ) : messageError ? (
                    <div className="bg-red-50 p-4 text-red-700 flex items-start">
                      <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <p>{messageError}</p>
                    </div>
                  ) : !aiMessages || aiMessages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-white">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>No agent messages found for this job</p>
                    </div>
                  ) : (
                    <div className="space-y-2 p-4 bg-white">
                      {Array.isArray(aiMessages) ? aiMessages.map((message, index) => (
                        <div key={index}>
                          {formatAgentMessage(message)}
                        </div>
                      )) : (
                        <div>
                          {typeof aiMessages === 'string' ? formatAgentMessage(aiMessages) : 
                            <div className="text-red-500 p-3 bg-red-50 rounded-lg">Invalid message format</div>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Show PD Findings */}
              {showD1Findings && (
                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4 text-yellow-600 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Domain 1 Findings
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
                      <p>No Domain 1 findings for this job</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden shadow-sm mb-4 bg-white">
                      <div className="bg-white p-3 cursor-pointer flex items-center justify-between transition-colors"
                           onClick={() => setD1Expanded(!d1Expanded)}>
                        <div className="flex items-center">
                          {d1Expanded ? 
                            <ChevronDown className="w-4 h-4 text-gray-700" /> : 
                            <ChevronRight className="w-4 h-4 text-gray-700" />
                          }
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                              <AlertTriangle size={14} className="text-yellow-500" />
                            </div>
                            <h4 className="font-medium text-yellow-600">Domain 1</h4>
                            <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full ml-2">
                              {findings.pd.length} {findings.pd.length === 1 ? 'item' : 'items'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {d1Expanded && (
                        <div className="divide-y divide-gray-100 animate-slideDown">
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
                                      {cleanTextContent(finding.content, true).cleanedText.replace(/Domain 1|D1:|Subject:|Site:|Category:|Description:/gi, (match: string) => `**${match}**`)}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Table data if available */}
                              {finding.table && finding.table.length > 0 && (
                                <div className="mt-4">
                                  <h5 className="font-medium text-gray-700 mb-2">Table Data:</h5>
                                  {renderD1Table(finding)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Show AE Findings */}
              {showD2Findings && (
                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4 text-orange-600 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Domain 2 Findings
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
                      <p>No Domain 2 findings for this job</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden shadow-sm mb-4 bg-white">
                      <div className="bg-white p-3 cursor-pointer flex items-center justify-between transition-colors"
                           onClick={() => setD2Expanded(!d2Expanded)}>
                        <div className="flex items-center">
                          {d2Expanded ? 
                            <ChevronDown className="w-4 h-4 text-gray-700" /> : 
                            <ChevronRight className="w-4 h-4 text-gray-700" />
                          }
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                              <AlertCircle size={14} className="text-orange-500" />
                            </div>
                            <h4 className="font-medium text-orange-600">Domain 2</h4>
                            <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full ml-2">
                              {findings.ae.length} {findings.ae.length === 1 ? 'item' : 'items'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {d2Expanded && (
                        <div className="divide-y divide-gray-100 animate-slideDown">
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
                                      {cleanTextContent(finding.content, true).cleanedText.replace(/Domain 2|D2:|Subject:|Site:|Event:|Grade:|Start Date:|End Date:|Seriousness:|Treatment:/gi, (match: string) => `**${match}**`)}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Table data if available */}
                              {finding.table && finding.table.length > 0 && (
                                <div className="mt-4">
                                  <h5 className="font-medium text-gray-700 mb-2">Table Data:</h5>
                                  {renderD2Table(finding)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
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
                          <div className="bg-white p-3 cursor-pointer flex items-center justify-between transition-colors"
                               onClick={() => setD1Expanded(!d1Expanded)}>
                            <div className="flex items-center">
                              {d1Expanded ? 
                                <ChevronDown className="w-4 h-4 text-gray-700" /> : 
                                <ChevronRight className="w-4 h-4 text-gray-700" />
                              }
                              <div className="flex items-center">
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                                  <AlertTriangle size={14} className="text-gray-700" />
                                </div>
                                <h4 className="font-medium text-gray-700">Domain 1</h4>
                                <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full ml-2">
                                  {retrievedContext.pd.length} {retrievedContext.pd.length === 1 ? 'item' : 'items'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {d1Expanded && (
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
                                    <table className="min-w-full text-xs border-collapse">
                                      <thead>
                                        <tr className="bg-gray-50">
                                          <th className="px-3 py-2 text-left font-medium text-gray-600 border border-gray-200">Property</th>
                                          <th className="px-3 py-2 text-left font-medium text-gray-600 border border-gray-200">Value</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {/* Display subActivity as Activity */}
                                        {chunk.subActivity && (
                                          <tr className="border-t border-gray-200 bg-white hover:bg-gray-50">
                                            <td className="px-3 py-2 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                              Activity
                                            </td>
                                            <td className="px-3 py-2 align-top text-gray-800 border border-gray-200">
                                              {cleanSubactivityValue(chunk.subActivity)}
                                            </td>
                                          </tr>
                                        )}
                                        
                                        {/* Display question as Sub-activity */}
                                        {chunk.question && (
                                          <tr className="border-t border-gray-200 bg-white hover:bg-gray-50">
                                            <td className="px-3 py-2 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                              Sub-activity
                                            </td>
                                            <td className="px-3 py-2 align-top text-gray-800 border border-gray-200">
                                              {chunk.question}
                                            </td>
                                          </tr>
                                        )}
                                        
                                        {/* Display relevance score if available */}
                                        {chunk.relevanceScore !== undefined && (
                                          <tr className="border-t border-gray-200 bg-white hover:bg-gray-50">
                                            <td className="px-3 py-2 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                              Relevance Score
                                            </td>
                                            <td className="px-3 py-2 align-top text-gray-800 border border-gray-200">
                                              <span className={`px-2 py-0.5 rounded-full text-xs ${chunk.relevanceScore > 0.7 ? 'bg-green-100 text-green-800' : chunk.relevanceScore > 0.4 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {formatRelevanceScore(chunk.relevanceScore)}
                                              </span>
                                            </td>
                                          </tr>
                                        )}
                                        
                                        {/* Display summary if available */}
                                        {chunk.summary && (
                                          <tr className="border-t border-gray-200 bg-white hover:bg-gray-50">
                                            <td className="px-3 py-2 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                              Summary
                                            </td>
                                            <td className="px-3 py-2 align-top text-gray-800 border border-gray-200">
                                              {chunk.summary}
                                            </td>
                                          </tr>
                                        )}
                                        
                                        {/* Display other metadata fields */}
                                        {chunk.metadata && Object.entries(chunk.metadata)
                                          .filter(([metaKey]) => metaKey !== 'text_as_html' && metaKey !== 'relevance_score' && metaKey !== 'summary') // Exclude special fields 
                                          .filter(([metaKey]) => shouldShowMetadataField(metaKey, chunk.metadata)) // Apply our custom filter
                                          .map(([metaKey, metaValue]) => (
                                            <tr key={metaKey} className="border-t border-gray-200 bg-white hover:bg-gray-50">
                                              <td className="px-3 py-2 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                                {getMetadataDisplayName(metaKey)}
                                              </td>
                                              <td className="px-3 py-2 align-top text-gray-800 border border-gray-200">
                                                {metaKey === 'source' || metaKey === 'filename' || metaKey === 'file_name' ? (
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
                                        <div className="overflow-x-auto border rounded shadow-sm">
                                          <style dangerouslySetInnerHTML={{ __html: `
                                            .html-table-container {
                                              max-height: 400px;
                                              overflow-y: auto;
                                            }
                                            .html-table-container table {
                                              border-collapse: collapse;
                                              width: 100%;
                                              margin-bottom: 1rem;
                                              font-size: 0.875rem;
                                              table-layout: auto;
                                            }
                                            .html-table-container th,
                                            .html-table-container td {
                                              border: 1px solid #e2e8f0;
                                              padding: 0.75rem 0.5rem;
                                              text-align: left;
                                              vertical-align: top;
                                              word-break: normal;
                                              max-width: 300px;
                                              overflow: hidden;
                                              text-overflow: ellipsis;
                                            }
                                            .html-table-container th {
                                              background-color: var(--header-bg-color, #f8fafc);
                                              font-weight: 600;
                                              color: var(--header-text-color, #334155);
                                              position: sticky;
                                              top: 0;
                                              z-index: 1;
                                              white-space: nowrap;
                                            }
                                            .html-table-container tr:nth-child(even) {
                                              background-color: #f8fafc;
                                            }
                                            .html-table-container tr:hover {
                                              background-color: #f1f5f9;
                                            }
                                            .html-table-container tbody tr:hover td {
                                              background-color: rgba(236, 253, 245, 0.4);
                                            }
                                          ` }} />
                                          <div 
                                            className="p-2 text-sm html-table-container" 
                                            style={{
                                              '--header-bg-color': '#f7f7f7',
                                              '--header-text-color': '#333'
                                            } as React.CSSProperties}
                                            dangerouslySetInnerHTML={{ __html: chunk.htmlTable }} 
                                          />
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Raw Content */}
                                    {!chunk.htmlTable && (
                                      <div className="relative">
                                        <div className="text-sm bg-white border rounded-md p-4 max-h-80 overflow-auto">
                                          <div className="font-medium text-gray-700 mb-2 flex items-center justify-between">
                                            <span>Raw Content:</span>
                                            <button
                                              className="inline-flex items-center justify-center p-1 rounded-full hover:bg-gray-200 focus:outline-none"
                                              title="Copy raw content"
                                              onClick={() => copyToClipboard(chunk.content)}
                                            >
                                              {copiedText === chunk.content ? 
                                                <CheckCircle className="w-3 h-3 text-green-500" /> : 
                                                <Copy className="w-3 h-3 text-blue-600/70" />
                                              }
                                            </button>
                                          </div>
                                          <div className="whitespace-pre-line text-gray-800">
                                            {cleanTextContent(chunk.content, true).cleanedText.split('\n').map((paragraph: string, i: number) => (
                                              <p key={i} className={i > 0 ? 'mt-2' : ''}>
                                                {paragraph}
                                              </p>
                                            ))}
                                          </div>
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
                          <div className="bg-white p-3 cursor-pointer flex items-center justify-between transition-colors"
                               onClick={() => setD2Expanded(!d2Expanded)}>
                            <div className="flex items-center">
                              {d2Expanded ? 
                                <ChevronDown className="w-4 h-4 text-gray-700" /> : 
                                <ChevronRight className="w-4 h-4 text-gray-700" />
                              }
                              <div className="flex items-center">
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                                  <AlertCircle size={14} className="text-gray-700" />
                                </div>
                                <h4 className="font-medium text-gray-700">Domain 2</h4>
                                <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full ml-2">
                                  {retrievedContext.ae.length} {retrievedContext.ae.length === 1 ? 'item' : 'items'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {d2Expanded && (
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
                                    <table className="min-w-full text-xs border-collapse">
                                      <thead>
                                        <tr className="bg-gray-50">
                                          <th className="px-3 py-2 text-left font-medium text-gray-600 border border-gray-200">Property</th>
                                          <th className="px-3 py-2 text-left font-medium text-gray-600 border border-gray-200">Value</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {/* Display subActivity as Activity */}
                                        {chunk.subActivity && (
                                          <tr className="border-t border-gray-200 bg-white hover:bg-gray-50">
                                            <td className="px-3 py-2 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                              Activity
                                            </td>
                                            <td className="px-3 py-2 align-top text-gray-800 border border-gray-200">
                                              {cleanSubactivityValue(chunk.subActivity)}
                                            </td>
                                          </tr>
                                        )}
                                        
                                        {/* Display question as Sub-activity */}
                                        {chunk.question && (
                                          <tr className="border-t border-gray-200 bg-white hover:bg-gray-50">
                                            <td className="px-3 py-2 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                              Sub-activity
                                            </td>
                                            <td className="px-3 py-2 align-top text-gray-800 border border-gray-200">
                                              {chunk.question}
                                            </td>
                                          </tr>
                                        )}
                                        
                                        {/* Display relevance score if available */}
                                        {chunk.relevanceScore !== undefined && (
                                          <tr className="border-t border-gray-200 bg-white hover:bg-gray-50">
                                            <td className="px-3 py-2 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                              Relevance Score
                                            </td>
                                            <td className="px-3 py-2 align-top text-gray-800 border border-gray-200">
                                              <span className={`px-2 py-0.5 rounded-full text-xs ${chunk.relevanceScore > 0.7 ? 'bg-green-100 text-green-800' : chunk.relevanceScore > 0.4 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {formatRelevanceScore(chunk.relevanceScore)}
                                              </span>
                                            </td>
                                          </tr>
                                        )}
                                        
                                        {/* Display summary if available */}
                                        {chunk.summary && (
                                          <tr className="border-t border-gray-200 bg-white hover:bg-gray-50">
                                            <td className="px-3 py-2 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                              Summary
                                            </td>
                                            <td className="px-3 py-2 align-top text-gray-800 border border-gray-200">
                                              {chunk.summary}
                                            </td>
                                          </tr>
                                        )}
                                        
                                        {/* Display other metadata fields */}
                                        {chunk.metadata && Object.entries(chunk.metadata)
                                          .filter(([metaKey]) => metaKey !== 'text_as_html' && metaKey !== 'relevance_score' && metaKey !== 'summary') // Exclude special fields 
                                          .filter(([metaKey]) => shouldShowMetadataField(metaKey, chunk.metadata)) // Apply our custom filter
                                          .map(([metaKey, metaValue]) => (
                                            <tr key={metaKey} className="border-t border-gray-200 bg-white hover:bg-gray-50">
                                              <td className="px-3 py-2 align-top font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                                {getMetadataDisplayName(metaKey)}
                                              </td>
                                              <td className="px-3 py-2 align-top text-gray-800 border border-gray-200">
                                                {metaKey === 'source' || metaKey === 'filename' || metaKey === 'file_name' ? (
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
                                        <div className="overflow-x-auto border rounded shadow-sm">
                                          <style dangerouslySetInnerHTML={{ __html: `
                                            .html-table-container {
                                              max-height: 400px;
                                              overflow-y: auto;
                                            }
                                            .html-table-container table {
                                              border-collapse: collapse;
                                              width: 100%;
                                              margin-bottom: 1rem;
                                              font-size: 0.875rem;
                                              table-layout: auto;
                                            }
                                            .html-table-container th,
                                            .html-table-container td {
                                              border: 1px solid #e2e8f0;
                                              padding: 0.75rem 0.5rem;
                                              text-align: left;
                                              vertical-align: top;
                                              word-break: normal;
                                              max-width: 300px;
                                              overflow: hidden;
                                              text-overflow: ellipsis;
                                            }
                                            .html-table-container th {
                                              background-color: var(--header-bg-color, #f8fafc);
                                              font-weight: 600;
                                              color: var(--header-text-color, #334155);
                                              position: sticky;
                                              top: 0;
                                              z-index: 1;
                                              white-space: nowrap;
                                            }
                                            .html-table-container tr:nth-child(even) {
                                              background-color: #f8fafc;
                                            }
                                            .html-table-container tr:hover {
                                              background-color: #f1f5f9;
                                            }
                                            .html-table-container tbody tr:hover td {
                                              background-color: rgba(236, 253, 245, 0.4);
                                            }
                                          ` }} />
                                          <div 
                                            className="p-2 text-sm html-table-container" 
                                            style={{
                                              '--header-bg-color': '#f7f7f7',
                                              '--header-text-color': '#333'
                                            } as React.CSSProperties}
                                            dangerouslySetInnerHTML={{ __html: chunk.htmlTable }} 
                                          />
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Raw Content */}
                                    {!chunk.htmlTable && (
                                      <div className="relative">
                                        <div className="text-sm bg-white border rounded-md p-4 max-h-80 overflow-auto">
                                          <div className="font-medium text-gray-700 mb-2 flex items-center justify-between">
                                            <span>Raw Content:</span>
                                            <button
                                              className="inline-flex items-center justify-center p-1 rounded-full hover:bg-gray-200 focus:outline-none"
                                              title="Copy raw content"
                                              onClick={() => copyToClipboard(chunk.content)}
                                            >
                                              {copiedText === chunk.content ? 
                                                <CheckCircle className="w-3 h-3 text-green-500" /> : 
                                                <Copy className="w-3 h-3 text-blue-600/70" />
                                              }
                                            </button>
                                          </div>
                                          <div className="whitespace-pre-line text-gray-800">
                                            {cleanTextContent(chunk.content, true).cleanedText.split('\n').map((paragraph: string, i: number) => (
                                              <p key={i} className={i > 0 ? 'mt-2' : ''}>
                                                {paragraph}
                                              </p>
                                            ))}
                                          </div>
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
                       (!retrievedContext.ae || retrievedContext.ae.length === 0) && (
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
                  setRetrievedContext({ pd: [], ae: [], chunks: [] });
                  setShowD1Findings(false);
                  setShowD2Findings(false);
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
