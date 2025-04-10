import axios from 'axios';
import { ComplianceIssue } from '../types/compliance';

// API base URL - change this to point to your backend
const API_BASE_URL = 'http://localhost:8000/api/v1';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
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
  }
};
