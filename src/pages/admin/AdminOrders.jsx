import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, ChevronDown, Package, 
  Truck, CheckCircle, Clock, MoreVertical,
  Loader2, ExternalLink, ShieldCheck, RefreshCcw,
  DollarSign, RotateCcw, X, AlertCircle
} from 'lucide-react';
import { getAllOrders, updateOrderStatus, updateOrderTracking } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const AdminOrders = () => {
  const { formatPrice } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingId, setTrackingId] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateOrderStatus(id, newStatus);
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus } : o));
      if (selectedOrder?._id === id) setSelectedOrder({ ...selectedOrder, status: newStatus });
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const handleUpdateTracking = async (id) => {
    if (!trackingId) return;
    try {
      await updateOrderTracking(id, trackingId);
      setOrders(prev => prev.map(o => o._id === id ? { ...o, tracking_id: trackingId } : o));
      if (selectedOrder?._id === id) setSelectedOrder({ ...selectedOrder, tracking_id: trackingId });
      alert("Tracking ID successfully injected into the matrix.");
    } catch (error) {
      alert("Tracking injection failed");
    }
  };

  const handleRefund = async (id) => {
    if (window.confirm("Initialize refund protocol for this deployment?")) {
      handleUpdateStatus(id, "Refunded");
    }
  };

  const filteredOrders = orders.filter(o => 
    o._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'shipped': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'refunded': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12 pb-8 border-b border-border-main">
        <div>
          <p className="text-accent text-[10px] font-black uppercase tracking-[0.3em] mb-2">Fulfillment Control</p>
          <h1 className="text-4xl font-black text-text-primary tracking-tighter uppercase">Deployment <span className="text-accent">Logistics</span></h1>
        </div>
        <div className="flex bg-white border border-border-main p-1 rounded-2xl shadow-sm">
          <button className="px-6 py-2 rounded-xl bg-accent text-white text-[10px] font-black uppercase tracking-widest shadow-lg">Active</button>
          <button className="px-6 py-2 rounded-xl text-[10px] font-black text-text-muted hover:text-text-primary uppercase tracking-widest transition-all">Archive</button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Pending Nodes', val: orders.filter(o => o.status === 'Pending').length, color: 'text-amber-500', icon: Clock },
          { label: 'In Transit', val: orders.filter(o => o.status === 'Shipped').length, color: 'text-blue-500', icon: Truck },
          { label: 'Finalized', val: orders.filter(o => o.status === 'Delivered').length, color: 'text-emerald-500', icon: CheckCircle },
          { label: 'Reversals', val: orders.filter(o => o.status === 'Refunded').length, color: 'text-red-500', icon: RotateCcw },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-border-main flex items-center gap-4 shadow-sm">
            <div className={`p-3 rounded-xl bg-slate-50 ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-black text-text-primary">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-[40px] border border-border-main shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Filter by Order ID or Status..." 
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-border-main rounded-2xl text-sm font-medium focus:border-accent outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-border-main">
                <th className="py-6 px-8 text-[10px] font-black text-text-muted uppercase tracking-widest">Deployment Hash</th>
                <th className="py-6 px-8 text-[10px] font-black text-text-muted uppercase tracking-widest">Revenue</th>
                <th className="py-6 px-8 text-[10px] font-black text-text-muted uppercase tracking-widest">Method</th>
                <th className="py-6 px-8 text-[10px] font-black text-text-muted uppercase tracking-widest">Fulfillment</th>
                <th className="py-6 px-8 text-[10px] font-black text-text-muted uppercase tracking-widest text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="5" className="py-20 text-center"><Loader2 className="h-10 w-10 text-accent animate-spin mx-auto" /></td></tr>
              ) : filteredOrders.map(order => (
                <tr key={order._id} className="group hover:bg-slate-50/50 transition-all">
                  <td className="py-6 px-8">
                    <p className="text-xs font-black text-text-primary uppercase tracking-tight">#{order._id.slice(-12).toUpperCase()}</p>
                    <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-1">Node: {order.user_id?.slice(-6).toUpperCase()}</p>
                  </td>
                  <td className="py-6 px-8">
                    <p className="text-sm font-black text-text-primary">{formatPrice(order.total)}</p>
                  </td>
                  <td className="py-6 px-8">
                    <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
                      {order.payment_method === 'COD' ? <DollarSign className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3 text-accent" />}
                      {order.payment_method}
                    </span>
                  </td>
                  <td className="py-6 px-8">
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-6 px-8 text-right">
                    <button onClick={() => setSelectedOrder(order)} className="p-3 bg-slate-50 rounded-xl text-text-muted hover:text-accent hover:bg-accent/5 transition-all">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-4xl rounded-[40px] p-12 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setSelectedOrder(null)} className="absolute top-10 right-10 p-2 hover:bg-slate-50 rounded-full transition-all">
                <X className="h-5 w-5" />
              </button>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-slate-50 pb-8">
                <div>
                  <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter">Manifest Inspection</h2>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-2">ID: #{selectedOrder._id.toUpperCase()}</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => handleRefund(selectedOrder._id)} className="px-6 py-3 bg-red-50 text-red-600 text-[10px] font-black rounded-xl uppercase tracking-widest border border-red-100 hover:bg-red-600 hover:text-white transition-all">
                    Initiate Refund
                  </button>
                  <select 
                    value={selectedOrder.status}
                    onChange={(e) => handleUpdateStatus(selectedOrder._id, e.target.value)}
                    className="px-6 py-3 bg-slate-900 text-white text-[10px] font-black rounded-xl uppercase tracking-widest outline-none cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-6">Component Breakdown</h4>
                  <div className="space-y-4">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-12 h-12 bg-white rounded-xl p-2 border border-slate-100">
                          <img src={item.image} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-grow">
                          <p className="text-xs font-black text-text-primary uppercase tracking-tight">{item.name}</p>
                          <p className="text-[10px] text-text-muted font-bold uppercase mt-1">QTY: {item.quantity} • {formatPrice(item.price)}</p>
                        </div>
                        <p className="text-sm font-black text-text-primary">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-10">
                  <div>
                    <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4">Logistics Management</h4>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-border-main space-y-4">
                      <div>
                        <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-2">Tracking ID (Global Matrix)</p>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Enter Tracking ID..." 
                            className="flex-grow px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-accent"
                            defaultValue={selectedOrder.tracking_id || ''}
                            onChange={(e) => setTrackingId(e.target.value)}
                          />
                          <button 
                            onClick={() => handleUpdateTracking(selectedOrder._id)}
                            className="px-4 py-3 bg-accent text-white rounded-xl text-[10px] font-black uppercase hover:bg-accent/80 transition-all"
                          >
                            Set
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Shipping Method</p>
                        <p className="text-[10px] font-black text-text-primary uppercase tracking-tight">{selectedOrder.shipping_method || 'Standard Orbital'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4">Shipping Memo</h4>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-border-main text-sm font-medium text-text-secondary leading-relaxed">
                      {selectedOrder.address}
                    </div>
                  </div>
                  <div className="bg-slate-900 p-8 rounded-3xl text-white">
                    <div className="flex justify-between items-end mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Settlement</span>
                      <span className="text-3xl font-black text-accent">{formatPrice(selectedOrder.total)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-emerald-400">
                      <ShieldCheck className="h-4 w-4" />
                      Transaction Verified via Razorpay
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrders;
