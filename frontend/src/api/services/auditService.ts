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

interface TreeNode {
  title: string;
  children?: TreeNode[];
  summary?: string;
  content?: string;
}

// Keep track of progress state for each job
const jobProgress = new Map<string, {
  level: number;
  activityIndex: number;
  agentIndex: number;
  subActivityIndex: number;
}>();

// Helper to reset progress for testing
const resetProgress = (jobId: string) => {
  jobProgress.delete(jobId);
};

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
    // Initialize progress for new jobs
    if (!jobProgress.has(jobId)) {
      jobProgress.set(jobId, {
        level: 0,
        activityIndex: 0,
        agentIndex: 0,
        subActivityIndex: 0
      });
    }

    const currentProgress = jobProgress.get(jobId)!;

    const buildIncrementalTree = () => {
      const result: TreeNode[] = [
        {
          title: "Protocol deviation",
          children: []
        }
      ];

      // Level 1: Activity IDs
      if (currentProgress.level >= 1) {
        const activityCount = Math.min(currentProgress.activityIndex + 1, 2);
        for (let i = 0; i < activityCount; i++) {
          result[0].children!.push({
            title: `Activity ID ${i + 1}`,
            children: []
          });
        }
      }

      // Level 2: Agents
      if (currentProgress.level >= 2) {
        const agents = ["Inspection Master", "Planner Agent", "Critique agent", "Feedback agent"];
        const activityIndex = Math.min(currentProgress.activityIndex, result[0].children!.length - 1);
        const agentCount = Math.min(currentProgress.agentIndex + 1, agents.length);
        
        for (let i = 0; i < agentCount; i++) {
          result[0].children![activityIndex].children!.push({
            title: agents[i],
            children: []
          });
        }
      }

      // Level 3: Sub-activities
      if (currentProgress.level >= 3) {
        const subActivities = [
          "Planned sub-activities",
          "Recommendation on the plan",
          "Reworked sub-activities"
        ];
        
        const activityIndex = Math.min(currentProgress.activityIndex, result[0].children!.length - 1);
        const agentIndex = Math.min(currentProgress.agentIndex, result[0].children![activityIndex].children!.length - 1);
        const subActivityCount = Math.min(currentProgress.subActivityIndex + 1, subActivities.length);

        for (let i = 0; i < subActivityCount; i++) {
          result[0].children![activityIndex].children![agentIndex].children!.push({
            title: subActivities[i],
            summary: "All sub-activities have been thoroughly planned, including resource allocation and scheduling.",
            content: "1. Initial assessment completed\n2. Resource allocation determined\n3. Timeline created"
          });
        }
      }

      // Progress to next state
      currentProgress.subActivityIndex++;
      if (currentProgress.subActivityIndex >= 3) {
        currentProgress.subActivityIndex = 0;
        currentProgress.agentIndex++;
        if (currentProgress.agentIndex >= 4) {
          currentProgress.agentIndex = 0;
          currentProgress.activityIndex++;
          if (currentProgress.activityIndex >= 2) {
            currentProgress.activityIndex = 0;
            currentProgress.level++;
            if (currentProgress.level >= 4) {
              // Clean up completed job progress
              jobProgress.delete(jobId);
            }
          }
        }
      }

      // Update progress in the Map
      if (currentProgress.level < 4) {
        jobProgress.set(jobId, { ...currentProgress });
      }

      return result;
    };

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 200,
          data: {
            activities: buildIncrementalTree()
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
