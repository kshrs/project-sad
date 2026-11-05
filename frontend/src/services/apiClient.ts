import axios from 'axios';

// Use relative path '/api/v1' so requests always go to the current host/ALB port 80,
// eliminating port 5000 firewall/ALB issues and CORS errors.
const getBaseUrl = (): string => {
  return '/api/v1';
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
