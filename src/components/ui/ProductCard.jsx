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
  const isInWishlist = wishlist.some(p => p._id === product._id);

  return (
    <motion.div 
      className="bg-card-bg/60 backdrop-blur-md rounded-3xl overflow-hidden group flex flex-col h-full border border-border-main hover:border-accent/50 hover:shadow-[0_10px_40px_rgba(2,132,199,0.15)] transition-all duration-500 relative"
    >
      {/* Hover Light Beam Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-accent/5 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform pointer-events-none"></div>

      <Link to={`/product/${product.slug || product._id}`} className="relative block aspect-[4/3] overflow-hidden bg-surface-hover/30 p-6">
        <img 
          src={product.image} 
          alt={product.name} 
          loading="lazy"
          className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal transform transition-transform duration-700 group-hover:scale-110 drop-shadow-xl"
        />
        <div className="absolute top-4 left-4 z-20">
          {(!product.inStock || (product.stockQuantity !== undefined && product.stockQuantity <= 0)) && (
            <span className="bg-status-danger/90 backdrop-blur-sm text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> Out of Stock
            </span>
          )}
        </div>
      </Link>

      <div className="absolute top-4 right-4 z-20 flex flex-col gap-3 translate-x-10 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
        <button 
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product);
          }}
          className={`p-2.5 rounded-full backdrop-blur-md shadow-lg transition-all hover:scale-110 ${
            isInWishlist ? 'bg-status-danger/10 border border-status-danger/20 text-status-danger shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-card-bg/80 border border-border-main text-text-muted hover:text-status-danger hover:border-status-danger/50'
          }`}
          title="Wishlist"
        >
          <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
        </button>
      </div>
      
      <div className="p-6 flex flex-col flex-grow relative z-10 bg-card-bg/40">
        <div className="text-[9px] font-black text-accent uppercase tracking-[0.2em] mb-2">{product.category}</div>
        <Link to={`/product/${product.slug || product._id}`}>
          <h3 className="text-lg font-bold text-text-primary mb-3 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-text-primary group-hover:to-accent transition-all tracking-tight leading-snug">{product.name}</h3>
        </Link>
        
        <div className="flex items-center gap-1.5 mb-6">
          <div className="flex bg-surface-hover/50 px-2 py-1 rounded-md border border-border-main/50">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`h-3 w-3 ${s <= Math.round(product.rating) ? 'fill-status-warning text-status-warning drop-shadow-[0_0_2px_rgba(217,119,6,0.5)]' : 'text-border-main'}`} />
            ))}
          </div>
          <span className="text-[10px] font-bold text-text-secondary">({product.reviews_count || 0})</span>
        </div>
        
        <div className="mt-auto pt-4 border-t border-border-main/50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-black text-text-primary tracking-tight">{formatPrice(product.price)}</span>
          </div>
          {quantityInCart > 0 ? (
            <div className="flex items-center bg-surface-hover rounded-xl p-1.5 border border-border-main shadow-inner">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  if (quantityInCart === 1) onRemoveFromCart(product._id);
                  else onUpdateQuantity(product._id, quantityInCart - 1);
                }}
                className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-accent hover:bg-card-bg rounded-lg transition-colors text-lg font-black shadow-sm"
              >
                -
              </button>
              <span className="w-8 text-center text-sm font-black text-text-primary">
                {quantityInCart}
              </span>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  const stock = product.stockQuantity !== undefined ? Number(product.stockQuantity) : Infinity;
                  if (quantityInCart < stock) {
                    onUpdateQuantity(product._id, quantityInCart + 1);
                  } else {
                    toast.error(`Only ${stock} items available`);
                  }
                }}
                className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-accent hover:bg-card-bg rounded-lg transition-colors text-lg font-black shadow-sm"
              >
                +
              </button>
            </div>
          ) : (!product.inStock || (product.stockQuantity !== undefined && product.stockQuantity <= 0)) ? (
            <button 
              onClick={(e) => {
                e.preventDefault();
                alert("We'll notify you when this product is back in stock!");
              }}
              className="px-5 py-2.5 bg-surface-hover hover:bg-border-main text-text-primary border border-border-main rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 shadow-sm"
            >
              Notify Me
            </button>
          ) : (
            <button 
              onClick={(e) => {
                e.preventDefault();
                onAddToCart(product);
              }}
              className="px-6 py-3 bg-gradient-to-r from-accent to-secondary hover:from-accent-hover hover:to-secondary text-white rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all flex items-center gap-2 shadow-[0_5px_15px_rgba(2,132,199,0.3)] hover:shadow-[0_8px_20px_rgba(2,132,199,0.4)] hover:-translate-y-0.5"
            >
              <ShoppingCart className="h-3.5 w-3.5" /> Add
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
