import apiClient from './api.client';

export const placeOrder = async (orderData) => {
  const response = await apiClient.post('/orders', orderData);
  return response.data;
};

export const getOrdersByUser = async (userId) => {
  const response = await apiClient.get(`/orders/user/${userId}`);
  return response.data;
};

export const getUserOrders = getOrdersByUser;

export const getAllOrders = async () => {
  const response = await apiClient.get('/orders');
  return response.data;
};

export const updateOrderStatus = async (id, status) => {
  const response = await apiClient.put(`/orders/${id}/status`, { status });
  return response.data;
};

export const updateOrderTracking = async (id, tracking_id) => {
  const response = await apiClient.put(`/orders/${id}/tracking`, { tracking_id });
  return response.data;
};

export const getLiveTracking = async (tracking_id) => {
  const response = await apiClient.get(`/orders/tracking/${tracking_id}`);
  return response.data;
};
