import React, { createContext, useContext, useState } from 'react';
import { getUsers, toggleWishlist as apiToggleWishlist, addAddress as apiAddAddress, removeAddress as apiRemoveAddress } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [currency, setCurrency] = useState({ code: 'INR', symbol: '₹', rate: 83.5 });
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Welcome to IoTMart', message: 'Your engineering account is now active.', type: 'info', time: 'Just now', read: false },
    { id: 2, title: 'Device Alert', message: 'Greenhouse Node 2 reported high humidity.', type: 'warning', time: '5m ago', read: false },
  ]);

  const addNotification = (notif) => {
    setNotifications(prev => [{ ...notif, id: Date.now(), read: false, time: 'Just now' }, ...prev]);
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const currencies = {
    INR: { code: 'INR', symbol: '₹', rate: 83.5 },
    USD: { code: 'USD', symbol: '$', rate: 1 },
    EUR: { code: 'EUR', symbol: '€', rate: 0.92 },
  };

  const formatPrice = (usdPrice) => {
    const converted = usdPrice * currency.rate;
    return `${currency.symbol}${converted.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const changeCurrency = (code) => {
    if (currencies[code]) setCurrency(currencies[code]);
  };

  const login = async (credentials) => {
    try {
      const data = await loginUser(credentials);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user_session', JSON.stringify(data.user));
      
      setUser(data.user);
      setIsAdmin(data.user.role === 'admin');
      setAddresses(data.user.addresses || []);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || 'Neural link failed' };
    }
  };

  const signup = async (userData) => {
    try {
      await signupUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || 'Initialization failed' };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAdmin(false);
    setWishlist([]);
    setAddresses([]);
    localStorage.removeItem('user_session');
    localStorage.removeItem('token');
  };

  const toggleWishlist = async (product) => {
    if (!user) return;
    try {
      const response = await apiToggleWishlist(user._id, product._id);
      // Re-hydrate wishlist from response IDs
      const allProducts = await (await fetch('http://localhost:8000/api/products')).json();
      const hydrated = allProducts.filter(p => response.wishlist.includes(p._id));
      setWishlist(hydrated);
    } catch (error) {
      if (error.response?.status === 404) {
        logout();
      }
      console.error('Wishlist sync failed:', error);
    }
  };

  const addAddress = async (newAddress) => {
    if (!user) return;
    try {
      const response = await apiAddAddress(user._id, newAddress);
      setAddresses(prev => [...prev, response]);
    } catch (error) {
      console.error('Address addition failed:', error);
    }
  };

  const removeAddress = async (id) => {
    if (!user) return;
    try {
      await apiRemoveAddress(user._id, id);
      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Address removal failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAdmin, 
      login, 
      logout, 
      wishlist, 
      toggleWishlist,
      addresses,
      addAddress,
      removeAddress,
      currency,
      formatPrice,
      changeCurrency,
      notifications,
      addNotification,
      markAllRead
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
