import React, { useState, useEffect, useRef } from 'react';
import { load } from '@cashfreepayments/cashfree-js';
import { 
  User, Package, MapPin, Heart, LogOut, 
  ChevronRight, ExternalLink, Shield, Bell, 
  Settings, Clock, CreditCard, ChevronDown, Plus, 
  Trash2, Eye, LayoutDashboard, History, Download, Loader2, CheckCircle2, X, Ticket, Gift, ShieldCheck, Mail, Phone, Star, Camera, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getOrdersByUser, getUserTransactions, getLiveTracking, updateUserProfile, sendVerification, verifyMobile, changeUserPassword, updateOrderStatus, updateIdentity, forgotPassword, deactivateAccount, addProductReview, getActiveCoupons, redeemGiftCard, purchaseGiftCard, createCashfreeSession, getGiftcardSettings } from '../../services/api';
import toast from 'react-hot-toast';
import OrderTimeline from '../../components/ui/OrderTimeline';
import { generateInvoice } from '../../utils/generateInvoice';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
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
  const { user, setUser, updateUserSession, logout, addresses, addAddress, removeAddress, formatPrice, currency } = useAuth();
  const { isInstallable, triggerInstall } = usePWAInstall();
  const { wishlist, toggleWishlist } = useWishlist();
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [expandedTxnId, setExpandedTxnId] = useState(null);
  const [reviewModal, setReviewModal] = useState({ isOpen: false, productId: null, productName: '' });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [availableCoupons, setAvailableCoupons] = useState([]);

  // Gift Card State
  const [giftCardTiers, setGiftCardTiers] = useState([
    {pay: 500, get: 500, label: ""},
    {pay: 1000, get: 1100, label: "10% Extra"},
    {pay: 2000, get: 2300, label: "15% Extra"},
    {pay: 5000, get: 6000, label: "20% Extra"}
  ]);
  
  useEffect(() => {
    const fetchGCSettings = async () => {
      try {
        const res = await getGiftcardSettings();
        if (res.data?.tiers) setGiftCardTiers(res.data.tiers);
      } catch (err) {
        console.error("Failed to fetch GC settings", err);
      }
    };
    fetchGCSettings();
  }, []);

  const [giftCardCode, setGiftCardCode] = useState('');
  const [giftForm, setGiftForm] = useState({ amount: '1000', recipient_email: '', recipient_name: '', message: '' });
  const [isRedeemingGC, setIsRedeemingGC] = useState(false);
  const [isRefreshingWallet, setIsRefreshingWallet] = useState(false);
  const [isPurchasingGC, setIsPurchasingGC] = useState(false);

  const handleRefreshWallet = async () => {
    if (!user?._id) return;
    setIsRefreshingWallet(true);
    try {
      // Inline fetch to avoid circular deps with apiClient
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8000/api/users/${user._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && data.wallet_balance !== undefined) {
        updateUserSession({ ...user, wallet_balance: data.wallet_balance });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsRefreshingWallet(false), 500); // 500ms artificial delay for smooth animation
    }
  };

  const handleRedeemGiftCard = async (e) => {
    e.preventDefault();
    if (!giftCardCode || giftCardCode.length !== 16) {
      toast.error("Please enter a valid 16-digit code");
      return;
    }
    setIsRedeemingGC(true);
    try {
      const res = await redeemGiftCard(giftCardCode);
      if (res.data?.success || res.success) {
        toast.success(res.data?.message || res.message || "Gift card redeemed!");
        setGiftCardCode('');
        updateUserSession({ ...user, wallet_balance: res.data?.new_balance || res.new_balance });
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to redeem gift card");
    } finally {
      setIsRedeemingGC(false);
    }
  };

  const handlePurchaseGiftCard = async (e) => {
    e.preventDefault();
    setIsPurchasingGC(true);
    try {
      // 1. Load cashfree SDK
      const cashfree = await load({ mode: import.meta.env.VITE_CASHFREE_MODE || "sandbox" });
      
      // 2. Create payment session for gift card amount
      const sessionRes = await createCashfreeSession({
        order_amount: parseFloat(giftForm.amount) * currency.rate,
        order_currency: currency.code,
        customer_id: user?._id || "guest",
        customer_phone: user?.phone || "9999999999",
        customer_email: user?.email || "guest@iotmart.com",
        customer_name: (user?.first_name ? `${user.first_name} ${user.last_name || ''}` : "Guest User").trim()
      });
      
      const { payment_session_id } = sessionRes.data;
      
      // 3. Open Cashfree widget
      let checkoutOptions = {
          paymentSessionId: payment_session_id,
          redirectTarget: "_modal",
      };
      
      cashfree.checkout(checkoutOptions).then(async (result) => {
          if (result.error) {
              toast.error("Payment failed: " + result.error.message);
              setIsPurchasingGC(false);
          }
          if (result.paymentDetails) {
              // Payment successful! Now actually generate the gift card in DB.
              try {
                const res = await purchaseGiftCard(giftForm);
                if (res.data?.success || res.success) {
                  toast.success(res.data?.message || res.message || "Gift card purchased successfully!");
                  setGiftForm({ amount: '1000', recipient_email: '', recipient_name: '', message: '' });
                }
              } catch (err) {
                toast.error("Gift card API failed after payment. Please contact support.");
              } finally {
                setIsPurchasingGC(false);
              }
          }
      });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to initialize payment gateway");
      setIsPurchasingGC(false);
    }
  };

  const [scheduledRemovals, setScheduledRemovals] = useState({});
  const fileInputRef = useRef(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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

    const fetchCoupons = async () => {
      try {
        const couponsData = await getActiveCoupons();
        setAvailableCoupons(couponsData);
      } catch (e) {
        console.error("Error fetching coupons:", e);
      }
    };
    fetchCoupons();

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

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Basic validation
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) { // 2MB
      toast.error('Image size must be less than 2MB');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        try {
          if (!user?._id) throw new Error("User ID missing");
          const res = await updateUserProfile(user._id, { ...profileData, avatar: base64String });
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('user_session', JSON.stringify(res.user));
            toast.success("Profile picture updated!");
          }
        } catch(err) {
            toast.error("Failed to upload avatar");
        } finally {
            setIsUploadingAvatar(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setIsUploadingAvatar(false);
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
    <div className="pt-28 md:pt-32 pb-32 min-h-screen bg-app-bg relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Master Container */}
        <div className="bg-card-bg/80 backdrop-blur-2xl border border-border-main rounded-[40px] shadow-[0_0_80px_rgba(2,132,199,0.1)] overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none rounded-[40px]"></div>
          
          {/* Profile Header Card */}
          <div className="bg-surface-dark p-8 md:p-10 relative overflow-hidden border-b border-border-main z-10 shadow-sm">
            
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="relative">
                <div 
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center text-white font-black text-4xl border-2 border-border-main relative overflow-hidden group cursor-pointer bg-card-bg"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                  {isUploadingAvatar ? (
                    <div className="w-full h-full bg-black/60 flex items-center justify-center backdrop-blur-sm">
                      <Loader2 className="w-8 h-8 animate-spin text-white" />
                    </div>
                  ) : user.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-accent text-white">
                        <span>{user.first_name ? user.first_name.charAt(0) : 'U'}</span>
                    </div>
                  )}
                  
                  {/* Hover overlay for upload */}
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                    <Camera className="w-8 h-8 text-white mb-2" />
                  </div>
                </div>
                
                {/* Permanent Edit Badge */}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 md:w-10 md:h-10 bg-accent hover:bg-accent-hover text-white rounded-full flex items-center justify-center border-2 border-surface-dark transition-transform hover:scale-110 z-20"
                  title="Change Profile Picture"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex-grow text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase">{user.first_name} {user.last_name}</h1>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-accent/10 border border-accent/20 rounded-md">
                    <ShieldCheck className="w-3 h-3 text-accent" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent">
                      Verified Customer
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2 text-text-muted font-medium text-base">
                  <Mail className="w-4 h-4 opacity-70" />
                  <span>{user.email}</span>
                </div>
              </div>
              
              <button
                onClick={logout}
                className="px-6 py-3 bg-transparent border border-status-danger text-status-danger rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-status-danger hover:text-white transition-colors duration-200 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
            </div>
          </div>

        <div className="flex flex-col lg:flex-row min-h-[600px] relative z-10">
            {/* Sidebar Navigation */}
            <aside className="w-full lg:w-72 flex-shrink-0 lg:border-r border-b lg:border-b-0 border-border-main p-4 lg:p-6 bg-card-bg/30 relative">
              <nav className="flex lg:flex-col overflow-x-auto lg:overflow-visible space-x-2 lg:space-x-0 lg:space-y-2 pb-4 lg:pb-0 scrollbar-hide lg:sticky lg:top-32">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 lg:w-full flex items-center gap-3 lg:gap-4 px-5 py-3 lg:px-6 lg:py-4 rounded-full lg:rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-accent/10 text-accent border border-accent/30 shadow-[0_0_20px_rgba(2,132,199,0.15)]'
                        : 'bg-card-bg/50 border border-transparent text-text-secondary hover:bg-surface-hover hover:text-accent hover:border-border-main'
                    }`}
                  >
                    <tab.icon className={`h-4 w-4 flex-shrink-0 transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : ''}`} />
                    {tab.label}
                  </button>
                ))}
                
                <div className="hidden lg:block pt-4 mt-6 border-t border-border-main space-y-2">
                  {isInstallable && (
                    <button
                      onClick={triggerInstall}
                      className="w-full flex items-center gap-4 px-5 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-accent hover:bg-accent/10 rounded-xl transition-all text-left"
                    >
                      <Download className="h-4 w-4" /> Install App
                    </button>
                  )}
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all text-status-danger hover:bg-status-danger/10 hover:border hover:border-status-danger/30"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </nav>
            </aside>

            {/* Main Dashboard Content */}
            <main className="flex-grow p-4 md:p-10 min-w-0 bg-transparent">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card-bg/40 backdrop-blur-xl border border-border-main rounded-[32px] p-6 md:p-10 space-y-10 shadow-sm">
                  <div className="flex items-center justify-between border-b border-border-main pb-6">
                    <h3 className="text-2xl md:text-3xl font-black text-text-primary tracking-tighter uppercase flex items-center gap-3">
                      <LayoutDashboard className="h-6 w-6 text-accent" /> Account Overview
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { label: 'Total Orders', value: orders.length,    Icon: Package, gradient: 'from-accent/20 to-transparent', color: 'text-accent' },
                      { label: 'Saved Items',  value: wishlist.length,  Icon: Heart,   gradient: 'from-status-danger/20 to-transparent', color: 'text-status-danger' },
                      { label: 'Addresses',    value: addresses.length, Icon: MapPin,  gradient: 'from-status-success/20 to-transparent', color: 'text-status-success' },
                    ].map(({ label, value, Icon, gradient, color }) => (
                      <div key={label} className="bg-card-bg/60 backdrop-blur-md p-8 rounded-3xl border border-border-main relative overflow-hidden group hover:border-accent transition-all duration-500 shadow-sm">
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 group-hover:opacity-100 transition-opacity duration-500`}></div>
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-card-bg/40 rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
                        <div className="flex items-center justify-between mb-4 relative z-10">
                          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{label}</p>
                          <Icon className={`h-5 w-5 ${color}`} />
                        </div>
                        <h4 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter relative z-10">{value}</h4>
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
                      <div key={order._id} className="bg-card-bg/40 backdrop-blur-2xl rounded-[32px] border border-border-main shadow-[0_0_60px_rgba(2,132,199,0.15)] overflow-hidden transition-all relative">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 blur-[120px] rounded-full pointer-events-none" />
                        
                        {/* Header Section */}
                        <div className="bg-gradient-to-r from-surface-dark/90 to-[#1e293b]/90 border-b border-border-main p-8 relative z-10">
                          <button onClick={() => setExpandedOrderId(null)} className="absolute top-8 left-6 w-11 h-11 bg-card-bg/50 backdrop-blur-md hover:bg-accent hover:border-accent hover:text-white rounded-full transition-all flex items-center justify-center shadow-lg border border-border-subtle z-20 group" title="Back to Orders">
                            <ChevronDown className="h-5 w-5 rotate-90 group-hover:-translate-x-1 transition-transform" />
                          </button>
                          
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pl-16">
                            <div className="flex items-center gap-5">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner ${
                                order.status?.toLowerCase() === 'delivered' 
                                  ? 'bg-status-success/20 text-status-success border-status-success/30' 
                                  : order.status?.toLowerCase() === 'cancelled'
                                  ? 'bg-status-danger/20 text-status-danger border-status-danger/30'
                                  : 'bg-accent/20 text-accent border-accent/30'
                              }`}>
                                {order.status?.toLowerCase() === 'delivered' ? <CheckCircle2 className="h-7 w-7" /> : order.status?.toLowerCase() === 'cancelled' ? <X className="h-7 w-7" /> : <Package className="h-7 w-7" />}
                              </div>
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Order ID</p>
                                  <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                                    order.status?.toLowerCase() === 'delivered' 
                                      ? 'bg-status-success/10 text-status-success border-status-success/30' 
                                      : order.status?.toLowerCase() === 'cancelled'
                                      ? 'bg-status-danger/10 text-status-danger border-status-danger/30'
                                      : 'bg-accent/10 text-accent border-accent/30'
                                  }`}>
                                    {order.status}
                                  </span>
                                </div>
                                <p className="font-black text-text-primary uppercase tracking-tight text-xl">#{order._id.slice(-12)}</p>
                              </div>
                            </div>
                            <div className="text-left md:text-right pl-16 md:pl-0">
                              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Total Paid</p>
                              <p className="text-3xl font-black text-accent tracking-tighter">{formatPrice(order.total || 0)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Items Section */}
                        <div className="p-8 pb-4 relative z-10">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-text-muted mb-4">Purchased Items</h4>
                          <div className="space-y-4">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card-bg/60 backdrop-blur-md border border-border-subtle rounded-2xl hover:border-accent/50 hover:shadow-[0_0_30px_rgba(2,132,199,0.15)] transition-all gap-4 group">
                                <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 md:w-16 md:h-16 shrink-0 bg-surface rounded-xl border border-border-subtle p-1.5 relative overflow-hidden flex justify-center items-center">
                                    {item.image ? (
                                      <img src={item.image} alt={item.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" />
                                    ) : (
                                      <Package className="w-6 h-6 text-text-muted" />
                                    )}
                                  </div>
                                  <div>
                                    <Link to={`/product/${item.slug || item.product_id}`} className="text-sm md:text-base font-black text-text-primary uppercase tracking-tight hover:text-accent transition-colors line-clamp-2">
                                      {item.name}
                                    </Link>
                                    <div className="flex items-center gap-3 mt-1.5">
                                      <p className="text-[10px] text-text-muted uppercase tracking-widest">Unit: {formatPrice(item.price)}</p>
                                      <span className="w-1 h-1 rounded-full bg-border-main"></span>
                                      <p className="text-[10px] font-bold text-accent uppercase tracking-widest bg-accent/10 px-2 py-0.5 rounded-sm">Qty: {item.quantity}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pl-18 sm:pl-0">
                                  <span className="text-lg font-black text-accent">{formatPrice(item.price * item.quantity)}</span>
                                  
                                  {order.status === 'Delivered' && (
                                    <button 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setReviewModal({ isOpen: true, productId: item.product_id, productName: item.name });
                                      }}
                                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-accent/10 text-accent border border-accent/20 px-4 py-2 rounded-xl hover:bg-accent hover:text-white transition-all ml-2"
                                    >
                                      <Star className="w-3.5 h-3.5" /> Rate
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Shipping & Billing Summary Section */}
                        <div className="px-8 pb-4 relative z-10">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Shipping Details */}
                            <div className="bg-card-bg/60 backdrop-blur-md border border-border-subtle p-6 rounded-2xl hover:border-accent/30 transition-colors">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-text-muted mb-4 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-accent" /> Shipping Address
                              </h4>
                              <div className="space-y-1 text-sm text-text-secondary">
                                <p className="font-bold text-text-primary text-base">{user?.first_name} {user?.last_name}</p>
                                <p className="pt-1">{order.shipping_address?.street || '123 Main Street'}</p>
                                <p>{order.shipping_address?.city || 'City'}, {order.shipping_address?.state || 'State'} {order.shipping_address?.zip || '100001'}</p>
                                <p className="pt-2 flex items-center gap-2 font-bold"><Phone className="w-3.5 h-3.5" /> +91 {user?.phone || '9876543210'}</p>
                              </div>
                            </div>
                            
                            {/* Payment Summary */}
                            <div className="bg-card-bg/60 backdrop-blur-md border border-border-subtle p-6 rounded-2xl hover:border-accent/30 transition-colors">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-text-muted mb-4 flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-accent" /> Payment Summary
                              </h4>
                              <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-text-secondary">
                                  <span>Subtotal</span>
                                  <span className="font-bold text-text-primary">{formatPrice(order.total || 0)}</span>
                                </div>
                                <div className="flex justify-between text-text-secondary">
                                  <span>Shipping Fee</span>
                                  <span className="font-bold text-status-success uppercase text-[10px] tracking-widest bg-status-success/10 px-2 py-0.5 rounded">Free</span>
                                </div>
                                <div className="flex justify-between text-text-secondary">
                                  <span>Discount</span>
                                  <span className="font-bold text-text-primary">- ₹0.00</span>
                                </div>
                                <div className="pt-3 border-t border-border-subtle/50 flex justify-between items-center">
                                  <span className="font-black text-text-primary uppercase tracking-widest text-xs">Total Paid</span>
                                  <span className="font-black text-accent text-xl">{formatPrice(order.total || 0)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Timeline & Actions Section */}
                        <div className="p-8 pt-4 relative z-10">
                          <div className="bg-card-bg/60 backdrop-blur-md border border-border-subtle p-8 rounded-3xl mb-8 w-full shadow-sm">
                            <OrderTimeline status={order.status} />
                          </div>
                          
                          <div className="flex flex-wrap gap-4 justify-end border-t border-border-subtle/50 pt-6">
                            {['Pending', 'Processing', 'Confirmed'].includes(order.status) && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order._id, 'Cancelled')}
                                className="px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-status-danger/10 text-status-danger border border-status-danger/30 hover:bg-status-danger hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0)] hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                              >
                                Cancel Order
                              </button>
                            )}
                            {order.status === 'Delivered' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order._id, 'Return Requested')}
                                className="px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-status-warning/10 text-status-warning border border-status-warning/30 hover:bg-status-warning hover:text-black transition-all shadow-[0_0_15px_rgba(245,158,11,0)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                              >
                                Request Return
                              </button>
                            )}
                            {order.tracking_id && (
                              <button
                                onClick={() => handleTrackShipment(order.tracking_id)}
                                className="px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-status-success/10 text-status-success border border-status-success/30 hover:bg-status-success hover:text-white transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0)] hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                              >
                                <MapPin className="h-4 w-4" /> Track Live
                              </button>
                            )}
                            <button
                              onClick={() => generateInvoice(order, user, currency)}
                              className="px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-accent to-accent-hover text-white transition-all flex items-center gap-2 shadow-lg hover:shadow-[0_0_25px_rgba(2,132,199,0.5)] hover:-translate-y-1"
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
                        <p className="text-text-muted italic text-sm p-10 bg-card-bg/40 backdrop-blur-md rounded-[32px] border border-dashed border-border-main text-center col-span-full">No orders found.</p>
                      ) : orders.map((order) => (
                        <div 
                          key={order._id} 
                          onClick={() => setExpandedOrderId(order._id)}
                          className="bg-card-bg/50 backdrop-blur-xl p-5 md:p-6 rounded-[28px] border border-border-main cursor-pointer hover:shadow-xl hover:border-accent/60 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          
                          <div className="flex gap-4 relative z-10">
                            {/* Layered Image Stack */}
                            <div className="w-[100px] h-[95px] md:w-[120px] md:h-[110px] shrink-0 relative mr-2 md:mr-4">
                              {order.items.slice(0, 3).map((item, index) => {
                                const isLastVisible = index === 2;
                                const extraCount = order.items.length - 3;
                                
                                return (
                                  <div 
                                    key={index} 
                                    className="absolute w-20 h-20 md:w-24 md:h-24 bg-card-bg rounded-2xl border border-border-subtle p-2 shadow-2xl flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_15px_30px_rgba(2,132,199,0.25)]"
                                    style={{
                                      left: `${index * 14}px`, 
                                      top: `${index * 8}px`,
                                      zIndex: 10 - index,
                                      transform: `scale(${1 - index * 0.08})`,
                                      opacity: 1 - (index * 0.15)
                                    }}
                                  >
                                    {item.image ? (
                                      <img src={item.image} className="w-full h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-500" alt={item.name} />
                                    ) : (
                                      <Package className="w-8 h-8 text-text-muted opacity-50" />
                                    )}
                                    
                                    {isLastVisible && extraCount > 0 && (
                                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                                        <span className="text-white font-black text-lg tracking-tight">+{extraCount}</span>
                                        <span className="text-white/80 text-[8px] font-bold uppercase tracking-widest mt-0.5">More</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Details Section */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                              <div>
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="text-base md:text-lg font-black text-text-primary truncate" title={order.items.map(i => i.name).join(', ')}>
                                     {order.items.length === 1 ? order.items[0]?.name : `${order.items[0]?.name} & ${order.items.length - 1} more`}
                                  </h4>
                                  <span className={`shrink-0 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                                    order.status?.toLowerCase() === 'delivered' 
                                      ? 'bg-status-success/15 text-status-success border-status-success/30' 
                                      : order.status?.toLowerCase() === 'cancelled'
                                      ? 'bg-status-danger/15 text-status-danger border-status-danger/30'
                                      : 'bg-accent/15 text-accent border-accent/30'
                                  }`}>
                                    {order.status}
                                  </span>
                                </div>
                                <p className="text-[10px] font-bold text-text-muted mt-1.5 uppercase tracking-widest font-mono">
                                  ID: #{order._id.slice(-8)}
                                </p>
                              </div>

                              <div className="flex justify-between items-end mt-4 border-t border-border-subtle/50 pt-4">
                                 <p className="text-xs font-bold text-text-secondary bg-surface px-2 py-1 rounded">{order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}</p>
                                 <p className="text-xl font-black text-text-primary">{formatPrice(order.total || 0)}</p>
                              </div>
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
                        <div key={txn._id} className="bg-card-bg/50 backdrop-blur-xl rounded-[28px] border border-border-main overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-accent/60 relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div 
                              onClick={() => setExpandedTxnId(expandedTxnId === txn._id ? null : txn._id)}
                              className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between cursor-pointer relative z-10 gap-4"
                            >
                              <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner ${
                                  txn.status === 'Success' || txn.status === 'Paid' 
                                    ? 'bg-status-success/20 text-status-success border-status-success/30' 
                                    : txn.status === 'Failed' 
                                    ? 'bg-status-danger/20 text-status-danger border-status-danger/30' 
                                    : 'bg-status-warning/20 text-status-warning border-status-warning/30'
                                }`}>
                                  {txn.status === 'Success' || txn.status === 'Paid' ? <CheckCircle2 className="h-7 w-7" /> : txn.status === 'Failed' ? <X className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-3 mb-1">
                                    <p className="text-[10px] uppercase tracking-widest text-text-muted">Transaction ID</p>
                                  </div>
                                  <p className="text-base md:text-lg font-black text-text-primary uppercase tracking-tight truncate">#{txn._id.slice(-10)}</p>
                                  <p className="text-[11px] font-bold text-text-muted mt-1 uppercase tracking-widest">{new Date(txn.created_at).toLocaleString()} • {txn.payment_method}</p>
                                </div>
                              </div>
                              <div className="text-left md:text-right flex flex-col items-start md:items-end w-full md:w-auto pl-20 md:pl-0">
                                <p className="text-xl font-black text-text-primary">{formatPrice(txn.amount)}</p>
                                <p className={`text-[10px] font-black uppercase tracking-widest mt-1.5 border px-2 py-0.5 rounded inline-block ${
                                  txn.status === 'Success' || txn.status === 'Paid' 
                                    ? 'bg-status-success/10 text-status-success border-status-success/30' 
                                    : txn.status === 'Failed' 
                                    ? 'bg-status-danger/10 text-status-danger border-status-danger/30' 
                                    : 'bg-status-warning/10 text-status-warning border-status-warning/30'
                                }`}>{txn.status}</p>
                              </div>
                            </div>

                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'wishlist' && (
                <motion.div key="wishlist" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-3xl font-black text-text-primary tracking-tight">
                      My Wishlist <span className="text-text-muted text-lg font-bold">({wishlist.length})</span>
                    </h3>
                  </div>

                  {wishlist.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center text-center">
                      <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-6 border border-border-subtle shadow-inner">
                        <Heart className="w-10 h-10 text-text-muted opacity-50" />
                      </div>
                      <h4 className="text-2xl font-black text-text-primary mb-3">Your wishlist is empty</h4>
                      <p className="text-text-muted text-base font-medium mb-8 max-w-md">
                        Explore our awesome components and hit the heart icon to save them here for later!
                      </p>
                      <Link to="/products" className="px-8 py-4 bg-text-primary hover:bg-text-secondary text-white text-[12px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-black/10">
                        Explore Products
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                      {wishlist.map((product) => (
                        <div key={product._id} className="group flex flex-col bg-card-bg border border-border-subtle rounded-[24px] overflow-hidden hover:border-accent hover:shadow-[0_10px_40px_rgba(2,132,199,0.12)] hover:-translate-y-1 transition-all duration-300">
                          
                          {/* Image Box */}
                          <div className="relative aspect-[4/3] bg-app-bg flex items-center justify-center p-6 overflow-hidden">
                            {/* Floating Remove Button */}
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                toggleWishlist(product);
                              }} 
                              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card-bg/80 backdrop-blur-md flex items-center justify-center text-status-danger hover:bg-status-danger hover:text-white hover:scale-110 transition-all z-20 shadow-sm border border-white/10"
                              title="Remove from wishlist"
                            >
                              <Heart className="w-4 h-4 fill-current" />
                            </button>
                            
                            <Link to={`/product/${product.slug || product._id}`} className="absolute inset-0 flex items-center justify-center p-6 z-10">
                              <img src={product.image} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" alt={product.name} />
                            </Link>
                          </div>
                          
                          {/* Content */}
                          <div className="p-5 flex flex-col flex-1 border-t border-border-subtle/50">
                            <Link to={`/product/${product.slug || product._id}`} className="text-sm font-black text-text-primary leading-snug line-clamp-2 hover:text-accent transition-colors mb-2">
                              {product.name}
                            </Link>
                            
                            <div className="mt-auto pt-4 flex flex-col gap-3">
                              <p className="text-lg font-black text-accent tracking-tight">{formatPrice(product.price || 0)}</p>
                              
                              {(() => {
                                const cartItem = cartItems.find(item => item._id === product._id);
                                const quantityInCart = cartItem ? cartItem.quantity : 0;
                                
                                return quantityInCart > 0 ? (
                                  <div className="flex items-center justify-between bg-surface border border-border-subtle rounded-xl p-1 h-10 w-full">
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
                                      className="w-8 h-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-card-bg rounded-lg transition-colors text-sm font-black"
                                    >
                                      -
                                    </button>
                                    <span className="flex-1 text-center text-sm font-bold text-text-primary">
                                      {quantityInCart}
                                    </span>
                                    <button 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleWishlistUpdateQuantity(product._id, quantityInCart + 1);
                                      }}
                                      className="w-8 h-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-card-bg rounded-lg transition-colors text-sm font-black"
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => handleWishlistAddToCart(product)}
                                    className="w-full h-10 bg-accent/10 hover:bg-accent text-accent hover:text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                                  >
                                    <Package className="w-3.5 h-3.5" /> Move to Cart
                                  </button>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'addresses' && (
                <motion.div key="addresses" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="card rounded-[32px] p-6 md:p-10">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-border-subtle">
                      <h3 className="text-2xl font-black text-text-primary tracking-tight flex items-center gap-3">
                        <MapPin className="h-6 w-6 text-accent" /> Saved Addresses
                      </h3>
                      <button 
                        onClick={() => setShowAddAddress(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-accent/10 text-accent text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-accent hover:text-white transition-all"
                      >
                        <Plus className="w-4 h-4" /> Add New
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {addresses.map((addr) => {
                        // Attempt to parse the address string for cleaner display
                        const lines = addr.address.split('\n').filter(Boolean);
                        const name = lines.length > 0 ? lines[0] : '';
                        const phoneLine = lines.find(l => l.includes('Phone:')) || '';
                        const addressLines = lines.filter((l, i) => i !== 0 && !l.includes('Phone:')).join(', ');

                        return (
                          <div key={addr.id} className="group flex flex-col bg-app-bg border border-border-subtle rounded-2xl p-6 transition-all duration-300 hover:border-accent hover:shadow-lg relative overflow-hidden">
                            {/* Header row */}
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-text-secondary group-hover:text-accent group-hover:bg-accent/10 transition-colors">
                                  {addr.type.toLowerCase() === 'home' ? <MapPin className="w-5 h-5" /> : addr.type.toLowerCase() === 'work' ? <Package className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-base font-black text-text-primary capitalize">{name || 'Saved Address'}</h4>
                                    <span className="px-2 py-0.5 bg-surface-dark text-text-muted text-[9px] font-black uppercase tracking-widest rounded">
                                      {addr.type}
                                    </span>
                                  </div>
                                  <p className="text-xs font-bold text-text-muted mt-0.5">{phoneLine.replace('Phone:', '').trim() || 'No phone'}</p>
                                </div>
                              </div>
                              <button onClick={() => removeAddress(addr.id)} className="p-2 text-text-muted hover:text-status-danger hover:bg-status-danger/10 rounded-full transition-all">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            
                            {/* Address Body */}
                            <div className="bg-surface/50 p-4 rounded-xl flex-1 border border-border-subtle/50">
                              <p className="text-sm font-medium text-text-secondary leading-relaxed">
                                {addressLines || addr.address}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Empty State / Add Box */}
                      {addresses.length === 0 && (
                        <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-surface/30 rounded-2xl border-2 border-dashed border-border-subtle">
                          <MapPin className="w-12 h-12 text-text-muted opacity-30 mb-4" />
                          <p className="text-text-primary font-bold mb-2">No addresses saved yet</p>
                          <p className="text-text-muted text-xs mb-6">Add your home or work address for quicker checkout.</p>
                          <button 
                            onClick={() => setShowAddAddress(true)}
                            className="px-6 py-3 bg-text-primary text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-text-secondary transition-all"
                          >
                            Add Address
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'giftcards' && (
                <motion.div key="giftcards" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-3xl font-black text-text-primary tracking-tight flex items-center gap-3">
                      Gift Cards <span className="text-text-muted text-lg font-bold">Wallet</span>
                    </h3>
                  </div>

                  {/* Top Section: Balance & Redeem */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Wallet Balance Card - Theme Based */}
                    <div className="lg:col-span-1 bg-surface-dark rounded-[32px] p-8 border border-border-main shadow-lg relative overflow-hidden group">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
                      <div className="absolute top-0 right-0 w-40 h-40 bg-accent/20 blur-[60px] rounded-full pointer-events-none group-hover:bg-accent/30 transition-colors duration-700" />
                      
                      <div className="relative z-10 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-10">
                          <Gift className="w-8 h-8 text-accent" />
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20">Active</span>
                            <button onClick={handleRefreshWallet} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white" title="Refresh Balance">
                              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingWallet ? 'animate-spin' : ''}`} />
                            </button>
                          </div>
                        </div>
                        <div className="mt-auto">
                          <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1">Available Balance</p>
                          <h4 className="text-4xl font-black text-white tracking-tighter">{formatPrice(user.wallet_balance || 0)}</h4>
                          <p className="text-[10px] text-white/50 mt-3 font-medium">Use this balance at checkout</p>
                        </div>
                      </div>
                    </div>

                    {/* Redeem Section */}
                    <div className="lg:col-span-2 bg-card-bg rounded-[32px] p-8 border border-border-main flex flex-col justify-center shadow-sm">
                      <div className="mb-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                          <Ticket className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-text-primary">Redeem a Gift Card</h4>
                          <p className="text-sm font-medium text-text-muted mt-1">Got a gift card? Enter the code below to add it to your balance.</p>
                        </div>
                      </div>
                      
                      <form onSubmit={handleRedeemGiftCard} className="flex flex-col sm:flex-row gap-4 mt-2">
                        <input 
                          type="text" 
                          placeholder="Enter 16-digit alphanumeric code" 
                          value={giftCardCode}
                          onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                          className="flex-grow px-5 py-4 bg-app-bg border border-border-subtle rounded-xl text-sm font-bold outline-none focus:border-accent focus:ring-1 focus:ring-accent text-text-primary uppercase placeholder:normal-case transition-all"
                          required
                          maxLength="16"
                        />
                        <button disabled={isRedeemingGC} type="submit" className="px-8 py-4 bg-text-primary hover:bg-text-secondary text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-black/10 flex-shrink-0 disabled:opacity-50 flex items-center gap-2">
                          {isRedeemingGC ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          Redeem Now
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Bottom Section: Purchase / Send Gift Card */}
                  <div className="bg-card-bg rounded-[32px] p-6 md:p-10 border border-border-main relative overflow-hidden shadow-sm">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/5 blur-[100px] rounded-full pointer-events-none" />
                    
                    <div className="relative z-10">
                      <h4 className="text-2xl font-black text-text-primary mb-2">Send a Gift Card</h4>
                      <p className="text-sm font-medium text-text-muted mb-8 max-w-xl">The perfect gift for the tech enthusiast. Instantly email a digital gift card that they can use to buy any IoT component.</p>
                      
                      <form onSubmit={handlePurchaseGiftCard} className="space-y-8">
                        {/* Amounts */}
                        <div>
                          <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-4 ml-1">Select Amount</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {giftCardTiers.map((tier) => (
                              <label key={tier.pay} className="cursor-pointer group relative">
                                <input type="radio" name="gift_amount" value={tier.pay} onChange={() => setGiftForm({...giftForm, amount: tier.pay})} checked={Number(giftForm.amount) === tier.pay} className="peer hidden" />
                                <div className="py-4 text-center border-2 border-border-subtle rounded-2xl peer-checked:border-accent peer-checked:bg-accent/5 transition-all group-hover:border-accent/50 relative">
                                  {tier.label && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-status-success text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                                      {tier.label}
                                    </span>
                                  )}
                                  <div className="text-text-primary font-black text-lg">₹ {tier.pay}</div>
                                  {tier.get > tier.pay && (
                                    <div className="text-[10px] font-bold text-accent mt-0.5">Get ₹ {tier.get}</div>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Recipient Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2 ml-1">Recipient's Email</label>
                            <input 
                              type="email" 
                              required 
                              value={giftForm.recipient_email}
                              onChange={(e) => setGiftForm({...giftForm, recipient_email: e.target.value})}
                              placeholder="friend@example.com" 
                              className="w-full px-5 py-4 bg-app-bg border border-border-subtle rounded-xl text-sm font-medium outline-none focus:border-accent focus:ring-1 focus:ring-accent text-text-primary transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2 ml-1">Recipient's Name</label>
                            <input 
                              type="text" 
                              required 
                              value={giftForm.recipient_name}
                              onChange={(e) => setGiftForm({...giftForm, recipient_name: e.target.value})}
                              placeholder="John Doe" 
                              className="w-full px-5 py-4 bg-app-bg border border-border-subtle rounded-xl text-sm font-medium outline-none focus:border-accent focus:ring-1 focus:ring-accent text-text-primary transition-all"
                            />
                          </div>
                        </div>

                        {/* Message */}
                        <div>
                          <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2 ml-1">Personal Message (Optional)</label>
                          <textarea 
                            rows="3"
                            value={giftForm.message}
                            onChange={(e) => setGiftForm({...giftForm, message: e.target.value})}
                            placeholder="Happy Birthday! Buy yourself some cool IoT sensors!" 
                            className="w-full px-5 py-4 bg-app-bg border border-border-subtle rounded-xl text-sm font-medium outline-none focus:border-accent focus:ring-1 focus:ring-accent text-text-primary transition-all resize-none"
                          ></textarea>
                        </div>

                        <div className="pt-2">
                          <button disabled={isPurchasingGC} type="submit" className="w-full md:w-auto px-10 py-4 bg-accent hover:bg-accent-hover text-white text-[12px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-3 disabled:opacity-50">
                            {isPurchasingGC ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />} 
                            Buy Gift Card
                          </button>
                        </div>
                      </form>
                    </div>
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
                          <Link to={`/product/${product.slug || product._id}`} className="inline-block mt-4 text-[10px] font-black uppercase tracking-widest text-accent hover:underline">View Product</Link>
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
                  <div className="bg-card-bg border border-border-main rounded-[32px] p-6 md:p-10 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
                    <h3 className="text-xl md:text-2xl font-black text-text-primary tracking-tight flex items-center gap-3 mb-8 relative z-10">
                      <User className="h-6 w-6 text-accent" /> Personal Information
                    </h3>
                    <form className="space-y-6 max-w-2xl relative z-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative group mt-2">
                          <label className="absolute -top-2.5 left-4 px-2 bg-card-bg text-[10px] font-black uppercase tracking-widest text-text-secondary z-10">First Name</label>
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-accent transition-colors z-10">
                            <User className="w-5 h-5" />
                          </div>
                          <input 
                            type="text" 
                            value={profileData.first_name} 
                            onChange={(e) => setProfileData({...profileData, first_name: e.target.value})}
                            placeholder="e.g. John"
                            className="w-full relative z-0 bg-card-bg/50 border-2 border-border-subtle focus:border-accent text-text-primary font-bold rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-text-muted/50 hover:bg-card-bg" 
                          />
                        </div>
                        <div className="relative group mt-2">
                          <label className="absolute -top-2.5 left-4 px-2 bg-card-bg text-[10px] font-black uppercase tracking-widest text-text-secondary z-10">Last Name</label>
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-accent transition-colors z-10">
                            <User className="w-5 h-5 opacity-70" />
                          </div>
                          <input 
                            type="text" 
                            value={profileData.last_name} 
                            onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                            placeholder="e.g. Doe"
                            className="w-full relative z-0 bg-card-bg/50 border-2 border-border-subtle focus:border-accent text-text-primary font-bold rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-text-muted/50 hover:bg-card-bg" 
                          />
                        </div>
                        <div className="relative group mt-2">
                          <label className="absolute -top-2.5 left-4 px-2 bg-card-bg text-[10px] font-black uppercase tracking-widest text-text-secondary z-10">Phone Number</label>
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-accent transition-colors z-10">
                            <Phone className="w-5 h-5" />
                          </div>
                          <input 
                            type="tel" 
                            value={profileData.phone} 
                            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                            placeholder="+91 98765 43210"
                            className="w-full relative z-0 bg-card-bg/50 border-2 border-border-subtle focus:border-accent text-text-primary font-bold rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-text-muted/50 hover:bg-card-bg" 
                          />
                        </div>
                        <div className="relative group mt-2">
                          <label className="absolute -top-2.5 left-4 px-2 bg-card-bg text-[10px] font-black uppercase tracking-widest text-text-secondary z-10">Email Address (Read-Only)</label>
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted z-10">
                            <Mail className="w-5 h-5 opacity-70" />
                          </div>
                          <input 
                            type="email" 
                            defaultValue={user?.email} 
                            disabled 
                            className="w-full relative z-0 bg-card-bg/30 border-2 border-border-subtle/50 text-text-secondary font-bold rounded-2xl pl-12 pr-4 py-4 cursor-not-allowed" 
                          />
                        </div>
                      </div>
                      <div className="pt-6 border-b border-border-subtle pb-10">
                        <button 
                          type="button" 
                          onClick={handleProfileSave}
                          disabled={isSavingProfile}
                          className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-accent to-accent-hover text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:shadow-[0_0_30px_rgba(2,132,199,0.3)] transition-all hover:-translate-y-1 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                          {isSavingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                          {isSavingProfile ? 'Saving Details...' : 'Save Profile Details'}
                        </button>
                      </div>

                      <div className="pt-4">
                        <h4 className="text-xl font-black text-text-primary tracking-tight mb-6 flex items-center gap-2">
                          <Bell className="w-5 h-5 text-accent" /> Notification Preferences
                        </h4>
                        <div className="space-y-4 mb-8">
                          {/* Email Notifications Toggle */}
                          <div className="flex items-center justify-between p-4 rounded-xl border border-border-subtle bg-surface hover:border-border-main transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                                <Mail className="w-5 h-5" />
                              </div>
                              <div>
                                <h5 className="font-bold text-text-primary text-sm">Email Notifications</h5>
                                <p className="text-xs text-text-muted mt-0.5">Receive order updates and promotions via email</p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={profileData.email_notifications !== false} 
                                onChange={(e) => setProfileData({...profileData, email_notifications: e.target.checked})}
                              />
                              <div className="w-11 h-6 bg-surface-dark peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                            </label>
                          </div>
                          
                          {/* SMS Notifications Toggle */}
                          <div className="flex items-center justify-between p-4 rounded-xl border border-border-subtle bg-surface hover:border-border-main transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-status-success/10 flex items-center justify-center text-status-success">
                                <Phone className="w-5 h-5" />
                              </div>
                              <div>
                                <h5 className="font-bold text-text-primary text-sm">SMS Alerts</h5>
                                <p className="text-xs text-text-muted mt-0.5">Get delivery updates directly on your phone</p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={profileData.sms_notifications !== false} 
                                onChange={(e) => setProfileData({...profileData, sms_notifications: e.target.checked})}
                              />
                              <div className="w-11 h-6 bg-surface-dark peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-status-success/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-status-success"></div>
                            </label>
                          </div>
                        </div>
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
                <motion.div key="coupons" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <div className="card rounded-[32px] p-6 md:p-10">
                    <h3 className="heading-section flex items-center gap-3 mb-8">
                      <Ticket className="h-6 w-6 text-accent" /> My Coupons
                    </h3>
                    
                    <h4 className="text-sm font-black text-text-primary uppercase tracking-widest mb-6">Available For You</h4>
                    
                    {/* Coupon Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {availableCoupons.length > 0 ? availableCoupons.map((coupon, idx) => (
                        <div key={coupon._id} className="relative overflow-hidden bg-card-bg border border-border-main rounded-2xl group hover:border-accent transition-all duration-300 hover:shadow-[0_10px_30px_rgba(2,132,199,0.1)] flex">
                          {/* Left Side (Color bar) */}
                          <div className={`w-16 bg-gradient-to-b ${idx % 2 === 0 ? 'from-accent to-accent-hover' : 'from-status-success to-emerald-600'} flex items-center justify-center border-r border-dashed border-white/30 relative`}>
                             {/* Dotted cutouts */}
                             <div className="absolute -top-2 -right-2 w-4 h-4 bg-app-bg rounded-full border-b border-l border-border-main group-hover:border-accent transition-colors"></div>
                             <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-app-bg rounded-full border-t border-l border-border-main group-hover:border-accent transition-colors"></div>
                             
                             <div className="rotate-[-90deg] whitespace-nowrap text-white font-black text-[10px] uppercase tracking-[0.3em]">{coupon.code.substring(0, 10)}</div>
                          </div>
                          {/* Right Side (Content) */}
                          <div className="flex-1 p-5 flex flex-col justify-between">
                            <div>
                              <span className="inline-block px-2 py-0.5 bg-status-success/10 text-status-success text-[9px] font-black uppercase tracking-widest rounded mb-2">Active</span>
                              <h5 className="font-black text-text-primary text-lg mb-1">{coupon.discount_percentage}% Off</h5>
                              <p className="text-xs text-text-muted font-medium leading-relaxed mb-4">
                                {coupon.description || `Get ${coupon.discount_percentage}% off on your purchase.`}
                                {coupon.min_order_value > 0 && ` Min order: ₹${coupon.min_order_value}.`}
                                {coupon.max_discount_amount > 0 && ` Max discount: ₹${coupon.max_discount_amount}.`}
                              </p>
                            </div>
                            <div className="flex items-center justify-between mt-auto">
                              <div className={`border border-dashed px-4 py-2 rounded font-mono font-bold text-sm tracking-widest ${idx % 2 === 0 ? 'border-accent/50 bg-accent/5 text-accent' : 'border-status-success/50 bg-status-success/5 text-status-success'}`}>
                                {coupon.code}
                              </div>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(coupon.code);
                                  toast.success('Coupon code copied!');
                                }}
                                className={`text-[10px] font-black uppercase tracking-widest text-text-muted transition-colors ${idx % 2 === 0 ? 'hover:text-accent' : 'hover:text-status-success'}`}
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-surface/30 rounded-2xl border border-dashed border-border-main">
                          <Ticket className="w-12 h-12 text-text-muted opacity-30 mb-4" />
                          <p className="text-text-primary font-bold mb-2">No coupons available right now.</p>
                          <p className="text-text-muted text-xs">Check back later for exciting offers and discounts!</p>
                        </div>
                      )}

                    </div>
                  </div>
                </motion.div>
              )}

              {/* activeTab === 'giftcards' && (
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
              ) */}
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

      {/* Transaction Details Modal */}
      {createPortal(
        <AnimatePresence>
          {expandedTxnId && transactions.find(t => t._id === expandedTxnId) && (() => {
            const txn = transactions.find(t => t._id === expandedTxnId);
            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="bg-app-bg max-w-sm w-full rounded-[28px] border border-border-main shadow-2xl overflow-hidden"
                >
                  {/* Modal Header */}
                  <div className="p-5 flex justify-between items-center border-b border-border-subtle bg-card-bg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner ${
                        txn.status === 'Success' || txn.status === 'Paid' 
                          ? 'bg-status-success/20 text-status-success border-status-success/30' 
                          : txn.status === 'Failed' 
                          ? 'bg-status-danger/20 text-status-danger border-status-danger/30' 
                          : 'bg-status-warning/20 text-status-warning border-status-warning/30'
                      }`}>
                        {txn.status === 'Success' || txn.status === 'Paid' ? <CheckCircle2 className="h-5 w-5" /> : txn.status === 'Failed' ? <X className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">Receipt</h3>
                        <p className="text-[10px] font-bold text-text-muted mt-0.5 uppercase tracking-widest">Txn: #{txn._id.slice(-10)}</p>
                      </div>
                    </div>
                    <button onClick={() => setExpandedTxnId(null)} className="w-8 h-8 rounded-full bg-surface hover:bg-surface-hover flex items-center justify-center text-text-muted transition-colors shrink-0 ml-2">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-5 space-y-5">
                    <div className="flex justify-between items-end border-b border-border-subtle border-dashed pb-5">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1.5">Total Amount</p>
                        <p className="text-2xl font-black text-text-primary tracking-tighter">{formatPrice(txn.amount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1.5">Date & Time</p>
                        <p className="text-xs font-bold text-text-primary">{new Date(txn.created_at).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Payment Method</p>
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-accent" />
                          <p className="text-xs font-bold text-text-primary">{txn.payment_method}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Status</p>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border inline-block ${
                          txn.status === 'Success' || txn.status === 'Paid' 
                            ? 'bg-status-success/15 text-status-success border-status-success/30' 
                            : txn.status === 'Failed' 
                            ? 'bg-status-danger/15 text-status-danger border-status-danger/30' 
                            : 'bg-status-warning/15 text-status-warning border-status-warning/30'
                        }`}>
                          {txn.status}
                        </span>
                      </div>

                      {/* Additional Details from Associated Order */}
                      {(() => {
                        const relatedOrder = orders.find(o => o._id === txn.order_id);
                        if (!relatedOrder) return null;
                        
                        const totalItems = relatedOrder.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
                        
                        return (
                          <div className="col-span-2 pt-4 border-t border-border-subtle border-dashed">
                            <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-2">Order Info</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-[9px] font-bold text-text-muted uppercase mb-0.5">Total Items</p>
                                <p className="text-xs font-bold text-text-primary">{totalItems} {totalItems === 1 ? 'Product' : 'Products'}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold text-text-muted uppercase mb-0.5">Delivery</p>
                                <p className="text-xs font-bold text-text-primary">{relatedOrder.status}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="col-span-2 pt-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-1">Full Transaction ID</p>
                        <p className="text-[11px] font-medium text-text-secondary font-mono bg-surface px-2.5 py-2 rounded border border-border-subtle break-all">{txn._id}</p>
                      </div>
                      
                      <div className="col-span-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-1">Gateway Reference</p>
                        <p className="text-[11px] font-medium text-text-secondary font-mono bg-surface px-2.5 py-2 rounded border border-border-subtle break-all">{txn.payment_id || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-border-subtle bg-surface/50 text-center">
                    <button onClick={() => setExpandedTxnId(null)} className="w-full py-3.5 bg-text-primary text-white text-[11px] font-black rounded-xl uppercase tracking-widest hover:bg-text-secondary transition-all">
                      Close Details
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default UserProfile;
