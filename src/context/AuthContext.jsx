import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUsers, addAddress as apiAddAddress, removeAddress as apiRemoveAddress, loginUser, signupUser, getNotifications, markNotificationsAsRead } from '../services/api';

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
  
  const [currency, setCurrency] = useState({ code: 'INR', symbol: '₹', rate: 1 });
  const [notifications, setNotifications] = useState([]);

  // Fetch notifications and setup live polling if user is logged in
  useEffect(() => {
    let intervalId;
    
    const fetchNotifs = () => {
      if (user) {
        getNotifications()
          .then(data => setNotifications(data))
          .catch(err => {
            console.error("Failed to load notifications:", err);
            // If the user is blocked or unauthorized, stop spamming the backend
            if (err.response?.status === 403 || err.response?.status === 401) {
              if (intervalId) clearInterval(intervalId);
            }
          });
      }
    };

    if (user) {
      fetchNotifs(); // Fetch immediately on load
      // Poll every 15 seconds to make notifications "live"
      intervalId = setInterval(fetchNotifs, 15000);
    } else {
      setNotifications([]);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user]);

  const addNotification = (notif) => {
    setNotifications(prev => [{ ...notif, id: Date.now(), read: false, time: 'Just now' }, ...prev]);
  };

  const markAllRead = async () => {
    try {
      await markNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  const currencies = {
    INR: { code: 'INR', symbol: '₹', rate: 1 },
    USD: { code: 'USD', symbol: '$', rate: 1/83.5 },
    EUR: { code: 'EUR', symbol: '€', rate: (1/83.5) * 0.92 },
  };

  const formatPrice = (basePriceInr) => {
    const converted = basePriceInr * currency.rate;
    return `${currency.symbol}${converted.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const changeCurrency = (code) => {
    if (currencies[code]) setCurrency(currencies[code]);
  };

  const googleLogin = async (credential, isSignup = false) => {
    try {
      // Lazy import to avoid circular dependencies if any
      const { loginWithGoogle } = await import('../services/auth.service');
      const data = await loginWithGoogle(credential, isSignup);
      
      if (data.requires_2fa) {
        return { success: true, requires_2fa: true, data };
      }
      
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user_session', JSON.stringify(data.user));
      
      setUser(data.user);
      setIsAdmin(data.user.role === 'admin');
      setAddresses(data.user.addresses || []);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || 'Google Login failed.' };
    }
  };

  const login = async (credentials) => {
    try {
      const data = await loginUser(credentials);
      
      if (data.requires_2fa) {
        return { success: true, requires_2fa: true, data };
      }
      
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

  // Used after successful 2FA verification
  const completeLogin = (data) => {
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user_session', JSON.stringify(data.user));
    
    setUser(data.user);
    setIsAdmin(data.user.role === 'admin');
    setAddresses(data.user.addresses || []);
  };

  const updateUserSession = (updatedUser) => {
    localStorage.setItem('user_session', JSON.stringify(updatedUser));
    setUser(updatedUser);
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
    localStorage.removeItem('user_session');
    localStorage.removeItem('token');
    localStorage.removeItem('iotmart_cart');
    
    // Dispatch event to clear other contexts BEFORE page reload
    window.dispatchEvent(new Event('auth-logout'));
    
    // Set states to null after local storage is clear
    setUser(null);
    setIsAdmin(false);
    setAddresses([]);
    
    // Force a full reload to clear all React Context states (like Cart, Wishlist)
    window.location.href = '/';
  };



  const addAddress = async (newAddress) => {
    if (!user) return;
    try {
      const response = await apiAddAddress(user._id, newAddress);
      setAddresses(prev => {
        const newAddresses = [...prev, response];
        updateUserSession({ ...user, addresses: newAddresses });
        return newAddresses;
      });
    } catch (error) {
      console.error('Address addition failed:', error);
      const errorMsg = error.response?.data?.detail;
      if (errorMsg === "Account is inactive or blocked") {
        alert("Action Denied: Your account has been suspended by the administrator.");
      } else {
        alert("Failed to add address. Please try again.");
      }
    }
  };

  const removeAddress = async (id) => {
    if (!user) return;
    try {
      await apiRemoveAddress(user._id, id);
      setAddresses(prev => {
        const newAddresses = prev.filter(a => a.id !== id);
        updateUserSession({ ...user, addresses: newAddresses });
        return newAddresses;
      });
    } catch (error) {
      console.error('Address removal failed:', error);
      const errorMsg = error.response?.data?.detail;
      if (errorMsg === "Account is inactive or blocked") {
        alert("Action Denied: Your account has been suspended by the administrator.");
      } else {
        alert("Failed to remove address. Please try again.");
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser,
      isAdmin, 
      updateUserSession,
      login,
      completeLogin,
      googleLogin, 
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
