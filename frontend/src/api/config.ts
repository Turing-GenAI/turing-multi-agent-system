export const API_CONFIG = {
  // Determine baseUrl based on environment variables
  // If VITE_USE_LOCAL_API is true, use the local API URL directly
  // Otherwise, use a relative path that will go through the Vite proxy
  baseUrl: import.meta.env.VITE_USE_LOCAL_API === 'true'
    ? (import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:8000')
    : '/api', // Use relative path to work with Vite proxy
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
