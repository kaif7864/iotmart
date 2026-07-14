import apiClient from './api.client';

// Simple Cache
const apiCache = {
  products: { data: null, timestamp: 0, promise: null }
};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getProducts = async (page = 1, limit = 100) => {
  const now = Date.now();
  const cacheKey = `${page}-${limit}`;
  
  if (apiCache.products.data && apiCache.products.page === cacheKey && (now - apiCache.products.timestamp < CACHE_TTL)) {
    return apiCache.products.data;
  }
  
  if (apiCache.products.promise) {
    return apiCache.products.promise;
  }
  
  apiCache.products.promise = apiClient.get(`/products?page=${page}&limit=${limit}`).then(response => {
    // Determine if it's paginated dict or old array format
    const productsArray = response.data.products ? response.data.products : response.data;
    apiCache.products = { data: productsArray, page: cacheKey, timestamp: Date.now(), promise: null };
    return productsArray; // Return array to not break existing frontend code
  }).catch(error => {
    apiCache.products.promise = null;
    throw error;
  });

  return apiCache.products.promise;
};

export const getProductsPaginated = async (page = 1, limit = 12) => {
  const response = await apiClient.get(`/products?page=${page}&limit=${limit}`);
  return response.data; // Returns { products, total, page, pages }
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
