import axios from 'axios';
import { getCSRFToken as getCSRFTokenFromCookie, ensureCSRFCookie } from './cookies';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

// Initialize API instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Track if we're initializing to prevent multiple simultaneous initializations
let isInitializing = false;

// Ensure we have a CSRF token
export const ensureCSRFToken = async () => {
  if (isInitializing) {
    // If we're already initializing, wait for it to complete
    return new Promise((resolve) => {
      const checkInitialized = () => {
        if (!isInitializing) {
          resolve(getCSRFTokenFromCookie());
        } else {
          setTimeout(checkInitialized, 100);
        }
      };
      checkInitialized();
    });
  }

  isInitializing = true;
  
  try {
    const token = await ensureCSRFCookie(api);
    isInitializing = false;
    return token;
  } catch (error) {
    console.error('Failed to ensure CSRF token:', error);
    isInitializing = false;
    throw error;
  }
};

// Initialize the API with CSRF token
export const initializeAPI = async () => {
  try {
    const token = await ensureCSRFToken();
    return token;
  } catch (error) {
    console.error('Failed to initialize API:', error);
    throw error;
  }
};

// Call initialize on import
initializeAPI().catch(console.error);

// Request interceptor to handle CSRF tokens
api.interceptors.request.use(
  async (config) => {
    // Skip for requests that don't need CSRF
    if (['get', 'head', 'options'].includes(config.method?.toLowerCase())) {
      return config;
    }

    try {
      // Ensure we have a valid CSRF token
      const token = getCSRFTokenFromCookie() || await ensureCSRFToken();
      if (token) {
        config.headers['X-CSRFToken'] = token;
      }
    } catch (error) {
      console.warn('CSRF token not available, continuing with request', error);
    }

    // Ensure credentials are included
    config.withCredentials = true;
    
    // Add necessary headers
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle session/csrf token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If we got a 403 and it's not a retry, try to refresh the CSRF token
    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        await ensureCSRFToken();
        // Retry the original request with the new token
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Failed to refresh CSRF token:', refreshError);
        // If we can't refresh, redirect to login or show an error
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Interceptor: Handle responses and errors
api.interceptors.response.use(
  (response) => {
    // You can add any response transformation here if needed
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle CSRF token issues
    if (error.response?.status === 403 && error.response.data?.code === 'csrf_token_mismatch') {
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        await ensureCSRFToken();
        return api(originalRequest);
      }
    }
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear any existing auth state
      localStorage.removeItem('auth');
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // For other errors, just reject with the error
    return Promise.reject(error);
  }
);

// CSRF fetcher
export const fetchCSRFToken = () => api.get('/csrf/');

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/login/', credentials, {
    withCredentials: true,
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
    },
  }),
  
  logout: () => {
    // Create a separate axios instance for logout to avoid circular dependencies
    const logoutApi = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    
    // Add CSRF token to the request
    const csrfToken = getCSRFTokenFromCookie();
    if (csrfToken) {
      logoutApi.defaults.headers.common['X-CSRFToken'] = csrfToken;
    }
    
    return logoutApi.post('/logout/');
  },
  
  getProfile: () => api.get('/profile/'),
  
  updatePassword: (passwordData) => api.post('/update_password/', passwordData, {
    withCredentials: true,
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
    },
  }),
};

// Employee API
export const employeeAPI = {
  getMenu: () => api.get('/employee/menu/'),
  placeOrder: (orderData) => api.post('/employee/order/', orderData),
  getOrders: () => api.get('/employee/orders/'),
};

// Guest API
export const guestAPI = {
  getMenu: () => api.get('/guest/menu/'),
  placeOrder: (orderData) => api.post('/guest/order/', orderData),
  getOrders: () => api.get('/guest/orders/'),
};


// Staff API
export const staffAPI = {
  getMenu: () => api.get('/staff/menu/'),
  createMenuItem: (data) => api.post('/staff/menu/', data),
  updateMenuItem: (id, data) => api.put(`/staff/menu/${id}/`, data),
  deleteMenuItem: (id) => api.delete(`/staff/menu/${id}/`),
  getOrders: (search) => api.get(`/staff/orders/${search ? `?search=${search}` : ''}`),
  updateOrderStatus: (orderId, status) =>
    api.patch(`/staff/orders/${orderId}/update_status/`, { status }),
};

// Admin API
export const adminAPI = {
  // User Management
  getUsers: async () => {
    const response = await api.get('/admin/users/');
    return response;
  },
  
  createUser: async (userData) => {
    const response = await api.post('/admin/users/', userData);
    return response;
  },
  
  updateUser: async (userId, userData) => {
    const response = await api.put(`/admin/users/${userId}/`, userData);
    return response;
  },
  
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}/`);
    return response;
  },
  
  // Token Management
  
  assignTokens: async (shift) => {
    const endpoint = '/admin/tokens/assign/';
    try {
      // Remove _shift suffix if present to match backend expectations
      const normalizedShift = shift.replace(/_shift$/, '');
      console.log(`[API] Assigning tokens for shift: ${normalizedShift}`);
      const response = await api.post(endpoint, { shift: normalizedShift });
      
      console.log(`[API] Tokens assigned successfully for ${shift} shift:`, {
        status: response.status,
        data: response.data
      });
      
      return response;
      
    } catch (error) {
      console.error(`[API] Error assigning tokens for ${shift} shift:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });
      
      // Re-throw the error to be handled by the caller
      throw error;
    }
  },
  
  getTokenSummary: async () => {
    try {
      console.log('Fetching token summary from:', `${API_BASE_URL}/admin/tokens/summary/`);
      const response = await api.get('/admin/tokens/summary/');
      
      // Log successful response for debugging
      console.log('Token summary response:', {
        status: response.status,
        data: response.data,
        headers: response.headers
      });
      
      // Ensure the response has the expected structure
      if (!response.data || typeof response.data !== 'object') {
        console.warn('Unexpected response format from token summary:', response);
        throw new Error('Invalid response format from server');
      }
      
      return response;
      
    } catch (error) {
      console.error('[API] Error in getTokenSummary:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      // Return a default structure if the API call fails
      const defaultResponse = {
        data: {
          day_shift: { users: [], total_tokens: 0 },
          mid_shift: { users: [], total_tokens: 0 },
          night_shift: { users: [], total_tokens: 0 }
        },
        status: error.response?.status,
        statusText: error.response?.statusText
      };
      
      // If we have a response but no data, include the error details
      if (error.response?.data) {
        defaultResponse.data = {
          ...defaultResponse.data,
          error: error.response.data,
          status: error.response.status
        };
      }
      
      return defaultResponse;
    }
  },
  
  // Dashboard endpoint
  getDashboardStats: async () => {
    try {
      console.log('Fetching dashboard stats from:', `${API_BASE_URL}/admin/dashboard/stats/`);
      const response = await api.get('/admin/dashboard/stats/');
      console.log('Dashboard stats response:', {
        status: response.status,
        data: response.data,
        headers: response.headers
      });
      return response;
    } catch (error) {
      console.error('Error in getDashboardStats:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        } : 'No response',
        stack: error.stack
      });
      throw error;
    }
  },
};

export default api;
