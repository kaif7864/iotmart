import apiClient from './api.client';

export const getAIChatReply = async (message) => {
  const response = await apiClient.post('/ai/chat', { message });
  return response.data;
};
