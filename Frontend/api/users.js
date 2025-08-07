import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const getUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/users/`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const createUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/admin/users/`, userData);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const updateUser = async (id, userData) => {
  try {
    const response = await axios.patch(`${API_URL}/admin/users/${id}/`, userData);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/admin/users/${id}/`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const refreshTokens = async (tokenCount) => {
  try {
    const response = await axios.post(`${API_URL}/admin/tokens/refresh/`, { token_count: tokenCount });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};