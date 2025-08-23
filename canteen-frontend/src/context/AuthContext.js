import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, fetchCSRFToken } from '../utils/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First ensure we have a CSRF token
      await fetchCSRFToken();
      
      // Then check if we have a valid session
      const response = await authAPI.getProfile();
      const userData = response.data;
      
      setUser(userData);
      setIsAuthenticated(true);
      // Avoid global welcome toasts here to prevent repeated toasts on every route change
      
      return userData;
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear any invalid tokens
      if (error.response && error.response.status === 401) {
        // Clear any invalid session data
        document.cookie = 'sessionid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'csrftoken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check auth status when location changes
  useEffect(() => {
    if (location.pathname !== '/login') {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [location, checkAuth]);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      // Ensure we have a CSRF token before login
      await fetchCSRFToken();
      
      const response = await authAPI.login(credentials);
      const userData = response.data.user || response.data;
      
      // Update auth state
      setUser(userData);
      setIsAuthenticated(true);
      
      // Store minimal user data in localStorage
      localStorage.setItem('user', JSON.stringify({
        id: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        name: userData.name
      }));
      
      setLoading(false);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || error.message || 'Login failed. Please try again.';
      setError(message);
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return { 
        success: false, 
        error: message
      };
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authAPI.logout();
      
      // Clear user data and authentication state
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear all cookies
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
      });
      
      // Clear localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // Redirect to login page
      navigate('/login');
      toast.success('Logged out', { autoClose: 1200, pauseOnHover: false, hideProgressBar: true });
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('An error occurred during logout. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };
  
  const updatePassword = async (passwordData) => {
    try {
      const response = await authAPI.updatePassword(passwordData);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update password' 
      };
    }
  };

  // Check if user has any of the required roles
  const hasRole = (requiredRoles) => {
    if (!user || !user.role) return false;
    if (!Array.isArray(requiredRoles)) requiredRoles = [requiredRoles];
    return requiredRoles.includes(user.role);
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    checkAuth,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
