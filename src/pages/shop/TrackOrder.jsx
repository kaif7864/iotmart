import React, { useState } from 'react';
import { Search, Package, Truck, CheckCircle2, MapPin, Calendar, Clock, AlertCircle, ArrowRight, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllOrders, getLiveTracking } from '../../services/api'; // In a real app, we'd have a specific getOrderById

const TrackOrder = () => {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderId) return;
    
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      // Simulation: Fetch all orders and find the one matching the ID
      // In production, we would call api.get(`/orders/${orderId}`)
      const allOrders = await getAllOrders();
      const foundOrder = allOrders.find(o => o._id.toLowerCase().includes(orderId.toLowerCase()) || o._id === orderId);
      
      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        setError('Order not found. Please check your Order ID and try again.');
      }
    } catch (err) {
      setError('Could not establish a connection to the logistics server.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { label: 'Pending', icon: Clock, color: 'text-amber-500' },
    { label: 'Processing', icon: Package, color: 'text-accent' },
    { label: 'Shipped', icon: Truck, color: 'text-accent' },
    { label: 'Delivered', icon: CheckCircle, color: 'text-emerald-500' }
  ];

  const currentStepIndex = order ? steps.findIndex(s => s.label === order.status) : -1;

  return (
    <div className="pt-32 pb-24 min-h-screen bg-app-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-accent text-[10px] font-black uppercase tracking-[0.4em] mb-4 text-center">Global Logistics</p>
          <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter uppercase mb-6">Track Your <span className="text-accent">Hardware</span></h1>
          <p className="text-text-muted font-medium max-w-lg mx-auto italic">Monitor the transit status of your industrial components in real-time.</p>
        </div>

        {/* Search Bar */}
        <div className="bg-card-bg p-4 rounded-[32px] shadow-xl border border-border-main mb-12">
          <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
              <input 
                type="text" 
                placeholder="Enter Tracking ID or Order ID..." 
                className="w-full pl-16 pr-8 h-16 bg-app-bg border border-transparent rounded-[24px] text-sm font-bold focus:bg-card-bg focus:border-accent transition-all outline-none"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="btn-premium h-16 px-12 rounded-[24px] text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Track Order <ArrowRight className="h-5 w-5" /></>}
            </button>
          </form>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 bg-red-50 border border-red-100 rounded-[24px] flex items-center gap-4 text-red-600 mb-8"
            >
              <Info className="h-6 w-6 shrink-0" />
              <p className="text-sm font-black uppercase tracking-tight">{error}</p>
            </motion.div>
          )}

          {order && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              {/* Order Info Card */}
              <div className="bg-card-bg p-10 rounded-[40px] border border-border-main shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div>
                    <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-2">Order Identification</p>
                    <h3 className="text-2xl font-black text-text-primary uppercase tracking-tighter mb-8">#{order._id.slice(-12).toUpperCase()}</h3>
                    
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-app-bg rounded-sm flex items-center justify-center shrink-0">
                          <MapPin className="h-5 w-5 text-text-muted" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Delivery Coordinates</p>
                          <p className="text-sm font-bold text-text-primary mt-1">{order.address}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-app-bg rounded-sm flex items-center justify-center shrink-0">
                          <Truck className="h-5 w-5 text-text-muted" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Shipping Partner</p>
                          <p className="text-sm font-bold text-text-primary mt-1">{order.shipping_method || 'Standard Orbital Delivery'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-end items-start md:items-end md:text-right">
                    <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-2">Tracking ID</p>
                    <p className="text-xl font-black text-accent mb-8">{order.tracking_id || 'Generating ID...'}</p>
                    
                    <div className="bg-surface-dark p-6 rounded-sm w-full max-w-xs text-white">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-1">Items in Transit</p>
                      <p className="text-lg font-black">{order.items.length} Component Modules</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="bg-card-bg p-10 rounded-[40px] border border-border-main shadow-sm">
                <div className="relative flex justify-between">
                  {/* Background Line */}
                  <div className="absolute top-7 left-0 w-full h-1 bg-surface-hover z-0"></div>
                  <div 
                    className="absolute top-7 left-0 h-1 bg-accent z-0 transition-all duration-1000"
                    style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                  ></div>

                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;

                    return (
                      <div key={index} className="relative z-10 flex flex-col items-center gap-4">
                        <div className={`w-14 h-14 rounded-sm flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-accent text-white shadow-xl shadow-accent/20 scale-110' : 'bg-card-bg border-2 border-border-subtle text-text-muted'}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="text-center">
                          <p className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-text-primary' : 'text-text-muted'}`}>
                            {step.label}
                          </p>
                          {isCurrent && (
                            <span className="inline-block px-3 py-1 bg-accent/10 text-accent text-[8px] font-black rounded-full mt-2 animate-pulse">
                              Current Station
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TrackOrder;
