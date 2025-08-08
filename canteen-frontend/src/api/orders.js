import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const placeOrder = async (items) => {
  try {
    const response = await axios.post(`${API_URL}/employee/order/`, { items });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getEmployeeOrders = async () => {
  try {
    const response = await axios.get(`${API_URL}/employee/orders/`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getAllOrders = async (search = '') => {
  try {
    const response = await axios.get(`${API_URL}/staff/orders/`, {
      params: { search }
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await axios.patch(`${API_URL}/staff/orders/${orderId}/update_status/`, { status });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};