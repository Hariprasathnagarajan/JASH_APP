import axios from 'axios';


const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const login = (username, password) => {
  return api.post('/auth/login/', { username, password });
};

export const getProfile = () => {
  return api.get('/profile/');
};

export default api;