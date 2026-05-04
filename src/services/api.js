import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Simple Cache
const apiCache = {
  products: { data: null, timestamp: 0 },
  users: { data: null, timestamp: 0 }
};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Auth Interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const signupUser = async (userData) => {
  const response = await api.post('/auth/signup', userData);
  return response.data;
};

export const getProducts = async () => {
  const now = Date.now();
  if (apiCache.products.data && (now - apiCache.products.timestamp < CACHE_TTL)) {
    return apiCache.products.data;
  }
  
  const response = await api.get('/products');
  apiCache.products = { data: response.data, timestamp: now };
  return response.data;
};

export const addProductReview = async (productId, reviewData) => {
  const response = await api.post(`/products/${productId}/reviews`, reviewData);
  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await api.post('/products', productData);
  return response.data;
};

export const updateProduct = async (id, productData) => {
  const response = await api.put(`/products/${id}`, productData);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

// Orders
export const placeOrder = async (orderData) => {
  const response = await api.post('/orders', orderData);
  return response.data;
};

export const getOrdersByUser = async (userId) => {
  const response = await api.get(`/orders/user/${userId}`);
  return response.data;
};

export const getUserOrders = getOrdersByUser;

export const getAllOrders = async () => {
  const response = await api.get('/orders');
  return response.data;
};

// Users
export const getUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const updateUserRole = async (id, role) => {
  const response = await api.put(`/users/${id}/role`, { role });
  return response.data;
};

export const updateOrderStatus = async (id, status) => {
  const response = await api.put(`/orders/${id}/status`, { status });
  return response.data;
};

export const updateOrderTracking = async (id, tracking_id) => {
  const response = await api.put(`/orders/${id}/tracking`, { tracking_id });
  return response.data;
};

export const updateUserStatus = async (id, status) => {
  const response = await api.put(`/users/${id}/status`, { status });
  return response.data;
};

export const toggleWishlist = async (userId, productId) => {
  const response = await api.post(`/users/${userId}/wishlist`, { product_id: productId });
  return response.data;
};

export const addAddress = async (userId, addressData) => {
  const response = await api.post(`/users/${userId}/addresses`, addressData);
  return response.data;
};

export const removeAddress = async (userId, addressId) => {
  const response = await api.delete(`/users/${userId}/addresses/${addressId}`);
  return response.data;
};

// Analytics
export const getDashboardStats = async () => {
  const response = await api.get('/analytics/dashboard');
  return response.data;
};

// AI
export const getAIChatReply = async (message) => {
  const response = await api.post('/ai/chat', { message });
  return response.data;
};

export default api;
