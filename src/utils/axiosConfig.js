import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL;

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sales-management-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      // Clear token from localStorage
      localStorage.removeItem('sales-management-token');
      
      // Clear auth header
      delete apiClient.defaults.headers.common['Authorization'];
      
      // Show error message
      toast.error('Session expired. Please login again.');
      
      // Dispatch a custom event that the app can listen to
      window.dispatchEvent(new CustomEvent('auth:logout', { 
        detail: { reason: '401_unauthorized' } 
      }));
      
      // Redirect to login page
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Set default axios instance
axios.defaults = apiClient.defaults;
axios.interceptors = apiClient.interceptors;

export default apiClient;
