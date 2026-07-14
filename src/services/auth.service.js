import apiClient from './api.client';

export const loginUser = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
};

export const signupUser = async (userData) => {
  const response = await apiClient.post('/auth/signup', userData);
  return response.data;
};

export const loginWithGoogle = async (credential, isSignup = false) => {
  const response = await apiClient.post('/auth/google', { credential, isSignup });
  return response.data;
};

export const sendVerification = async (email, type) => {
  const response = await apiClient.post('/auth/send-verification', { email, type });
  return response.data;
};

export const verifyMobile = async (email, otp) => {
  const response = await apiClient.post('/auth/verify-mobile', { email, otp });
  return response.data;
};

export const verifyEmailOtp = async (email, otp, new_email) => {
  const response = await apiClient.post('/auth/verify-email-otp', { email, otp, new_email });
  return response.data;
};

export const updateIdentity = async (user_id, email, phone) => {
  const response = await apiClient.put('/auth/update-identity', { user_id, email, phone });
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};
