export interface ReviewInfo {
  id: string;
  clinical_doc_id?: string;
  compliance_doc_id?: string;
  clinicalDoc: string;
  complianceDoc: string;
  status: 'completed' | 'processing';
  issues: number;
  highConfidenceIssues: number;
  lowConfidenceIssues: number;
  created: string;
}

export interface ReviewAlertRequest {
  to_emails: string[];
  subject: string;
  content?: string;
  review_data?: {
    clinical_doc: string;
    compliance_doc: string;
    issues: number;
    high_confidence_issues: number;
    low_confidence_issues: number;
    decision_history?: any[];
  };
} 