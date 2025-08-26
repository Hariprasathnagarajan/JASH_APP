import { api, ensureCSRFToken } from './api';
import { toast } from 'react-toastify';

export const login = async (email, password, rememberMe = false) => {
  try {
    // Ensure we have a CSRF token
    await ensureCSRFToken();
    
    // Make the login request
    const response = await api.post('/login/', {
      email,
      password,
      remember_me: rememberMe
    }, {
      withCredentials: true,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (response.status === 200) {
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error.response?.data?.error || 
                       error.response?.data?.message || 
                       error.message || 
                       'Login failed';
    
    toast.error(errorMessage);
    throw error;
  }
};

export const logout = async () => {
  try {
    await api.post('/logout/', {}, { withCredentials: true });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear user data from localStorage
    localStorage.removeItem('user');
    // Clear CSRF token
    document.cookie = 'csrftoken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => {
  return !!getCurrentUser();
};
