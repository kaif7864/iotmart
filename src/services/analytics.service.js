import apiClient from './api.client';

export const getDashboardStats = async () => {
  const response = await apiClient.get('/analytics/dashboard');
  return response.data;
};
