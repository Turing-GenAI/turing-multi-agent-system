import axios from 'axios';
import { ComplianceIssue } from '../types/compliance';

// API base URL - reads from environment variables in production
// Using Vite's import.meta.env instead of process.env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_PATH = '/api/v1';

// Full API URL with path
const FULL_API_URL = `${API_BASE_URL}${API_PATH}`;

// Create axios instance with default config
const api = axios.create({
  baseURL: FULL_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API methods
export const documentAPI = {
  // Get list of all documents
  getDocuments: async (type?: string) => {
    const response = await api.get(`/documents/list/${type ? `?doc_type=${type}` : ''}`);
    return response.data.documents;
  },
  
  // Get document content
  getDocumentContent: async (documentId: string) => {
    const response = await api.get(`/documents/${documentId}/content`);
    return response.data.content;
  },
  
  // Get document metadata
  getDocumentMetadata: async (documentId: string) => {
    const response = await api.get(`/documents/${documentId}`);
    return response.data;
  }
};

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
  };
}

export const complianceAPI = {
  // Analyze compliance using document IDs
  analyzeCompliance: async (clinicalDocId: string, complianceDocId: string, forceRefresh: boolean = false) => {
    const response = await api.post(`/compliance/analyze-by-ids/?clinical_doc_id=${clinicalDocId}&compliance_doc_id=${complianceDocId}&force_refresh=${forceRefresh}`);
    return response.data as {
      clinical_doc_id: string;
      compliance_doc_id: string;
      issues: ComplianceIssue[];
    };
  },
  
  // Get all compliance reviews
  getReviews: async () => {
    const response = await api.get('/compliance/reviews/');
    return response.data.reviews;
  },
  
  // Create a new compliance review record
  createReview: async (reviewData: {
    id: string;
    clinical_doc_id: string;
    compliance_doc_id: string;
    clinicalDoc: string;
    complianceDoc: string;
    status: string;
    issues?: number;
    highConfidenceIssues?: number;
    lowConfidenceIssues?: number;
    created: string;
  }) => {
    const response = await api.post('/compliance/reviews/', reviewData);
    return response.data;
  },
  
  // Apply a suggested edit to non-compliant text
  applySuggestion: async (data: {
    clinical_text: string;
    suggested_edit: string;
    surrounding_context: string;
  }) => {
    const response = await api.post('/compliance/apply-suggestion/', data);
    return response.data as {
      original_text: string;
      revised_text: string;
    };
  },
  
  // Notify document owner about compliance issues
  notifyDocumentOwner: async (documentId: string, ownerEmail: string, issues: ComplianceIssue[], message?: string) => {
    const response = await api.post('/compliance/notify-document-owner/', {
      document_id: documentId,
      owner_email: ownerEmail,
      issues,
      message
    });
    return response.data;
  },
  
  // Get issues for a specific review ID
  getIssuesByReviewId: async (reviewId: string) => {
    const response = await api.get(`/compliance/reviews/${reviewId}/issues`);
    return response.data.issues || [];
  },
  
  // Get a complete review by ID with document content
  getReviewById: async (reviewId: string) => {
    const response = await api.get(`/compliance/reviews/${reviewId}`);
    return response.data;
  },
  
  // Save decisions for compliance issues (including applied changes)
  saveDecisions: async (reviewId: string, decisions: Array<{
    issueId: string;
    action: 'accepted' | 'rejected';
    applied_change?: string;
    comments?: string;
  }>) => {
    const response = await api.post(`/compliance/save-decisions/?review_id=${reviewId}`, decisions);
    return response.data;
  },
  
  // Update the document content of a review to save applied changes
  updateReviewContent: async (reviewId: string, contentData: {
    clinical_doc_content: string;
  }) => {
    const response = await api.post(`/compliance/update-review-content/${reviewId}`, contentData);
    return response.data;
  },
  
  // Update the statuses of compliance issues (accepted, rejected, pending)
  updateIssueStatuses: async (issueStatuses: Array<{
    issue_id: string;
    status: 'accepted' | 'rejected' | 'pending';
  }>) => {
    const response = await api.post('/compliance/update-issue-statuses/', issueStatuses);
    return response.data;
  },
  
  // Get all decisions for a specific review
  getReviewDecisions: async (reviewId: string) => {
    const response = await api.get(`/compliance/review/${reviewId}/decisions/`);
    return response.data;
  },
  
  // Get all decisions for a specific issue
  getIssueDecisions: async (issueId: string) => {
    const response = await api.get(`/compliance/issue/${issueId}/decisions/`);
    return response.data;
  },
  
  // Delete a compliance review (soft delete)
  deleteReview: async (reviewId: string) => {
    const response = await api.delete(`/compliance/review/${reviewId}/`);
    return response.data;
  },
  
  // Send alert to document owners about review results
  sendReviewAlert: async (data: ReviewAlertRequest) => {
    const response = await api.post('/compliance/send-review-alert/', data);
    return response;
  },

  // Generate email content for review alert
  generateReviewAlertContent: async (data: ReviewAlertRequest) => {
    const response = await api.post('/compliance/generate-review-alert-content/', data);
    return response.data;
  }
};
