import React from 'react';
import { Link } from 'react-router-dom';
import { useComparison } from '../../context/ComparisonContext';
import { useCart } from '../../hooks/useCart';
import { X, Scale, Info, Check, Shield, Zap, Package, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Compare = () => {
  const { comparisonList, removeFromCompare, clearComparison } = useComparison();
  const { onAddToCart, cartItems, onUpdateQuantity, onRemoveFromCart } = useCart();

  if (comparisonList.length === 0) {
    return (
      <div className="pt-48 pb-32 min-h-screen text-center px-4 flex flex-col items-center justify-center bg-app-bg relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-accent-light)_0%,_transparent_40%)] opacity-5 blur-3xl pointer-events-none"></div>
        <div className="max-w-md mx-auto relative z-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-card-bg/80 backdrop-blur-xl border border-border-main shadow-2xl rounded-full flex items-center justify-center mx-auto mb-8"
          >
            <Scale className="h-10 w-10 text-accent animate-pulse" />
          </motion.div>
          <h2 className="text-4xl font-black text-text-primary uppercase tracking-tighter mb-4">Nothing to Compare</h2>
          <p className="text-text-secondary mb-10 text-sm font-medium">Add some high-performance IoT components to your comparison list to audit their technical specifications side-by-side.</p>
          <Link to="/shop" className="px-10 py-4 bg-accent text-white font-black text-xs uppercase tracking-widest rounded-sm hover:bg-accent-hover transition-all shadow-lg hover:shadow-accent/20 hover:-translate-y-1 inline-block">Explore Inventory</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-32 min-h-screen bg-app-bg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse"></div>
              <p className="text-xs font-bold text-accent uppercase tracking-widest">Technical Audit</p>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-text-primary tracking-tighter uppercase">Product Compare</h1>
          </div>
          <button 
            onClick={clearComparison}
            className="group flex items-center gap-3 px-6 py-3 bg-card-bg/50 backdrop-blur-md border border-status-danger/20 hover:border-status-danger hover:bg-status-danger/5 rounded-full transition-all duration-300"
          >
            <span className="text-status-danger font-black text-[10px] uppercase tracking-widest">Clear All</span>
            <div className="w-6 h-6 rounded-full bg-status-danger/10 flex items-center justify-center group-hover:bg-status-danger group-hover:text-white text-status-danger transition-all">
              <X className="h-3 w-3" />
            </div>
          </button>
        </div>

        {/* Horizontal Scrollable Compare Grid */}
        <div className="flex overflow-x-auto gap-6 snap-x snap-mandatory pb-12 hide-scrollbar">
          <AnimatePresence>
            {comparisonList.map((product, index) => (
              <motion.div
                key={product._id}
                layout
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="w-[340px] shrink-0 snap-center bg-card-bg/40 backdrop-blur-xl border border-border-main hover:border-accent/30 rounded-3xl p-6 flex flex-col transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] group"
              >
                {/* Header Actions */}
                <div className="flex justify-between items-start mb-6">
                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${product.inStock ? 'bg-status-success/10 text-status-success border border-status-success/20' : 'bg-status-danger/10 text-status-danger border border-status-danger/20'}`}>
                    {product.inStock ? 'In Stock' : 'Sold Out'}
                  </div>
                  <button 
                    onClick={() => removeFromCompare(product._id)}
                    className="w-8 h-8 rounded-full bg-surface hover:bg-status-danger hover:text-white border border-border-main flex items-center justify-center text-text-muted transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Image */}
                <div className="w-full aspect-square bg-surface-hover/30 rounded-2xl mb-6 p-6 border border-border-main/50 relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-accent-light)_0%,_transparent_70%)] opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                  <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-700" />
                </div>

                {/* Title & Price */}
                <div className="mb-6 flex-grow">
                  <h3 className="text-lg font-black text-text-primary uppercase tracking-tight line-clamp-2 leading-tight mb-3">{product.name}</h3>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-black text-accent">${product.price.toFixed(2)}</p>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                  <div className="bg-surface-hover/50 p-3 rounded-xl border border-border-main/30">
                    <div className="flex items-center gap-2 text-text-muted mb-1">
                      <Package className="h-3 w-3" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">Category</span>
                    </div>
                    <p className="text-xs font-bold text-text-primary truncate">{product.category}</p>
                  </div>
                  <div className="bg-surface-hover/50 p-3 rounded-xl border border-border-main/30">
                    <div className="flex items-center gap-2 text-text-muted mb-1">
                      <Star className="h-3 w-3" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">Rating</span>
                    </div>
                    <p className="text-xs font-bold text-text-primary">{product.rating} / 5.0</p>
                  </div>
                </div>

                {/* Tech Specs */}
                <div className="mb-8 flex-grow">
                  <div className="flex items-center gap-2 mb-4 border-b border-border-main pb-3">
                    <Zap className="h-4 w-4 text-accent" />
                    <h4 className="text-xs font-black text-text-primary uppercase tracking-widest">Tech Specs</h4>
                  </div>
                  {product.specs && product.specs.length > 0 ? (
                    <ul className="space-y-3">
                      {product.specs.slice(0, 6).map((spec, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent/60 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(2,132,199,0.5)]"></div>
                          <span className="text-xs font-medium text-text-secondary leading-relaxed">{spec}</span>
                        </li>
                      ))}
                      {product.specs.length > 6 && (
                        <li className="text-[10px] font-bold text-accent uppercase tracking-widest pt-2">
                          + {product.specs.length - 6} more specs
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-xs text-text-muted italic">No specifications provided.</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 mt-auto pt-6 border-t border-border-main/50">
                  <Link 
                    to={`/product/${product.slug || product._id}`}
                    className="w-full py-3.5 bg-surface-hover hover:bg-surface border border-border-main text-text-primary text-[10px] font-black rounded-xl uppercase tracking-widest transition-all text-center"
                  >
                    Full Details
                  </Link>

                  {(() => {
                    const cartItem = cartItems.find(item => item._id === product._id);
                    const quantityInCart = cartItem ? cartItem.quantity : 0;
                    
                    if (quantityInCart > 0) {
                      return (
                        <div className="flex items-center justify-between w-full h-[46px] border-2 border-accent rounded-xl overflow-hidden bg-accent/5">
                          <button onClick={() => quantityInCart === 1 ? onRemoveFromCart(product._id) : onUpdateQuantity(product._id, quantityInCart - 1)} className="w-12 h-full flex items-center justify-center text-accent hover:bg-accent hover:text-white transition-colors text-lg font-bold">-</button>
                          <span className="font-black text-sm text-text-primary">{quantityInCart}</span>
                          <button onClick={() => onUpdateQuantity(product._id, quantityInCart + 1)} className="w-12 h-full flex items-center justify-center text-accent hover:bg-accent hover:text-white transition-colors text-lg font-bold">+</button>
                        </div>
                      );
                    } else {
                      return (
                        <button 
                          onClick={() => onAddToCart(product)}
                          disabled={!product.inStock}
                          className={`w-full py-3.5 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all ${product.inStock ? 'bg-accent text-white hover:bg-accent-hover shadow-lg hover:shadow-accent/20 hover:-translate-y-0.5' : 'bg-surface-hover text-text-muted cursor-not-allowed opacity-50'}`}
                        >
                          {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                      );
                    }
                  })()}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Compare;
