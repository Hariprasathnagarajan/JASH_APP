import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const getMenuItems = async () => {
  try {
    const response = await axios.get(`${API_URL}/employee/menu/`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getAllMenuItems = async () => {
  try {
    const response = await axios.get(`${API_URL}/staff/menu/`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const createMenuItem = async (menuItem) => {
  try {
    const response = await axios.post(`${API_URL}/staff/menu/`, menuItem);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const updateMenuItem = async (id, menuItem) => {
  try {
    const response = await axios.patch(`${API_URL}/staff/menu/${id}/`, menuItem);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const deleteMenuItem = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/staff/menu/${id}/`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};