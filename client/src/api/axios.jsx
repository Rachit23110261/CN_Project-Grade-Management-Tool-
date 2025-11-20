import axios from "axios";

// Function to determine the best API base URL
const getApiBaseUrl = () => {
  // Check if environment variable is set
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  const protocol = window.location.protocol; // 'http:' or 'https:'
  const hostname = window.location.hostname;
  
  // If running on 127.0.0.1, try to use the network IP for API
  if (hostname === '127.0.0.1' || hostname === 'localhost') {
    // Try common network IPs first
    const networkIPs = ['10.7.4.228', '10.7.45.10', '192.168.1.1', 'localhost'];
    
    // For HTTPS, prefer the same network IP that might be running the backend
    if (protocol === 'https:') {
      // Check if we're on a known network IP, try that first
      for (const ip of networkIPs) {
        if (hostname === ip || hostname === '127.0.0.1') {
          return `${protocol}//${networkIPs[0]}:5000/api`; // Use first network IP
        }
      }
    }
  }
  
  // Default fallback - use same hostname as frontend
  return `${protocol}//${hostname}:5000/api`;
};

const baseURL = getApiBaseUrl();
console.log('🔗 API Base URL:', baseURL);

const api = axios.create({
  baseURL: baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000, // 10 second timeout
  withCredentials: true, // Important for CORS with credentials
});

// Add JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      console.warn('🔒 Unauthorized - clearing token and redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
      console.error('🚫 Network/CORS Error:', {
        message: error.message,
        code: error.code,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        }
      });
      
      // Provide helpful error message
      error.userMessage = 'Connection failed. Please check if the server is running and accessible.';
    }
    return Promise.reject(error);
  }
);

export default api;
