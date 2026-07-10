import React, { createContext, useContext, useState } from 'react';
import { getUsers, addAddress as apiAddAddress, removeAddress as apiRemoveAddress, loginUser, signupUser } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const session = localStorage.getItem('user_session');
    return session ? JSON.parse(session) : null;
  });
  
  const [isAdmin, setIsAdmin] = useState(() => {
    const session = localStorage.getItem('user_session');
    if (session) {
      const parsed = JSON.parse(session);
      return parsed.role === 'admin';
    }
    return false;
  });

  const [addresses, setAddresses] = useState(() => {
    const session = localStorage.getItem('user_session');
    if (session) {
      const parsed = JSON.parse(session);
      return parsed.addresses || [];
    }
    return [];
  });
  
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
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || 'Login failed. Please check your credentials.' };
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

    setAddresses([]);
    localStorage.removeItem('user_session');
    localStorage.removeItem('token');
    localStorage.removeItem('iotmart_cart');
    
    // Force a full reload to clear all React Context states (like Cart, Wishlist)
    window.location.href = '/';
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
      setUser,
      isAdmin, 
      login, 
      signup,
      logout, 

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
