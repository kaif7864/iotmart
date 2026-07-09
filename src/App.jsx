import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ComparisonProvider } from './context/ComparisonContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { Toaster } from 'react-hot-toast';

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
const UserProfile = lazy(() => import('./pages/user/UserProfile'));
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
const AdminIoT = lazy(() => import('./pages/admin/AdminIoT'));

// Components
import ChatSupport from './components/feedback/ChatSupport';
import Toast from './components/feedback/Toast';

const LoadingScreen = () => (
  <div className="fixed inset-0 bg-card-bg z-[999] flex items-center justify-center">
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 border-4 border-border-subtle border-t-accent rounded-full animate-spin"></div>
      <p className="mt-6 text-[10px] font-black text-text-muted uppercase tracking-[0.4em] animate-pulse">Initializing Neural Link...</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <ComparisonProvider>
        <CartProvider>
          <WishlistProvider>
          <Router>
          <Toaster position="top-right" toastOptions={{ style: { fontWeight: 'bold', fontSize: '12px' } }} />
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
                  <Route path="iot" element={<AdminIoT />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>

          {/* <ChatSupport /> */}
        </Router>
          </WishlistProvider>
        </CartProvider>
      </ComparisonProvider>
    </AuthProvider>
  );
}

export default App;
