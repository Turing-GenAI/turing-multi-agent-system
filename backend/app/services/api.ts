import axios from 'axios';
import { ComplianceIssue } from '../types/compliance';
import { ReviewAlertRequest } from '../types';

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