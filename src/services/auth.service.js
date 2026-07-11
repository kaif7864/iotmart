import apiClient from './api.client';

export const loginUser = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
};

export const signupUser = async (userData) => {
  const response = await apiClient.post('/auth/signup', userData);
  return response.data;
};

export const loginWithGoogle = async (credential) => {
  const response = await apiClient.post('/auth/google', { credential });
  return response.data;
};

export const sendVerification = async (email) => {
  const response = await apiClient.post('/auth/send-verification', { email });
  return response.data;
};

export const verifyMobile = async (email, otp) => {
  const response = await apiClient.post('/auth/verify-mobile', { email, otp });
  return response.data;
};
