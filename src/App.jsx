import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ComparisonProvider } from './context/ComparisonContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { Toaster } from 'react-hot-toast';
import { Skeleton, SkeletonGrid, SkeletonText } from './components/common';

// Layouts
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';

// Routes
import { ProtectedRoute, AdminRoute } from './routes/ProtectedRoute';

// Lazy Loaded Pages
const Home = lazy(() => import('./pages/public/Home'));
const Shop = lazy(() => import('./pages/public/Shop'));
const ProductDetail = lazy(() => import('./pages/public/ProductDetail'));
const Cart = lazy(() => import('./pages/shop/Cart'));
const Checkout = lazy(() => import('./pages/shop/Checkout'));
const Login = lazy(() => import('./pages/auth/Login'));
const Signup = lazy(() => import('./pages/auth/Signup'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const UserProfile = lazy(() => import('./pages/user/UserProfile'));
const NotFound = lazy(() => import('./pages/public/NotFound'));
const DeviceDashboard = lazy(() => import('./pages/DeviceDashboard'));
const About = lazy(() => import('./pages/public/About'));
const Contact = lazy(() => import('./pages/public/Contact'));
const Legal = lazy(() => import('./pages/public/Legal'));
const Compare = lazy(() => import('./pages/shop/Compare'));
const TrackOrder = lazy(() => import('./pages/shop/TrackOrder'));
const FAQ = lazy(() => import('./pages/public/FAQ'));
const Support = lazy(() => import('./pages/support/Support'));
const IoTLab = lazy(() => import('./pages/lab/IoTLab'));

// Admin Pages (Lazy)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminSupport = lazy(() => import('./pages/admin/AdminSupport'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminLogs = lazy(() => import('./pages/admin/AdminLogs'));
// const AdminIoT = lazy(() => import('./pages/admin/AdminIoT')); // Lab type not needed
const AdminPromos = lazy(() => import('./pages/admin/AdminPromos'));

// Components
import ChatSupport from './components/feedback/ChatSupport';
import Toast from './components/feedback/Toast';
import { GoogleOAuthProvider } from '@react-oauth/google';

const LoadingScreen = () => (
  <div className="fixed inset-0 bg-app-bg z-[999] flex flex-col p-8 lg:p-32">
    <div className="max-w-7xl mx-auto w-full">
      <SkeletonText lines={1} className="w-48 h-8 mb-12" />
      <SkeletonGrid count={3} />
    </div>
  </div>
);

function App() {
  return (
    <GoogleOAuthProvider clientId="95030813967-u0po79ptsibocs7653c2nk2jiajokek8.apps.googleusercontent.com">
      <AuthProvider>
        <ComparisonProvider>
          <CartProvider>
          <WishlistProvider>
          <Router>
          <Toaster position="top-center" toastOptions={{ style: { fontWeight: 'bold', fontSize: '12px' } }} containerStyle={{ zIndex: 99999 }} />
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              {/* IoTLab — fullscreen, no navbar */}
              <Route path="/lab" element={<IoTLab />} />

              <Route element={<UserLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<Legal />} />
                <Route path="/terms" element={<Legal />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/track" element={<TrackOrder />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/support" element={<Support />} />
                
                {/* Protected User Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/profile" element={<UserProfile />} />
                  <Route path="/devices" element={<DeviceDashboard />} />
                </Route>
              </Route>

              {/* Protected Admin Routes */}
              <Route path="/admin" element={<AdminRoute />}>
                <Route element={<AdminLayout />}>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="users" element={<AdminUsers />} />
            <Route path="support" element={<AdminSupport />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="logs" element={<AdminLogs />} />
                  <Route path="promos" element={<AdminPromos />} />
                  {/* <Route path="iot" element={<AdminIoT />} /> */}
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Router>
          </WishlistProvider>
          </CartProvider>
        </ComparisonProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
