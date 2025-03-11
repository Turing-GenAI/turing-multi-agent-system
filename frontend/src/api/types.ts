export interface ApiResponse<T> {
  data: T;
  error?: string;
  status: number;
}

export interface AIMessagesResponse {
  ai_messages: string;
  new_ai_messages: string[];
  last_position: number;
  findings: any;
  filtered_data: {
    id: number;
    name: string;
    summary: string;
    content: string;
  }[];
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
  last_position: number;
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
  status:string
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
  id: number;
  name: string;
  children?: TreeNode[];
  summary?: string;
  content?: string;
}

export interface AgentProgressResponse {
  activities: TreeNode[];
}

/**
 * Interface for the retrieved context data from the get_retrieved_context endpoint
 */
export interface RetrievedContextResponse {
  [key: string]: {
    [key: string]: {
      [key: string]: {
        [key: string]: {
          context_dict_key: {
            [key: string]: {
              metadata: {
                source: string;
                file_directory?: string;
                filename?: string;
                last_modified?: string;
                page_name?: string;
                page_number?: number;
                text_as_html?: string;
                page?: number;
                languages?: string[];
                filetype?: string;
                category?: string;
              };
              page_content: string;
            }
          }
        }
      }
    }
  }
}
