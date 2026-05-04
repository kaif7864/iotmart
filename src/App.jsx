import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ComparisonProvider } from './context/ComparisonContext';

// Layouts
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';

// Lazy Loaded Pages
const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Login = lazy(() => import('./pages/Login'));
const UserProfile = lazy(() => import('./pages/user/UserProfile'));
const DeviceDashboard = lazy(() => import('./pages/DeviceDashboard'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Legal = lazy(() => import('./pages/Legal'));
const Compare = lazy(() => import('./pages/Compare'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Support = lazy(() => import('./pages/Support'));

// Admin Pages (Lazy)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminIoT = lazy(() => import('./pages/admin/AdminIoT'));

// Components
import Toast from './components/Toast';
import ChatSupport from './components/ChatSupport';

const LoadingScreen = () => (
  <div className="fixed inset-0 bg-white z-[999] flex items-center justify-center">
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 border-4 border-slate-100 border-t-accent rounded-full animate-spin"></div>
      <p className="mt-6 text-[10px] font-black text-text-muted uppercase tracking-[0.4em] animate-pulse">Initializing Neural Link...</p>
    </div>
  </div>
);

function App() {
  const [cartItems, setCartItems] = useState([]);
  const [toast, setToast] = useState(null);

  const handleAddToCart = (product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item._id === product._id);
      if (existingItem) {
        return prevItems.map(item => 
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
    setToast(`${product.name} added to cart`);
  };

  const handleRemoveFromCart = (id) => {
    setCartItems(prevItems => prevItems.filter(item => item._id !== id));
  };

  const handleUpdateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems(prevItems => 
      prevItems.map(item => 
        item._id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <AuthProvider>
      <ComparisonProvider>
        <Router>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route element={<UserLayout cartCount={cartCount} />}>
                <Route path="/" element={<Home onAddToCart={handleAddToCart} />} />
                <Route path="/shop" element={<Shop onAddToCart={handleAddToCart} />} />
                <Route path="/product/:id" element={<ProductDetail onAddToCart={handleAddToCart} />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<Legal />} />
                <Route path="/terms" element={<Legal />} />
                <Route path="/cart" element={
                  <Cart 
                    cartItems={cartItems} 
                    onRemoveFromCart={handleRemoveFromCart}
                    onUpdateQuantity={handleUpdateQuantity}
                  />
                } />
                <Route path="/checkout" element={
                  <Checkout 
                    cartItems={cartItems} 
                    onClearCart={handleClearCart} 
                  />
                } />
                <Route path="/login" element={<Login />} />
                <Route path="/profile" element={<UserProfile onAddToCart={handleAddToCart} />} />
                <Route path="/devices" element={<DeviceDashboard />} />
                <Route path="/track" element={<TrackOrder />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/support" element={<Support />} />
              </Route>

              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="iot" element={<AdminIoT />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>

          <ChatSupport />
          
          {toast && (
            <Toast message={toast} onClose={() => setToast(null)} />
          )}
        </Router>
      </ComparisonProvider>
    </AuthProvider>
  );
}

export default App;
