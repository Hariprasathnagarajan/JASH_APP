import api from './api';

export const refreshTokens = () => {
  return api.post('/tokens/refresh/');
};

export const getUserTokens = (userId) => {
  return api.get(`/tokens/?user=${userId}`);
};

export const updateUserTokens = (userId, tokens) => {
  return api.patch(`/tokens/${userId}/`, { tokens });
};