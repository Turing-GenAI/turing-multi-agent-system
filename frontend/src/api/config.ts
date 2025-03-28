export const API_CONFIG = {
  // Determine baseUrl based on environment variables
  // If VITE_USE_LOCAL_API is true, use the local API URL directly
  // For production, use the full VITE_API_URL
  // For development with proxy, use relative path '/api'
  baseUrl: import.meta.env.VITE_USE_LOCAL_API === 'true'
    ? (import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:8000')
    : (import.meta.env.PROD 
       ? (import.meta.env.VITE_API_URL || 'https://multi-agent.turing.com') 
       : '/api'), // Use relative path in development for proxy
  headers: {
    'Content-Type': 'application/json',
  },
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
