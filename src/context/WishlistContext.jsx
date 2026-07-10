import React, { createContext, useContext, useState, useEffect } from 'react';
import { toggleWishlist as apiToggleWishlist, getProducts } from '../services/api';
import { useAuth } from './AuthContext';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user, setUser, logout } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [pendingToggles, setPendingToggles] = useState(new Set());

  useEffect(() => {
    const hydrateInitialWishlist = async () => {
      if (user && user.wishlist && user.wishlist.length > 0) {
        try {
          const allProducts = await getProducts();
          const hydrated = allProducts.filter(p => user.wishlist.includes(p._id));
          setWishlist(hydrated);
        } catch (error) {
          console.error("Initial wishlist hydration failed", error);
        }
      } else {
        setWishlist([]);
      }
    };
    hydrateInitialWishlist();
  }, [user?._id]);

  const toggleWishlist = async (product) => {
    if (!user || pendingToggles.has(product._id)) return;
    
    setPendingToggles(prev => new Set(prev).add(product._id));
    try {
      const response = await apiToggleWishlist(user._id, product._id);
      
      // Update local user session so refresh works
      const updatedUser = { ...user, wishlist: response.wishlist };
      setUser(updatedUser);
      localStorage.setItem('user_session', JSON.stringify(updatedUser));

      // Re-hydrate wishlist from response IDs
      const allProducts = await getProducts();
      const hydrated = allProducts.filter(p => response.wishlist.includes(p._id));
      setWishlist(hydrated);
    } catch (error) {
      if (error.response?.status === 404) {
        logout();
      }
      console.error('Wishlist sync failed:', error);
    } finally {
      setPendingToggles(prev => {
        const next = new Set(prev);
        next.delete(product._id);
        return next;
      });
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, setWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
