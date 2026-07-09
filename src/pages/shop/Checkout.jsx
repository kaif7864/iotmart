import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { placeOrder } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../hooks/useCart';
import { 
  ChevronLeft, MapPin, CreditCard, Truck, 
  ShieldCheck, CheckCircle2, Loader2, Package, 
  Wallet, Building2, Smartphone, Gift, Clock, AlertCircle, Zap
} from 'lucide-react';

const Checkout = () => {
  const { cartItems, onClearCart, discount, appliedPromo } = useCart();
  const { user, addresses, formatPrice, currency } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CARD'); // Default to Card/Razorpay
  const [deliveryOption, setDeliveryOption] = useState('STANDARD');

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryCharges = {
    'STANDARD': subtotal > 50 ? 0 : 5,
    'EXPRESS': 15,
    'PRIORITY': 25
  };
  const shipping = deliveryCharges[deliveryOption];
  const tax = subtotal * 0.18;
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal + shipping + tax - discountAmount;



  const handleRazorpayPayment = () => {
    if (!address.trim()) {
      alert('Please enter or select a delivery address');
      return;
    }

    const options = {
      key: "rzp_test_SKuwVRt8zcsDpJ",
      amount: Math.round(total * 100 * (currency.code === 'INR' ? 1 : 83)), // Convert to Paise and handle conversion if not INR
      currency: currency.code === 'INR' ? 'INR' : 'INR', // Razorpay test usually works best with INR
      name: "IoTMart",
      description: "Hardware Manifest Deployment",
      image: "https://cdn-icons-png.flaticon.com/512/2105/2105041.png",
      handler: function (response) {
        processOrder("PAID", response.razorpay_payment_id);
      },
      prefill: {
        name: user?.name,
        email: user?.email,
      },
      theme: {
        color: "#3b82f6",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const processOrder = async (status, paymentId = "COD") => {
    setLoading(true);
    try {
      const orderData = {
        user_id: user?._id || "guest",
        items: cartItems.map(item => ({
          product_id: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        total: total,
        address: address,
        payment_method: paymentMethod,
        payment_id: paymentId,
        status: "Pending",
        delivery_type: deliveryOption
      };

      await placeOrder(orderData);
      setOrderComplete(true);
      onClearCart();
    } catch (error) {
      console.error('Order failed:', error);
      alert('Order placement failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (paymentMethod === 'COD') {
      processOrder("PENDING");
    } else {
      handleRazorpayPayment();
    }
  };

  if (orderComplete) {
    return (
      <div className="pt-32 pb-32 min-h-screen flex items-center justify-center px-4 bg-slate-50">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white max-w-2xl w-full p-12 text-center rounded-[40px] border border-border-main shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent to-blue-400"></div>
          <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-white shadow-lg">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          </div>
          <h1 className="text-4xl font-black text-text-primary mb-4 tracking-tighter uppercase">Manifest Deployed</h1>
          <p className="text-text-secondary mb-10 text-lg font-medium max-w-md mx-auto">
            Your hardware components are being packed. Track your shipment in the "My Orders" section.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/profile')}
              className="btn-premium py-4 text-xs"
            >
              Monitor Orders
            </button>
            <button 
              onClick={() => navigate('/shop')}
              className="py-4 px-8 border-2 border-slate-100 rounded-sm font-black text-[10px] uppercase tracking-widest text-text-muted hover:text-text-primary hover:border-accent transition-all"
            >
              Continue Sourcing
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="pt-48 pb-32 min-h-screen flex items-center justify-center px-4 bg-slate-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <AlertCircle className="h-8 w-8 text-slate-200" />
          </div>
          <h2 className="text-2xl font-black text-text-primary mb-6 uppercase tracking-tight">Checkout is Empty</h2>
          <Link to="/shop" className="btn-premium px-10 py-4 text-xs">Back to Marketplace</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-32 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 mb-12 pb-8 border-b border-border-main">
          <button onClick={() => navigate('/cart')} className="p-3 bg-white border border-border-main rounded-sm text-text-secondary hover:text-accent transition-all shadow-sm">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-4xl font-black text-text-primary tracking-tighter uppercase leading-none">Security <span className="text-accent">Checkout</span></h1>
            <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mt-2">256-bit encrypted transaction tunnel</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-10">
            
            {/* Delivery Section */}
            <section className="bg-white p-10 rounded-[32px] border border-border-main shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-text-primary flex items-center gap-3 uppercase tracking-tight">
                  <MapPin className="h-5 w-5 text-accent" /> Destination Node
                </h3>
              </div>
              
              <div className="space-y-8">
                {addresses.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <button 
                        key={addr.id}
                        onClick={() => setAddress(addr.address)}
                        className={`p-6 rounded-sm border-2 text-left transition-all relative group ${
                          address === addr.address 
                            ? 'border-accent bg-accent/5' 
                            : 'border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${address === addr.address ? 'border-accent bg-accent' : 'border-slate-300'}`}>
                            {address === addr.address && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-primary">{addr.type}</span>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed font-medium line-clamp-2">{addr.address}</p>
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Manual Entry / Shipping Memo</label>
                  <textarea 
                    rows="3"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter full coordinate details (Street, City, State, ZIP)..."
                    className="w-full px-5 py-4 bg-slate-50 border border-border-main rounded-sm text-sm font-medium text-text-primary focus:border-accent outline-none transition-all resize-none"
                  ></textarea>
                </div>
              </div>
            </section>

            {/* Delivery Options */}
            <section className="bg-white p-10 rounded-[32px] border border-border-main shadow-sm">
              <h3 className="text-lg font-black text-text-primary mb-8 flex items-center gap-3 uppercase tracking-tight">
                <Truck className="h-5 w-5 text-accent" /> Shipment Protocol
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'STANDARD', name: 'Standard', desc: '3-5 Days', icon: Clock },
                  { id: 'EXPRESS', name: 'Express', desc: '1-2 Days', icon: Zap },
                  { id: 'PRIORITY', name: 'Priority', desc: 'Overnight', icon: ShieldCheck },
                ].map((opt) => (
                  <button 
                    key={opt.id}
                    onClick={() => setDeliveryOption(opt.id)}
                    className={`p-6 rounded-sm border-2 text-center transition-all ${
                      deliveryOption === opt.id 
                        ? 'border-accent bg-accent/5' 
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <opt.icon className={`h-6 w-6 mx-auto mb-3 ${deliveryOption === opt.id ? 'text-accent' : 'text-text-muted'}`} />
                    <div className="font-black text-text-primary text-[10px] uppercase tracking-widest">{opt.name}</div>
                    <div className="text-[9px] text-text-muted mt-1 uppercase font-bold">{opt.desc}</div>
                    <div className="text-[10px] font-black text-accent mt-3">+{formatPrice(deliveryCharges[opt.id])}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Payment Systems */}
            <section className="bg-white p-10 rounded-[32px] border border-border-main shadow-sm">
              <h3 className="text-lg font-black text-text-primary mb-8 flex items-center gap-3 uppercase tracking-tight">
                <CreditCard className="h-5 w-5 text-accent" /> Transaction Hub
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-6 rounded-sm border-2 text-left transition-all ${
                    paymentMethod === 'CARD' 
                      ? 'border-accent bg-accent/5' 
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <Smartphone className={`h-6 w-6 ${paymentMethod === 'CARD' ? 'text-accent' : 'text-text-muted'}`} />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'CARD' ? 'border-accent bg-accent' : 'border-slate-300'}`}>
                      {paymentMethod === 'CARD' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                  </div>
                  <div className="font-black text-text-primary text-xs uppercase tracking-widest">Card / UPI / NetBanking</div>
                  <div className="text-[9px] text-text-muted mt-2 uppercase font-bold leading-tight">Powered by Razorpay Secure</div>
                </button>

                <button 
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-6 rounded-sm border-2 text-left transition-all ${
                    paymentMethod === 'COD' 
                      ? 'border-accent bg-accent/5' 
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <Wallet className={`h-6 w-6 ${paymentMethod === 'COD' ? 'text-accent' : 'text-text-muted'}`} />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'COD' ? 'border-accent bg-accent' : 'border-slate-300'}`}>
                      {paymentMethod === 'COD' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                  </div>
                  <div className="font-black text-text-primary text-xs uppercase tracking-widest">Cash on Delivery</div>
                  <div className="text-[9px] text-text-muted mt-2 uppercase font-bold leading-tight">Pay after verification</div>
                </button>
              </div>
            </section>
          </div>

          {/* Side Summary */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-[32px] p-10 border border-border-main sticky top-32 shadow-xl shadow-slate-200/50">
              <h3 className="text-xl font-black text-text-primary mb-8 uppercase tracking-tighter flex items-center gap-3">
                <Package className="h-6 w-6 text-accent" /> Manifest Summary
              </h3>
              
              <div className="space-y-6 mb-10 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                {cartItems.map(item => (
                  <div key={item._id} className="flex items-center gap-5 group">
                    <div className="w-16 h-16 rounded-sm border border-slate-100 overflow-hidden bg-slate-50 p-2 flex-shrink-0 group-hover:border-accent transition-all">
                      <img src={item.image} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-grow">
                      <div className="text-xs font-black text-text-primary line-clamp-1 uppercase tracking-tight">{item.name}</div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[10px] text-text-muted font-bold">QTY: {item.quantity}</span>
                        <span className="text-sm font-black text-text-primary">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>



              <div className="space-y-4 mb-10 pt-6 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Subtotal</span>
                  <span className="text-sm font-black text-text-primary">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Shipping ({deliveryOption})</span>
                  <span className="text-sm font-black text-text-primary">{formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Technical Tax (18%)</span>
                  <span className="text-sm font-black text-text-primary">{formatPrice(tax)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span className="text-[10px] font-black uppercase tracking-widest">Promo ({appliedPromo})</span>
                    <span className="text-sm font-black">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-end pt-6 border-t-2 border-dashed border-slate-100">
                  <span className="text-sm font-black text-text-primary uppercase tracking-widest">Total Payable</span>
                  <span className="text-4xl font-black text-accent tracking-tighter">{formatPrice(total)}</span>
                </div>
              </div>

              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full btn-premium py-6 text-sm font-black flex items-center justify-center gap-3 uppercase tracking-[0.2em] shadow-xl shadow-accent/20"
              >
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    Confirm Deployment
                    <ShieldCheck className="h-6 w-6" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
