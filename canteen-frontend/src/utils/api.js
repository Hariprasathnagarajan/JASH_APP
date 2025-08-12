import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

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

// Interceptor: Attach CSRF token for modifying requests
api.interceptors.request.use(
  (config) => {
    const method = config.method?.toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      const csrfToken = getCSRFToken();
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: Handle 401s (optional)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Optional: redirect or notify
      window.location.href = '/login';
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
};

// Employee API
export const employeeAPI = {
  getMenu: () => api.get('/guest/menu/'),
  placeOrder: (orderData) => api.post('/employee/order/', orderData),
  getOrders: () => api.get('/employee/orders/'),
};

// Guest API
export const guestAPI = {
  getMenu: () => api.get('/employee/menu/'),
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
  getUsers: () => api.get('/admin/users/'),
  createUser: (userData) => api.post('/admin/users/', userData),
  updateUser: (userId, userData) => api.put(`/admin/users/${userId}/`, userData),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}/`),
  refreshTokens: (tokenCount) => api.post('/admin/tokens/refresh/', { token_count: tokenCount }),
};

export default api;
