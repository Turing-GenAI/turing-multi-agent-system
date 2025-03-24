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
  AgentProgressResponse,
  RetrievedContextResponse
} from '../types';
import { activities } from '../../data/activities';
import { get_progress_tree_response1, get_progress_tree_response2, get_progress_tree_response3, get_progress_tree_response4, get_progress_tree_response5, get_progress_tree_response6, get_progress_tree_response7, get_progress_tree_response8} from '../../data/get_ai_responses';

let apiCallCount = 0;
const parentNodes = [ "inspection - site_area_agent", "trial supervisor - inspection_master_agent"]
const responses = [get_progress_tree_response1,get_progress_tree_response2, get_progress_tree_response3, get_progress_tree_response4, get_progress_tree_response5, get_progress_tree_response6, get_progress_tree_response7, get_progress_tree_response8];
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

interface GetJobsResponse {
  jobs: JobDetails[];
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
    withFindings: boolean = false,
    last_position: number = 0
  ): Promise<ApiResponse<AIMessagesResponse>> => {
    const endpoint = `/get_ai_messages/${encodeURIComponent(jobId)}`;
    const body: AIMessagesRequest = {
      ai_messages: true,
      findings: withFindings,
      last_position:last_position
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
  
  // getJob
  getJobDetails: async (status: string): Promise<ApiResponse<JobResponse>> => {
    const endpoint = `/job-status/${encodeURIComponent(status)}`;
    return apiClient.get<JobResponse>(endpoint);
  },

  // Get all jobs
  getJobs: async (): Promise<ApiResponse<GetJobsResponse>> => {
    const endpoint = '/jobs/';
    return apiClient.get<GetJobsResponse>(endpoint);
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
    const endpoint = `/update-job/${encodeURIComponent(jobId)}`;
    const body: JobFeedbackRequest = {
      status: "got_human_feedback",
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
  },

  /**
   * Get retrieved context data for a specific job
   * @param jobId - The ID of the job to fetch retrieved context for
   * @returns Promise with retrieved context data
   */
  getRetrievedContext: async (
    jobId: string
  ): Promise<ApiResponse<RetrievedContextResponse>> => {
    const endpoint = `/get_retrieved_context/${encodeURIComponent(jobId)}`;
    return apiClient.get<RetrievedContextResponse>(endpoint);
  }
};

// Mock implementation
const mockAuditService = {
  getAIMessages: async (
    jobId: string,
    withFindings: boolean = false,
    last_position: number = 0
  ): Promise<ApiResponse<AIMessagesResponse>> => {
    // last_position = 1;
    console.log("backendintegration : ", " auditService.getAIMessages() called with last_position: ", last_position);
    
    
    
    if(apiCallCount >= responses.length) {
      apiCallCount = responses.length - 1;
    }
    
    const responseStr = responses[apiCallCount];
    console.log("API Call count : ", apiCallCount);
    const response: AIMessagesResponse = JSON.parse(responseStr);
    apiCallCount++;

    return {
      status: 200,
      data: response
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
    const status = apiCallCount < responses.length ? 'running' : 'completed';
    return {
      data: {
        job_id: jobId,
        status: status,
        job_details: {
          job_id: jobId,
          site_id: 'mock-site-123',
          date: '2022-01-01',
          trial_id: 'mock-trial-123',
          run_at: '2022-01-01T12:00:00',
          status: status,
          feedback: 'Job completed successfully',
          processing_start_time: '2022-01-01T11:00:00',
          completed_time: '2022-01-01T12:00:00',
        }
      },
      status: 200,
    };
  },

  getJobs: async (): Promise<ApiResponse<GetJobsResponse>> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      data: {
        jobs: [
          {
            job_id: 'mock-job-123',
            site_id: 'mock-site-123',
            date: '2022-01-01',
            trial_id: 'mock-trial-123',
            run_at: '2022-01-01T12:00:00',
            status: 'completed',
            feedback: 'Job completed successfully',
            processing_start_time: '2022-01-01T11:00:00',
          },
          {
            job_id: 'mock-job-456',
            site_id: 'mock-site-456',
            date: '2022-01-02',
            trial_id: 'mock-trial-456',
            run_at: '2022-01-02T12:00:00',
            status: 'in_progress',
            feedback: '',
            processing_start_time: '2022-01-02T11:00:00',
          }
        ]
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
    
    // First check and increment apiCallCount
    if (apiCallCount >= responses.length) {
      apiCallCount = 0; // Reset to start if we've reached the end
    }
    
    const responseStr = responses[apiCallCount];
    const response = JSON.parse(responseStr);
    const activitiesJson = response.filtered_data || [];
    
    // Increment for next call
    apiCallCount++;
    
    activitiesJson.forEach((activity: any) => {
      parentNodes.includes(activity.name);
    });

    return {
      status: 200,
      data: {
        activities: JSON.parse(JSON.stringify(activities)) // Deep clone the activities
      }
    };
  },

  /**
   * Get retrieved context data for a specific job (mock implementation)
   * @param jobId - The ID of the job to fetch retrieved context for
   * @returns Promise with mock retrieved context data
   */
  getRetrievedContext: async (
    jobId: string
  ): Promise<ApiResponse<RetrievedContextResponse>> => {
    const endpoint = `/get_retrieved_context/${encodeURIComponent(jobId)}`;
    return apiClient.get<RetrievedContextResponse>(endpoint);
  }
};

// Export either mock or real service based on environment variable
export const auditService = import.meta.env.VITE_USE_MOCK_API === 'true' 
  ? mockAuditService 
  : realAuditService;
