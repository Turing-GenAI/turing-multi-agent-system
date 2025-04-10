// Types for compliance review functionality

export interface ComplianceIssue {
  id: string;
  clinical_text: string;
  compliance_text: string;
  explanation: string;
  suggested_edit: string;
  confidence: 'high' | 'low';
  regulation: string;
}

export interface ComplianceReviewResponse {
  clinical_doc_id: string;
  compliance_doc_id: string;
  issues: ComplianceIssue[];
  reviewId?: string;
}

export interface Document {
  id: string;
  title: string;
  type: 'clinical' | 'compliance';
  filename: string;
  path: string;
  size: number;
  content?: string;
}

export interface ComplianceDecision {
  issueId: string;
  decision: 'accept' | 'reject';
  timestamp: string;
  userId: string;
  comment?: string;
}

export interface NotificationRequest {
  document_id: string;
  owner_email: string;
  issues: ComplianceIssue[];
  message?: string;
}

export interface NotificationResponse {
  message: string;
  document_id: string;
  success: boolean;
}
