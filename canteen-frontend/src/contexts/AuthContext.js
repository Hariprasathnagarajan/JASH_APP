import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jwt_decode from 'jwt-decode';
import api from '../api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const logout = React.useCallback(() => {
    localStorage.removeItem('token');
    api.setAuthToken(null);
    setUser(null);
    setToken(null);
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (storedToken) {
        try {
          const decoded = jwt_decode(storedToken);
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp < currentTime) {
            logout();
          } else {
            setToken(storedToken);
            setUser(decoded);
            api.setAuthToken(storedToken);
          }
        } catch (error) {
          logout();
        }
      }
      setLoading(false);
    };
    
    initializeAuth();
  }, [logout]);

  const login = async (username, password) => {
    try {
      const response = await api.login(username, password);
      const { access, user: userData } = response.data;
      
      localStorage.setItem('token', access);
      api.setAuthToken(access);
      
      const decoded = jwt_decode(access);
      setUser(decoded);
      setToken(access);
      
      // Redirect based on role
      switch (userData.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'staff':
          navigate('/staff/orders');
          break;
        case 'employee':
          navigate('/employee/menu');
          break;
        default:
          navigate('/');
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || 'Login failed' };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);