import React, { useState, useEffect } from 'react';
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
  const { formatPrice, user } = useAuth();
  const [savedItems, setSavedItems] = useState(() => {
    try {
      const saved = localStorage.getItem('iotmart_saved_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [promoCode, setPromoCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [activeCoupons, setActiveCoupons] = useState([]);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const { getActiveCoupons } = await import('../../services/api');
        const coupons = await getActiveCoupons();
        setActiveCoupons(coupons);
      } catch (err) {
        console.error("Failed to fetch active coupons:", err);
      }
    };
    fetchCoupons();
  }, []);

  useEffect(() => {
    localStorage.setItem('iotmart_saved_items', JSON.stringify(savedItems));
  }, [savedItems]);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? (subtotal > 500 ? 0 : 50) : 0;
  const tax = subtotal * 0.18; // 18% GST for IoT hardware
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal + shipping + tax - discountAmount;

  const handleApplyPromo = async (codeToApply = promoCode) => {
    const code = codeToApply.toUpperCase().trim();
    if (!code) return;
    
    setIsApplying(true);
    try {
      const { validateCoupon } = await import('../../services/api');
      const data = await validateCoupon(code, subtotal, user?._id);
      
      setDiscount(data.discount_percentage);
      setAppliedPromo(data.code);
      setPromoCode('');
      toast.success(`Coupon ${data.code} applied! Saved ${formatPrice(data.discount_amount)}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || `Invalid promo code: ${code}`);
    } finally {
      setIsApplying(false);
    }
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
      className="pt-32 pb-32 min-h-screen bg-app-bg relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-status-success/5 rounded-full blur-[150px] pointer-events-none mix-blend-screen"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-6 border-b border-border-main/50 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse"></div>
              <p className="text-xs font-bold text-accent uppercase tracking-widest">Order Processing</p>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-text-primary tracking-tighter uppercase">Project <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-status-success">Manifest</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-text-primary font-black text-xs uppercase tracking-widest bg-card-bg/80 backdrop-blur-md border border-border-main px-6 py-3 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.1)]">
              <span className="text-accent">{cartItems.length}</span> Components
            </span>
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-32 bg-card-bg/40 backdrop-blur-xl border border-border-main/50 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-accent-light)_0%,_transparent_40%)] opacity-5 pointer-events-none"></div>
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-32 h-32 mx-auto bg-surface/50 backdrop-blur-md rounded-full flex items-center justify-center mb-8 border border-border-main shadow-inner relative"
            >
              <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl animate-pulse"></div>
              <ShoppingCart className="h-12 w-12 text-accent relative z-10" />
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-black text-text-primary mb-4 uppercase tracking-tighter">Manifest Empty</h2>
            <p className="text-text-secondary mb-10 max-w-md mx-auto text-sm font-medium leading-relaxed">
              Initialize your project by adding high-performance IoT components from our premium catalog.
            </p>
            <Link to="/shop" className="px-10 py-4 bg-accent text-white font-black text-xs uppercase tracking-widest rounded-sm hover:bg-accent-hover transition-all shadow-[0_0_20px_rgba(2,132,199,0.4)] hover:shadow-[0_0_30px_rgba(2,132,199,0.6)] hover:-translate-y-1 inline-block">
              Explore Inventory
            </Link>
          </div>
        ) : (
          <div className="bg-card-bg/80 backdrop-blur-2xl border border-border-main rounded-3xl p-6 lg:p-10 shadow-2xl relative flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none rounded-3xl"></div>
            
            {/* Cart Items List */}
            <div className="lg:col-span-7 relative z-10 lg:min-h-0">
              <div className="lg:absolute lg:inset-0 lg:overflow-y-auto lg:pr-4 scrollbar-thin scrollbar-thumb-border-main scrollbar-track-transparent pb-10">
                <h3 className="text-sm font-black text-text-primary uppercase tracking-widest flex items-center gap-3 mb-8 pb-4 border-b border-border-main/30">
                  <ShoppingCart className="h-5 w-5 text-accent" /> Hardware Components
                </h3>
              
              <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                  {cartItems.map((item) => (
                    <motion.div 
                      key={item._id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, x: -50 }}
                      className="bg-card-bg/60 backdrop-blur-md border border-border-main hover:border-accent/30 p-4 sm:p-6 rounded-2xl flex flex-col sm:flex-row items-center gap-6 group transition-all shadow-lg hover:shadow-[0_8px_30px_rgba(2,132,199,0.1)]"
                    >
                      <div className="w-full sm:w-32 aspect-square sm:aspect-auto sm:h-32 bg-surface/50 rounded-xl flex-shrink-0 p-4 relative overflow-hidden border border-border-main/50">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-accent-light)_0%,_transparent_70%)] opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-700 relative z-10" />
                      </div>
                      
                      <div className="flex-grow w-full text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
                          <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-2.5 py-1 bg-surface rounded-full border border-border-main">
                            {item.category}
                          </span>
                          {item.inStock && (
                            <span className="text-[10px] font-black text-status-success uppercase tracking-widest px-2.5 py-1 bg-status-success/10 rounded-full border border-status-success/20 flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 bg-status-success rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                              In Stock
                            </span>
                          )}
                        </div>
                        <Link to={`/product/${item.slug || item._id}`} className="block mb-2">
                          <h3 className="text-lg sm:text-xl font-black text-text-primary hover:text-accent transition-colors tracking-tight uppercase line-clamp-2">{item.name}</h3>
                        </Link>
                        <div className="text-2xl font-black text-text-primary tracking-tighter mb-4 sm:mb-0">{formatPrice(item.price)}</div>
                      </div>
                      
                      <div className="flex flex-col gap-4 w-full sm:w-auto shrink-0 border-t sm:border-t-0 sm:border-l border-border-main/50 pt-4 sm:pt-0 sm:pl-6">
                        <div className="flex items-center justify-between w-full h-[40px] border-2 border-border-main hover:border-accent/50 rounded-xl overflow-hidden bg-surface transition-all">
                          <button onClick={() => onUpdateQuantity(item._id, Math.max(1, item.quantity - 1))} className="w-10 h-full flex items-center justify-center text-text-muted hover:bg-accent hover:text-white transition-colors">-</button>
                          <span className="font-black text-sm text-text-primary px-3">{item.quantity}</span>
                          <button onClick={() => onUpdateQuantity(item._id, item.quantity + 1)} className="w-10 h-full flex items-center justify-center text-text-muted hover:bg-accent hover:text-white transition-colors">+</button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleSaveForLater(item)}
                            className="flex-1 sm:flex-none p-3 text-text-secondary hover:text-white bg-surface hover:bg-text-secondary border border-border-main rounded-xl transition-all flex items-center justify-center"
                            title="Save for later"
                          >
                            <Bookmark className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => onRemoveFromCart(item._id)}
                            className="flex-1 sm:flex-none p-3 text-status-danger hover:text-white bg-status-danger/5 hover:bg-status-danger border border-status-danger/20 rounded-xl transition-all flex items-center justify-center"
                            title="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-5 relative mt-12 lg:mt-0 z-10">
              <div className="lg:sticky lg:top-32">
                <div className="bg-surface/50 backdrop-blur-md border border-border-main rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="text-sm font-black text-text-primary uppercase tracking-widest flex items-center gap-3 mb-8 border-b border-border-main/30 pb-4">
                      <CreditCard className="h-5 w-5 text-accent" /> Cost Breakdown
                    </h3>
                    
                    {/* Promo Code Box */}
                    <div className="mb-8">
                      <div className="p-5 sm:p-6 bg-surface/50 backdrop-blur-sm border border-border-main rounded-2xl">
                        <p className="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <Tag className="h-3 w-3" /> Injection Token (Promo)
                        </p>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="IOTMART10"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            className="flex-grow min-w-0 w-full px-4 py-3.5 bg-card-bg border border-border-main rounded-xl text-xs font-bold text-text-primary outline-none focus:border-accent transition-all uppercase tracking-widest shadow-inner"
                          />
                          <button 
                            onClick={() => handleApplyPromo()}
                            disabled={isApplying || !promoCode.trim()}
                            className="px-6 py-3.5 bg-text-primary text-app-bg text-[10px] font-black uppercase tracking-widest shrink-0 rounded-xl hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                            {activeCoupons.length > 0 && (
                              <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest pl-2">Available Offers</p>
                            )}
                            {activeCoupons.map((coupon) => (
                              <button 
                                key={coupon._id}
                                onClick={() => handleApplyPromo(coupon.code)}
                                className="w-full p-4 border border-accent/20 bg-accent/5 rounded-xl flex items-center justify-between hover:bg-accent/10 transition-colors group text-left shadow-sm hover:border-accent/40"
                              >
                                <div>
                                  <span className="text-[10px] font-black text-accent uppercase tracking-widest block mb-1">{coupon.code}</span>
                                  <span className="text-[9px] font-bold text-text-secondary">
                                    {coupon.discount_percentage ? `Get ${coupon.discount_percentage}% off` : ''} 
                                    {coupon.min_order_value ? ` (Min order: ₹${coupon.min_order_value})` : ''}
                                  </span>
                                </div>
                                <span className="text-[9px] font-black text-accent uppercase tracking-widest group-hover:underline">Apply</span>
                              </button>
                            ))}
                          </motion.div>
                        ) : (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-4 p-4 bg-status-success/10 border border-status-success/20 rounded-xl flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-status-success/20 rounded-lg flex items-center justify-center text-status-success">
                                <Tag className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="text-[11px] font-black text-status-success uppercase tracking-widest block">{appliedPromo}</span>
                                <span className="text-[8px] font-bold text-status-success uppercase tracking-wider">Coupon Applied</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                setDiscount(0);
                                setAppliedPromo('');
                                toast("Coupon removed.", { icon: '🗑️' });
                              }}
                              className="p-2 hover:bg-status-success/20 rounded-lg text-status-success transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="space-y-4 mb-8 bg-surface border border-border-main rounded-2xl p-6">
                      <div className="flex justify-between items-center pb-4 border-b border-border-main/50">
                        <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Subtotal</span>
                        <span className="text-sm font-black text-text-primary tracking-tight">{formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-border-main/50">
                        <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-2">
                          Shipping {subtotal > 50 && <span className="text-[8px] bg-status-success/20 text-status-success px-2 py-0.5 rounded font-black uppercase shadow-sm">Free</span>}
                        </span>
                        <span className="text-sm font-black text-text-primary tracking-tight">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-border-main/50">
                        <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
                          GST (18%) <Info className="h-3 w-3 text-text-muted" />
                        </span>
                        <span className="text-sm font-black text-text-primary tracking-tight">{formatPrice(tax)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between items-center bg-status-success/10 -mx-6 mb-0 p-4 border-b border-border-main/50 text-status-success">
                          <span className="text-[10px] font-black uppercase tracking-widest">Discount</span>
                          <span className="text-sm font-black">-{formatPrice(discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-end pt-2">
                        <div>
                          <span className="text-[10px] font-black text-text-primary uppercase tracking-widest block mb-1">Total Manifest Value</span>
                          <p className="text-[8px] text-text-muted font-bold uppercase tracking-widest">Inc. Taxes & Surcharges</p>
                        </div>
                        <span className="text-3xl font-black text-accent tracking-tighter">
                          {formatPrice(total)}
                        </span>
                      </div>
                    </div>
                    
                    <Link to="/checkout" className="w-full block mt-8">
                      <button className="w-full py-5 bg-accent text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-accent-hover transition-all hover:-translate-y-0.5 relative overflow-hidden group shadow-lg shadow-accent/20">
                        <div className="absolute inset-0 bg-white/20 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                        <CreditCard className="h-4 w-4 relative z-10" />
                        <span className="relative z-10">Finalize Order</span>
                      </button>
                    </Link>
                    
                    <div className="mt-8 pt-6 border-t border-border-main/30 grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-surface/30 rounded-xl border border-border-main/50">
                        <ShieldCheck className="h-5 w-5 text-status-success shrink-0" />
                        <span className="text-[8px] font-black text-text-primary uppercase tracking-widest leading-tight">Secure<br/>Checkout</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-surface/30 rounded-xl border border-border-main/50">
                        <Truck className="h-5 w-5 text-accent shrink-0" />
                        <span className="text-[8px] font-black text-text-primary uppercase tracking-widest leading-tight">Priority<br/>Dispatch</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save For Later Section (New Container) */}
        {savedItems.length > 0 && (
          <div className="mt-8 lg:mt-12 bg-card-bg/80 backdrop-blur-2xl border border-border-main rounded-3xl p-6 lg:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none rounded-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border-main/30">
                <Bookmark className="h-5 w-5 text-text-muted" />
                <h2 className="text-sm font-black text-text-primary uppercase tracking-widest">Saved For <span className="text-text-muted">Later</span></h2>
                <span className="px-3 py-1 bg-surface border border-border-main text-[10px] text-text-secondary font-black rounded-full ml-2">{savedItems.length} Items</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedItems.map(item => (
                  <div key={item._id} className="bg-card-bg/60 backdrop-blur-md rounded-2xl p-5 flex items-center gap-5 border border-border-main hover:border-accent/30 transition-all group shadow-sm hover:shadow-md">
                    <div className="w-20 h-20 bg-surface rounded-xl p-2 flex-shrink-0 border border-border-main/50 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-accent-light)_0%,_transparent_70%)] opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                      <img src={item.image} className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500 relative z-10" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="text-[10px] font-black text-text-primary line-clamp-2 uppercase tracking-tight leading-tight">{item.name}</h4>
                      <p className="text-sm font-black text-accent mt-1 mb-3">{formatPrice(item.price)}</p>
                      <button 
                        onClick={() => handleMoveToCart(item)}
                        className="text-[9px] font-black text-text-primary uppercase tracking-widest flex items-center gap-1.5 hover:text-accent transition-colors bg-surface px-3 py-1.5 rounded-lg border border-border-main"
                      >
                        <RefreshCcw className="h-3 w-3" /> Move to Cart
                      </button>
                    </div>
                    <button onClick={() => setSavedItems(savedItems.filter(i => i._id !== item._id))} className="text-text-muted hover:text-status-danger p-2 shrink-0 bg-surface rounded-lg border border-border-main">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Cart;
