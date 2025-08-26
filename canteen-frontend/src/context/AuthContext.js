import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, fetchCSRFToken, ensureCSRFToken } from '../utils/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Helper to clear auth data
const clearAuthData = () => {
  // Clear all cookies by setting them to expire in the past
  const cookies = document.cookie.split(';');
  cookies.forEach(cookie => {
    const [name] = cookie.split('=').map(c => c.trim());
    if (name) {
      // Clear cookie by setting it to expire in the past
      document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
      // Also clear for subdomains if applicable
      document.cookie = `${name}=; Path=/; Domain=${window.location.hostname}; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
      document.cookie = `${name}=; Path=/; Domain=.${window.location.hostname}; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
    }
  });
  
  // Clear local storage and session storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear indexedDB if used
  if (window.indexedDB) {
    window.indexedDB.databases().then(databases => {
      databases.forEach(db => {
        if (db.name) {
          window.indexedDB.deleteDatabase(db.name);
        }
      });
    }).catch(console.error);
  }
  
  // Clear any service worker caches
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
      });
    }).catch(console.error);
  }
};

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
      await ensureCSRFToken();
      
      // Then check if we have a valid session
      const response = await authAPI.getProfile().catch(err => {
        // Clear auth data if we get a 401
        if (err.response?.status === 401) {
          clearAuthData();
        }
        throw err;
      });
      
      const userData = response.data;
      
      // Update state with user data
      setUser(userData);
      setIsAuthenticated(true);
      
      // Store minimal user data in localStorage for session persistence
      const userToStore = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        name: userData.name,
        shift: userData.shift,
        tokens_remaining: userData.tokens_remaining
      };
      
      localStorage.setItem('user', JSON.stringify(userToStore));
      
      return userData;
    } catch (error) {
      console.error('Auth check failed:', error);
      
      // Try to get user from localStorage as fallback for offline mode
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // Only use stored user if we're not getting auth errors
          if (error.response?.status !== 401) {
            setUser(parsedUser);
            setIsAuthenticated(true);
            return parsedUser;
          }
        } catch (parseError) {
          console.error('Failed to parse stored user:', parseError);
          clearAuthData();
        }
      }
      
      // Clear auth state
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear any invalid tokens on auth errors
      if (error.response?.status === 401) {
        clearAuthData();
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check auth status on initial load and when location changes
  useEffect(() => {
    if (location.pathname !== '/login') {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [location, checkAuth]);

  // Initial auth check on app load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      // Ensure we have a fresh CSRF token
      await ensureCSRFToken();
      
      // Make the login request
      await authAPI.login(credentials);
      
      // Get the user profile to update auth state
      const userData = await checkAuth();
      
      // Update auth state
      setUser(userData);
      setIsAuthenticated(true);
      
      // Store user data in localStorage for session persistence
      localStorage.setItem('user', JSON.stringify({
        id: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        name: userData.name
      }));
      
      // Show success message
      toast.success(`Welcome back, ${userData.name || userData.username}!`);
      
      // Redirect based on role
      const redirectPath = location.state?.from?.pathname || 
        (userData.role === 'admin' ? '/admin/dashboard' : 
         userData.role === 'staff' ? '/staff/orders' : 
         userData.role === 'employee' ? '/employee/menu' : '/guest/menu');
      
      navigate(redirectPath, { replace: true });
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login failed:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      setUser(null);
      setIsAuthenticated(false);
      toast.error(errorMessage);
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      // Ensure we have a CSRF token before making the logout request
      try {
        await ensureCSRFToken();
        
        // Make the logout request with credentials
        await authAPI.logout(null, {
          withCredentials: true,
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          }
        });
      } catch (error) {
        console.error('Logout API error (proceeding anyway):', error);
      } finally {
        // Always clear auth data and state, even if the API call fails
        clearAuthData();
        
        // Reset state
        setUser(null);
        setIsAuthenticated(false);
        setError(null);
        
        // Clear any pending requests or timers
        if (window.authRefreshTimer) {
          clearTimeout(window.authRefreshTimer);
          delete window.authRefreshTimer;
        }
        
        // Redirect to login with a small delay to ensure state is cleared
        setTimeout(() => {
          navigate('/login', { replace: true });
          toast.success('You have been logged out successfully.');
        }, 100);
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('An error occurred during logout.');
      throw error;
    } finally {
      setLoading(false);
    }
    try {
      setLoading(true);
      
      // Only call logout API if we have a valid session
      if (isAuthenticated) {
        await authAPI.logout();
      }
      
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

  // User and password update functionality can be added here when needed

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
