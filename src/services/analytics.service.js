import apiClient from './api.client';

export const getDashboardStats = async (range = '7D') => {
  const response = await apiClient.get(`/analytics/dashboard?range=${range}`);
  return response.data;
};
