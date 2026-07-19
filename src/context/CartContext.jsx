import React, { createContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('iotmart_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('iotmart_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    const handleLogout = () => {
      setCartItems([]);
    };
    window.addEventListener('auth-logout', handleLogout);
    return () => window.removeEventListener('auth-logout', handleLogout);
  }, []);

  const handleAddToCart = (product) => {
    const existingItem = cartItems.find(item => item._id === product._id);
    
    // Check stock limit
    if (existingItem) {
      const stockLimit = product.stockQuantity !== undefined ? product.stockQuantity : Infinity;
      if (existingItem.quantity >= stockLimit) {
        toast.error(`Only ${stockLimit} units available for ${product.name}`);
        return; // Don't proceed with state update
      }
      
      toast.success(`${product.name} quantity updated`, {
        style: { fontWeight: 'bold', fontSize: '12px', background: '#333', color: '#fff' }
      });
    } else {
      toast.success(`${product.name} added to cart`, {
        style: { fontWeight: 'bold', fontSize: '12px', background: '#333', color: '#fff' }
      });
    }

    setCartItems(prevItems => {
      const existing = prevItems.find(item => item._id === product._id);
      if (existing) {
        return prevItems.map(item => 
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (id) => {
    setCartItems(prevItems => prevItems.filter(item => item._id !== id));
  };

  const handleUpdateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    
    const existingItem = cartItems.find(item => item._id === id);
    if (existingItem) {
      const stockLimit = existingItem.stockQuantity !== undefined ? existingItem.stockQuantity : Infinity;
      if (newQuantity > stockLimit) {
        toast.error(`Only ${stockLimit} units available for ${existingItem.name}`);
        return;
      }
    }
    
    setCartItems(prevItems => 
      prevItems.map(item => 
        item._id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const [discount, setDiscount] = useState(0);
  const [appliedPromo, setAppliedPromo] = useState('');

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      discount,
      setDiscount,
      appliedPromo,
      setAppliedPromo,
      onAddToCart: handleAddToCart,
      onRemoveFromCart: handleRemoveFromCart,
      onUpdateQuantity: handleUpdateQuantity,
      onClearCart: handleClearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};
