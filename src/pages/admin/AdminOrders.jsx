import React, { useState, useEffect } from 'react';
import {
  Search, Package,
  Truck, CheckCircle, Clock,
  Loader2, ExternalLink, ShieldCheck,
  DollarSign, RotateCcw, Download
} from 'lucide-react';
import { getAllOrders, updateOrderStatus, updateOrderTracking } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SkeletonTableRows, Input, Table, Badge, Button, EmptyState, Modal, ConfirmModal } from '../../components/common';
import { generateInvoice } from '../../utils/generateInvoice';

const getStatusVariant = (status) => {
  switch (status?.toLowerCase()) {
    case 'delivered': return 'success';
    case 'shipped':   return 'info';
    case 'pending':   return 'warning';
    case 'refunded':  return 'danger';
    default:          return 'default';
  }
};

const AdminOrders = () => {
  const { formatPrice, currency } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingId, setTrackingId] = useState('');
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [refundTarget, setRefundTarget] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateOrderStatus(id, newStatus);
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus } : o));
      if (selectedOrder?._id === id) setSelectedOrder(prev => ({ ...prev, status: newStatus }));
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleUpdateTracking = async (id) => {
    if (!trackingId) return;
    try {
      await updateOrderTracking(id, trackingId);
      setOrders(prev => prev.map(o => o._id === id ? { ...o, tracking_id: trackingId } : o));
      if (selectedOrder?._id === id) setSelectedOrder(prev => ({ ...prev, tracking_id: trackingId }));
    } catch (error) {
      alert('Tracking injection failed');
    }
  };

  const confirmRefund = async () => {
    await handleUpdateStatus(refundTarget, 'Refunded');
    setIsRefundOpen(false);
    setRefundTarget(null);
  };

  const filteredOrders = orders.filter(o =>
    o._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Pending Nodes', val: orders.filter(o => o.status === 'Pending').length,   icon: Clock,        colorClass: 'text-status-warning bg-status-warning-bg' },
    { label: 'In Transit',    val: orders.filter(o => o.status === 'Shipped').length,    icon: Truck,        colorClass: 'text-accent bg-accent-light' },
    { label: 'Finalized',     val: orders.filter(o => o.status === 'Delivered').length,  icon: CheckCircle,  colorClass: 'text-status-success bg-status-success-bg' },
    { label: 'Reversals',     val: orders.filter(o => o.status === 'Refunded').length,   icon: RotateCcw,    colorClass: 'text-status-danger bg-status-danger-bg' },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12 pb-8 border-b border-border-main">
        <div>
          <p className="label-caps text-accent mb-2">Fulfillment Control</p>
          <h1 className="heading-page">Order <span className="text-accent">Management</span></h1>
        </div>
        <div className="flex bg-card-bg border border-border-main p-1 rounded-sm shadow-sm">
          <button className="px-6 py-2 rounded-sm bg-accent text-text-inverse text-[10px] font-black uppercase tracking-widest shadow-lg">Active</button>
          <button className="px-6 py-2 rounded-sm text-[10px] font-black text-text-muted hover:text-text-primary uppercase tracking-widest transition-all">Archive</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="card rounded-[32px] p-6 flex items-center gap-4">
            <div className={`p-3 rounded-sm ${stat.colorClass}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="label-caps">{stat.label}</p>
              <p className="text-xl font-black text-text-primary">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Orders Table Card */}
      <div className="card rounded-[40px] overflow-hidden">
        <div className="p-8 border-b border-border-subtle">
          <div className="relative max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
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
            <div className="p-6">
              <SkeletonTableRows rows={6} cols={5} />
            </div>
          ) : filteredOrders.length === 0 ? (
            <EmptyState icon={Package} title="No Orders Found" description="No matching orders found in the registry." />
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
                      <p className="label-caps mt-1">Node: {order.user_id?.slice(-6).toUpperCase()}</p>
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
                    <span className="label-caps flex items-center gap-1.5">
                      {order.payment_method === 'COD'
                        ? <DollarSign className="h-3 w-3" />
                        : <ShieldCheck className="h-3 w-3 text-accent" />
                      }
                      {order.payment_method}
                    </span>
                  )
                },
                {
                  header: 'Fulfillment',
                  render: (order) => <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                },
                {
                  header: 'Inspect',
                  render: (order) => (
                    <div className="flex justify-end">
                      <button
                        onClick={() => { setSelectedOrder(order); setTrackingId(order.tracking_id || ''); }}
                        className="w-9 h-9 flex items-center justify-center rounded-full text-text-muted hover:text-accent hover:bg-accent-light transition-all"
                      >
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
        maxWidth="max-w-3xl"
      >
        {selectedOrder && (
          <>
            <p className="label-caps mb-8">ID: #{selectedOrder._id.toUpperCase()}</p>

            <div className="flex flex-wrap gap-3 mb-8 pb-8 border-b border-border-subtle">
              <Button
                variant="danger"
                onClick={() => { setRefundTarget(selectedOrder._id); setIsRefundOpen(true); }}
                className="py-3"
              >
                Initiate Refund
              </Button>
              <select
                value={selectedOrder.status}
                onChange={(e) => handleUpdateStatus(selectedOrder._id, e.target.value)}
                className="px-6 py-3 bg-surface-dark text-text-inverse text-[10px] font-black rounded-sm uppercase tracking-widest outline-none cursor-pointer"
              >
                <option value="Pending">Pending</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Items */}
              <div>
                <h4 className="label-caps mb-6">Component Breakdown</h4>
                <div className="space-y-4">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-app-bg rounded-sm border border-border-subtle">
                      <div className="w-12 h-12 card rounded-sm p-2 flex-shrink-0">
                        <img src={item.image} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-xs font-black text-text-primary uppercase tracking-tight">{item.name}</p>
                        <p className="label-caps mt-1">QTY: {item.quantity} • {formatPrice(item.price)}</p>
                      </div>
                      <p className="text-sm font-black text-text-primary">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logistics */}
              <div className="space-y-6">
                <div>
                  <h4 className="label-caps mb-4">Logistics Management</h4>
                  <div className="card p-6 rounded-sm space-y-4">
                    <div>
                      <label className="label-caps block mb-2">Tracking ID</label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="Enter Tracking ID..."
                          className="flex-grow py-3"
                          value={trackingId}
                          onChange={(e) => setTrackingId(e.target.value)}
                        />
                        <Button onClick={() => handleUpdateTracking(selectedOrder._id)} className="py-3 px-4">Set</Button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <p className="label-caps">Shipping Method</p>
                      <p className="text-[10px] font-black text-text-primary uppercase tracking-tight">{selectedOrder.shipping_method || 'Standard Orbital'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="label-caps mb-4">Shipping Memo</h4>
                  <div className="card p-6 rounded-sm text-sm font-medium text-text-secondary leading-relaxed">
                    {selectedOrder.address}
                  </div>
                </div>

                <div className="bg-surface-dark p-8 rounded-sm text-text-inverse">
                  <div className="flex justify-between items-end mb-4">
                    <span className="label-caps text-text-muted">Total Settlement</span>
                    <span className="text-3xl font-black text-accent">{formatPrice(selectedOrder.total)}</span>
                  </div>
                  <div className="flex items-center gap-2 label-caps text-status-success">
                    <ShieldCheck className="h-4 w-4" />
                    Transaction Verified via Razorpay
                  </div>
                </div>

                <Button
                  variant="secondary"
                  onClick={() => generateInvoice(selectedOrder, null, currency)}
                  className="w-full py-4 text-[10px]"
                >
                  <Download className="h-5 w-5 text-accent" /> Download Tax Invoice
                </Button>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* Refund Confirm Modal */}
      <ConfirmModal
        isOpen={isRefundOpen}
        onClose={() => setIsRefundOpen(false)}
        onConfirm={confirmRefund}
        title="Initiate Refund?"
        message="This will mark the order as Refunded and cannot be undone. Please confirm you want to proceed."
        confirmLabel="Yes, Refund"
        variant="warning"
      />
    </div>
  );
};

export default AdminOrders;
