// Job History Types
export interface Job {
  id: string;
  trial_id: string;
  site_id: string;
  date: string;
  status: string;
  created_at: string;
  completed_at?: string;
}

export interface AIMessage {
  role: string;
  content: string;
  timestamp?: string;
}

export interface Finding {
  id: string;
  content: string;
  table?: any[];
  type?: string;
  description?: string;
  severity?: string;
  source?: string;
}

export interface ContextChunk {
  text: string;
  source: string;
  category?: string;
  activity?: string;
  subActivity?: string;
  question?: string;
}

export interface ProcessedContext {
  pd: ContextChunk[];
  ae: ContextChunk[];
  other: ContextChunk[];
  chunks: ContextChunk[];
}
