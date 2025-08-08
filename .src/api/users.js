import api from './api';

export const getUsers = () => {
  return api.get('/users/');
};

export const createUser = (userData) => {
  return api.post('/users/', userData);
};

export const updateUser = (userId, userData) => {
  return api.patch(`/users/${userId}/`, userData);
};

export const deleteUser = (userId) => {
  return api.delete(`/users/${userId}/`);
};