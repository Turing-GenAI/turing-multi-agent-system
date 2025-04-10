import axios from 'axios';
import { ComplianceIssue } from '../components/ComplianceReviewPage';

// API base URL - change this to match your backend
const API_BASE_URL = 'http://localhost:8000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Document API functions
export const fetchDocuments = async (type?: string) => {
  try {
    const response = await api.get(`/documents/list${type ? `?doc_type=${type}` : ''}`);
    return response.data.documents;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
};

export const fetchDocumentContent = async (documentId: string) => {
  try {
    const response = await api.get(`/documents/${documentId}/content`);
    return response.data.content;
  } catch (error) {
    console.error('Error fetching document content:', error);
    throw error;
  }
};

// Compliance API functions
export const analyzeCompliance = async (clinicalDocId: string, complianceDocId: string) => {
  try {
    const response = await api.post(`/compliance/analyze-by-ids/?clinical_doc_id=${clinicalDocId}&compliance_doc_id=${complianceDocId}`);
    return response.data;
  } catch (error) {
    console.error('Error analyzing compliance:', error);
    throw error;
  }
};

export const notifyDocumentOwner = async (params: {
  document_id: string;
  owner_email: string;
  issues: ComplianceIssue[];
  message?: string;
}) => {
  try {
    const response = await api.post('/compliance/notify-document-owner/', params);
    return response.data;
  } catch (error) {
    console.error('Error notifying document owner:', error);
    throw error;
  }
};
