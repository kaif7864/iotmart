import apiClient from './api.client';
import { loginUser, signupUser } from './auth.service';
import { getProducts, getProductsPaginated, addProductReview, getProductById, createProduct, updateProduct, deleteProduct } from './product.service';
import { placeOrder, getOrdersByUser, getUserOrders, getAllOrders, updateOrderStatus, updateOrderTracking, getLiveTracking } from './order.service';
import { getUsers, updateUserRole, updateUserStatus, toggleWishlist, addAddress, removeAddress, updateUserProfile } from './user.service';
import { getDashboardStats } from './analytics.service';
import { getAIChatReply } from './ai.service';

export {
  apiClient as default,
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
  getUsers,
  updateUserRole,
  updateUserStatus,
  toggleWishlist,
  addAddress,
  removeAddress,
  updateUserProfile,
  getDashboardStats,
  getAIChatReply
};
