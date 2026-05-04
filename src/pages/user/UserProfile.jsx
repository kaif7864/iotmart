import React, { useState, useEffect } from 'react';
import { 
  User, Package, MapPin, Heart, LogOut, 
  ChevronRight, ExternalLink, Shield, Bell, 
  Settings, Clock, CreditCard, ChevronDown, Plus, 
  Trash2, Eye, LayoutDashboard, History
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getOrdersByUser } from '../../services/api';
import OrderTimeline from '../../components/OrderTimeline';
import { motion, AnimatePresence } from 'framer-motion';

const UserProfile = ({ onAddToCart }) => {
  const { user, logout, wishlist, toggleWishlist, addresses, addAddress, removeAddress, formatPrice } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({ type: 'Home', address: '' });
  const [recentlyViewed, setRecentlyViewed] = useState([]);

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
    if (newAddr.address.trim()) {
      addAddress({ ...newAddr, id: Date.now() });
      setNewAddr({ type: 'Home', address: '' });
      setShowAddAddress(false);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Deployments', icon: Package },
    { id: 'wishlist', label: 'Favorites', icon: Heart },
    { id: 'addresses', label: 'Nodes', icon: MapPin },
    { id: 'recent', label: 'History', icon: History },
  ];

  if (!user) {
    return (
      <div className="pt-48 pb-32 min-h-screen text-center bg-slate-50">
        <h2 className="text-3xl font-black text-text-primary mb-6 uppercase tracking-tighter">Unauthorized Access</h2>
        <p className="text-text-muted mb-10 max-w-sm mx-auto font-medium">Authentication required to access the control center.</p>
        <Link to="/login" className="btn-premium px-10 py-4 text-xs">Initialize Session</Link>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-32 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Profile Header Card */}
        <div className="bg-slate-900 rounded-[40px] p-8 md:p-12 mb-10 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 blur-[150px] rounded-full"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-accent flex items-center justify-center text-white font-black text-4xl shadow-xl shadow-accent/20 border-4 border-white/10">
              {user.name.charAt(0)}
            </div>
            <div className="flex-grow text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-3">
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase">{user.name}</h1>
                <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-[10px] font-black text-white uppercase tracking-widest">
                  Verified Engineer
                </span>
              </div>
              <p className="text-slate-400 font-medium text-lg">{user.email}</p>
            </div>
            <button 
              onClick={logout}
              className="px-8 py-4 bg-white/10 border border-white/20 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:border-red-500 transition-all"
            >
              Terminate Session
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar Navigation */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-[32px] p-6 border border-border-main shadow-sm sticky top-32">
              <nav className="space-y-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all ${
                      activeTab === tab.id 
                        ? 'bg-accent text-white shadow-lg shadow-accent/20' 
                        : 'text-text-secondary hover:bg-slate-50 hover:text-accent'
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span className="uppercase tracking-widest text-[10px]">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Dashboard Content */}
          <main className="flex-grow">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-[32px] border border-border-main shadow-sm">
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4">Total Orders</p>
                      <h4 className="text-4xl font-black text-text-primary tracking-tighter">{orders.length}</h4>
                    </div>
                    <div className="bg-white p-8 rounded-[32px] border border-border-main shadow-sm">
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4">Saved Items</p>
                      <h4 className="text-4xl font-black text-text-primary tracking-tighter">{wishlist.length}</h4>
                    </div>
                    <div className="bg-white p-8 rounded-[32px] border border-border-main shadow-sm">
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4">Saved Nodes</p>
                      <h4 className="text-4xl font-black text-text-primary tracking-tighter">{addresses.length}</h4>
                    </div>
                  </div>

                  <div className="bg-white p-10 rounded-[32px] border border-border-main shadow-sm">
                    <h3 className="text-xl font-black text-text-primary mb-8 uppercase tracking-tighter">Recent Deployment</h3>
                    {orders.length > 0 ? (
                      <div>
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                          <div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Order ID</p>
                            <p className="font-black text-text-primary uppercase">#{orders[0]._id.slice(-8)}</p>
                          </div>
                          <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                            {orders[0].status}
                          </span>
                        </div>
                        <OrderTimeline status={orders[0].status} />
                      </div>
                    ) : (
                      <p className="text-text-muted text-sm italic">No deployments found in your history.</p>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'orders' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  {loading ? (
                    <div className="p-20 text-center"><Loader2 className="h-10 w-10 text-accent animate-spin mx-auto" /></div>
                  ) : orders.map((order) => (
                    <div key={order._id} className="bg-white rounded-[32px] border border-border-main shadow-sm overflow-hidden hover:shadow-lg transition-all">
                      <div className="p-8 border-b border-slate-100 bg-slate-50 flex flex-wrap justify-between items-center gap-6">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-accent border border-border-main">
                            <Package className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Deployment Hash</p>
                            <p className="font-black text-text-primary uppercase tracking-tight">#{order._id.slice(-12)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Total Value</p>
                          <p className="text-xl font-black text-accent tracking-tighter">{formatPrice(order.total || 0)}</p>
                        </div>
                      </div>
                      <div className="p-8">
                        <div className="space-y-4 mb-8">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <span className="text-sm font-bold text-text-primary uppercase tracking-tight">{item.name} <span className="text-text-muted ml-2">x{item.quantity}</span></span>
                              <span className="text-sm font-black text-text-secondary">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-8 border-t border-slate-50">
                          <OrderTimeline status={order.status} />
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'wishlist' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {wishlist.map((product) => (
                      <div key={product._id} className="bg-white p-6 rounded-[32px] border border-border-main flex items-center gap-6 group hover:shadow-lg transition-all">
                        <div className="w-24 h-24 bg-slate-50 rounded-2xl p-4 flex-shrink-0 border border-slate-100">
                          <img src={product.image} className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-black text-text-primary text-sm uppercase tracking-tight line-clamp-1">{product.name}</h4>
                          <p className="text-lg font-black text-accent mt-1">{formatPrice(product.price || 0)}</p>
                          <div className="flex gap-2 mt-4">
                            <Link to={`/product/${product._id}`} className="px-4 py-2 bg-slate-50 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all border border-border-main">View</Link>
                            <button 
                              onClick={() => onAddToCart(product)}
                              className="px-4 py-2 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-lg hover:shadow-accent/20 transition-all"
                            >
                              Deploy
                            </button>
                            <button onClick={() => toggleWishlist(product)} className="px-2 py-2 text-text-muted hover:text-red-500 transition-all">
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
                      <div key={addr.id} className="bg-white p-8 rounded-[32px] border border-border-main relative group">
                        <div className="flex justify-between items-start mb-4">
                          <span className="px-3 py-1 bg-slate-50 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-100">{addr.type}</span>
                          <button onClick={() => removeAddress(addr.id)} className="p-2 text-text-muted hover:text-red-500 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm font-medium text-text-secondary leading-relaxed">{addr.address}</p>
                      </div>
                    ))}
                    <button 
                      onClick={() => setShowAddAddress(true)}
                      className="border-2 border-dashed border-slate-200 rounded-[32px] p-8 flex flex-col items-center justify-center gap-3 text-text-muted hover:border-accent hover:text-accent transition-all bg-white/50"
                    >
                      <Plus className="h-8 w-8" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Initialize New Node</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'recent' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {recentlyViewed.length > 0 ? recentlyViewed.map((product) => (
                      <div key={product._id} className="bg-white p-6 rounded-[32px] border border-border-main flex items-center gap-6 group hover:shadow-lg transition-all">
                        <div className="w-24 h-24 bg-slate-50 rounded-2xl p-4 flex-shrink-0">
                          <img src={product.image} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-black text-text-primary text-sm uppercase tracking-tight line-clamp-1">{product.name}</h4>
                          <p className="text-lg font-black text-accent mt-1">{formatPrice(product.price || 0)}</p>
                          <Link to={`/product/${product._id}`} className="inline-block mt-4 text-[10px] font-black uppercase tracking-widest text-accent hover:underline">Re-examine</Link>
                        </div>
                      </div>
                    )) : (
                      <p className="text-text-muted italic text-sm p-10 bg-white rounded-3xl border border-dashed border-border-main text-center col-span-full">Your research history is clean.</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Add Address Modal */}
      <AnimatePresence>
        {showAddAddress && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white w-full max-w-lg rounded-[40px] p-10 shadow-2xl relative">
              <button onClick={() => setShowAddAddress(false)} className="absolute top-8 right-8 p-2 hover:bg-slate-50 rounded-full transition-all">
                <X className="h-5 w-5" />
              </button>
              <h3 className="text-2xl font-black text-text-primary mb-8 uppercase tracking-tighter">New Shipping Node</h3>
              <form onSubmit={handleAddAddress} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-3">Node Label</label>
                  <select 
                    value={newAddr.type}
                    onChange={(e) => setNewAddr({...newAddr, type: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border border-border-main rounded-2xl text-sm font-bold outline-none"
                  >
                    <option>Home</option>
                    <option>Lab / Office</option>
                    <option>Warehouse</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-3">Coordinate Address</label>
                  <textarea 
                    rows="4"
                    value={newAddr.address}
                    onChange={(e) => setNewAddr({...newAddr, address: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border border-border-main rounded-2xl text-sm font-medium outline-none focus:border-accent"
                    placeholder="Enter complete shipping coordinates..."
                  />
                </div>
                <button type="submit" className="w-full btn-premium py-5 text-sm font-black uppercase tracking-widest shadow-xl shadow-accent/20">
                  Deploy Node
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
