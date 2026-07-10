import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart, Scale } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useComparison } from '../../context/ComparisonContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../hooks/useCart';

const ProductCard = ({ product }) => {
  const { onAddToCart, cartItems, onUpdateQuantity, onRemoveFromCart } = useCart();
  const cartItem = cartItems.find(item => item._id === product._id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;
  const { formatPrice } = useAuth();
  const { toggleWishlist, wishlist } = useWishlist();
  const { addToCompare, comparisonList } = useComparison();
  const isInWishlist = wishlist.some(p => p._id === product._id);
  const isInCompare = comparisonList.some(p => p._id === product._id);

  return (
    <motion.div 
      className="bg-card-bg rounded-sm overflow-hidden group flex flex-col h-full border border-border-main hover:shadow-lg transition-all duration-300 relative"
    >
      <Link to={`/product/${product._id}`} className="relative block aspect-square overflow-hidden bg-app-bg">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-contain p-4 transform transition-all duration-500 group-hover:scale-105"
        />
        <div className="absolute top-2 left-2 z-20">
          {!product.inStock && (
            <span className="bg-status-danger text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-widest">
              Sold Out
            </span>
          )}
        </div>
      </Link>

      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button 
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product);
          }}
          className={`p-2 rounded-full border shadow-sm transition-all ${
            isInWishlist ? 'bg-red-50 border-red-100 text-status-danger' : 'bg-card-bg border-border-subtle text-text-muted hover:text-red-400'
          }`}
        >
          <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
        </button>
        <button 
          onClick={(e) => {
            e.preventDefault();
            addToCompare(product);
          }}
          className={`p-2 rounded-full border shadow-sm transition-all ${
            isInCompare ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-card-bg border-border-subtle text-text-muted hover:text-accent'
          }`}
          title="Compare Product"
        >
          <Scale className="h-4 w-4" />
        </button>
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <div className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">{product.category}</div>
        <Link to={`/product/${product._id}`}>
          <h3 className="text-base font-bold text-text-primary mb-2 line-clamp-2 hover:text-accent transition-colors tracking-tight leading-tight">{product.name}</h3>
        </Link>
        
        <div className="flex items-center gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className={`h-3 w-3 ${s <= Math.round(product.rating) ? 'fill-status-star text-status-star' : 'text-lab-text'}`} />
          ))}
          <span className="text-[10px] font-medium text-text-muted ml-1">({product.reviews_count || 0})</span>
        </div>
        
        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-text-primary tracking-tight">{formatPrice(product.price)}</span>
          </div>
          {quantityInCart > 0 ? (
            <div className="flex items-center bg-surface-hover rounded-md p-1 border border-border-main">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  if (quantityInCart === 1) onRemoveFromCart(product._id);
                  else onUpdateQuantity(product._id, quantityInCart - 1);
                }}
                className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-accent hover:bg-card-bg rounded transition-colors text-sm font-black"
              >
                -
              </button>
              <span className="w-8 text-center text-xs font-bold text-text-primary">
                {quantityInCart}
              </span>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  onUpdateQuantity(product._id, quantityInCart + 1);
                }}
                className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-accent hover:bg-card-bg rounded transition-colors text-sm font-black"
              >
                +
              </button>
            </div>
          ) : (
            <button 
              onClick={(e) => {
                e.preventDefault();
                if (product.inStock) onAddToCart(product);
              }}
              disabled={!product.inStock}
              className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-md text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            >
              <ShoppingCart className="h-4 w-4" /> Add
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
