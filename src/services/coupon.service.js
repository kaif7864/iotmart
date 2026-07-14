import apiClient from './api.client';

export const validateCoupon = async (code, orderValue, userId = null) => {
  const response = await apiClient.post('/coupons/validate', {
    code,
    order_value: orderValue,
    user_id: userId
  });
  return response.data;
};

export const getActiveCoupons = async () => {
  const response = await apiClient.get('/coupons/active');
  return response.data;
};
