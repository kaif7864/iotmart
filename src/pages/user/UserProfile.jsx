import React, { useState, useEffect } from 'react';
import { 
  User, Package, MapPin, Heart, LogOut, 
  ChevronRight, ExternalLink, Shield, Bell, 
  Settings, Clock, CreditCard, ChevronDown, Plus, 
  Trash2, Eye, LayoutDashboard, History, Download, Loader2, CheckCircle2, X, Ticket, Gift
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getOrdersByUser, getLiveTracking } from '../../services/api';
import OrderTimeline from '../../components/ui/OrderTimeline';
import { generateInvoice } from '../../utils/generateInvoice';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../context/WishlistContext';

const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", 
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", 
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const UserProfile = () => {
  const { handleAddToCart } = useCart();
  const { user, logout, addresses, addAddress, removeAddress, formatPrice, currency } = useAuth();
  const { wishlist, toggleWishlist } = useWishlist();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({ 
    type: 'Home', name: '', phone: '', pincode: '', state: '', city: '', house: '', area: '', landmark: '' 
  });
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  
  // Tracking State
  const [showTracking, setShowTracking] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

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

  useEffect(() => {
    const fetchOrders = async () => {
      if (user) {
        try {
          const data = await getOrdersByUser(user._id);
          setOrders(data);
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
  }, [user]);

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

  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'settings', label: 'My Profile', icon: User },
    { id: 'orders', label: 'Orders', icon: Package },
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
        <div className="bg-white rounded-[40px] shadow-xl border border-border-main overflow-hidden">
          
          {/* Profile Header Card */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 blur-[150px] rounded-full"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-accent flex items-center justify-center text-white font-black text-4xl shadow-xl shadow-accent/20 border-4 border-white/10">
              {user.name.charAt(0)}
            </div>
            <div className="flex-grow text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-3">
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase">{user.name}</h1>
                <span className="px-3 py-1 bg-card-bg/10 border border-card-bg/20 rounded-sm text-[10px] font-black text-white uppercase tracking-widest">
                  Verified Customer
                </span>
              </div>
              <p className="text-text-muted font-medium text-lg">{user.email}</p>
            </div>
            <button 
              onClick={logout}
              className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:border-red-500 hover:shadow-lg transition-all"
            >
              Log Out
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row min-h-[600px]">
            {/* Sidebar Navigation */}
            <aside className="w-full lg:w-72 flex-shrink-0 bg-slate-50/80 border-r border-slate-100 p-6">
              <nav className="space-y-2 sticky top-32">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-sm font-black transition-all ${
                      activeTab === tab.id 
                        ? 'bg-accent text-white shadow-lg shadow-accent/20' 
                        : 'text-text-secondary hover:bg-slate-100 hover:text-accent'
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span className="uppercase tracking-widest text-[10px]">{tab.label}</span>
                  </button>
                ))}
                
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-sm font-black transition-all text-red-500 hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="uppercase tracking-widest text-[10px]">Logout</span>
                  </button>
                </div>
              </nav>
            </aside>

            {/* Main Dashboard Content */}
            <main className="flex-grow p-6 md:p-10">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-10 rounded-[32px] border border-border-main shadow-sm space-y-10">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                    <h3 className="text-xl font-black text-text-primary uppercase tracking-tighter flex items-center gap-3">
                      <LayoutDashboard className="h-6 w-6 text-accent" /> Account Overview
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 relative overflow-hidden group">
                      <div className="absolute -right-6 -top-6 w-24 h-24 bg-accent/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Total Orders</p>
                        <Package className="h-5 w-5 text-accent" />
                      </div>
                      <h4 className="text-4xl font-black text-text-primary tracking-tighter relative z-10">{orders.length}</h4>
                    </div>
                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 relative overflow-hidden group">
                      <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Saved Items</p>
                        <Heart className="h-5 w-5 text-red-500" />
                      </div>
                      <h4 className="text-4xl font-black text-text-primary tracking-tighter relative z-10">{wishlist.length}</h4>
                    </div>
                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 relative overflow-hidden group">
                      <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Addresses</p>
                        <MapPin className="h-5 w-5 text-emerald-500" />
                      </div>
                      <h4 className="text-4xl font-black text-text-primary tracking-tighter relative z-10">{addresses.length}</h4>
                    </div>
                  </div>

                  <div className="pt-6">
                    <h3 className="text-lg font-black text-text-primary mb-6 uppercase tracking-tighter">Recent Order</h3>
                    {orders.length > 0 ? (
                      <div>
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-border-subtle">
                          <div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Order ID</p>
                            <p className="font-black text-text-primary uppercase">#{orders[0]._id.slice(-8)}</p>
                          </div>
                          <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-sm text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                            {orders[0].status}
                          </span>
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
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  {loading ? (
                    <div className="p-20 text-center"><Loader2 className="h-10 w-10 text-accent animate-spin mx-auto" /></div>
                  ) : expandedOrderId ? (
                    // Expanded Single Order View
                    orders.filter(o => o._id === expandedOrderId).map(order => (
                      <div key={order._id} className="bg-card-bg rounded-[32px] border border-border-main shadow-lg overflow-hidden transition-all">
                        {/* Header Section */}
                        <div className="bg-slate-50 border-b border-border-subtle p-8 relative">
                          <button onClick={() => setExpandedOrderId(null)} className="absolute top-8 left-6 p-3 bg-white border border-border-main hover:bg-slate-100 hover:scale-105 rounded-full transition-all flex items-center justify-center shadow-sm z-10" title="Back to Orders">
                            <ChevronDown className="h-5 w-5 rotate-90 text-text-primary" />
                          </button>
                          
                          <div className="flex flex-wrap justify-between items-center gap-6 pl-16">
                            <div className="flex items-center gap-6">
                              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-accent border border-border-main shadow-sm">
                                <Package className="h-7 w-7" />
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Order ID</p>
                                <p className="font-black text-text-primary uppercase tracking-tight text-lg">#{order._id.slice(-12)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Total Value</p>
                              <p className="text-2xl font-black text-accent tracking-tighter">{formatPrice(order.total || 0)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Items Section */}
                        <div className="p-8 pb-4">
                          <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4">Purchased Items</h4>
                          <div className="space-y-3">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                  <div className="w-2 h-2 rounded-full bg-accent"></div>
                                  <span className="text-sm font-bold text-text-primary uppercase tracking-tight">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-6">
                                  <span className="text-xs font-black text-text-muted bg-slate-50 px-3 py-1 rounded-full">Qty: {item.quantity}</span>
                                  <span className="text-sm font-black text-text-secondary min-w-[80px] text-right">{formatPrice(item.price * item.quantity)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Timeline & Actions Section */}
                        <div className="p-8 pt-4">
                          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm mb-6 w-full">
                            <OrderTimeline status={order.status} />
                          </div>
                          
                          <div className="flex flex-wrap gap-4 justify-end">
                            {order.tracking_id && (
                              <button 
                                onClick={() => handleTrackShipment(order.tracking_id)}
                                className="flex items-center justify-center gap-2 px-8 py-4 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-100 transition-all shadow-sm border border-emerald-100"
                              >
                                <MapPin className="h-4 w-4" /> Track Live
                              </button>
                            )}
                            <button 
                              onClick={() => generateInvoice(order, user, currency)}
                              className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-900/20"
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
                            <div className="w-12 h-12 bg-app-bg rounded-xl flex items-center justify-center text-accent border border-border-subtle group-hover:scale-110 transition-transform">
                              <Package className="h-5 w-5" />
                            </div>
                            <span className={`px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest ${
                              order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="mb-4">
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Order ID</p>
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

              {activeTab === 'wishlist' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
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
                            <button 
                              onClick={() => handleAddToCart(product)}
                              className="px-4 py-2 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:shadow-lg hover:shadow-accent/20 transition-all"
                            >
                              Add to Cart
                            </button>
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
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
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
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                  <div className="bg-white p-10 rounded-[32px] border border-border-main shadow-sm">
                    <h3 className="text-xl font-black text-text-primary mb-8 uppercase tracking-tighter flex items-center gap-3">
                      <User className="h-6 w-6 text-accent" /> Personal Information
                    </h3>
                    <form className="space-y-6 max-w-2xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 block">Full Name</label>
                          <input type="text" defaultValue={user?.name} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:border-accent outline-none" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 block">Email Address</label>
                          <input type="email" defaultValue={user?.email} disabled className="w-full p-4 bg-slate-100 border border-slate-200 rounded-xl font-bold text-text-muted cursor-not-allowed outline-none" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 block">Gender</label>
                          <div className="flex items-center gap-6 mt-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="gender" value="male" className="accent-accent" />
                              <span className="text-sm font-bold text-text-primary">Male</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="gender" value="female" className="accent-accent" />
                              <span className="text-sm font-bold text-text-primary">Female</span>
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="pt-4 border-b border-border-main pb-8">
                        <button type="button" className="px-8 py-4 bg-accent text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-accent/90 transition-all shadow-lg shadow-accent/20">
                          Save Information
                        </button>
                      </div>

                      <div className="pt-4">
                        <h4 className="text-lg font-black text-text-primary mb-6 uppercase tracking-tighter">PAN Card Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                          <div>
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 block">PAN Card Number</label>
                            <input type="text" placeholder="ABCDE1234F" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:border-accent outline-none uppercase" />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 block">Full Name on PAN</label>
                            <input type="text" placeholder="Enter name as on PAN" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:border-accent outline-none" />
                          </div>
                        </div>
                        <button type="button" className="px-8 py-4 border-2 border-border-main text-text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-accent hover:text-accent transition-all">
                          Upload & Verify PAN
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                  <div className="bg-white p-10 rounded-[32px] border border-border-main shadow-sm">
                    <h3 className="text-xl font-black text-text-primary mb-8 uppercase tracking-tighter flex items-center gap-3">
                      <Bell className="h-6 w-6 text-accent" /> Notification Preferences
                    </h3>
                    <div className="space-y-4 max-w-2xl">
                      {[
                        { title: 'Order Updates', desc: 'Get notified when your order status changes' },
                        { title: 'Restock Alerts', desc: 'Be the first to know when items in your wishlist are back' },
                        { title: 'Promotional Offers', desc: 'Receive exclusive discounts and tech news' }
                      ].map((pref, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <div>
                            <p className="font-bold text-text-primary">{pref.title}</p>
                            <p className="text-xs text-text-muted mt-1">{pref.desc}</p>
                          </div>
                          <div className="w-12 h-6 bg-accent rounded-full relative cursor-pointer shadow-inner">
                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'payments' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                  <div className="bg-white p-10 rounded-[32px] border border-border-main shadow-sm">
                    <h3 className="text-xl font-black text-text-primary mb-8 uppercase tracking-tighter flex items-center gap-3">
                      <CreditCard className="h-6 w-6 text-accent" /> Payment Methods
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                      <div className="p-6 bg-slate-900 rounded-2xl text-white relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all">
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full"></div>
                        <div className="flex justify-between items-start mb-8 relative z-10">
                          <CreditCard className="h-8 w-8 text-white/80" />
                          <span className="text-[10px] font-black tracking-widest bg-white/10 px-3 py-1 rounded-lg">VISA</span>
                        </div>
                        <div className="relative z-10">
                          <p className="font-mono text-lg tracking-widest mb-2 opacity-90">•••• •••• •••• 4242</p>
                          <div className="flex justify-between items-center text-xs opacity-70">
                            <span className="uppercase font-bold tracking-widest">{user?.name}</span>
                            <span>12/28</span>
                          </div>
                        </div>
                      </div>
                      
                      <button className="p-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-text-muted hover:border-accent hover:text-accent hover:bg-accent/5 transition-all min-h-[160px]">
                        <Plus className="h-8 w-8 mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Add New Card</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                  <div className="bg-white p-10 rounded-[32px] border border-border-main shadow-sm">
                    <h3 className="text-xl font-black text-text-primary mb-8 uppercase tracking-tighter flex items-center gap-3">
                      <Shield className="h-6 w-6 text-emerald-500" /> Account Security
                    </h3>
                    
                    <div className="space-y-8 max-w-2xl">
                      <div className="grid grid-cols-1 gap-6">
                        <div className="p-6 border border-slate-100 rounded-2xl bg-slate-50 flex items-center justify-between shadow-sm">
                          <div>
                            <p className="font-black text-text-primary uppercase tracking-tight mb-1">Password</p>
                            <p className="text-xs text-text-muted">Last changed 3 months ago</p>
                          </div>
                          <button type="button" className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-accent hover:text-accent transition-all shadow-sm">
                            Update
                          </button>
                        </div>
                        <div className="p-6 border border-emerald-100 rounded-2xl bg-emerald-50 flex items-center justify-between shadow-sm">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-black text-emerald-700 uppercase tracking-tight text-sm">Two-Factor Auth</p>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded text-[8px] font-black uppercase tracking-widest">Active</span>
                            </div>
                            <p className="text-xs text-emerald-600/80 font-medium">Protected by authenticator app.</p>
                          </div>
                          <button type="button" className="px-6 py-3 bg-white border border-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-100 transition-all shadow-sm">
                            Manage
                          </button>
                        </div>
                      </div>

                      <div className="pt-8 mt-8 border-t border-border-main">
                        <h4 className="text-lg font-black text-status-danger mb-4 uppercase tracking-tighter">Danger Zone</h4>
                        <p className="text-text-muted text-sm mb-6 leading-relaxed">Deactivating your account will remove all your data, order history, and saved addresses permanently. This action cannot be undone.</p>
                        <button type="button" className="px-8 py-4 bg-red-50 text-status-danger rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100 hover:border-red-500">
                          Deactivate Account
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'coupons' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                  <div className="bg-white p-10 rounded-[32px] border border-border-main shadow-sm">
                    <h3 className="text-xl font-black text-text-primary mb-8 uppercase tracking-tighter flex items-center gap-3">
                      <Ticket className="h-6 w-6 text-accent" /> My Coupons
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                      <div className="p-6 border-2 border-dashed border-emerald-500/30 bg-emerald-50 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="font-black text-emerald-700 uppercase tracking-tight text-lg mb-1">IOTMART10</p>
                          <p className="text-xs text-emerald-600/80 font-medium">10% off your entire order</p>
                        </div>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">Active</span>
                      </div>
                      <div className="p-6 border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl flex items-center justify-between opacity-50">
                        <div>
                          <p className="font-black text-slate-700 uppercase tracking-tight text-lg mb-1">WELCOME5</p>
                          <p className="text-xs text-slate-600/80 font-medium">Flat 5% discount (Used)</p>
                        </div>
                        <span className="px-3 py-1 bg-slate-200 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">Expired</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'giftcards' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                  <div className="bg-white p-10 rounded-[32px] border border-border-main shadow-sm flex flex-col items-center justify-center text-center py-20">
                    <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center text-accent mb-6">
                      <Gift className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-black text-text-primary mb-2 uppercase tracking-tighter">No Gift Cards</h3>
                    <p className="text-text-muted max-w-sm mb-8">You don't have any active gift cards. Purchase one for a friend or redeem a code below.</p>
                    <button className="px-8 py-4 bg-accent text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-accent/90 transition-all shadow-lg shadow-accent/20">
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
      {/* Add Address Modal */}
      <AnimatePresence>
        {showAddAddress && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-surface-dark/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-card-bg w-full max-w-lg rounded-[40px] shadow-2xl relative overflow-hidden">
              <button onClick={() => setShowAddAddress(false)} className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-all z-50">
                <X className="h-5 w-5 text-text-primary" />
              </button>
              
              <div className="p-10 max-h-[90vh] overflow-y-auto scrollbar-hide">
                <h3 className="text-2xl font-black text-text-primary mb-8 uppercase tracking-tighter">New Shipping Address</h3>
              <form onSubmit={handleAddAddress} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2">Full Name</label>
                    <input required type="text" value={newAddr.name} onChange={(e) => setNewAddr({...newAddr, name: e.target.value})} className="w-full px-5 py-3 bg-app-bg border border-border-main rounded-sm text-sm font-medium outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2">Phone Number</label>
                    <input 
                      required type="tel" 
                      maxLength="10"
                      value={newAddr.phone} 
                      onChange={(e) => setNewAddr({...newAddr, phone: e.target.value.replace(/\D/g, '')})} 
                      className={`w-full px-5 py-3 bg-app-bg border ${newAddr.phone && newAddr.phone.length !== 10 ? 'border-status-danger' : 'border-border-main'} rounded-sm text-sm font-medium outline-none focus:border-accent`} 
                    />
                    {newAddr.phone && newAddr.phone.length !== 10 && <p className="text-status-danger text-[10px] font-bold mt-1">Must be exactly 10 digits</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2">Pincode</label>
                    <input 
                      required type="text" 
                      maxLength="6"
                      value={newAddr.pincode} 
                      onChange={(e) => setNewAddr({...newAddr, pincode: e.target.value.replace(/\D/g, '')})} 
                      className={`w-full px-5 py-3 bg-app-bg border ${newAddr.pincode && newAddr.pincode.length !== 6 ? 'border-status-danger' : 'border-border-main'} rounded-sm text-sm font-medium outline-none focus:border-accent`} 
                    />
                    {newAddr.pincode && newAddr.pincode.length !== 6 && <p className="text-status-danger text-[10px] font-bold mt-1">Must be exactly 6 digits</p>}
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2">State</label>
                    <select 
                      required 
                      value={newAddr.state} 
                      onChange={(e) => setNewAddr({...newAddr, state: e.target.value})} 
                      className="w-full px-5 py-3 bg-app-bg border border-border-main rounded-sm text-sm font-medium outline-none focus:border-accent"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2">City / District / Town</label>
                  <input required type="text" value={newAddr.city} onChange={(e) => setNewAddr({...newAddr, city: e.target.value})} className="w-full px-5 py-3 bg-app-bg border border-border-main rounded-sm text-sm font-medium outline-none focus:border-accent" />
                </div>

                <div>
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2">House No., Building, Company, Apartment</label>
                  <input required type="text" value={newAddr.house} onChange={(e) => setNewAddr({...newAddr, house: e.target.value})} className="w-full px-5 py-3 bg-app-bg border border-border-main rounded-sm text-sm font-medium outline-none focus:border-accent" />
                </div>

                <div>
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2">Area, Street, Sector, Village</label>
                  <input required type="text" value={newAddr.area} onChange={(e) => setNewAddr({...newAddr, area: e.target.value})} className="w-full px-5 py-3 bg-app-bg border border-border-main rounded-sm text-sm font-medium outline-none focus:border-accent" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2">Landmark (Optional)</label>
                    <input type="text" value={newAddr.landmark} onChange={(e) => setNewAddr({...newAddr, landmark: e.target.value})} className="w-full px-5 py-3 bg-app-bg border border-border-main rounded-sm text-sm font-medium outline-none focus:border-accent" />
                  </div>
                  <div>
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2">Address Type</label>
                  <select 
                    value={newAddr.type}
                    onChange={(e) => setNewAddr({...newAddr, type: e.target.value})}
                    className="w-full px-5 py-3 bg-app-bg border border-border-main rounded-sm text-sm font-bold outline-none"
                  >
                    <option>Home</option>
                    <option>Lab / Office</option>
                    <option>Warehouse</option>
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full btn-premium py-4 text-sm font-black uppercase tracking-widest shadow-xl shadow-accent/20">
                  Save Address
                </button>
              </div>
              </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Tracking Modal */}
      <AnimatePresence>
        {showTracking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-surface-dark/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-card-bg w-full max-w-lg rounded-[40px] shadow-2xl relative overflow-hidden">
              <button onClick={() => setShowTracking(false)} className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-all z-50">
                <X className="h-5 w-5 text-text-primary" />
              </button>
              
              <div className="p-10 max-h-[80vh] overflow-y-auto scrollbar-hide">
                <div className="mb-10 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-sm flex items-center justify-center mx-auto mb-6 text-emerald-500">
                  <MapPin className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-black text-text-primary uppercase tracking-tighter">Live Tracking</h3>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-2">Powered by Shiprocket</p>
              </div>

              {trackingLoading ? (
                <div className="py-20 flex justify-center"><Loader2 className="h-10 w-10 text-accent animate-spin" /></div>
              ) : trackingData ? (
                <div>
                  <div className="bg-app-bg p-6 rounded-sm border border-border-subtle mb-8 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Current Status</p>
                      <p className="text-sm font-black text-accent uppercase tracking-tight">{trackingData.current_status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Estimated Arrival</p>
                      <p className="text-sm font-black text-text-primary uppercase tracking-tight">{trackingData.estimated_delivery}</p>
                    </div>
                  </div>

                  <div className="relative pl-8 space-y-8 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-[2px] before:bg-slate-200">
                    {trackingData.scans?.map((scan, idx) => (
                      <div key={idx} className="relative">
                        {/* Timeline Dot */}
                        <div className={`absolute -left-[35.5px] top-1 w-5 h-5 rounded-full border-4 border-white shadow-sm z-10 flex items-center justify-center ${idx === 0 ? 'bg-accent text-white' : 'bg-slate-300'}`}>
                        </div>
                        
                        {/* Scan Content */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow ml-4">
                          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                            <span className="font-black text-text-primary text-xs uppercase tracking-widest">{scan.location}</span>
                            <time className="text-[10px] font-black text-accent uppercase bg-accent/10 px-3 py-1 rounded-full">{scan.date}</time>
                          </div>
                          <p className="text-sm text-text-secondary font-medium leading-relaxed">{scan.activity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 bg-red-50 text-status-danger rounded-sm text-sm font-bold">
                  Failed to fetch tracking data. Please try again.
                </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserProfile;
