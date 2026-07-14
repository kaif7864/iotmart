import apiClient from './api.client';

export const createTransaction = async (data) => {
  const response = await apiClient.post('/transactions/', data);
  return response.data;
};

export const getUserTransactions = async (userId) => {
  const response = await apiClient.get(`/transactions/user/${userId}`);
  return response.data;
};
