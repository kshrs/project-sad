import axios from 'axios';

// Dynamically determine the backend API URL:
// 1. If running in a browser, use the current page's hostname (e.g. EC2 public IP or domain) with port 5000.
// 2. Otherwise use VITE_API_BASE_URL if set and not pointing to localhost.
// 3. Fallback to http://localhost:5000/api/v1.
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    // If accessing via an external IP/domain, always target that host on port 5000
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}:5000/api/v1`;
    }
  }
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
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
