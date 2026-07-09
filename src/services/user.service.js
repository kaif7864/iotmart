import apiClient from './api.client';

export const getUsers = async () => {
  const response = await apiClient.get('/users');
  return response.data;
};

export const updateUserRole = async (id, role) => {
  const response = await apiClient.put(`/users/${id}/role`, { role });
  return response.data;
};

export const updateUserStatus = async (id, status) => {
  const response = await apiClient.put(`/users/${id}/status`, { status });
  return response.data;
};

export const toggleWishlist = async (userId, productId) => {
  const response = await apiClient.post(`/users/${userId}/wishlist`, { product_id: productId });
  return response.data;
};

export const addAddress = async (userId, addressData) => {
  const response = await apiClient.post(`/users/${userId}/addresses`, addressData);
  return response.data;
};

export const removeAddress = async (userId, addressId) => {
  const response = await apiClient.delete(`/users/${userId}/addresses/${addressId}`);
  return response.data;
};
