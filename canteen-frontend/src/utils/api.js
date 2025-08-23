import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';


// Helper: Get CSRF token from cookies
function getCSRFToken() {
  const name = 'csrftoken';
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Ensure we have a CSRF token before making any requests
const ensureCSRFToken = async () => {
  try {
    await axios.get(`${API_BASE_URL}/csrf/`, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    throw error;
  }
};

// Interceptor: Attach CSRF token for modifying requests
api.interceptors.request.use(
  async (config) => {
    const method = config.method?.toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      await ensureCSRFToken();
      const csrfToken = getCSRFToken();
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: Handle authentication errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // Redirect to login if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Handle CSRF token issues
    if (error.response?.status === 403 && error.response.data?.code === 'csrf_token_mismatch') {
      await ensureCSRFToken();
      return api(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

// CSRF fetcher
export const fetchCSRFToken = () => api.get('/csrf/');

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/login/', credentials),
  logout: () => api.post('/logout/'),
  getProfile: () => api.get('/profile/'),
  updatePassword: (passwordData) => api.post('/update_password/', passwordData),
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
  getUsers: () => api.get('/admin/users/'),
  createUser: (userData) => api.post('/admin/users/', userData),
  updateUser: (userId, userData) => api.patch(`/admin/users/${userId}/`, userData),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}/`),
  
  // Token Management
  refreshTokens: (tokenCount) => api.post('/admin/tokens/refresh/', { count: tokenCount }),
  assignTokens: (shift) => api.post('/admin/tokens/assign/', { shift }),
  getTokenSummary: () => api.get('/admin/tokens/summary/'),
  
  // Dashboard endpoints
  getDashboardStats: () => api.get('/admin/dashboard/stats/'),
  getRecentOrders: (limit = 5) => api.get(`/admin/dashboard/orders/recent/?limit=${limit}`),
  getRevenueData: (period = 'week') => api.get(`/admin/dashboard/revenue/?period=${period}`)
};

export default api;
