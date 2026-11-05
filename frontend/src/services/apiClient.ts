import axios from 'axios';

// Dynamically determine the backend API URL:
// 1. If VITE_API_BASE_URL is explicitly set, use it.
// 2. If running in a browser, use the current hostname (e.g. EC2 public IP or domain) with port 5000.
// 3. Fallback to http://localhost:5000/api/v1.
const getBaseUrl = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:5000/api/v1`;
  }
  return 'http://localhost:5000/api/v1';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach token from localStorage if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sad_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 unauthenticated redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sad_token');
      localStorage.removeItem('sad_user');
      // Dispatch event for UI re-render
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

export default api;
