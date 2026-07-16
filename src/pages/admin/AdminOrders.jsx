import React, { useState, useEffect } from 'react';
import {
  Search, Package, Truck, CheckCircle, Clock,
  Loader2, ShieldCheck, DollarSign,
  RotateCcw, Download, X, Activity, Layers, ArrowRight,
} from 'lucide-react';
import { getAllOrders, updateOrderStatus, updateOrderTracking, refundOrder } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const T = {
  caps: "text-[10px] font-black uppercase tracking-widest text-text-muted",
  btnPrimary: "bg-accent hover:bg-accent/90 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2",
  btnSecondary: "bg-app-bg border border-border-main hover:border-accent/50 text-text-primary font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2",
  input: "w-full bg-app-bg border border-border-main rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-text-muted",
};

const AnimatedNumber = ({ value }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const end = parseInt(value, 10);
    if (isNaN(end)) { setDisplay(0); return; }
    let start = 0;
    const duration = 500;
    const step = duration / Math.max(Math.abs(end - start), 1);
    const timer = setInterval(() => {
      start += 1;
      setDisplay(start);
      if (start >= end) clearInterval(timer);
    }, step);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}</>;
};

const getStatusStyles = (status) => {
  switch (status?.toLowerCase()) {
    case 'delivered':  return 'bg-status-success-bg text-status-success border border-status-success/20';
    case 'shipped':    return 'bg-accent/10 text-accent border border-accent/20';
    case 'pending':    return 'bg-status-warning-bg text-status-warning border border-status-warning/20';
    case 'processing': return 'bg-accent/10 text-accent border border-accent/20';
    case 'refunded':   return 'bg-status-danger-bg text-status-danger border border-status-danger/20';
    default:           return 'bg-app-bg text-text-muted border border-border-main';
  }
};

const parseCustomerDetails = (address) => {
  if (!address) return { name: 'Unknown Customer', phone: 'N/A', full: '' };
  const lines = address.split('\n');
  return { name: lines[0] || 'Unknown Customer', phone: lines[1] || 'N/A', full: address };
};

// ── KPI Card ──────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, icon: Icon, active, onClick, color }) => (
  <button onClick={onClick}
    className={`relative w-full text-left p-6 rounded-3xl transition-all duration-300 group overflow-hidden ${
      active ? 'card border-accent shadow-xl scale-[1.02]' : 'card hover:border-border-main hover:scale-[1.01]'
    }`}
  >
    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-xl" style={{ background: color }} />
    {active && <div className="absolute inset-0 bg-accent/5 pointer-events-none" />}
    <div className="relative z-10 flex items-start justify-between mb-4">
      <div className="p-2.5 rounded-xl" style={{ background: active ? color : color + '20' }}>
        <Icon className="w-5 h-5" style={active ? { color: '#fff' } : { color }} />
      </div>
      {active && <div className="text-[9px] font-black px-2 py-1 rounded-full bg-accent/20 text-accent">Active</div>}
    </div>
    <div className="relative z-10">
      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${active ? 'text-accent' : 'text-text-muted'}`}>{label}</p>
      <h4 className="text-3xl font-black text-text-primary tracking-tighter"><AnimatedNumber value={value} /></h4>
    </div>
  </button>
);

// ── Order Row ─────────────────────────────────────────────────────────────
const OrderRow = ({ order, onClick, formatPrice }) => {
  const { name, phone } = parseCustomerDetails(order.address);
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}
      onClick={() => onClick(order)}
      className="group flex flex-col md:flex-row md:items-center gap-3 md:gap-6 p-4 md:px-8 bg-app-bg hover:bg-card-bg border-b border-border-subtle transition-all cursor-pointer relative last:border-0 mx-2 sm:mx-0 my-2 sm:my-0 rounded-2xl sm:rounded-none border sm:border-0 border-border-main"
    >
      <div className="hidden md:block absolute left-0 top-0 bottom-0 w-1 bg-accent scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />
      
      {/* Mobile-only Header (Status + Order ID) */}
      <div className="flex md:hidden items-center justify-between pb-3 border-b border-border-subtle">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getStatusStyles(order.status)}`}>
          <div className={`w-1.5 h-1.5 rounded-full bg-current ${order.status === 'Pending' || order.status === 'Processing' ? 'animate-pulse' : ''}`} />
          {order.status}
        </span>
        <p className="text-xs font-black text-text-primary">#{order._id.slice(-8).toUpperCase()}</p>
      </div>

      <div className="flex items-center justify-between md:justify-start gap-4 flex-grow min-w-0 md:w-[30%] pt-1 md:pt-0">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-card-bg border border-border-main flex items-center justify-center flex-shrink-0 group-hover:border-accent/30 group-hover:bg-accent/5 transition-colors">
            <Package className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors" />
          </div>
          <div className="min-w-0">
            <p className="hidden md:block text-sm font-black text-text-primary truncate">#{order._id.slice(-8).toUpperCase()}</p>
            <p className="block md:hidden text-sm font-black text-text-primary truncate">{name}</p>
            <p className="text-[10px] font-bold text-text-muted mt-0.5">{order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : 'Just now'} <span className="md:hidden">· {phone}</span></p>
          </div>
        </div>

        {/* Mobile-only Right Arrow */}
        <div className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-text-muted bg-card-bg border border-border-main flex-shrink-0">
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="w-[30%] flex-shrink-0 hidden md:block min-w-0">
        <p className="text-sm font-bold text-text-primary truncate">{name}</p>
        <p className="text-[10px] font-bold text-text-muted mt-0.5 truncate">{phone}</p>
      </div>
      <div className="w-28 flex-shrink-0 hidden md:block">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${getStatusStyles(order.status)}`}>
          <div className={`w-1.5 h-1.5 rounded-full bg-current ${order.status === 'Pending' || order.status === 'Processing' ? 'animate-pulse' : ''}`} />
          {order.status}
        </span>
      </div>

      {/* Footer / Price Area */}
      <div className="flex md:w-24 items-center justify-between md:justify-end md:flex-col md:items-end flex-shrink-0 pt-3 md:pt-0 border-t border-border-subtle md:border-t-0 mt-1 md:mt-0">
         <div className="flex items-center gap-1.5 md:hidden">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Total Amount</span>
         </div>
         <div className="text-right flex flex-row-reverse md:flex-col items-center md:items-end gap-3 md:gap-0">
           <p className="text-sm md:text-sm font-black text-accent md:text-text-primary">{formatPrice(order.total)}</p>
           <div className="flex items-center justify-end gap-1 mt-0 md:mt-0.5">
             {order.payment_method === 'COD' ? <DollarSign className="w-3 h-3 text-status-warning" /> : <ShieldCheck className="w-3 h-3 text-status-success" />}
             <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">{order.payment_method}</p>
           </div>
         </div>
      </div>

      {/* Desktop-only Right Arrow */}
      <div className="hidden md:flex w-12 flex-shrink-0 justify-end">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted group-hover:bg-accent/10 group-hover:text-accent transition-all">
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
};

// ── Order Drawer ──────────────────────────────────────────────────────────
const OrderDrawer = ({ order, onClose, onUpdateStatus, onRefund, formatPrice }) => {
  const [trackingId, setTrackingId] = useState('');
  const [isSettingTracking, setIsSettingTracking] = useState(false);
  const { name, phone, full: fullAddress } = parseCustomerDetails(order.address);

  const handleTracking = async () => {
    if (!trackingId.trim()) return;
    setIsSettingTracking(true);
    await updateOrderTracking(order._id, trackingId);
    order.tracking_id = trackingId;
    order.status = 'Shipped';
    setIsSettingTracking(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end p-3 sm:p-5"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 200 }}
          className="bg-card-bg w-full max-w-[540px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-border-main"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-7 py-5 border-b border-border-subtle bg-app-bg flex-shrink-0">
            <div className="min-w-0 pr-3">
              <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-1 truncate">Order Details</p>
              <h3 className="text-lg sm:text-xl font-black text-text-primary tracking-tight truncate">#{order._id.slice(-8).toUpperCase()}</h3>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <button
                onClick={() => alert('Receipt PDF generation is coming soon!')}
                className="group flex items-center gap-2 bg-accent/10 hover:bg-accent text-accent hover:text-white px-3 sm:px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200"
              >
                <Download className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
                <span className="hidden sm:inline">Download</span>
              </button>
              <button onClick={onClose} className="w-10 h-10 rounded-xl bg-card-bg border border-border-main text-text-muted hover:text-text-primary hover:border-accent transition-all flex items-center justify-center flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="flex-grow overflow-y-auto px-7 py-6 space-y-6">

            {/* Status & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-app-bg border border-border-subtle rounded-2xl">
              <div>
                <p className={T.caps + " mb-2"}>Current Status</p>
                <select
                  value={order.status}
                  onChange={(e) => onUpdateStatus(order._id, e.target.value)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest outline-none cursor-pointer appearance-none ${getStatusStyles(order.status)}`}
                >
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Refunded" disabled>Refunded</option>
                </select>
              </div>
              {order.status !== 'Refunded' && (
                <button
                  onClick={() => onRefund(order._id)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-status-danger-bg border border-status-danger/30 text-status-danger hover:bg-status-danger hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all w-full sm:w-auto justify-center"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Initiate Refund
                </button>
              )}
            </div>

            {/* Customer Details */}
            <div>
              <p className={T.caps + " mb-3"}>Customer Details</p>
              <div className="p-4 sm:p-5 bg-card-bg border border-border-main rounded-2xl flex gap-3 sm:gap-4 items-start overflow-hidden">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-accent text-white flex items-center justify-center font-black text-lg flex-shrink-0">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-black text-text-primary break-all sm:break-words">{name}</p>
                  <p className="text-xs font-bold text-text-muted mt-0.5 break-all sm:break-words">{phone}</p>
                  <div className="mt-3 pt-3 border-t border-border-subtle">
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1.5">Shipping Address</p>
                    <p className="text-xs font-medium text-text-primary leading-relaxed break-all sm:break-words whitespace-pre-wrap">{fullAddress}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking */}
            <div>
              <p className={T.caps + " mb-3"}>Tracking Information</p>
              <div className="p-5 bg-card-bg border border-border-main rounded-2xl">
                {(order.status === 'Pending' || order.status === 'Processing') && !order.tracking_id ? (
                  <div>
                    <p className="text-xs font-medium text-text-muted mb-3">Assign a tracking ID to ship this order</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. DELHIVERY123456"
                        value={trackingId}
                        onChange={e => setTrackingId(e.target.value)}
                        className={`${T.input} text-xs flex-grow py-2.5`}
                      />
                      <button
                        onClick={handleTracking}
                        disabled={isSettingTracking || !trackingId.trim()}
                        className={`${T.btnPrimary} py-2.5 px-4 flex-shrink-0 disabled:opacity-40`}
                      >
                        {isSettingTracking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1.5">Tracking ID</p>
                      <p className="text-base font-black font-mono text-text-primary">{order.tracking_id || '—'}</p>
                    </div>
                    {order.tracking_id
                      ? <div className="flex items-center gap-1.5 text-[9px] font-black text-status-success bg-status-success-bg px-3 py-1.5 rounded-lg border border-status-success/20"><CheckCircle className="w-3.5 h-3.5" /> Assigned</div>
                      : <div className="text-[9px] font-black text-text-muted bg-app-bg px-3 py-1.5 rounded-lg border border-border-subtle">Not Assigned</div>
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Purchased Items */}
            <div>
              <p className={T.caps + " mb-3"}>Purchased Items ({order.items.length})</p>
              <div className="bg-card-bg border border-border-main rounded-2xl overflow-hidden divide-y divide-border-subtle">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 hover:bg-app-bg transition-colors">
                    <div className="w-14 h-14 bg-app-bg rounded-xl flex-shrink-0 border border-border-subtle flex items-center justify-center overflow-hidden">
                      {item.image
                        ? <img src={item.image} className="w-full h-full object-contain p-1 mix-blend-multiply" alt={item.name} />
                        : <Package className="w-6 h-6 text-text-muted" />
                      }
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-bold text-text-primary line-clamp-2 leading-snug">{item.name}</p>
                      <span className="inline-flex text-[9px] font-black text-text-muted mt-1.5 uppercase tracking-widest bg-app-bg px-2 py-1 rounded-md border border-border-subtle">
                        QTY {item.quantity} × {formatPrice(item.price)}
                      </span>
                    </div>
                    <p className="text-sm font-black text-text-primary flex-shrink-0">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Summary — Premium Dark Card */}
            <div className="bg-surface-dark rounded-3xl p-7 text-white relative overflow-hidden shadow-xl">
              <div className="absolute -right-8 -top-8 w-40 h-40 bg-accent rounded-full blur-3xl opacity-25 pointer-events-none" />
              <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-purple-600 rounded-full blur-3xl opacity-15 pointer-events-none" />
              <div className="relative z-10">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/40 mb-1">Total Settlement</p>
                <p className="text-4xl font-black tracking-tighter mb-6">{formatPrice(order.total)}</p>
                <div className="flex items-center justify-between border-t border-white/10 pt-5">
                  <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-lg ${order.payment_method === 'COD' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                    {order.payment_method === 'COD' ? <DollarSign className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    {order.payment_method === 'COD' ? 'Cash on Delivery' : 'Paid via Cashfree'}
                  </div>
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                    {order.payment_method}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────
const AdminOrders = () => {
  const { formatPrice } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?._id === orderId) setSelectedOrder(prev => ({ ...prev, status: newStatus }));
    } catch { alert('Failed to update status'); }
  };

  const handleRefund = async (orderId) => {
    if (!window.confirm('Are you sure you want to refund this order?')) return;
    try {
      await refundOrder(orderId);
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'Refunded' } : o));
      if (selectedOrder?._id === orderId) setSelectedOrder(prev => ({ ...prev, status: 'Refunded' }));
    } catch { alert('Refund failed'); }
  };

  const handleExportCSV = () => {
    if (!orders.length) return;
    const headers = ['Order ID', 'Date', 'Customer', 'Phone', 'Total', 'Status', 'Payment Method', 'Tracking ID'];
    const rows = orders.map(o => {
      const { name, phone } = parseCustomerDetails(o.address);
      return [o._id, new Date(o.createdAt).toISOString(), name, phone, o.total, o.status, o.payment_method, o.tracking_id || ''].join(',');
    });
    const csv = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `orders_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-10 h-10 animate-spin text-accent" /></div>;
  }

  const filteredOrders = orders
    .filter(o => statusFilter === 'All' || o.status === statusFilter)
    .filter(o => {
      if (!searchTerm) return true;
      const t = searchTerm.toLowerCase();
      const { name, phone } = parseCustomerDetails(o.address);
      return o._id.toLowerCase().includes(t) || name.toLowerCase().includes(t) || phone.includes(t);
    });

  const p_count = orders.filter(o => o.status === 'Pending').length;
  const s_count = orders.filter(o => o.status === 'Shipped').length;
  const d_count = orders.filter(o => o.status === 'Delivered').length;
  const r_count = orders.filter(o => o.status === 'Refunded').length;

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-subtle pb-6">
        <div>
          <p className="text-[10px] font-black text-accent uppercase tracking-[0.25em] mb-1">Fulfillment Center</p>
          <h1 className="text-3xl font-black text-text-primary tracking-tighter">
            Orders <span className="text-accent">Registry</span>
          </h1>
        </div>
        <button onClick={handleExportCSV} className={`${T.btnSecondary} py-2.5 px-5`}>
          <Download className="w-4 h-4 text-text-muted" /> Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
        <KpiCard label="All Orders" value={orders.length} icon={Layers} color="#6366f1" active={statusFilter === 'All'} onClick={() => setStatusFilter('All')} />
        <KpiCard label="Pending" value={p_count} icon={Clock} color="#f59e0b" active={statusFilter === 'Pending'} onClick={() => setStatusFilter('Pending')} />
        <KpiCard label="In Transit" value={s_count} icon={Truck} color="#3b82f6" active={statusFilter === 'Shipped'} onClick={() => setStatusFilter('Shipped')} />
        <KpiCard label="Delivered" value={d_count} icon={CheckCircle} color="#10b981" active={statusFilter === 'Delivered'} onClick={() => setStatusFilter('Delivered')} />
        <KpiCard label="Refunds" value={r_count} icon={RotateCcw} color="#ef4444" active={statusFilter === 'Refunded'} onClick={() => setStatusFilter('Refunded')} />
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by Order ID or User..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-app-bg border border-border-main rounded-xl text-sm font-bold text-text-primary outline-none focus:bg-card-bg focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-text-muted"
          />
        </div>
        <div className="flex bg-app-bg border border-border-main p-1 rounded-xl gap-1 shadow-inner w-full md:w-auto overflow-x-auto hide-scrollbar">
          {['All', 'Pending', 'Shipped', 'Delivered', 'Refunded'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap ${
                statusFilter === s ? 'bg-accent text-white shadow-lg shadow-accent/30' : 'text-text-muted hover:text-text-primary'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div>
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center card">
            <Package className="w-16 h-16 text-text-muted opacity-20 mb-4" />
            <p className="text-sm font-black text-text-primary uppercase tracking-widest">No Orders Found</p>
            <p className="text-sm font-medium text-text-muted mt-1">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div className="card overflow-hidden !p-0 border border-border-main">
            <div className="flex items-center gap-6 px-8 py-4 bg-app-bg border-b border-border-subtle">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted flex-grow md:w-[30%]">Order ID & Date</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted w-[30%] hidden md:block">Customer</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted w-28 hidden sm:block">Status</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted w-24 text-right">Amount</p>
              <p className="w-12 flex-shrink-0" />
            </div>
            <div className="divide-y divide-border-subtle bg-card-bg">
              <AnimatePresence mode="popLayout">
                {filteredOrders.map((o, i) => (
                  <OrderRow key={o._id || `order-${i}`} order={o} onClick={setSelectedOrder} formatPrice={formatPrice} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleUpdateStatus}
          onRefund={handleRefund}
          formatPrice={formatPrice}
        />
      )}
    </div>
  );
};

export default AdminOrders;
