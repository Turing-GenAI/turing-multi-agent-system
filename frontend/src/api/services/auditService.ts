import { apiClient } from '../client';
import { 
  AIMessagesRequest, 
  AIMessagesResponse, 
  ApiResponse, 
  ScheduleJobRequest,
  ScheduleJobResponse
} from '../types';

interface JobDetails {
  job_id: string;
  site_id: string;
  date: string;
  trial_id: string;
  run_at: string;
  status: string;
  feedback: string;
  processing_start_time: string;
  completed_time: string;
  error_details?: string;
}

interface JobResponse {
  job_id: string;
  status: string;
  job_details: JobDetails;
}

const realAuditService = {
  /**
   * Fetch AI messages and findings for a specific job
   * @param jobId - The ID of the job to fetch messages for
   * @param withFindings - Whether to include findings in the response
   * @returns Promise with AI messages and findings
   */
  getAIMessages: async (
    jobId: string,
    withFindings: boolean = false
  ): Promise<ApiResponse<AIMessagesResponse>> => {
    const endpoint = `/get_ai_messages/${encodeURIComponent(jobId)}`;
    const body: AIMessagesRequest = {
      ai_messages: true,
      findings: withFindings,
    };

    return apiClient.put<AIMessagesResponse>(endpoint, body);
  },

  /**
   * Schedule a new analysis job
   * @param siteId - The ID of the site to analyze
   * @param trialId - The ID of the trial to analyze
   * @param dateRange - Formatted date range for analysis
   * @returns Promise with job details
   */
  scheduleJob: async (
    siteId: string,
    trialId: string,
    dateRange: string
  ): Promise<ApiResponse<ScheduleJobResponse>> => {
    const endpoint = '/schedule-job/';
    const body: ScheduleJobRequest = {
      site_id: siteId,
      trial_id: trialId,
      date: dateRange,
    };

    return apiClient.post<ScheduleJobResponse>(endpoint, body);
  },
  
  getJobDetails: async (jobId: string): Promise<ApiResponse<JobResponse>> => {
    const endpoint = `/jobs/${encodeURIComponent(jobId)}`;
    return apiClient.get<JobResponse>(endpoint);
  }
};

// Mock implementation
const mockAuditService = {
  getAIMessages: async (
    jobId: string,
    withFindings: boolean = false
  ): Promise<ApiResponse<AIMessagesResponse>> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Fetch mock messages from file
    const response = await fetch('/mockMessages.txt');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const mockMessages = await response.text();

    const mockResponse: AIMessagesResponse = {
      ai_messages: mockMessages,
      ...(withFindings && {
        findings: {
          pd: [
            {
              id: 'pd1',
              agent: 'trial_master',
              content: 'Protocol deviation found: Missing patient data in visit 3',
              timestamp: new Date().toISOString()
            }
          ],
          ae: [
            {
              id: 'ae1',
              agent: 'inspection_master',
              content: 'Adverse event not properly documented within 24 hours',
              timestamp: new Date().toISOString()
            }
          ],
          sgr: [
            {
              id: 'sgr1',
              agent: 'crm_master',
              content: 'Site generated report shows inconsistency in drug administration',
              timestamp: new Date().toISOString()
            }
          ]
        }
      })
    };

    return {
      data: mockResponse,
      status: 200,
    };
  },

  scheduleJob: async (
    siteId: string,
    trialId: string,
    dateRange: string
  ): Promise<ApiResponse<ScheduleJobResponse>> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      data: {
        job_id: 'mock-job-123',
        status: 'scheduled',
        message: 'Job scheduled successfully'
      },
      status: 200,
    };
  },
  
  getJobDetails: async (jobId: string): Promise<ApiResponse<JobResponse>> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      data: {
        job_id: jobId,
        status: 'completed',
        job_details: {
          job_id: jobId,
          site_id: 'mock-site-123',
          date: '2022-01-01',
          trial_id: 'mock-trial-123',
          run_at: '2022-01-01T12:00:00',
          status: 'completed',
          feedback: 'Job completed successfully',
          processing_start_time: '2022-01-01T11:00:00',
          completed_time: '2022-01-01T12:00:00',
        }
      },
      status: 200,
    };
  },
};

// Export either mock or real service based on environment variable
export const auditService = import.meta.env.VITE_USE_MOCK_API === 'true' 
  ? mockAuditService 
  : realAuditService;
