import apiClient from './api.client';

// Simple Cache
const apiCache = {
  products: { data: null, timestamp: 0 }
};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getProducts = async () => {
  const now = Date.now();
  if (apiCache.products.data && (now - apiCache.products.timestamp < CACHE_TTL)) {
    return apiCache.products.data;
  }
  
  const response = await apiClient.get('/products');
  apiCache.products = { data: response.data, timestamp: now };
  return response.data;
};

export const addProductReview = async (productId, reviewData) => {
  const response = await apiClient.post(`/products/${productId}/reviews`, reviewData);
  return response.data;
};

export const getProductById = async (id) => {
  const response = await apiClient.get(`/products/${id}`);
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await apiClient.post('/products', productData);
  return response.data;
};

export const updateProduct = async (id, productData) => {
  const response = await apiClient.put(`/products/${id}`, productData);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await apiClient.delete(`/products/${id}`);
  return response.data;
};
