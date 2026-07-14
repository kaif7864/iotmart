import apiClient from './api.client';

// Simple Cache
const apiCache = {
  products: { data: null, timestamp: 0, promise: null }
};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getProducts = async (page = 1, limit = 100, search = '', category = '') => {
  const now = Date.now();
  const cacheKey = `${page}-${limit}-${search}-${category}`;
  
  if (apiCache.products.data && apiCache.products.page === cacheKey && (now - apiCache.products.timestamp < CACHE_TTL)) {
    return apiCache.products.data;
  }
  
  if (apiCache.products.promise && apiCache.products.page === cacheKey) {
    return apiCache.products.promise;
  }
  
  let url = `/products?page=${page}&limit=${limit}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (category && category !== 'All') url += `&category=${encodeURIComponent(category)}`;
  
  apiCache.products.page = cacheKey;
  apiCache.products.promise = apiClient.get(url).then(response => {
    const productsArray = response.data.products ? response.data.products : response.data;
    apiCache.products = { data: productsArray, page: cacheKey, timestamp: Date.now(), promise: null };
    return productsArray; // Return array to not break existing frontend code
  }).catch(error => {
    apiCache.products.promise = null;
    throw error;
  });

  return apiCache.products.promise;
};

export const getProductsPaginated = async (page = 1, limit = 12, search = '', category = '') => {
  let url = `/products?page=${page}&limit=${limit}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (category && category !== 'All') url += `&category=${encodeURIComponent(category)}`;
  const response = await apiClient.get(url);
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
