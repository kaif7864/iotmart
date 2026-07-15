import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { placeOrder, createTransaction } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../hooks/useCart';
import { 
  ChevronLeft, MapPin, CreditCard, Truck, 
  ShieldCheck, CheckCircle2, Loader2, Package, 
  Wallet, Building2, Smartphone, Gift, Clock, AlertCircle, Zap,
  X, Send, MessageSquare
} from 'lucide-react';
import { load } from '@cashfreepayments/cashfree-js';
import apiClient from '../../services/api.client';
import AddAddressModal from '../../components/profile/AddAddressModal';

const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", 
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", 
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

let cashfree;
const initializeSDK = async () => {
    cashfree = await load({
        mode: import.meta.env.VITE_CASHFREE_MODE || "sandbox"
    });
};
initializeSDK();

const Checkout = () => {
  const { cartItems, onClearCart, discount, appliedPromo } = useCart();
  const { user, addresses, formatPrice, currency } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [address, setAddress] = useState('');
  
  // Blocked account modal state
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [queryText, setQueryText] = useState("");
  const [querySending, setQuerySending] = useState(false);
  const [querySent, setQuerySent] = useState(false);
  
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(!addresses || addresses.length === 0);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({ 
    type: 'Home', name: '', phone: '', pincode: '', state: '', city: '', house: '', area: '', landmark: '' 
  });
  const [paymentMethod, setPaymentMethod] = useState('CARD'); // Default to Card/Razorpay
  const [deliveryOption, setDeliveryOption] = useState('STANDARD');

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryCharges = {
    'STANDARD': subtotal > 500 ? 0 : 50,
    'EXPRESS': 150,
    'PRIORITY': 250
  };
  const shipping = deliveryCharges[deliveryOption];
  const tax = subtotal * 0.18;
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal + shipping + tax - discountAmount;

  const { addAddress } = useAuth();
  
  const handleAddAddress = (e) => {
    e.preventDefault();
    
    // Basic Form Validation
    if (!/^\d{10}$/.test(newAddr.phone)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }
    if (!/^\d{6}$/.test(newAddr.pincode)) {
      alert("Please enter a valid 6-digit PIN code.");
      return;
    }
    if (newAddr.name.trim().length < 2) {
      alert("Please enter a valid name.");
      return;
    }

    const formattedAddress = `${newAddr.name}\n${newAddr.house}, ${newAddr.area}\n${newAddr.city}, ${newAddr.state} - ${newAddr.pincode}\n${newAddr.landmark ? `Landmark: ${newAddr.landmark}\n` : ''}Phone: ${newAddr.phone}`;

    addAddress({
      type: newAddr.type,
      address: formattedAddress
    });
    
    setAddress(formattedAddress);
    setShowAddAddress(false);
    setIsAddingNewAddress(false);
    setNewAddr({ type: 'Home', name: '', phone: '', pincode: '', state: '', city: '', house: '', area: '', landmark: '' });
  };

  const handleSendQuery = async () => {
    if (!queryText.trim()) return;
    setQuerySending(true);
    try {
      await apiClient.post('/support/', {
        name: user?.name || user?.first_name || 'Suspended User',
        email: user?.email || '',
        message: `Blocked Account Query: ${queryText}`
      });
      setQuerySent(true);
    } catch (error) {
      console.error("Failed to send query", error);
      alert("Failed to send message. Please try again or email support@iotmart.com");
    } finally {
      setQuerySending(false);
    }
  };

  const handleCashfreePayment = async () => {
    if (!address.trim()) {
      alert('Please enter or select a delivery address');
      return;
    }
    setLoading(true);
    try {
      // Send the amount in the currently selected currency to match the UI
      const displayTotal = total * currency.rate;
      const res = await apiClient.post('/payments/cashfree/create-session', {
        order_amount: displayTotal,
        order_currency: currency.code,
        customer_id: user?._id || "guest",
        customer_phone: user?.phone || "9999999999",
        customer_email: user?.email || "guest@iotmart.com",
        customer_name: (user?.first_name ? `${user.first_name} ${user.last_name || ''}` : "Guest User").trim()
      });
      
      const { payment_session_id, order_id } = res.data;
      
      let checkoutOptions = {
          paymentSessionId: payment_session_id,
          redirectTarget: "_modal",
      };
      
      cashfree.checkout(checkoutOptions).then(async (result) => {
          if(result.error){
              alert("Payment failed: " + result.error.message);
              try {
                await createTransaction({
                  user_id: user?._id || "guest",
                  order_id: order_id,
                  amount: displayTotal,
                  currency: currency.code,
                  status: "Failed",
                  payment_method: paymentMethod,
                  payment_id: result.error.message || "Failed"
                });
              } catch (e) {
                console.error("Failed to log transaction", e);
              }
          }
          if(result.paymentDetails){
              processOrder("PAID", result.paymentDetails.paymentMessage || order_id);
          }
      });
    } catch (e) {
      console.error(e);
      const errorMsg = e.response?.data?.detail || e.message;
      if (errorMsg === "Account is inactive or blocked") {
        setShowBlockedModal(true);
      } else {
        alert(`Payment Initialization Failed: ${errorMsg}\n\nPlease try again later or select Cash on Delivery.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const [createdOrderId, setCreatedOrderId] = useState(null);

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
        status: status === "PAID" ? "Paid" : "Pending",
        shipping_method: deliveryOption,
        promo_code: appliedPromo || null
      };

      const res = await placeOrder(orderData);
      setCreatedOrderId(res._id || res.id || "Processing");
      setOrderComplete(true);
      onClearCart();
    } catch (error) {
      console.error('Order failed:', error);
      const errorMsg = error.response?.data?.detail || error.message;
      if (errorMsg === "Account is inactive or blocked") {
        setShowBlockedModal(true);
      } else {
        alert(`Order Failed: ${errorMsg}\n\nPlease check your cart and try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (paymentMethod === 'COD') {
      processOrder("PENDING");
    } else {
      handleCashfreePayment();
    }
  };

  if (orderComplete) {
    return (
      <div className="pt-32 pb-32 min-h-screen flex items-center justify-center px-4 bg-app-bg">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-raised max-w-2xl w-full p-12 text-center rounded-[40px] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent to-secondary" />
          <div className="w-24 h-24 bg-status-success-bg rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-card-bg shadow-lg">
            <CheckCircle2 className="h-12 w-12 text-status-success" />
          </div>
          <h1 className="heading-page mb-4">Order Placed Successfully</h1>
          <p className="text-text-secondary mb-10 text-lg font-medium max-w-md mx-auto">
            Your products are being packed. Track your shipment in the "My Orders" section.<br/><br/>
            <span className="text-accent font-bold">Order ID: {createdOrderId}</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={() => navigate('/profile')} className="btn-premium py-4 text-xs">
              View My Orders
            </button>
            <button onClick={() => navigate('/shop')} className="btn-outline py-4 text-xs">
              Continue Shopping
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="pt-48 pb-32 min-h-screen flex items-center justify-center px-4 bg-app-bg">
        <div className="text-center">
          <div className="w-20 h-20 card rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-text-muted" />
          </div>
          <h2 className="heading-section mb-6">Checkout is Empty</h2>
          <Link to="/shop" className="btn-premium px-10 py-4 text-xs">Back to Marketplace</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-32 min-h-screen bg-app-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 mb-12 pb-8 border-b border-border-main">
          <button onClick={() => navigate('/cart')} className="w-12 h-12 flex items-center justify-center card rounded-sm text-text-secondary hover:text-accent transition-all">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="heading-page leading-none">Security <span className="text-accent">Checkout</span></h1>
            <p className="label-caps mt-2">100% Secure & Encrypted Payment</p>
          </div>
        </div>

        <div className="card rounded-[32px] p-8 lg:p-12">
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-12">
              
              {/* Delivery Section */}
              <section className="">
              <h3 className="heading-section flex items-center gap-3 mb-8">
                <MapPin className="h-5 w-5 text-accent" /> Shipping Address
              </h3>
              
              <div className="space-y-8">
                {addresses && addresses.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Saved Addresses</label>
                      <button 
                        onClick={() => { setIsAddingNewAddress(!isAddingNewAddress); setAddress(''); }}
                        className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline"
                      >
                        {isAddingNewAddress ? 'Select Saved Address' : '+ Add New Address'}
                      </button>
                    </div>

                    {!isAddingNewAddress && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addresses.map((addr) => (
                          <button
                            key={addr.id}
                            onClick={() => setAddress(addr.address)}
                            className={`p-6 rounded-[16px] border-2 text-left transition-all ${
                              address === addr.address && !isAddingNewAddress
                                ? 'border-accent bg-accent/5'
                                : 'border-border-subtle hover:border-border-main'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${address === addr.address && !isAddingNewAddress ? 'border-accent bg-accent' : 'border-border-main'}`}>
                                {address === addr.address && !isAddingNewAddress && <div className="w-1.5 h-1.5 bg-card-bg rounded-full" />}
                              </div>
                              <span className="label-caps text-text-primary">{addr.type}</span>
                            </div>
                            <p className="text-xs text-text-secondary leading-relaxed font-medium line-clamp-2">{addr.address}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(isAddingNewAddress || addresses.length === 0) && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3"
                  >
                    <button
                      onClick={() => setShowAddAddress(true)}
                      className="w-full py-4 px-6 border-2 border-dashed border-accent text-accent font-bold rounded-[16px] hover:bg-accent/5 transition-all flex items-center justify-center gap-2"
                    >
                      <span>+ Click here to fill Address Details</span>
                    </button>
                    {address && !isAddingNewAddress && (
                      <div className="p-4 bg-app-bg border border-border-main rounded-xl mt-4">
                        <p className="text-xs text-text-secondary whitespace-pre-wrap">{address}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </section>

            {/* Delivery Options */}
            <section className="pt-12 border-t border-border-main">
              <h3 className="heading-section flex items-center gap-3 mb-8">
                <Truck className="h-5 w-5 text-accent" /> Delivery Options
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'STANDARD', name: 'Standard', desc: '3-5 Days', icon: Clock },
                  { id: 'EXPRESS',  name: 'Express',  desc: '1-2 Days', icon: Zap },
                  { id: 'PRIORITY', name: 'Priority', desc: 'Overnight', icon: ShieldCheck },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setDeliveryOption(opt.id)}
                    className={`p-6 rounded-sm border-2 text-center transition-all ${
                      deliveryOption === opt.id
                        ? 'border-accent bg-accent-light'
                        : 'border-border-subtle hover:border-border-main'
                    }`}
                  >
                    <opt.icon className={`h-6 w-6 mx-auto mb-3 ${deliveryOption === opt.id ? 'text-accent' : 'text-text-muted'}`} />
                    <div className="label-caps text-text-primary">{opt.name}</div>
                    <div className="label-caps mt-1">{opt.desc}</div>
                    <div className="label-caps text-accent mt-3">+{formatPrice(deliveryCharges[opt.id])}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Payment Systems */}
            <section className="pt-12 border-t border-border-main">
              <h3 className="heading-section flex items-center gap-3 mb-8">
                <CreditCard className="h-5 w-5 text-accent" /> Payment Method
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[{ id: 'CARD', label: 'Card / UPI / NetBanking', sublabel: 'Powered by Razorpay Secure', Icon: Smartphone }, { id: 'COD', label: 'Cash on Delivery', sublabel: 'Pay after verification', Icon: Wallet }].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setPaymentMethod(opt.id)}
                    className={`p-6 rounded-sm border-2 text-left transition-all ${
                      paymentMethod === opt.id
                        ? 'border-accent bg-accent-light'
                        : 'border-border-subtle hover:border-border-main'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <opt.Icon className={`h-6 w-6 ${paymentMethod === opt.id ? 'text-accent' : 'text-text-muted'}`} />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === opt.id ? 'border-accent bg-accent' : 'border-border-main'}`}>
                        {paymentMethod === opt.id && <div className="w-2 h-2 bg-card-bg rounded-full" />}
                      </div>
                    </div>
                    <div className="font-black text-text-primary text-xs uppercase tracking-widest">{opt.label}</div>
                    <div className="label-caps mt-2">{opt.sublabel}</div>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="hidden lg:block lg:col-span-1 relative">
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border-main"></div>
          </div>

          {/* Side Summary */}
          <div className="lg:col-span-4">
            <div className="sticky top-32">
              <h3 className="heading-section flex items-center gap-3 mb-8">
                <Package className="h-6 w-6 text-accent" /> Manifest Summary
              </h3>
              
              <div className="space-y-6 mb-10 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                {cartItems.map(item => (
                  <div key={item._id} className="flex items-center gap-5 group">
                    <div className="w-16 h-16 rounded-sm border border-border-subtle overflow-hidden bg-surface p-2 flex-shrink-0 group-hover:border-accent transition-all">
                      <img src={item.image} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-grow">
                      <div className="text-xs font-black text-text-primary line-clamp-1 uppercase tracking-tight">{item.name}</div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="label-caps">QTY: {item.quantity}</span>
                        <span className="text-sm font-black text-text-primary">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>



              <div className="space-y-4 mb-10 pt-6 border-t border-border-main">
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
                  <div className="flex justify-between text-status-success">
                    <span className="text-[10px] font-black uppercase tracking-widest">Promo ({appliedPromo})</span>
                    <span className="text-sm font-black">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-end pt-6 border-t-2 border-dashed border-border-main">
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

      <AddAddressModal 
        showAddAddress={showAddAddress} 
        setShowAddAddress={setShowAddAddress} 
        newAddr={newAddr} 
        setNewAddr={setNewAddr} 
        handleAddAddress={handleAddAddress} 
        INDIAN_STATES={INDIAN_STATES}
      />

      <AnimatePresence>
        {showBlockedModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => !querySending && setShowBlockedModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="card bg-card-bg/95 backdrop-blur-2xl w-full max-w-md p-6 sm:p-8 rounded-[32px] shadow-[0_0_80px_rgba(239,68,68,0.15)] relative z-10 border border-status-danger/20 overflow-y-auto max-h-[95vh] hide-scrollbar"
            >
              {/* Background Glows */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b from-status-danger/10 to-transparent pointer-events-none" />
              
              <button 
                onClick={() => setShowBlockedModal(false)}
                className="absolute right-4 top-4 sm:right-6 sm:top-6 p-2 rounded-full bg-app-bg/50 hover:bg-status-danger/10 text-text-muted hover:text-status-danger transition-all duration-300 z-20"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mt-2 bg-gradient-to-br from-status-danger-bg to-status-danger/20 rounded-[24px] flex items-center justify-center mb-6 border border-status-danger/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <div className="absolute inset-0 rounded-[24px] border border-status-danger/50 animate-ping opacity-20" />
                <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 text-status-danger" />
              </div>
              
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-text-primary mb-3">
                  Account <span className="text-status-danger">Suspended</span>
                </h2>
                <p className="text-text-secondary text-xs sm:text-sm leading-relaxed max-w-[95%] sm:max-w-[90%] mx-auto">
                  Your account access has been restricted due to a policy violation or security flag. Purchasing features are currently disabled.
                </p>
              </div>
              
              {querySent ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-status-success/10 rounded-2xl border border-status-success/30 text-center relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-status-success/5 to-transparent pointer-events-none" />
                  <CheckCircle2 className="h-12 w-12 text-status-success mx-auto mb-4 drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]" />
                  <p className="text-status-success font-black uppercase tracking-widest text-sm mb-2">Request Received</p>
                  <p className="text-text-muted text-xs leading-relaxed mb-6">Our security team will review your account status within 24-48 hours. Please monitor your email.</p>
                  <button 
                    onClick={() => setShowBlockedModal(false)}
                    className="w-full py-3 bg-status-success/20 hover:bg-status-success text-status-success hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300"
                  >
                    Acknowledge
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute left-4 top-4 text-status-danger/50 group-focus-within:text-status-danger transition-colors">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <textarea 
                      value={queryText}
                      onChange={(e) => setQueryText(e.target.value)}
                      placeholder="Explain your situation to the administrator..."
                      className="w-full h-32 bg-app-bg/50 border border-border-main rounded-2xl py-4 pl-12 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-status-danger/50 focus:ring-1 focus:ring-status-danger/50 focus:outline-none transition-all resize-none shadow-inner"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowBlockedModal(false)}
                      className="flex-1 py-4 bg-app-bg hover:bg-border-main text-text-primary rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSendQuery}
                      disabled={!queryText.trim() || querySending}
                      className="flex-1 py-4 bg-status-danger hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_20px_-10px_rgba(239,68,68,0.5)]"
                    >
                      {querySending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {querySending ? 'Sending...' : 'Appeal Ban'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Checkout;
