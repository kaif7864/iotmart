import React, { useState, useEffect } from 'react';
import { 
  User, Package, MapPin, Heart, LogOut, 
  ChevronRight, ExternalLink, Shield, Bell, 
  Settings, Clock, CreditCard, ChevronDown, Plus, 
  Trash2, Eye, LayoutDashboard, History, Download, Loader2, CheckCircle2, X, Ticket, Gift, ShieldCheck, Mail, Phone, Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getOrdersByUser, getUserTransactions, getLiveTracking, updateUserProfile, sendVerification, verifyMobile, changeUserPassword, updateOrderStatus, updateIdentity, forgotPassword, deactivateAccount, addProductReview } from '../../services/api';
import toast from 'react-hot-toast';
import OrderTimeline from '../../components/ui/OrderTimeline';
import { generateInvoice } from '../../utils/generateInvoice';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton, SkeletonGrid, SkeletonText } from '../../components/common';
import { SectionCard, SectionHeader, TabNav } from '../../components/common';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../context/WishlistContext';
import AddAddressModal from '../../components/profile/AddAddressModal';
import LiveTrackingModal from '../../components/profile/LiveTrackingModal';
import TwoFactorSettingsModal from '../../components/profile/TwoFactorSettingsModal';

const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", 
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", 
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

import { usePWAInstall } from '../../hooks/usePWAInstall';

const UserProfile = () => {
  const { cartItems, onAddToCart, onUpdateQuantity, onRemoveFromCart } = useCart();
  const { user, setUser, logout, addresses, addAddress, removeAddress, formatPrice, currency } = useAuth();
  const { isInstallable, triggerInstall } = usePWAInstall();
  const { wishlist, toggleWishlist } = useWishlist();
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [expandedTxnId, setExpandedTxnId] = useState(null);
  const [reviewModal, setReviewModal] = useState({ isOpen: false, productId: null, productName: '' });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  const [scheduledRemovals, setScheduledRemovals] = useState({});

  const handleWishlistAddToCart = (product) => {
    onAddToCart(product);
    if (scheduledRemovals[product._id]) clearTimeout(scheduledRemovals[product._id]);
    const timeoutId = setTimeout(() => {
      toggleWishlist(product);
      setScheduledRemovals(prev => { const next = {...prev}; delete next[product._id]; return next; });
    }, 3000);
    setScheduledRemovals(prev => ({...prev, [product._id]: timeoutId}));
  };

  const handleWishlistUpdateQuantity = (productId, newQuantity) => {
    onUpdateQuantity(productId, newQuantity);
    if (scheduledRemovals[productId]) {
      clearTimeout(scheduledRemovals[productId]);
      const product = wishlist.find(p => p._id === productId);
      const timeoutId = setTimeout(() => {
        if (product) toggleWishlist(product);
        setScheduledRemovals(prev => { const next = {...prev}; delete next[productId]; return next; });
      }, 3000);
      setScheduledRemovals(prev => ({...prev, [productId]: timeoutId}));
    }
  };
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({ 
    type: 'Home', name: '', phone: '', pincode: '', state: '', city: '', house: '', area: '', landmark: '' 
  });
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Tracking State
  const [showTracking, setShowTracking] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Verification State
  const [otp, setOtp] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingMobile, setIsSendingMobile] = useState(false);
  const [showMobileOtpInput, setShowMobileOtpInput] = useState(false);
  const [emailLinkSent, setEmailLinkSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [editIdentityMode, setEditIdentityMode] = useState(null); // 'email' | 'mobile' | null
  const [editIdentityValue, setEditIdentityValue] = useState('');
  const [isUpdatingIdentity, setIsUpdatingIdentity] = useState(false);

  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateAgreed, setDeactivateAgreed] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);

  // Password State
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSendingResetLink, setIsSendingResetLink] = useState(false);

  const handleSendResetLink = async () => {
    try {
      setIsSendingResetLink(true);
      const res = await forgotPassword(user.email);
      if (res.success) {
        toast.success("Password reset link sent to your email!");
      }
    } catch (error) {
      toast.error("Failed to send reset link");
    } finally {
      setIsSendingResetLink(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error("New passwords do not match!");
      return;
    }
    if (passwordForm.new.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setIsChangingPassword(true);
    try {
      const res = await changeUserPassword(user._id, passwordForm.current, passwordForm.new);
      if (res.success) {
        toast.success("Password changed successfully!");
        setShowChangePassword(false);
        setPasswordForm({ current: '', new: '', confirm: '' });
        
        // Update user context to reflect they now have a custom password
        const updatedUser = { ...user, has_custom_password: true };
        setUser(updatedUser);
        localStorage.setItem('user_session', JSON.stringify(updatedUser));
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSendEmailVerification = async () => {
    try {
      setIsSendingEmail(true);
      const res = await sendVerification(user.email, 'email');
      if (res.success) {
        toast.success("Verification link sent to email");
        setEmailLinkSent(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to send email");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendMobileVerification = async () => {
    try {
      if (!user?.phone) {
        toast.error("Please add a mobile number in My Profile first");
        return;
      }
      setIsSendingMobile(true);
      const res = await sendVerification(user.email, 'mobile');
      if (res.success) {
        toast.success("OTP sent to mobile");
        setShowMobileOtpInput(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to send SMS");
    } finally {
      setIsSendingMobile(false);
    }
  };

  const handleVerifyMobile = async () => {
    try {
      setIsVerifying(true);
      const res = await verifyMobile(user.email, otp);
      if (res.success) {
        toast.success("Mobile number verified successfully!");
        setShowMobileOtpInput(false);
        const updatedUser = { ...user, phone_verified: true };
        setUser(updatedUser);
        localStorage.setItem('user_session', JSON.stringify(updatedUser));
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Invalid OTP");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDeactivateAccount = async () => {
    if (!deactivateAgreed) return;
    try {
      setIsDeactivating(true);
      const res = await deactivateAccount(user._id);
      if (res.success) {
        toast.success("Account deactivated successfully. Logging you out...");
        setShowDeactivateModal(false);
        setTimeout(() => {
          logout();
        }, 1500);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to deactivate account");
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleUpdateIdentity = async (type) => {
    if (!editIdentityValue.trim()) return;
    try {
      setIsUpdatingIdentity(true);
      const emailParam = type === 'email' ? editIdentityValue : user.email;
      const phoneParam = type === 'mobile' ? editIdentityValue : user.phone;
      
      const res = await updateIdentity(user._id, emailParam, phoneParam);
      if (res.success) {
        toast.success(`${type === 'email' ? 'Email' : 'Mobile'} updated! Sending verification...`);
        setUser(res.user);
        localStorage.setItem('user_session', JSON.stringify(res.user));
        setEditIdentityMode(null);
        setEditIdentityValue('');
        
        // Auto-trigger verification
        if (type === 'email') {
          handleSendEmailVerification();
        } else {
          handleSendMobileVerification();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update identity");
    } finally {
      setIsUpdatingIdentity(false);
    }
  };

  const handleTrackShipment = async (tracking_id) => {
    if (!tracking_id) return;
    setShowTracking(true);
    setTrackingLoading(true);
    try {
      const data = await getLiveTracking(tracking_id);
      setTrackingData(data);
    } catch (error) {
      console.error("Tracking error:", error);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    if (!window.confirm(`Are you sure you want to ${newStatus === 'Cancelled' ? 'cancel this order' : 'request a return'}?`)) {
      return;
    }
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(newStatus === 'Cancelled' ? 'Order Cancelled' : 'Return Requested');
      
      // Update local state
      setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to update order status`);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) {
      toast.error('Please enter a review comment');
      return;
    }
    setIsSubmittingReview(true);
    try {
      const reviewData = {
        user_id: user._id,
        user: user.first_name + ' ' + (user.last_name || ''),
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      };
      await addProductReview(reviewModal.productId, reviewData);
      toast.success('Review submitted successfully! Thank you for your feedback.');
      setReviewModal({ isOpen: false, productId: null, productName: '' });
      setReviewForm({ rating: 5, comment: '' });
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (user) {
        try {
          const data = await getOrdersByUser(user._id);
          setOrders(data);
          try {
            const txns = await getUserTransactions(user._id);
            setTransactions(txns);
          } catch(e) { console.error("Error fetching transactions", e) }
        } catch (error) {
          console.error("Error fetching orders:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchOrders();

    // Load recently viewed from localStorage
    const saved = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
    setRecentlyViewed(saved);
  }, [user?._id]);

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

    const formattedAddress = `${newAddr.name}
${newAddr.house}, ${newAddr.area}
${newAddr.city}, ${newAddr.state} - ${newAddr.pincode}
${newAddr.landmark ? `Landmark: ${newAddr.landmark}\n` : ''}Phone: ${newAddr.phone}`;

    if (newAddr.house.trim() && newAddr.city.trim() && newAddr.state.trim()) {
      addAddress({ type: newAddr.type, address: formattedAddress, id: Date.now().toString() });
      setNewAddr({ type: 'Home', name: '', phone: '', pincode: '', state: '', city: '', house: '', area: '', landmark: '' });
      setShowAddAddress(false);
    } else {
      alert("Please fill in all required address fields.");
    }
  };

  const handleProfileSave = async () => {
    try {
      setIsSavingProfile(true);
      if (!user?._id) throw new Error("User ID missing");
      const res = await updateUserProfile(user._id, profileData);
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('user_session', JSON.stringify(res.user));
        toast.success("Profile successfully updated");
      }
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'settings', label: 'My Profile', icon: User },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'transactions', label: 'Transactions', icon: History },
    { id: 'coupons', label: 'Coupons', icon: Ticket },
    { id: 'payments', label: 'Saved Cards & Wallet', icon: CreditCard },
    { id: 'security', label: 'Security & Login', icon: Shield },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'giftcards', label: 'Gift Cards', icon: Gift },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];


  return (
    <div className="pt-32 pb-32 min-h-screen bg-app-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Master Container */}
        <div className="card rounded-[40px] shadow-xl overflow-hidden">
          
          {/* Profile Header Card */}
          <div className="bg-gradient-to-r from-surface-dark to-[#1e293b] p-8 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 blur-[150px] rounded-full" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-accent flex items-center justify-center text-text-inverse font-black text-4xl shadow-xl shadow-accent/20 border-4 border-card-bg/10">
              {user.first_name ? user.first_name.charAt(0) : 'U'}
            </div>
            <div className="flex-grow text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-3">
                <h1 className="text-3xl md:text-5xl font-black text-text-inverse tracking-tighter uppercase">{user.first_name} {user.last_name}</h1>
                <span className="px-3 py-1 bg-card-bg/10 border border-card-bg/20 rounded-sm label-caps text-text-inverse">
                  Verified Customer
                </span>
              </div>
              <p className="text-text-muted font-medium text-lg">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="px-8 py-4 bg-card-bg/5 border border-card-bg/10 text-text-inverse rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-status-danger hover:border-status-danger transition-all"
            >
              Log Out
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row min-h-[600px]">
            {/* Sidebar Navigation */}
            <aside className="w-full lg:w-72 flex-shrink-0 bg-surface lg:border-r border-b lg:border-b-0 border-border-subtle p-4 lg:p-6 overflow-hidden">
              <nav className="flex lg:block overflow-x-auto lg:overflow-visible space-x-2 lg:space-x-0 lg:space-y-1 pb-4 lg:pb-0 scrollbar-hide lg:sticky lg:top-32">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 lg:w-full flex items-center gap-2 lg:gap-4 px-4 py-3 lg:px-5 lg:py-4 rounded-full lg:rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeTab === tab.id
                        ? 'bg-accent text-text-inverse shadow-lg shadow-accent/20'
                        : 'bg-card-bg lg:bg-transparent text-text-secondary hover:bg-surface-hover hover:text-accent'
                    }`}
                  >
                    <tab.icon className="h-4 w-4 flex-shrink-0" />
                    {tab.label}
                  </button>
                ))}
                
                <div className="hidden lg:block pt-4 mt-4 border-t border-border-subtle space-y-2">
                  {isInstallable && (
                    <button
                      onClick={triggerInstall}
                      className="w-full flex items-center gap-4 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-accent hover:bg-accent/10 rounded-sm transition-all text-left"
                    >
                      <Download className="h-4 w-4" /> Install App
                    </button>
                  )}
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all text-status-danger hover:bg-status-danger-bg"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </nav>
            </aside>

            {/* Main Dashboard Content */}
            <main className="flex-grow p-4 md:p-10 min-w-0">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card rounded-[32px] p-10 space-y-10">
                  <div className="flex items-center justify-between border-b border-border-subtle pb-6">
                    <h3 className="heading-section flex items-center gap-3">
                      <LayoutDashboard className="h-6 w-6 text-accent" /> Account Overview
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { label: 'Total Orders', value: orders.length,    Icon: Package, bgClass: 'bg-accent-light' },
                      { label: 'Saved Items',  value: wishlist.length,  Icon: Heart,   bgClass: 'bg-status-danger-bg' },
                      { label: 'Addresses',    value: addresses.length, Icon: MapPin,  bgClass: 'bg-status-success-bg' },
                    ].map(({ label, value, Icon, bgClass }) => (
                      <div key={label} className={`${bgClass} p-8 rounded-2xl border border-border-subtle relative overflow-hidden group`}>
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-card-bg/40 rounded-full group-hover:scale-150 transition-transform duration-500" />
                        <div className="flex items-center justify-between mb-4 relative z-10">
                          <p className="label-caps">{label}</p>
                          <Icon className="h-5 w-5 text-accent" />
                        </div>
                        <h4 className="text-4xl font-black text-text-primary tracking-tighter relative z-10">{value}</h4>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6">
                    <h3 className="heading-section mb-6">Recent Order</h3>
                    {orders.length > 0 ? (
                      <div>
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-border-subtle">
                          <div>
                            <p className="label-caps">Order ID</p>
                            <p className="font-black text-text-primary uppercase">#{orders[0]._id.slice(-8)}</p>
                          </div>
                          <span className="badge-success">{orders[0].status}</span>
                        </div>
                        <OrderTimeline status={orders[0].status} />
                      </div>
                    ) : (
                      <p className="text-text-muted text-sm italic">No orders found in your history.</p>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'orders' && (
                <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-card-bg p-6 rounded-[32px] border border-border-main space-y-4">
                          <div className="flex justify-between">
                            <Skeleton className="w-12 h-12 rounded-xl" />
                            <Skeleton className="w-20 h-6 rounded-sm" />
                          </div>
                          <Skeleton className="w-1/2 h-6" />
                          <div className="flex justify-between pt-4 border-t border-border-subtle">
                            <Skeleton className="w-1/4 h-8" />
                            <Skeleton className="w-1/4 h-8" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : expandedOrderId ? (
                    // Expanded Single Order View
                    orders.filter(o => o._id === expandedOrderId).map(order => (
                      <div key={order._id} className="bg-card-bg rounded-[32px] border border-border-main shadow-lg overflow-hidden transition-all">
                        {/* Header Section */}
                        <div className="bg-surface border-b border-border-subtle p-8 relative">
                          <button onClick={() => setExpandedOrderId(null)} className="absolute top-8 left-6 w-11 h-11 card hover:border-accent rounded-full transition-all flex items-center justify-center shadow-sm z-10" title="Back to Orders">
                            <ChevronDown className="h-5 w-5 rotate-90 text-text-primary" />
                          </button>
                          
                          <div className="flex flex-wrap justify-between items-center gap-6 pl-16">
                            <div className="flex items-center gap-6">
                              <div className="w-14 h-14 card rounded-xl flex items-center justify-center text-accent">
                                <Package className="h-7 w-7" />
                              </div>
                              <div>
                                <p className="label-caps mb-1">Order ID</p>
                                <p className="font-black text-text-primary uppercase tracking-tight text-lg">#{order._id.slice(-12)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="label-caps mb-1">Total Value</p>
                              <p className="text-2xl font-black text-accent tracking-tighter">{formatPrice(order.total || 0)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Items Section */}
                        <div className="p-8 pb-4">
                          <h4 className="label-caps mb-4">Purchased Items</h4>
                          <div className="space-y-3">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 card rounded-2xl hover:border-accent/30 transition-all gap-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-2 h-2 rounded-full bg-accent shrink-0" />
                                  <Link to={`/product/${item.product_id}`} className="text-sm font-bold text-text-primary uppercase tracking-tight hover:text-accent transition-colors">
                                    {item.name}
                                  </Link>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                                  <span className="label-caps bg-surface px-3 py-1 rounded-full whitespace-nowrap">Qty: {item.quantity}</span>
                                  <span className="text-sm font-black text-text-secondary min-w-[80px] text-right">{formatPrice(item.price * item.quantity)}</span>
                                  
                                  {order.status === 'Delivered' && (
                                    <button 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setReviewModal({ isOpen: true, productId: item.product_id, productName: item.name });
                                      }}
                                      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent px-3 py-1.5 rounded-full hover:bg-accent hover:text-white transition-all ml-2 whitespace-nowrap"
                                    >
                                      <Star className="w-3 h-3" /> Rate
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Timeline & Actions Section */}
                        <div className="p-8 pt-4">
                          <div className="card p-8 rounded-2xl mb-6 w-full">
                            <OrderTimeline status={order.status} />
                          </div>
                          
                          <div className="flex flex-wrap gap-4 justify-end">
                            {['Pending', 'Processing', 'Confirmed'].includes(order.status) && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order._id, 'Cancelled')}
                                className="btn-outline border-status-danger text-status-danger hover:bg-status-danger hover:text-white px-8 py-4 text-xs rounded-xl transition-all"
                              >
                                Cancel Order
                              </button>
                            )}
                            {order.status === 'Delivered' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order._id, 'Return Requested')}
                                className="btn-outline border-status-warning text-status-warning hover:bg-status-warning hover:text-black px-8 py-4 text-xs rounded-xl transition-all"
                              >
                                Request Return
                              </button>
                            )}
                            {order.tracking_id && (
                              <button
                                onClick={() => handleTrackShipment(order.tracking_id)}
                                className="flex items-center justify-center gap-2 px-8 py-4 bg-status-success-bg text-status-success rounded-xl text-xs font-black uppercase tracking-widest hover:bg-status-success hover:text-text-inverse transition-all border border-status-success/20"
                              >
                                <MapPin className="h-4 w-4" /> Track Live
                              </button>
                            )}
                            <button
                              onClick={() => generateInvoice(order, user, currency)}
                              className="btn-dark flex items-center gap-2 px-8 py-4 text-xs rounded-xl"
                            >
                              <Download className="h-4 w-4" /> Download Invoice
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Compact Grid View
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {orders.length === 0 ? (
                        <p className="text-text-muted italic text-sm p-10 bg-card-bg rounded-[32px] border border-dashed border-border-main text-center col-span-full">No orders found.</p>
                      ) : orders.map((order) => (
                        <div 
                          key={order._id} 
                          onClick={() => setExpandedOrderId(order._id)}
                          className="bg-card-bg p-6 rounded-[32px] border border-border-main cursor-pointer hover:shadow-xl hover:border-accent group transition-all"
                        >
                          <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 card rounded-xl flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                              <Package className="h-5 w-5" />
                            </div>
                            <span className={`badge-${order.status?.toLowerCase() === 'delivered' ? 'success' : 'info'}`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="mb-4">
                            <p className="label-caps mb-1">Order ID</p>
                            <p className="text-sm font-black text-text-primary uppercase tracking-tight">#{order._id.slice(-8)}</p>
                          </div>
                          <div className="flex justify-between items-end pt-4 border-t border-border-subtle">
                            <div>
                              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Items</p>
                              <p className="text-sm font-bold text-text-secondary">{order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Total</p>
                              <p className="text-lg font-black text-accent">{formatPrice(order.total || 0)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'transactions' && (
                <motion.div key="transactions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  {loading ? (
                    <SkeletonGrid count={2} />
                  ) : transactions.length === 0 ? (
                    <div className="card rounded-[32px] p-12 text-center flex flex-col items-center">
                      <History className="h-16 w-16 text-text-muted mb-4 opacity-50" />
                      <h3 className="text-xl font-bold text-text-primary mb-2">No Transactions Yet</h3>
                      <p className="text-text-secondary">When you make a payment, it will appear here.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {transactions.map((txn) => (
                        <div key={txn._id} className="card rounded-[32px] overflow-hidden border border-border-main transition-all">
                            <div 
                              onClick={() => setExpandedTxnId(expandedTxnId === txn._id ? null : txn._id)}
                              className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-surface-hover gap-4"
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${txn.status === 'Success' || txn.status === 'Paid' ? 'bg-status-success-bg text-status-success' : txn.status === 'Failed' ? 'bg-status-danger-bg text-status-danger' : 'bg-status-warning-bg text-status-warning'}`}>
                                  {txn.status === 'Success' || txn.status === 'Paid' ? <CheckCircle2 className="h-6 w-6" /> : txn.status === 'Failed' ? <X className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-text-primary uppercase tracking-tight truncate">Txn: #{txn._id.slice(-8)}</p>
                                  <p className="text-xs text-text-muted mt-1 truncate">{new Date(txn.created_at).toLocaleString()} • {txn.payment_method}</p>
                                </div>
                              </div>
                              <div className="text-left md:text-right flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pl-16 md:pl-0">
                                <div>
                                  <p className="text-lg font-black text-text-primary">{formatPrice(txn.amount)}</p>
                                  <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${txn.status === 'Success' || txn.status === 'Paid' ? 'text-status-success' : txn.status === 'Failed' ? 'text-status-danger' : 'text-status-warning'}`}>{txn.status}</p>
                                </div>
                                <ChevronDown className={`h-5 w-5 text-text-muted transition-transform shrink-0 ${expandedTxnId === txn._id ? 'rotate-180' : ''}`} />
                              </div>
                            </div>
                          
                          <AnimatePresence>
                            {expandedTxnId === txn._id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-border-subtle bg-surface/50 overflow-hidden"
                              >
                                <div className="p-8 space-y-6">
                                  {/* Receipt Style Header */}
                                  <div className="flex justify-between items-start pb-6 border-b border-border-subtle border-dashed">
                                    <div>
                                      <p className="text-[10px] uppercase font-black tracking-widest text-text-muted mb-1">Transaction Receipt</p>
                                      <p className="text-sm font-bold text-text-primary">Ref: {txn._id}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[10px] uppercase font-black tracking-widest text-text-muted mb-1">Date & Time</p>
                                      <p className="text-sm font-bold text-text-primary">{new Date(txn.created_at).toLocaleString()}</p>
                                    </div>
                                  </div>
                                  
                                  {/* Details Grid */}
                                  <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                    <div>
                                      <p className="text-[10px] uppercase font-black tracking-widest text-text-muted mb-1">Payment Method</p>
                                      <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-accent" />
                                        <p className="text-sm font-bold text-text-primary">{txn.payment_method}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-[10px] uppercase font-black tracking-widest text-text-muted mb-1">Status</p>
                                      <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${txn.status === 'Success' || txn.status === 'Paid' ? 'bg-status-success' : txn.status === 'Failed' ? 'bg-status-danger' : 'bg-status-warning'}`}></span>
                                        <p className="text-sm font-bold text-text-primary uppercase">{txn.status}</p>
                                      </div>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                      <p className="text-[10px] uppercase font-black tracking-widest text-text-muted mb-1">Gateway Reference</p>
                                      <p className="text-sm font-medium text-text-secondary break-all font-mono bg-app-bg px-3 py-2 rounded-lg border border-border-subtle inline-block">{txn.payment_id || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                      <p className="text-[10px] uppercase font-black tracking-widest text-text-muted mb-1">Associated Order Ref</p>
                                      <p className="text-sm font-medium text-text-secondary break-all font-mono bg-app-bg px-3 py-2 rounded-lg border border-border-subtle inline-block">{txn.order_id || 'N/A'}</p>
                                    </div>
                                  </div>

                                  {/* Amount Summary */}
                                  <div className="pt-6 border-t border-border-subtle flex justify-between items-center bg-app-bg -mx-8 px-8 -mb-8 pb-8 mt-4 rounded-b-[32px]">
                                    <div>
                                      <p className="text-sm font-bold text-text-secondary uppercase tracking-tight">Total Amount</p>
                                      {txn.status === 'Failed' && (
                                        <p className="text-[10px] text-status-danger mt-1 max-w-[200px] sm:max-w-xs leading-tight">
                                          Transaction declined or cancelled. No amount was charged.
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <p className="text-3xl font-black text-text-primary tracking-tighter">{formatPrice(txn.amount)}</p>
                                      <p className="text-xs text-text-muted font-bold tracking-widest">{txn.currency}</p>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'wishlist' && (
                <motion.div key="wishlist" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {wishlist.map((product) => (
                      <div key={product._id} className="bg-card-bg p-6 rounded-[32px] border border-border-main flex items-center gap-6 group hover:shadow-lg transition-all">
                        <div className="w-24 h-24 bg-app-bg rounded-sm p-4 flex-shrink-0 border border-border-subtle">
                          <img src={product.image} className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-black text-text-primary text-sm uppercase tracking-tight line-clamp-1">{product.name}</h4>
                          <p className="text-lg font-black text-accent mt-1">{formatPrice(product.price || 0)}</p>
                          <div className="flex gap-2 mt-4">
                            <Link to={`/product/${product._id}`} className="px-4 py-2 bg-app-bg text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-surface-hover transition-all border border-border-main">View</Link>
                            {(() => {
                              const cartItem = cartItems.find(item => item._id === product._id);
                              const quantityInCart = cartItem ? cartItem.quantity : 0;
                              
                              return quantityInCart > 0 ? (
                                <div className="flex items-center bg-surface-hover rounded-md p-1 border border-border-main">
                                  <button 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      if (quantityInCart === 1) {
                                        onRemoveFromCart(product._id);
                                        if (scheduledRemovals[product._id]) {
                                          clearTimeout(scheduledRemovals[product._id]);
                                          setScheduledRemovals(prev => { const next = {...prev}; delete next[product._id]; return next; });
                                        }
                                      }
                                      else handleWishlistUpdateQuantity(product._id, quantityInCart - 1);
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
                                      handleWishlistUpdateQuantity(product._id, quantityInCart + 1);
                                    }}
                                    className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-accent hover:bg-card-bg rounded transition-colors text-sm font-black"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => handleWishlistAddToCart(product)}
                                  className="px-4 py-2 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:shadow-lg hover:shadow-accent/20 transition-all"
                                >
                                  Add to Cart
                                </button>
                              );
                            })()}
                            <button onClick={() => toggleWishlist(product)} className="px-2 py-2 text-text-muted hover:text-status-danger transition-all">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'addresses' && (
                <motion.div key="addresses" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="bg-card-bg p-8 rounded-[32px] border border-border-main relative group">
                        <div className="flex justify-between items-start mb-4">
                          <span className="px-3 py-1 bg-app-bg text-[10px] font-black uppercase tracking-widest rounded-sm border border-border-subtle">{addr.type}</span>
                          <button onClick={() => removeAddress(addr.id)} className="p-2 text-text-muted hover:text-status-danger transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm font-medium text-text-secondary leading-relaxed whitespace-pre-wrap">{addr.address}</p>
                      </div>
                    ))}
                    <button 
                      onClick={() => setShowAddAddress(true)}
                      className="border-2 border-dashed border-border-main rounded-[32px] p-8 flex flex-col items-center justify-center gap-3 text-text-muted hover:border-accent hover:text-accent transition-all bg-card-bg/50"
                    >
                      <Plus className="h-8 w-8" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Add New Address</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'recent' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {recentlyViewed.length > 0 ? recentlyViewed.map((product) => (
                      <div key={product._id} className="bg-card-bg p-6 rounded-[32px] border border-border-main flex items-center gap-6 group hover:shadow-lg transition-all">
                        <div className="w-24 h-24 bg-app-bg rounded-sm p-4 flex-shrink-0">
                          <img src={product.image} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-black text-text-primary text-sm uppercase tracking-tight line-clamp-1">{product.name}</h4>
                          <p className="text-lg font-black text-accent mt-1">{formatPrice(product.price || 0)}</p>
                          <Link to={`/product/${product._id}`} className="inline-block mt-4 text-[10px] font-black uppercase tracking-widest text-accent hover:underline">View Product</Link>
                        </div>
                      </div>
                    )) : (
                      <p className="text-text-muted italic text-sm p-10 bg-card-bg rounded-sm border border-dashed border-border-main text-center col-span-full">Your browsing history is empty.</p>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                  <div className="card rounded-[32px] p-10">
                    <h3 className="heading-section flex items-center gap-3 mb-8">
                      <User className="h-6 w-6 text-accent" /> Personal Information
                    </h3>
                    <form className="space-y-6 max-w-2xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="label-caps block mb-2">First Name</label>
                          <input 
                            type="text" 
                            value={profileData.first_name} 
                            onChange={(e) => setProfileData({...profileData, first_name: e.target.value})}
                            className="field-input" 
                          />
                        </div>
                        <div>
                          <label className="label-caps block mb-2">Last Name</label>
                          <input 
                            type="text" 
                            value={profileData.last_name} 
                            onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                            className="field-input" 
                          />
                        </div>
                        <div>
                          <label className="label-caps block mb-2">Phone Number</label>
                          <input 
                            type="tel" 
                            value={profileData.phone} 
                            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                            className="field-input" 
                          />
                        </div>
                        <div>
                          <label className="label-caps block mb-2">Email Address</label>
                          <input type="email" defaultValue={user?.email} disabled className="field-input-dark" />
                        </div>
                      </div>
                      <div className="pt-4 border-b border-border-main pb-8">
                        <button 
                          type="button" 
                          onClick={handleProfileSave}
                          disabled={isSavingProfile}
                          className="btn-premium py-4 text-[10px] disabled:opacity-50"
                        >
                          {isSavingProfile ? 'Saving...' : 'Save Information'}
                        </button>
                      </div>

                      <div className="pt-4">
                        <h4 className="heading-section mb-6">PAN Card Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                          <div>
                            <label className="label-caps block mb-2">PAN Card Number</label>
                            <input type="text" placeholder="ABCDE1234F" className="field-input uppercase" />
                          </div>
                          <div>
                            <label className="label-caps block mb-2">Full Name on PAN</label>
                            <input type="text" placeholder="Enter name as on PAN" className="field-input" />
                          </div>
                        </div>
                        <button type="button" className="btn-outline py-4 text-[10px]">
                          Upload & Verify PAN
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div key="notifications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                  <div className="card rounded-[32px] p-10">
                    <h3 className="heading-section flex items-center gap-3 mb-8">
                      <Bell className="h-6 w-6 text-accent" /> Notification Preferences
                    </h3>
                    <div className="space-y-4 max-w-2xl">
                      {[
                        { title: 'Order Updates',       desc: 'Get notified when your order status changes' },
                        { title: 'Restock Alerts',      desc: 'Be the first to know when items in your wishlist are back' },
                        { title: 'Promotional Offers',  desc: 'Receive exclusive discounts and tech news' }
                      ].map((pref, i) => (
                        <div key={i} className="flex items-start sm:items-center justify-between p-5 bg-surface rounded-xl border border-border-subtle gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-text-primary text-sm sm:text-base">{pref.title}</p>
                            <p className="text-xs text-text-muted mt-1 leading-relaxed pr-2">{pref.desc}</p>
                          </div>
                          <div className="w-12 h-6 bg-accent rounded-full relative cursor-pointer shrink-0 mt-1 sm:mt-0">
                            <div className="absolute right-1 top-1 w-4 h-4 bg-card-bg rounded-full shadow transition-all" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'payments' && (
                <motion.div key="payments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                  <div className="card rounded-[32px] p-5 md:p-10">
                    <h3 className="heading-section flex items-center gap-3 mb-8">
                      <CreditCard className="h-6 w-6 text-accent" /> Payment Methods
                    </h3>
                    <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-border-main rounded-2xl text-text-muted bg-surface/50">
                      <CreditCard className="h-12 w-12 mb-4 opacity-20" />
                      <p className="font-bold text-text-primary mb-1">No saved payment methods</p>
                      <p className="text-xs text-center max-w-sm mb-6">You haven't saved any credit/debit cards yet. Cards are saved securely after your first purchase.</p>
                      <button 
                        type="button"
                        onClick={() => toast('Payment gateway integration pending...', { icon: '🚧' })}
                        className="btn-outline py-3 px-6 text-[10px]"
                      >
                        Add New Card
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div key="security" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                  <div className="card rounded-[32px] p-5 md:p-10">
                    <h3 className="heading-section flex items-center gap-3 mb-8">
                      <Shield className="h-6 w-6 text-status-success" /> Account Security
                    </h3>
                    
                    <div className="space-y-8 max-w-2xl">
                      {/* Identity Verification */}
                      <div className="card p-4 md:p-6 rounded-2xl border border-border-main">
                        <div className="flex items-center gap-3 mb-4 md:mb-6">
                          <ShieldCheck className="h-6 w-6 text-accent flex-shrink-0" />
                          <h4 className="heading-section text-lg sm:text-xl">Identity Verification</h4>
                        </div>
                        
                        <div className="space-y-4">
                          {/* Email Block */}
                          <div className="flex flex-col gap-3 p-4 bg-app-bg rounded-xl border border-border-subtle">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="min-w-0">
                                <p className="font-bold text-text-primary text-sm">Email Address</p>
                                {editIdentityMode === 'email' ? (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <input type="email" value={editIdentityValue} onChange={(e) => setEditIdentityValue(e.target.value)} className="field-input py-2 px-3 text-xs w-full sm:w-auto" />
                                    <button disabled={isUpdatingIdentity} onClick={() => handleUpdateIdentity('email')} className="btn-premium px-4 py-2 text-[10px]">Save</button>
                                    <button disabled={isUpdatingIdentity} onClick={() => setEditIdentityMode(null)} className="btn-outline px-4 py-2 text-[10px]">Cancel</button>
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                                    <p className="text-xs text-text-muted truncate max-w-full">{user?.email}</p>
                                    <button onClick={() => { setEditIdentityMode('email'); setEditIdentityValue(user?.email || ''); }} className="text-[10px] text-accent uppercase font-black hover:underline shrink-0 whitespace-nowrap">Change</button>
                                  </div>
                                )}
                              </div>
                              {editIdentityMode !== 'email' && (
                                user?.email_verified ? (
                                  <span className="badge-success self-start sm:self-auto shrink-0"><CheckCircle2 className="h-3 w-3 inline mr-1"/> Verified</span>
                                ) : (
                                  <button 
                                    onClick={handleSendEmailVerification}
                                    disabled={isSendingEmail}
                                    className="px-4 py-2 bg-accent text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-accent-hover transition-all self-start sm:self-auto shrink-0 whitespace-nowrap"
                                  >
                                    {isSendingEmail ? 'Sending...' : 'Verify Email'}
                                  </button>
                                )
                              )}
                            </div>
                            {emailLinkSent && !user?.email_verified && (
                              <div className="p-3 bg-status-info/10 border border-status-info/20 rounded-lg text-xs">
                                <p className="text-status-info font-bold mb-1"><Mail className="h-3 w-3 inline mr-1"/>Link Sent!</p>
                                <p className="text-text-muted">Please check your inbox and click the link to verify.</p>
                              </div>
                            )}
                          </div>
                          
                          {/* Mobile Block */}
                          <div className="flex flex-col gap-3 p-4 bg-app-bg rounded-xl border border-border-subtle">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="min-w-0">
                                <p className="font-bold text-text-primary text-sm">Mobile Number</p>
                                {editIdentityMode === 'mobile' ? (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <input type="text" value={editIdentityValue} onChange={(e) => setEditIdentityValue(e.target.value)} placeholder="+91..." className="field-input py-2 px-3 text-xs w-full sm:w-auto" />
                                    <button disabled={isUpdatingIdentity} onClick={() => handleUpdateIdentity('mobile')} className="btn-premium px-4 py-2 text-[10px]">Save</button>
                                    <button disabled={isUpdatingIdentity} onClick={() => setEditIdentityMode(null)} className="btn-outline px-4 py-2 text-[10px]">Cancel</button>
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                                    <p className="text-xs text-text-muted truncate max-w-full">{user?.phone || 'Not provided'}</p>
                                    <button onClick={() => { setEditIdentityMode('mobile'); setEditIdentityValue(user?.phone || ''); }} className="text-[10px] text-accent uppercase font-black hover:underline shrink-0 whitespace-nowrap">{user?.phone ? 'Change' : 'Add'}</button>
                                  </div>
                                )}
                              </div>
                              {editIdentityMode !== 'mobile' && (
                                (user?.phone_verified || user?.mobile_verified) ? (
                                  <span className="badge-success self-start sm:self-auto shrink-0"><CheckCircle2 className="h-3 w-3 inline mr-1"/> Verified</span>
                                ) : (
                                  <button 
                                    onClick={!user?.phone ? () => { setEditIdentityMode('mobile'); setEditIdentityValue(''); } : handleSendMobileVerification}
                                    disabled={isSendingMobile}
                                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded transition-all self-start sm:self-auto shrink-0 whitespace-nowrap ${!user?.phone ? 'bg-status-warning text-black hover:bg-yellow-500' : 'bg-accent text-white hover:bg-accent-hover'}`}
                                  >
                                    {!user?.phone ? 'Add Mobile' : isSendingMobile ? 'Sending...' : 'Verify Mobile'}
                                  </button>
                                )
                              )}
                            </div>
                            {showMobileOtpInput && !(user?.phone_verified || user?.mobile_verified) && (
                              <div className="p-4 bg-surface rounded-lg border border-border-subtle mt-2 flex gap-3">
                                <input 
                                  type="text" 
                                  placeholder="Enter 6-digit OTP" 
                                  value={otp}
                                  onChange={(e) => setOtp(e.target.value)}
                                  className="field-input flex-grow text-center tracking-[0.5em] font-mono text-sm py-2"
                                  maxLength={6}
                                />
                                <button 
                                  onClick={handleVerifyMobile}
                                  disabled={isVerifying || otp.length !== 6}
                                  className="px-6 btn-premium py-2 text-xs"
                                >
                                  {isVerifying ? '...' : 'Confirm'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                        <div className="card p-4 md:p-6 rounded-2xl flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-black text-text-primary uppercase tracking-tight mb-1">Password</p>
                              <p className="text-xs text-text-muted">Manage your account password</p>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => setShowChangePassword(!showChangePassword)}
                              className="btn-outline px-6 py-3 text-[10px]"
                            >
                              {showChangePassword ? 'Cancel' : 'Update'}
                            </button>
                          </div>
                          
                          <AnimatePresence>
                            {showChangePassword && (
                              <motion.form 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }} 
                                exit={{ opacity: 0, height: 0 }}
                                onSubmit={handleChangePassword}
                                className="space-y-4 pt-4 border-t border-border-subtle overflow-hidden"
                              >
                                {user?.has_custom_password !== false && (
                                  <div>
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Current Password</label>
                                    <input type="password" required value={passwordForm.current} onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})} className="field-input" placeholder="••••••••" />
                                  </div>
                                )}
                                <div>
                                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">New Password</label>
                                  <input type="password" required value={passwordForm.new} onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})} className="field-input" placeholder="••••••••" />
                                </div>
                                <div>
                                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">Confirm New Password</label>
                                  <input type="password" required value={passwordForm.confirm} onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})} className="field-input" placeholder="••••••••" />
                                </div>
                                <div className="pt-2">
                                  <button type="submit" disabled={isChangingPassword} className="btn-premium px-8 py-3 text-xs">
                                    {isChangingPassword ? 'Updating...' : 'Save Password'}
                                  </button>
                                </div>
                                <div className="pt-2 border-t border-border-subtle mt-4">
                                  <p className="text-xs text-text-muted mb-2">Logged in via Google or forgot your current password?</p>
                                  <button 
                                    type="button" 
                                    onClick={handleSendResetLink}
                                    disabled={isSendingResetLink}
                                    className="text-[10px] text-accent uppercase font-black hover:underline"
                                  >
                                    {isSendingResetLink ? 'Sending Link...' : 'Send Reset Link to Email'}
                                  </button>
                                </div>
                              </motion.form>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className={`p-6 border rounded-2xl flex items-center justify-between ${user?.is_2fa_enabled ? 'border-status-success/30 bg-status-success-bg' : 'border-border-subtle bg-app-bg'}`}>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`font-black uppercase tracking-tight text-sm ${user?.is_2fa_enabled ? 'text-status-success' : 'text-text-primary'}`}>Two-Factor Auth</p>
                              {user?.is_2fa_enabled && <span className="badge-success text-[8px]">Active</span>}
                            </div>
                            <p className={`text-xs font-medium ${user?.is_2fa_enabled ? 'text-status-success/80' : 'text-text-muted'}`}>
                              {user?.is_2fa_enabled 
                                ? `Protected by ${user.two_factor_type === 'authenticator' ? 'authenticator app' : 'email OTP'}.`
                                : 'Add an extra layer of security to your account.'}
                            </p>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setShowTwoFactorModal(true)}
                            className={`px-6 py-3 card rounded-xl label-caps transition-all ${user?.is_2fa_enabled ? 'text-status-success hover:bg-status-success hover:text-text-inverse' : 'text-text-primary hover:border-accent hover:text-accent'}`}
                          >
                            Manage
                          </button>
                        </div>
                      </div>

                      <div className="pt-8 mt-8 border-t border-border-main">
                        <h4 className="text-lg font-black text-status-danger mb-4 uppercase tracking-tighter">Danger Zone</h4>
                        <p className="text-text-muted text-sm mb-6 leading-relaxed">Deactivating your account will remove all your data, order history, and saved addresses permanently. This action cannot be undone.</p>
                        <button 
                          type="button" 
                          onClick={() => { setShowDeactivateModal(true); setDeactivateAgreed(false); }}
                          className="px-8 py-4 bg-status-danger-bg text-status-danger rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-status-danger hover:text-text-inverse transition-all border border-status-danger/20"
                        >
                          Deactivate Account
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Deactivate Account Modal */}
              <AnimatePresence>
                {showDeactivateModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="bg-app-bg w-full max-w-md rounded-[32px] border border-status-danger/30 overflow-hidden shadow-2xl"
                    >
                      <div className="bg-status-danger/10 p-6 flex flex-col items-center justify-center text-center">
                        <div className="h-16 w-16 bg-status-danger/20 rounded-full flex items-center justify-center text-status-danger mb-4">
                          <X className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">Deactivate Account</h3>
                      </div>
                      
                      <div className="p-8 space-y-6">
                        <p className="text-sm text-text-muted text-center leading-relaxed">
                          This is a permanent action. You will lose access to all your orders, wishlist, and profile information. Are you absolutely sure?
                        </p>
                        
                        <label className="flex items-start gap-3 cursor-pointer p-4 border border-border-subtle rounded-xl hover:bg-surface transition-all">
                          <input 
                            type="checkbox" 
                            checked={deactivateAgreed}
                            onChange={(e) => setDeactivateAgreed(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-border-strong text-status-danger focus:ring-status-danger bg-app-bg" 
                          />
                          <span className="text-xs text-text-secondary leading-tight">
                            I understand that deactivating my account is permanent and my data will be removed.
                          </span>
                        </label>

                        <div className="flex gap-3 pt-2">
                          <button 
                            onClick={() => setShowDeactivateModal(false)}
                            className="flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-text-secondary bg-surface hover:bg-surface-hover transition-all border border-border-subtle"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={handleDeactivateAccount}
                            disabled={!deactivateAgreed || isDeactivating}
                            className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${!deactivateAgreed ? 'bg-status-danger/30 text-white/50 cursor-not-allowed' : 'bg-status-danger text-white hover:bg-red-600 shadow-lg shadow-status-danger/25'}`}
                          >
                            {isDeactivating ? 'Deactivating...' : 'Confirm'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {activeTab === 'coupons' && (
                <motion.div key="coupons" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                  <div className="card rounded-[32px] p-10">
                    <h3 className="heading-section flex items-center gap-3 mb-8">
                      <Ticket className="h-6 w-6 text-accent" /> My Coupons
                    </h3>
                    <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-border-main rounded-2xl text-text-muted bg-surface/50 max-w-2xl">
                      <Ticket className="h-12 w-12 mb-4 opacity-20" />
                      <p className="font-bold text-text-primary mb-1">No coupons available</p>
                      <p className="text-xs text-center max-w-sm mb-6">You don't have any active coupons or discount codes at the moment. Keep shopping to earn rewards!</p>
                      <button 
                        type="button"
                        onClick={() => toast('Coupon redemption is coming soon!', { icon: '🎟️' })}
                        className="btn-outline py-3 px-6 text-[10px]"
                      >
                        Redeem a Code
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'giftcards' && (
                <motion.div key="giftcards" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                  <div className="card rounded-[32px] p-10 flex flex-col items-center justify-center text-center py-20">
                    <div className="w-24 h-24 bg-accent-light rounded-full flex items-center justify-center text-accent mb-6">
                      <Gift className="h-10 w-10" />
                    </div>
                    <h3 className="heading-section mb-2">No Gift Cards</h3>
                    <p className="text-text-muted max-w-sm mb-8">You don't have any active gift cards. Purchase one for a friend or redeem a code below.</p>
                    <button 
                      type="button"
                      onClick={() => toast('Gift cards feature is coming soon!', { icon: '🎁' })}
                      className="btn-premium py-4 text-[10px] px-8"
                    >
                      Redeem Code
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
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

      <TwoFactorSettingsModal
        show={showTwoFactorModal}
        onClose={() => setShowTwoFactorModal(false)}
      />

      <LiveTrackingModal 
        showTracking={showTracking} 
        setShowTracking={setShowTracking} 
        trackingData={trackingData} 
        trackingLoading={trackingLoading} 
      />

      <AnimatePresence>
        {reviewModal.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-card-bg border border-border-main rounded-3xl p-8 max-w-lg w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setReviewModal({ isOpen: false, productId: null, productName: '' })}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-surface transition-colors"
              >
                <X className="w-5 h-5 text-text-muted hover:text-text-primary" />
              </button>
              
              <h3 className="text-2xl font-black text-text-primary mb-2 uppercase tracking-tight">Rate Product</h3>
              <p className="text-sm font-bold text-accent mb-8 line-clamp-1">{reviewModal.productName}</p>
              
              <form onSubmit={handleReviewSubmit}>
                <div className="mb-8">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-4">Your Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button 
                        key={star} 
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star className={`w-10 h-10 ${star <= reviewForm.rating ? 'fill-amber-400 text-amber-400 drop-shadow-md' : 'text-border-subtle hover:text-border-main'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-8">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-4">Your Review</label>
                  <textarea 
                    rows="4" 
                    required
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    placeholder="Tell us what you liked or disliked about this product..."
                    className="w-full bg-surface border border-border-main rounded-xl p-4 text-sm text-text-primary focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all resize-none shadow-inner"
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={isSubmittingReview}
                  className="w-full py-4 bg-text-primary text-white text-xs font-bold rounded-xl uppercase tracking-widest hover:bg-text-secondary transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserProfile;
