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
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item._id === product._id);
      
      // Check stock limit for existing items
      if (existingItem) {
        const stockLimit = product.stockQuantity !== undefined ? product.stockQuantity : Infinity;
        if (existingItem.quantity >= stockLimit) {
          toast.error(`Only ${stockLimit} units available for ${product.name}`);
          return prevItems;
        }
        
        toast.success(`${product.name} quantity updated`, {
          style: { fontWeight: 'bold', fontSize: '12px', background: '#333', color: '#fff' }
        });
        
        return prevItems.map(item => 
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      
      // For new items, they are adding 1, assume 1 is available if inStock is true
      toast.success(`${product.name} added to cart`, {
        style: { fontWeight: 'bold', fontSize: '12px', background: '#333', color: '#fff' }
      });
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (id) => {
    setCartItems(prevItems => prevItems.filter(item => item._id !== id));
  };

  const handleUpdateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item._id === id);
      if (existingItem) {
        const stockLimit = existingItem.stockQuantity !== undefined ? existingItem.stockQuantity : Infinity;
        if (newQuantity > stockLimit) {
          toast.error(`Only ${stockLimit} units available for ${existingItem.name}`);
          return prevItems;
        }
      }
      
      return prevItems.map(item => 
        item._id === id ? { ...item, quantity: newQuantity } : item
      );
    });
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
