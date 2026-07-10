import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trash2, ShoppingCart, ArrowRight, Minus, Plus, 
  CreditCard, ShieldCheck, Truck, Bookmark, 
  Tag, Info, CheckCircle, X, RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../hooks/useCart';
import toast from 'react-hot-toast';

const Cart = () => {
  const { cartItems, onRemoveFromCart, onUpdateQuantity, onAddToCart, discount, setDiscount, appliedPromo, setAppliedPromo } = useCart();
  const { formatPrice } = useAuth();
  const [savedItems, setSavedItems] = useState([]);
  const [promoCode, setPromoCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? (subtotal > 50 ? 0 : 5.99) : 0;
  const tax = subtotal * 0.18; // 18% GST for IoT hardware
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal + shipping + tax - discountAmount;

  const handleApplyPromo = (codeToApply = promoCode) => {
    const code = codeToApply.toUpperCase().trim();
    if (!code) return;
    
    setIsApplying(true);
    setTimeout(() => {
      if (code === 'IOTMART10') {
        setDiscount(10);
        setAppliedPromo(code);
        setPromoCode('');
        toast.success(`Coupon ${code} applied successfully!`);
      } else if (code === 'WELCOME5') {
        setDiscount(5);
        setAppliedPromo(code);
        setPromoCode('');
        toast.success(`Coupon ${code} applied successfully!`);
      } else {
        toast.error(`Invalid promo code: ${code}`);
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
      className="pt-32 pb-32 min-h-screen bg-app-bg"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6 border-b border-border-main pb-8">
          <div>
            <h1 className="text-4xl font-black text-text-primary tracking-tighter uppercase">Project <span className="text-accent">Manifest</span></h1>
            <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mt-1">Review your hardware components before deployment</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-text-secondary font-black text-[10px] uppercase tracking-widest bg-card-bg border border-border-main px-4 py-2 rounded-sm shadow-sm">
              {cartItems.length} Components
            </span>
          </div>
        </div>

        {cartItems.length === 0 && savedItems.length === 0 ? (
          <div className="text-center py-32 bg-surface border border-dashed border-border-main rounded-[32px]">
            <div className="w-24 h-24 mx-auto bg-surface-hover rounded-[24px] flex items-center justify-center mb-8">
              <ShoppingCart className="h-10 w-10 text-border-main" />
            </div>
            <h2 className="text-2xl font-black text-text-primary mb-3 uppercase tracking-tight">Your Manifest is Empty</h2>
            <p className="text-text-secondary mb-10 max-w-sm mx-auto text-sm font-medium">
              Initialize your project by adding high-performance IoT components from our catalog.
            </p>
            <Link to="/shop" className="btn-premium px-12 py-4 text-xs rounded-[16px]">
              Start Building
            </Link>
          </div>
        ) : (
          <div className="card rounded-[32px] p-8 lg:p-12">
            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12">
              
              {/* Cart Items List */}
              <div className="lg:col-span-7">
                <h3 className="heading-section flex items-center gap-3 mb-8">
                  <ShoppingCart className="h-5 w-5 text-accent" /> Hardware Components
                </h3>
                <AnimatePresence mode="popLayout">
                  {cartItems.map((item, index) => (
                    <motion.div 
                      key={item._id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`flex flex-col sm:flex-row items-center gap-8 group relative overflow-hidden ${index !== cartItems.length - 1 ? 'border-b border-border-main pb-8 mb-8' : ''}`}
                    >
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-app-bg rounded-2xl overflow-hidden flex-shrink-0 border border-border-main p-4">
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" />
                    </div>
                    
                    <div className="flex-grow text-center sm:text-left">
                      <div className="flex items-center gap-3 mb-2 justify-center sm:justify-start">
                        <span className="text-[9px] font-black text-accent uppercase tracking-widest px-2 py-0.5 bg-accent/5 rounded-md border border-accent/10">
                          {item.category}
                        </span>
                        {item.inStock && (
                          <span className="text-[9px] font-black text-status-success uppercase tracking-widest flex items-center gap-1">
                            <div className="w-1 h-1 bg-status-success rounded-full"></div>
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
                      <div className="flex items-center bg-app-bg rounded-[16px] border border-border-main p-1 shadow-inner">
                        <button 
                          className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-card-bg rounded-[12px] transition-all"
                          onClick={() => onUpdateQuantity(item._id, Math.max(1, item.quantity - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-10 text-center text-text-primary font-black text-lg">{item.quantity}</span>
                        <button 
                          className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-card-bg rounded-[12px] transition-all"
                          onClick={() => onUpdateQuantity(item._id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleSaveForLater(item)}
                            className="p-3 text-text-muted hover:text-accent hover:bg-accent/5 rounded-[12px] transition-all border border-transparent hover:border-accent/20"
                            title="Save for later"
                          >
                            <Bookmark className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => onRemoveFromCart(item._id)}
                            className="p-3 text-text-muted hover:text-status-danger hover:bg-status-danger-bg rounded-[12px] transition-all border border-transparent hover:border-status-danger/20"
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
                <div className="mt-16 pt-12 border-t border-border-main">
                  <div className="flex items-center gap-3 mb-8">
                    <Bookmark className="h-5 w-5 text-accent" />
                    <h2 className="text-xl font-black text-text-primary uppercase tracking-tight">Saved For <span className="text-accent">Later</span></h2>
                    <span className="px-3 py-1 bg-surface-hover text-[10px] font-black rounded-full">{savedItems.length} Items</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {savedItems.map(item => (
                      <div key={item._id} className="bg-surface-hover rounded-[24px] p-6 flex items-center gap-6 group border border-border-subtle">
                        <div className="w-20 h-20 bg-surface rounded-[16px] p-2 flex-shrink-0">
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
                        <button onClick={() => setSavedItems(savedItems.filter(i => i._id !== item._id))} className="text-text-muted hover:text-status-danger">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden lg:block lg:col-span-1 relative">
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border-main"></div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-4">
              <div className="sticky top-32">
                <h3 className="heading-section flex items-center gap-3 mb-8">
                  <Bookmark className="h-5 w-5 text-accent" /> Cost Breakdown
                </h3>
                
                {/* Promo Code Box */}
                <div className="mb-10">
                  <div className="p-6 bg-surface border border-border-main rounded-[24px] relative">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4">
                      Injection Token<br/>(Promo)
                    </p>
                    <div className="flex gap-2 relative z-10">
                      <input 
                        type="text" 
                        placeholder="IOTMART10"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="flex-grow px-5 py-4 bg-card-bg border border-border-main rounded-[16px] text-sm font-bold text-text-primary outline-none focus:border-accent transition-all uppercase tracking-widest shadow-sm"
                      />
                      <button 
                        onClick={() => handleApplyPromo()}
                        disabled={isApplying || !promoCode.trim()}
                        className="btn-premium px-8 py-4 text-[10px] shrink-0 rounded-[16px]"
                      >
                        {isApplying ? <RefreshCcw className="h-4 w-4 animate-spin mx-auto" /> : 'Apply'}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {discount === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 space-y-3"
                      >
                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Available Offers</p>
                        <button 
                          onClick={() => handleApplyPromo('IOTMART10')}
                          className="w-full p-4 border border-dashed border-accent/50 bg-accent/5 rounded-[16px] flex items-center justify-between hover:bg-accent/10 transition-colors group text-left"
                        >
                          <div>
                            <span className="text-[10px] font-black text-accent uppercase tracking-widest block mb-1">IOTMART10</span>
                            <span className="text-[9px] font-medium text-text-secondary">Get 10% off your entire order</span>
                          </div>
                          <span className="text-[10px] font-bold text-accent uppercase tracking-widest group-hover:underline">Apply</span>
                        </button>
                        <button 
                          onClick={() => handleApplyPromo('WELCOME5')}
                          className="w-full p-4 border border-dashed border-status-success/50 bg-status-success/10 rounded-[16px] flex items-center justify-between hover:bg-status-success/20 transition-colors group text-left"
                        >
                          <div>
                            <span className="text-[10px] font-black text-status-success uppercase tracking-widest block mb-1">WELCOME5</span>
                            <span className="text-[9px] font-medium text-text-secondary">Flat 5% discount for new users</span>
                          </div>
                          <span className="text-[10px] font-bold text-status-success uppercase tracking-widest group-hover:underline">Apply</span>
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-4 p-4 bg-status-success/10 border border-status-success/20 rounded-[16px] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-status-success/20 rounded-[8px] flex items-center justify-center text-status-success">
                            <Tag className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs font-black text-status-success uppercase tracking-widest block">{appliedPromo}</span>
                            <span className="text-[9px] font-bold text-status-success uppercase tracking-wider">Coupon Applied Successfully</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setDiscount(0);
                            setAppliedPromo('');
                            toast("Coupon removed.", { icon: '🗑️' });
                          }}
                          className="p-2 hover:bg-status-success/20 rounded-[8px] text-status-success transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">Subtotal</span>
                    <span className="text-base font-black text-text-primary tracking-tight">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                      Shipping {subtotal > 50 && <span className="text-[8px] bg-status-success/10 text-status-success px-2 py-0.5 rounded font-black uppercase">Exempt</span>}
                    </span>
                    <span className="text-base font-black text-text-primary tracking-tight">{formatPrice(shipping)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                      GST (18%) <Info className="h-3 w-3 text-border-main" />
                    </span>
                    <span className="text-base font-black text-text-primary tracking-tight">{formatPrice(tax)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center text-status-success">
                      <span className="text-xs font-bold uppercase tracking-widest">Discount</span>
                      <span className="text-base font-black">-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                </div>
                
                <div className="border-t-2 border-dashed border-border-main pt-8 mb-10">
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
                  <button className="w-full btn-premium py-6 rounded-[24px] text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-accent/20">
                    <CreditCard className="h-5 w-5" />
                    Finalize Order
                  </button>
                </Link>
                
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-[8px] font-black text-text-muted uppercase tracking-widest">
                    <ShieldCheck className="h-4 w-4 text-status-success" />
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
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Cart;
