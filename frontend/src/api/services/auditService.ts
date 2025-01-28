import { apiClient } from '../client';
import { 
  AIMessagesRequest, 
  AIMessagesResponse, 
  ApiResponse, 
  ScheduleJobRequest,
  ScheduleJobResponse
} from '../types';

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
};

// Export either mock or real service based on environment variable
export const auditService = import.meta.env.VITE_USE_MOCK_API === 'true' 
  ? mockAuditService 
  : realAuditService;
