import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trash2, ShoppingCart, ArrowRight, Minus, Plus, 
  CreditCard, ShieldCheck, Truck, Bookmark, 
  Tag, Info, CheckCircle, X, RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Cart = ({ cartItems, onRemoveFromCart, onUpdateQuantity, onAddToCart }) => {
  const { formatPrice } = useAuth();
  const [savedItems, setSavedItems] = useState([]);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isApplying, setIsApplying] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? (subtotal > 50 ? 0 : 5.99) : 0;
  const tax = subtotal * 0.18; // 18% GST for IoT hardware
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal + shipping + tax - discountAmount;

  const handleApplyPromo = () => {
    setIsApplying(true);
    setTimeout(() => {
      if (promoCode.toUpperCase() === 'IOTMART10') {
        setDiscount(10);
      } else {
        alert('Invalid promo code');
      }
      setIsApplying(false);
    }, 800);
  };

  const handleSaveForLater = (item) => {
    setSavedItems([...savedItems, item]);
    onRemoveFromCart(item._id);
  };

  const handleMoveToCart = (item) => {
    onAddToCart(item);
    setSavedItems(savedItems.filter(i => i._id !== item._id));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-32 pb-32 min-h-screen bg-slate-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6 border-b border-border-main pb-8">
          <div>
            <h1 className="text-4xl font-black text-text-primary tracking-tighter uppercase">Project <span className="text-accent">Manifest</span></h1>
            <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mt-1">Review your hardware components before deployment</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-text-secondary font-black text-[10px] uppercase tracking-widest bg-white border border-border-main px-4 py-2 rounded-xl shadow-sm">
              {cartItems.length} Components
            </span>
          </div>
        </div>

        {cartItems.length === 0 && savedItems.length === 0 ? (
          <div className="text-center py-32 bg-white border border-dashed border-border-main rounded-3xl">
            <div className="w-24 h-24 mx-auto bg-slate-50 rounded-full flex items-center justify-center mb-8">
              <ShoppingCart className="h-10 w-10 text-slate-200" />
            </div>
            <h2 className="text-2xl font-black text-text-primary mb-3 uppercase tracking-tight">Your Manifest is Empty</h2>
            <p className="text-text-secondary mb-10 max-w-sm mx-auto text-sm font-medium">
              Initialize your project by adding high-performance IoT components from our catalog.
            </p>
            <Link to="/shop" className="btn-premium px-12 py-4 text-xs">
              Start Building
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12">
            
            {/* Cart Items List */}
            <div className="lg:col-span-8 space-y-8">
              <AnimatePresence mode="popLayout">
                {cartItems.map(item => (
                  <motion.div 
                    key={item._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-8 group border border-border-main hover:shadow-xl transition-all relative overflow-hidden"
                  >
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0 border border-border-main p-4">
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" />
                    </div>
                    
                    <div className="flex-grow text-center sm:text-left">
                      <div className="flex items-center gap-3 mb-2 justify-center sm:justify-start">
                        <span className="text-[9px] font-black text-accent uppercase tracking-widest px-2 py-0.5 bg-accent/5 rounded-md border border-accent/10">
                          {item.category}
                        </span>
                        {item.inStock && (
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                            <div className="w-1 h-1 bg-emerald-600 rounded-full"></div>
                            In Stock
                          </span>
                        )}
                      </div>
                      <Link to={`/product/${item._id}`}>
                        <h3 className="text-xl font-black text-text-primary hover:text-accent transition-colors mb-2 tracking-tight uppercase">{item.name}</h3>
                      </Link>
                      <div className="text-2xl font-black text-text-primary tracking-tighter">{formatPrice(item.price)}</div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto">
                      {/* Quantity Controls */}
                      <div className="flex items-center bg-slate-50 rounded-xl border border-border-main p-1 shadow-inner">
                        <button 
                          className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white rounded-lg transition-all"
                          onClick={() => onUpdateQuantity(item._id, Math.max(1, item.quantity - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-10 text-center text-text-primary font-black text-lg">{item.quantity}</span>
                        <button 
                          className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white rounded-lg transition-all"
                          onClick={() => onUpdateQuantity(item._id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleSaveForLater(item)}
                          className="p-3 text-text-muted hover:text-accent hover:bg-accent/5 rounded-xl transition-all border border-transparent hover:border-accent/10"
                          title="Save for later"
                        >
                          <Bookmark className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => onRemoveFromCart(item._id)}
                          className="p-3 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                          title="Remove item"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Save For Later Section */}
              {savedItems.length > 0 && (
                <div className="mt-16">
                  <div className="flex items-center gap-3 mb-8">
                    <Bookmark className="h-5 w-5 text-accent" />
                    <h2 className="text-xl font-black text-text-primary uppercase tracking-tight">Saved For <span className="text-accent">Later</span></h2>
                    <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-black rounded-lg">{savedItems.length} Items</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {savedItems.map(item => (
                      <div key={item._id} className="bg-white p-6 rounded-3xl border border-border-main flex items-center gap-6 group">
                        <div className="w-20 h-20 bg-slate-50 rounded-xl p-2 flex-shrink-0">
                          <img src={item.image} className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all" />
                        </div>
                        <div className="flex-grow">
                          <h4 className="text-sm font-bold text-text-primary line-clamp-1">{item.name}</h4>
                          <p className="text-lg font-black text-accent mt-1">{formatPrice(item.price)}</p>
                          <button 
                            onClick={() => handleMoveToCart(item)}
                            className="text-[10px] font-black text-accent uppercase tracking-widest mt-3 flex items-center gap-1 hover:underline"
                          >
                            <RefreshCcw className="h-3 w-3" /> Move to Manifest
                          </button>
                        </div>
                        <button onClick={() => setSavedItems(savedItems.filter(i => i._id !== item._id))} className="text-text-muted hover:text-red-500">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-3xl p-10 sticky top-32 shadow-sm border border-border-main">
                <h3 className="text-xl font-black text-text-primary mb-8 tracking-tighter uppercase">
                  Cost Breakdown
                </h3>
                
                {/* Promo Code */}
                <div className="mb-10">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Tag className="h-3 w-3" /> Promo Code
                  </p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="IOTMART10"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-grow px-4 py-3 bg-slate-50 border border-border-main rounded-xl text-xs font-bold outline-none focus:border-accent"
                    />
                    <button 
                      onClick={handleApplyPromo}
                      disabled={isApplying}
                      className="px-6 py-3 bg-text-primary text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-accent transition-all disabled:opacity-50"
                    >
                      {isApplying ? <RefreshCcw className="h-4 w-4 animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                  {discount > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-emerald-600">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">10% Discount Applied</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">Subtotal</span>
                    <span className="text-base font-black text-text-primary tracking-tight">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                      Shipping {subtotal > 50 && <span className="text-[8px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-black uppercase">Exempt</span>}
                    </span>
                    <span className="text-base font-black text-text-primary tracking-tight">{formatPrice(shipping)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                      GST (18%) <Info className="h-3 w-3 text-slate-300" />
                    </span>
                    <span className="text-base font-black text-text-primary tracking-tight">{formatPrice(tax)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center text-emerald-600">
                      <span className="text-xs font-bold uppercase tracking-widest">Discount</span>
                      <span className="text-base font-black">-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                </div>
                
                <div className="border-t-2 border-dashed border-slate-100 pt-8 mb-10">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-xs font-black text-text-primary uppercase tracking-widest block mb-1">Total Manifest Value</span>
                      <p className="text-[8px] text-text-muted font-bold uppercase tracking-widest">Inc. Technical Surcharge</p>
                    </div>
                    <span className="text-4xl font-black text-accent tracking-tighter">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
                
                <Link to="/checkout" className="w-full block">
                  <button className="w-full btn-premium py-5 text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                    <CreditCard className="h-5 w-5" />
                    Finalize Order
                  </button>
                </Link>
                
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-[8px] font-black text-text-muted uppercase tracking-widest">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span>Secure<br/>Auth</span>
                  </div>
                  <div className="flex items-center gap-2 text-[8px] font-black text-text-muted uppercase tracking-widest">
                    <Truck className="h-4 w-4 text-accent" />
                    <span>Priority<br/>Dispatch</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Cart;
