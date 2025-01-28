export interface ApiResponse<T> {
  data: T;
  error?: string;
  status: number;
}

export interface AIMessagesResponse {
  ai_messages: string;
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
