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