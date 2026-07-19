import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, Menu, Search, CircuitBoard, 
  User, ShieldCheck, Mic, MicOff, X, ArrowRight, Loader2, Cpu,
  Bell, BellRing, Info, AlertTriangle, Download
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getProducts } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../hooks/useCart';
import { usePWAInstall } from '../../hooks/usePWAInstall';

const Navbar = () => {
  const { isInstallable, triggerInstall } = usePWAInstall();
  const { user, isAdmin, currency, changeCurrency, notifications, markAllRead } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const searchRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const data = await getProducts();
        setAllProducts(data);
      } catch (e) {
        console.error("Failed to fetch products for search");
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 1) {
      const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery, allProducts]);

  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      handleSearchSubmit(transcript);
    };
    recognition.start();
  };

  const handleSearchSubmit = (query = searchQuery) => {
    if (query.trim()) {
      navigate(`/shop?search=${encodeURIComponent(query)}`);
      setSearchQuery('');
      setSuggestions([]);
    }
  };

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-7xl z-[100] bg-card-bg/75 backdrop-blur-2xl border border-border-main/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 group-hover:rotate-12 transition-transform duration-500">
                <CircuitBoard className="h-6 w-6 text-white" />
              </div>
              <span className="font-black text-2xl tracking-tighter text-text-primary uppercase hidden sm:block">
                IoT<span className="text-accent">Mart</span>
              </span>
            </Link>
          </div>
          
          {/* Main Search Bar (Desktop) */}
          <div className="hidden lg:flex flex-1 max-w-xl mx-12 relative" ref={searchRef}>
            <div className="relative w-full group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within:text-accent transition-colors" />
              <input 
                type="text" 
                placeholder="Search high-performance components..." 
                className="w-full pl-14 pr-24 py-3.5 bg-app-bg border border-border-main rounded-full text-sm font-bold text-text-primary focus:outline-none focus:border-accent focus:bg-card-bg focus:ring-4 focus:ring-accent/5 transition-all shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button 
                  onClick={startVoiceSearch}
                  className={`p-2 rounded-full transition-all ${isListening ? 'bg-status-danger text-white animate-pulse' : 'bg-card-bg text-text-muted hover:text-accent border border-border-subtle shadow-sm'}`}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Smart Suggestions Dropdown */}
            <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 w-full mt-3 bg-card-bg border border-border-main rounded-[24px] shadow-2xl shadow-slate-200/50 overflow-hidden z-[110]"
                >
                  <div className="p-3 border-b border-border-subtle bg-app-bg/50">
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] px-3">Instant Results</p>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {suggestions.map((p) => (
                      <button 
                        key={p._id}
                        onClick={() => {
                          navigate(`/product/${p.slug || p._id}`);
                          setSearchQuery('');
                          setSuggestions([]);
                        }}
                        className="w-full flex items-center gap-4 p-4 hover:bg-app-bg transition-all border-b border-border-subtle last:border-none group text-left"
                      >
                        <div className="w-12 h-12 bg-surface-hover rounded-sm overflow-hidden p-2 flex-shrink-0">
                          <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-grow">
                          <p className="text-xs font-black text-text-primary group-hover:text-accent transition-colors line-clamp-1 uppercase tracking-tight">{p.name}</p>
                          <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-1">{p.category}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-lab-text group-hover:text-accent group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3 sm:gap-6">
            
            {/* Currency Switcher */}
            {/* <div className="hidden md:block">
              <select 
                onChange={(e) => changeCurrency(e.target.value)}
                value={currency?.code || 'INR'}
                className="bg-transparent text-[10px] font-black text-text-muted uppercase tracking-[0.2em] focus:outline-none cursor-pointer hover:text-accent transition-colors border-none"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div> */}

            <div className="h-6 w-[1px] bg-surface-hover mx-1 hidden sm:block"></div>

            {/* Install App Button */}
            {isInstallable && (
              <button 
                onClick={triggerInstall}
                className="hidden md:flex items-center gap-2 px-5 py-2 bg-accent hover:bg-accent-light text-white rounded-full font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-accent/20"
              >
                <Download className="h-4 w-4" /> Install App
              </button>
            )}

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => { setIsNotifOpen(!isNotifOpen); markAllRead(); }}
                className="p-3 bg-app-bg rounded-xl border border-border-main hover:bg-card-bg hover:border-accent transition-all shadow-sm relative group"
              >
                <Bell className={`h-5 w-5 ${notifications.some(n => !n.read) ? 'text-accent' : 'text-text-secondary'} group-hover:text-accent transition-colors`} />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-accent rounded-full border-2 border-card-bg animate-pulse"></span>
                )}
              </button>
              
              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="fixed left-4 right-4 top-20 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-80 bg-card-bg border border-border-main rounded-[24px] shadow-2xl overflow-hidden z-[110]"
                  >
                    <div className="p-5 border-b border-border-subtle bg-app-bg/50 flex justify-between items-center">
                      <p className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em]">Notifications</p>
                      <button onClick={() => setIsNotifOpen(false)} className="text-text-muted hover:text-accent"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? notifications.map((n) => (
                        <div key={n.id} className="p-5 border-b border-border-subtle hover:bg-app-bg transition-all flex gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'warning' ? 'bg-status-warning-bg text-status-warning-text' : 'bg-status-info-bg text-accent'}`}>
                            {n.type === 'warning' ? <AlertTriangle className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="text-xs font-black text-text-primary uppercase tracking-tight leading-tight">{n.title}</p>
                            <p className="text-[10px] text-text-secondary mt-1 font-medium leading-relaxed">{n.message}</p>
                            <p className="text-[8px] text-text-muted font-bold uppercase mt-2">{n.time}</p>
                          </div>
                        </div>
                      )) : (
                        <div className="p-10 text-center text-text-muted italic text-[10px] uppercase font-black">All systems nominal</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart Icon */}
            <Link to="/cart" className="relative group p-3 bg-app-bg rounded-xl border border-border-main hover:bg-card-bg hover:border-accent transition-all shadow-sm">
              <ShoppingCart className="h-5 w-5 text-text-secondary group-hover:text-accent transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] font-black text-white bg-accent rounded-full border-2 border-card-bg shadow-lg">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Profile / Login */}
            {user ? (
              <div className="flex items-center gap-3">
                {/* <Link to="/devices" className="hidden sm:flex items-center gap-2 p-3 bg-app-bg rounded-sm text-text-primary hover:text-accent transition-all border border-border-main shadow-sm">
                  <Cpu className="h-4 w-4" />
                  <span className="text-[9px] font-black uppercase tracking-widest">My Devices</span>
                </Link> */}
                {isAdmin && (
                  <Link to="/admin/dashboard" className="hidden xl:flex items-center gap-2 p-3 bg-surface-dark rounded-sm text-white hover:bg-surface-dark transition-all shadow-lg">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Control Panel</span>
                  </Link>
                )}
                <Link to="/profile" className="flex items-center gap-3 group">
                  <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white font-black text-sm shadow-lg shadow-accent/20 group-hover:scale-105 transition-all border-2 border-card-bg">
                    {user.first_name ? user.first_name.charAt(0) : 'U'}
                  </div>
                </Link>
              </div>
            ) : (
              <Link to="/login" className="px-4 py-2.5 sm:px-7 sm:py-3.5 bg-text-primary text-white rounded-xl sm:rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all shadow-xl shadow-slate-900/10 whitespace-nowrap">
                Login
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-3 bg-app-bg rounded-sm lg:hidden text-text-primary hover:bg-card-bg transition-all border border-border-main"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 left-0 w-full h-[100dvh] z-[200] lg:hidden p-6 flex flex-col"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.98)', backdropFilter: 'blur(16px)' }}
          >
            <div className="flex justify-between items-center mb-8 shrink-0">
              <div className="flex items-center gap-3">
                <CircuitBoard className="h-8 w-8 text-accent" />
                <span className="font-black text-xl text-white uppercase">IoTMart</span>
              </div>
              <div className="flex items-center gap-3">
                {isInstallable && (
                  <button 
                    onClick={triggerInstall}
                    className="p-3 bg-accent text-white rounded-sm font-bold text-[10px] uppercase tracking-widest flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" /> Install
                  </button>
                )}
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-3 bg-white/10 rounded-sm text-white">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="relative mb-8 shrink-0">
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-5 pr-12 py-4 bg-white/5 border border-white/10 rounded-[24px] text-sm font-bold text-white focus:outline-none focus:border-accent transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if(e.key === 'Enter') {
                    handleSearchSubmit();
                    setIsMobileMenuOpen(false);
                  }
                }}
              />
              <button 
                onClick={() => {
                  handleSearchSubmit();
                  setIsMobileMenuOpen(false);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-accent transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto scrollbar-hide flex-1">
              {[
                { name: 'Shop Inventory', path: '/shop', icon: ShoppingCart },
                { name: 'Track Order', path: '/track', icon: ArrowRight },
                { name: 'Support Tickets', path: '/support', icon: Info },
                { name: 'FAQ Center', path: '/faq', icon: Info },
                // { name: 'Device Dashboard', path: '/devices', icon: Cpu },
              ].map((item) => (
                <Link 
                  key={item.name} 
                  to={item.path} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between p-6 bg-white/5 rounded-[24px] border border-white/10 text-white group hover:bg-accent transition-all"
                >
                  <span className="text-sm font-black uppercase tracking-widest">{item.name}</span>
                  <item.icon className="h-5 w-5 text-accent group-hover:text-white" />
                </Link>
              ))}
            </div>

            <div className="mt-6 shrink-0 pb-6">
              <Link 
                to={user ? (isAdmin ? "/admin/dashboard" : "/profile") : "/login"} 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-5 bg-accent text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-accent/20"
              >
                {user ? (isAdmin ? "Admin Console" : "My Profile") : "Login / Register"} <ShieldCheck className="h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
