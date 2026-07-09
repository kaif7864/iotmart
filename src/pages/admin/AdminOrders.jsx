import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, ChevronDown, Package, 
  Truck, CheckCircle, Clock, MoreVertical,
  Loader2, ExternalLink, ShieldCheck, RefreshCcw,
  DollarSign, RotateCcw, X, AlertCircle, Download
} from 'lucide-react';
import { getAllOrders, updateOrderStatus, updateOrderTracking } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { generateInvoice } from '../../utils/generateInvoice';
import { Input, Table, Badge, Button, EmptyState, Modal } from '../../components/common';

const AdminOrders = () => {
  const { formatPrice, currency } = useAuth();
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
      alert("Tracking ID updated successfully.");
    } catch (error) {
      alert("Tracking injection failed");
    }
  };

  const handleRefund = async (id) => {
    if (window.confirm("Initiate refund for this order?")) {
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
      case 'shipped': return 'bg-status-info-bg text-accent border-border-subtle';
      case 'pending': return 'bg-status-warning-bg text-status-warning-text border-amber-100';
      case 'refunded': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-app-bg text-text-secondary border-border-subtle';
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12 pb-8 border-b border-border-main">
        <div>
          <p className="text-accent text-[10px] font-black uppercase tracking-[0.3em] mb-2">Fulfillment Control</p>
          <h1 className="text-4xl font-black text-text-primary tracking-tighter uppercase">Order <span className="text-accent">Management</span></h1>
        </div>
        <div className="flex bg-card-bg border border-border-main p-1 rounded-sm shadow-sm">
          <button className="px-6 py-2 rounded-sm bg-accent text-white text-[10px] font-black uppercase tracking-widest shadow-lg">Active</button>
          <button className="px-6 py-2 rounded-sm text-[10px] font-black text-text-muted hover:text-text-primary uppercase tracking-widest transition-all">Archive</button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Pending Nodes', val: orders.filter(o => o.status === 'Pending').length, color: 'text-amber-500', icon: Clock },
          { label: 'In Transit', val: orders.filter(o => o.status === 'Shipped').length, color: 'text-accent', icon: Truck },
          { label: 'Finalized', val: orders.filter(o => o.status === 'Delivered').length, color: 'text-emerald-500', icon: CheckCircle },
          { label: 'Reversals', val: orders.filter(o => o.status === 'Refunded').length, color: 'text-status-danger', icon: RotateCcw },
        ].map((stat, i) => (
          <div key={i} className="bg-card-bg p-6 rounded-[32px] border border-border-main flex items-center gap-4 shadow-sm">
            <div className={`p-3 rounded-sm bg-app-bg ${stat.color}`}>
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
      <div className="bg-card-bg rounded-[40px] border border-border-main shadow-sm overflow-hidden">
        <div className="p-8 border-b border-border-subtle flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted z-10" />
            <Input 
              type="text" 
              placeholder="Filter by Order ID or Status..." 
              className="pl-14 py-4"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center"><Loader2 className="h-10 w-10 text-accent animate-spin mx-auto" /></div>
          ) : filteredOrders.length === 0 ? (
            <EmptyState 
              icon={Package}
              title="No Orders Found"
              description="No matching orders found in the registry."
            />
          ) : (
            <Table 
              keyField="_id"
              data={filteredOrders}
              columns={[
                {
                  header: 'Order ID',
                  render: (order) => (
                    <div>
                      <p className="text-xs font-black text-text-primary uppercase tracking-tight">#{order._id.slice(-12).toUpperCase()}</p>
                      <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-1">Node: {order.user_id?.slice(-6).toUpperCase()}</p>
                    </div>
                  )
                },
                {
                  header: 'Revenue',
                  render: (order) => <p className="text-sm font-black text-text-primary">{formatPrice(order.total)}</p>
                },
                {
                  header: 'Method',
                  render: (order) => (
                    <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
                      {order.payment_method === 'COD' ? <DollarSign className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3 text-accent" />}
                      {order.payment_method}
                    </span>
                  )
                },
                {
                  header: 'Fulfillment',
                  render: (order) => (
                    <span className={`px-4 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  )
                },
                {
                  header: 'Inspect',
                  render: (order) => (
                    <div className="flex justify-end">
                      <button onClick={() => setSelectedOrder(order)} className="p-3 bg-app-bg rounded-sm text-text-muted hover:text-accent hover:bg-accent/5 transition-all">
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  )
                }
              ]}
            />
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      <Modal 
        isOpen={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)}
        title="Manifest Inspection"
      >
        {selectedOrder && (
          <>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-8">ID: #{selectedOrder._id.toUpperCase()}</p>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-border-subtle pb-8">
              <div className="flex gap-4">
                <Button variant="danger" onClick={() => handleRefund(selectedOrder._id)} className="py-3">
                  Initiate Refund
                </Button>
                <select 
                  value={selectedOrder.status}
                  onChange={(e) => handleUpdateStatus(selectedOrder._id, e.target.value)}
                  className="px-6 py-3 bg-surface-dark text-white text-[10px] font-black rounded-sm uppercase tracking-widest outline-none cursor-pointer"
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
                    <div key={idx} className="flex items-center gap-4 p-4 bg-app-bg rounded-sm border border-border-subtle">
                      <div className="w-12 h-12 bg-card-bg rounded-sm p-2 border border-border-subtle">
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
                  <div className="p-6 bg-app-bg rounded-sm border border-border-main space-y-4">
                    <div>
                      <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-2">Tracking ID</p>
                      <div className="flex gap-2">
                        <Input 
                          type="text" 
                          placeholder="Enter Tracking ID..." 
                          className="flex-grow py-3"
                          defaultValue={selectedOrder.tracking_id || ''}
                          onChange={(e) => setTrackingId(e.target.value)}
                        />
                        <Button 
                          onClick={() => handleUpdateTracking(selectedOrder._id)}
                          className="py-3 px-4"
                        >
                          Set
                        </Button>
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
                  <div className="p-6 bg-app-bg rounded-sm border border-border-main text-sm font-medium text-text-secondary leading-relaxed">
                    {selectedOrder.address}
                  </div>
                </div>
                  <div className="bg-surface-dark p-8 rounded-sm text-white">
                    <div className="flex justify-between items-end mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Total Settlement</span>
                      <span className="text-3xl font-black text-accent">{formatPrice(selectedOrder.total)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-emerald-400">
                      <ShieldCheck className="h-4 w-4" />
                      Transaction Verified via Razorpay
                    </div>
                  </div>
                  <Button 
                    variant="secondary"
                    onClick={() => generateInvoice(selectedOrder, null, currency)}
                    className="w-full flex items-center justify-center gap-3 py-4 text-[10px] uppercase tracking-widest border-border-main shadow-sm"
                  >
                    <Download className="h-5 w-5 text-accent" /> Download Tax Invoice
                  </Button>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default AdminOrders;
