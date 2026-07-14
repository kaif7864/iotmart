import apiClient from './api.client';
import { loginUser, signupUser, sendVerification, verifyMobile, updateIdentity, forgotPassword } from './auth.service';
import { getProducts, getProductsPaginated, addProductReview, getProductById, createProduct, updateProduct, deleteProduct } from './product.service';
import { placeOrder, getOrdersByUser, getUserOrders, getAllOrders, updateOrderStatus, updateOrderTracking, getLiveTracking, refundOrder } from './order.service';
import { getUsers, updateUserRole, updateUserStatus, toggleWishlist, addAddress, removeAddress, updateUserProfile, changeUserPassword, deactivateAccount, addRecentlyViewed } from './user.service';
import { getDashboardStats } from './analytics.service';
import { getAIChatReply } from './ai.service';
import { validateCoupon } from './coupon.service';
import { createTransaction, getUserTransactions } from './transaction.service';

export {
  apiClient as default,
  validateCoupon,
  createTransaction,
  getUserTransactions,
  loginUser,
  signupUser,
  getProducts,
  getProductsPaginated,
  addProductReview,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  placeOrder,
  getOrdersByUser,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  updateOrderTracking,
  getLiveTracking,
  refundOrder,
  getUsers,
  updateUserRole,
  updateUserStatus,
  toggleWishlist,
  addAddress,
  removeAddress,
  updateUserProfile,
  changeUserPassword,
  getDashboardStats,
  getAIChatReply,
  sendVerification,
  verifyMobile,
  updateIdentity,
  forgotPassword,
  deactivateAccount,
  addRecentlyViewed
};

export const setup2FA = (email) => apiClient.get(`/auth/2fa/setup?email=${email}`);
export const enable2FA = (data) => apiClient.post('/auth/2fa/enable', data);
export const disable2FA = (email) => apiClient.post('/auth/2fa/disable', { email });
export const verify2FALogin = (data) => apiClient.post('/auth/login/verify-2fa', data);

export const uploadProductImage = (formData) => apiClient.post('/products/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
