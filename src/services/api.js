import apiClient from './api.client';
import { loginUser, signupUser, sendVerification, verifyMobile, verifyEmailOtp, updateIdentity, forgotPassword } from './auth.service';
import { getProducts, getProductsPaginated, addProductReview, getProductById, createProduct, updateProduct, deleteProduct, getAiCuratedProducts, postAiChatProducts, getGlobalReviews } from './product.service';
import { placeOrder, getOrdersByUser, getUserOrders, getAllOrders, updateOrderStatus, updateOrderTracking, getLiveTracking, refundOrder } from './order.service';
import { getUsers, updateUserRole, updateUserStatus, deleteUser, toggleWishlist, addAddress, removeAddress, updateUserProfile, changeUserPassword, deactivateAccount, addRecentlyViewed } from './user.service';
import { getDashboardStats } from './analytics.service';
import { getAIChatReply } from './ai.service';
import { validateCoupon, getActiveCoupons } from './coupon.service';
import { createTransaction, getUserTransactions } from './transaction.service';

// ==========================================
// Notifications API
// ==========================================
const getNotifications = async () => {
    try {
        const response = await apiClient.get('/notifications/');
        return response.data.map(n => {
            if (n.created_at) {
                const date = new Date(n.created_at);
                n.time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString();
            }
            return n;
        });
    } catch (error) {
        throw error.response?.data?.detail || 'Failed to fetch notifications';
    }
};

const markNotificationsAsRead = async () => {
    try {
        const response = await apiClient.put('/notifications/read-all');
        return response.data;
    } catch (error) {
        throw error.response?.data?.detail || 'Failed to mark notifications as read';
    }
};

export {
  apiClient as default,
  validateCoupon,
  getActiveCoupons,
  createTransaction,
  getUserTransactions,
  getNotifications,
  markNotificationsAsRead,
  loginUser,
  signupUser,
  getProducts,
  getAiCuratedProducts,
  postAiChatProducts,
  getGlobalReviews,
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
  deleteUser,
  toggleWishlist,
  addAddress,
  removeAddress,
  updateUserProfile,
  changeUserPassword,
  getDashboardStats,
  getAIChatReply,
  sendVerification,
  verifyMobile,
  verifyEmailOtp,
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
