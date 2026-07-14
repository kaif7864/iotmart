import apiClient from './api.client';

export const validateCoupon = async (code, orderValue) => {
  const response = await apiClient.post('/coupons/validate', {
    code,
    order_value: orderValue
  });
  return response.data;
};
