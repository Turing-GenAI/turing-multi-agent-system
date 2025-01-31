export interface ApiResponse<T> {
  data: T;
  error?: string;
  status: number;
}

export interface AIMessagesResponse {
  ai_messages: string;
  new_ai_messages?: string[];
  last_position?: number;
  filtered_data?: TreeNode[];
  findings?: {
    pd: Finding[];
    ae: Finding[];
    sgr: Finding[];
  };
}

export interface Finding {
  id: string;
  agent: string;
  content: string;
  timestamp: string;
}

export interface AIMessagesRequest {
  ai_messages: boolean;
  findings: boolean;
}

export interface ScheduleJobRequest {
  site_id: string;
  trial_id: string;
  date: string;
}

export interface ScheduleJobResponse {
  job_id: string;
  status: string;
  message?: string;
}

export interface JobFeedbackRequest {
  feedback: string;
}

export interface JobFeedbackResponse {
  job_id: string;
  status: string;
  updated_feedback: string;
}

export interface JobCancellationResponse {
  job_id: string;
  status: string;
  message: string;
}

export interface JobStatistics {
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  in_progress_jobs: number;
  average_completion_time: number;
}

export interface TreeNode {
  name: string;
  children?: TreeNode[];
  summary?: string;
  content?: string;
}

export interface AgentProgressResponse {
  activities: TreeNode[];
}
