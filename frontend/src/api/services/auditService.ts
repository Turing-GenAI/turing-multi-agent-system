import { apiClient } from '../client';
import { 
  AIMessagesRequest, 
  AIMessagesResponse, 
  ApiResponse, 
  ScheduleJobRequest,
  ScheduleJobResponse,
  JobFeedbackRequest,
  JobFeedbackResponse,
  JobCancellationResponse,
  JobStatistics,
  AgentProgressResponse
} from '../types';
import { activities } from '../../data/activities';

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
  
  getJobDetails: async (status: string): Promise<ApiResponse<JobResponse>> => {
    const endpoint = `/jobs/?status=${encodeURIComponent(status)}`;
    return apiClient.get<JobResponse>(endpoint);
  },

  /**
   * Update feedback for a specific job
   * @param jobId - The ID of the job to update feedback for
   * @param feedback - The feedback text to update
   * @returns Promise with updated job details
   */
  updateJobFeedback: async (
    jobId: string,
    feedback: string
  ): Promise<ApiResponse<JobFeedbackResponse>> => {
    const endpoint = `/jobs/${encodeURIComponent(jobId)}/feedback`;
    const body: JobFeedbackRequest = {
      feedback,
    };

    return apiClient.put<JobFeedbackResponse>(endpoint, body);
  },

  /**
   * Cancel a running job
   * @param jobId - The ID of the job to cancel
   * @returns Promise with cancellation status
   */
  cancelJob: async (
    jobId: string
  ): Promise<ApiResponse<JobCancellationResponse>> => {
    const endpoint = `/jobs/${encodeURIComponent(jobId)}/cancel`;
    return apiClient.post<JobCancellationResponse>(endpoint, {});
  },

  /**
   * Get job statistics
   * @returns Promise with job statistics
   */
  getJobStatistics: async (): Promise<ApiResponse<JobStatistics>> => {
    const endpoint = '/api/job-statistics';
    return apiClient.get<JobStatistics>(endpoint);
  },

  /**
   * Get agent progress tree for a specific job
   * @param jobId - The ID of the job to fetch progress for
   * @returns Promise with agent progress tree
   */
  getAgentProgress: async (
    jobId: string
  ): Promise<ApiResponse<AgentProgressResponse>> => {
    return apiClient.get<AgentProgressResponse>(`/api/jobs/${jobId}/progress`);
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

  updateJobFeedback: async (
    jobId: string,
    feedback: string
  ): Promise<ApiResponse<JobFeedbackResponse>> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      data: {
        job_id: jobId,
        feedback: feedback,
        message: 'Feedback updated successfully'
      },
      status: 200,
    };
  },

  cancelJob: async (
    jobId: string
  ): Promise<ApiResponse<JobCancellationResponse>> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      data: {
        job_id: jobId,
        status: 'cancelled',
        message: 'Job cancelled successfully'
      },
      status: 200,
    };
  },

  getJobStatistics: async (): Promise<ApiResponse<JobStatistics>> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 200,
          data: {
            total_jobs: 100,
            completed_jobs: 75,
            failed_jobs: 5,
            in_progress_jobs: 20,
            average_completion_time: 300
          }
        });
      }, 500);
    });
  },

  /**
   * Get agent progress tree for a specific job
   * @param jobId - The ID of the job to fetch progress for
   * @returns Promise with agent progress tree
   */
  getAgentProgress: async (
    jobId: string
  ): Promise<ApiResponse<AgentProgressResponse>> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 200,
          data: {
            activities
          }
        });
      }, 500);
    });
  }
};

// Export either mock or real service based on environment variable
export const auditService = import.meta.env.VITE_USE_MOCK_API === 'true' 
  ? mockAuditService 
  : realAuditService;
