import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Package,
  Truck, CheckCircle, Clock,
  Loader2, ExternalLink, ShieldCheck,
  DollarSign, RotateCcw, Download
} from 'lucide-react';
import { getAllOrders, updateOrderStatus, updateOrderTracking, refundOrder } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SkeletonTableRows, Input, Table, Badge, Button, EmptyState, Modal, ConfirmModal } from '../../components/common';
import { generateInvoice } from '../../utils/generateInvoice';
import toast from 'react-hot-toast';

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

  // Helper to parse the formatted address string from Checkout
  const parseCustomerDetails = (addressString) => {
    if (!addressString) return { name: 'Unknown Customer', phone: 'N/A', fullAddress: 'No address provided' };
    const lines = addressString.split('\n');
    const name = lines[0];
    const phoneLine = lines.find(l => l.startsWith('Phone:'));
    const phone = phoneLine ? phoneLine.replace('Phone:', '').trim() : 'N/A';
    const fullAddress = lines.filter(l => !l.startsWith('Phone:') && l !== name).join(', ');
    return { name, phone, fullAddress };
  };

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

  const [isSettingTracking, setIsSettingTracking] = useState(false);

  const handleUpdateTracking = async (id) => {
    if (!trackingId.trim()) {
      toast.error('Please enter a tracking ID');
      return;
    }
    setIsSettingTracking(true);
    try {
      await updateOrderTracking(id, trackingId.trim());
      toast.success('Tracking ID saved!');
      setOrders(prev => prev.map(o => o._id === id ? { ...o, tracking_id: trackingId.trim() } : o));
      if (selectedOrder?._id === id) setSelectedOrder(prev => ({ ...prev, tracking_id: trackingId.trim() }));
    } catch (error) {
      toast.error('Failed to update tracking ID');
    } finally {
      setIsSettingTracking(false);
    }
  };

  const confirmRefund = async () => {
    try {
      await refundOrder(refundTarget);
      setOrders(prev => prev.map(o => o._id === refundTarget ? { ...o, status: 'Refunded' } : o));
      if (selectedOrder?._id === refundTarget) setSelectedOrder(prev => ({ ...prev, status: 'Refunded' }));
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to refund order');
    } finally {
      setIsRefundOpen(false);
      setRefundTarget(null);
    }
  };

  const handleExportCSV = () => {
    window.open('http://localhost:8000/api/orders/export', '_blank');
  };

  const filteredOrders = orders.filter(o =>
    o._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Pending Orders', val: orders.filter(o => o.status === 'Pending').length,   icon: Clock,        colorClass: 'text-status-warning bg-status-warning-bg' },
    { label: 'In Transit',    val: orders.filter(o => o.status === 'Shipped').length,    icon: Truck,        colorClass: 'text-accent bg-accent-light' },
    { label: 'Delivered',     val: orders.filter(o => o.status === 'Delivered').length,  icon: CheckCircle,  colorClass: 'text-status-success bg-status-success-bg' },
    { label: 'Refunds',       val: orders.filter(o => o.status === 'Refunded').length,   icon: RotateCcw,    colorClass: 'text-status-danger bg-status-danger-bg' },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-8 border-b border-border-main">
        <div>
          <p className="label-caps text-accent mb-2">Order Processing</p>
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="heading-page">Order <span className="text-accent">Management</span></h1>
            <button onClick={handleExportCSV} className="btn-outline px-4 py-2 text-xs flex items-center gap-2 rounded-sm border-border-main text-text-muted hover:text-accent hover:border-accent/30 transition-all">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>
        <div className="flex bg-card-bg border border-border-main p-1 rounded-sm shadow-sm">
          <button className="px-6 py-2 rounded-sm bg-accent text-text-inverse text-[10px] font-black uppercase tracking-widest shadow-lg">Active</button>
          <button className="px-6 py-2 rounded-sm text-[10px] font-black text-text-muted hover:text-text-primary uppercase tracking-widest transition-all">Archive</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="card rounded-2xl sm:rounded-[32px] p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
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
      <div className="card rounded-2xl sm:rounded-[40px] overflow-hidden">
        <div className="p-5 sm:p-8 border-b border-border-subtle">
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
        <div className="p-4 sm:p-0 overflow-x-auto">
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
              mobileRenderer={(order) => (
                <div className="card rounded-[24px] p-5 space-y-5 border border-border-main bg-card-bg shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-black text-text-primary uppercase tracking-tight">#{order._id.slice(-12).toUpperCase()}</p>
                      <p className="label-caps mt-1">User: {order.user_id?.slice(-6).toUpperCase()}</p>
                    </div>
                    <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 bg-app-bg p-4 rounded-[16px] border border-border-subtle">
                    <div>
                      <p className="text-[9px] text-text-muted font-black uppercase tracking-widest mb-1">Total Amount</p>
                      <p className="text-sm font-black text-text-primary">{formatPrice(order.total)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-text-muted font-black uppercase tracking-widest mb-1">Payment</p>
                      <span className="label-caps flex items-center gap-1.5 mt-1">
                        {order.payment_method === 'COD' ? <DollarSign className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3 text-accent" />}
                        {order.payment_method}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => { setSelectedOrder(order); setTrackingId(order.tracking_id || ''); }}
                    className="w-full py-3.5 bg-app-bg hover:bg-accent hover:text-white text-text-primary font-black text-[10px] uppercase tracking-widest rounded-[12px] transition-all border border-border-main flex items-center justify-center gap-2"
                  >
                    View Order Details <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              )}
              columns={[
                {
                  header: 'Order Details',
                  render: (order) => (
                    <div>
                      <p className="text-xs font-black text-text-primary uppercase tracking-tight">#{order._id.slice(-12).toUpperCase()}</p>
                      <p className="text-[10px] text-text-muted mt-1 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString() || 'Recent'}</p>
                    </div>
                  )
                },
                {
                  header: 'Customer',
                  render: (order) => {
                    const { name, phone } = parseCustomerDetails(order.address);
                    if (order.global_user_id === "GUEST") {
                      return (
                        <div className="block">
                          <p className="text-sm font-bold text-text-primary">{name}</p>
                          <p className="text-[10px] text-text-muted mt-0.5">{phone} • GUEST / DELETED</p>
                        </div>
                      );
                    }
                    return (
                      <Link to={`/admin/users?search=${order.global_user_id || order.user_id}`} className="block group">
                        <p className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">{name}</p>
                        <p className="text-[10px] text-text-muted mt-0.5 group-hover:text-accent/80 transition-colors">{phone} • {order.global_user_id || order.user_id?.slice(-6).toUpperCase()}</p>
                      </Link>
                    );
                  }
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
                  header: 'Status',
                  render: (order) => <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                },
                {
                  header: 'Action',
                  align: 'right',
                  render: (order) => (
                    <div className="flex justify-end">
                      <button
                        onClick={() => { setSelectedOrder(order); setTrackingId(order.tracking_id || ''); }}
                        className="flex items-center gap-2 px-4 py-2 bg-app-bg hover:bg-accent hover:text-white text-text-secondary text-[10px] font-black uppercase tracking-widest rounded-lg border border-border-main transition-colors"
                      >
                        Manage
                        <ExternalLink className="h-3 w-3" />
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
        title="Order Details"
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
                <h4 className="label-caps mb-6">Order Items</h4>
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
                  <h4 className="label-caps mb-4">Shipping & Tracking</h4>
                  <div className="card p-6 rounded-sm space-y-4">
                    <div>
                      <label className="label-caps block mb-2">Tracking ID</label>

                      {/* Only allow setting tracking ONCE: Pending + no tracking ID yet */}
                      {selectedOrder.status === 'Pending' && !selectedOrder.tracking_id ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              placeholder="Assign courier tracking ID..."
                              className="flex-grow py-3"
                              value={trackingId}
                              onChange={(e) => setTrackingId(e.target.value)}
                            />
                            <Button isLoading={isSettingTracking} onClick={() => handleUpdateTracking(selectedOrder._id)} className="py-3 px-4">Assign</Button>
                          </div>
                          <p className="text-[10px] text-status-warning font-bold uppercase tracking-widest">⚠ Once assigned, tracking ID cannot be changed</p>
                        </div>
                      ) : (
                        /* Locked read-only for all other cases */
                        <div className="flex items-center gap-3 p-3 bg-app-bg rounded-sm border border-border-subtle">
                          {selectedOrder.tracking_id ? (
                            <>
                              <span className="font-mono font-black text-text-primary tracking-wider flex-1">{selectedOrder.tracking_id}</span>
                              <span className="text-[9px] font-black uppercase tracking-widest text-status-success bg-status-success-bg px-2 py-1 rounded-sm">🔒 Locked</span>
                            </>
                          ) : (
                            <span className="text-text-muted text-xs italic">No tracking ID assigned</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <p className="label-caps">Shipping Method</p>
                      <p className="text-[10px] font-black text-text-primary uppercase tracking-tight">{selectedOrder.shipping_method || 'Standard'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="label-caps mb-4">Customer & Delivery Details</h4>
                  <div className="card p-6 rounded-sm space-y-4">
                    {(() => {
                      const { name, phone, fullAddress } = parseCustomerDetails(selectedOrder.address);
                      const isGuest = selectedOrder.global_user_id === "GUEST";
                      return (
                        <>
                          {isGuest ? (
                            <div className="flex justify-between items-center pb-4 border-b border-border-subtle">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-surface-dark text-text-muted flex items-center justify-center font-black text-lg">
                                  {name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-text-primary">{name}</p>
                                  <p className="text-xs text-text-muted mt-0.5">{phone} • DELETED ACCOUNT</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <Link to={`/admin/users?search=${selectedOrder.global_user_id || selectedOrder.user_id}`} className="flex justify-between items-center pb-4 border-b border-border-subtle group">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-accent-light text-accent flex items-center justify-center font-black text-lg group-hover:bg-accent group-hover:text-white transition-colors">
                                  {name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-text-primary group-hover:text-accent transition-colors">{name}</p>
                                  <p className="text-xs text-text-muted mt-0.5 group-hover:text-accent/80 transition-colors">{phone}</p>
                                </div>
                              </div>
                              <ExternalLink className="h-4 w-4 text-text-muted group-hover:text-accent transition-colors" />
                            </Link>
                          )}
                          <div>
                            <p className="label-caps mb-1 text-text-muted">Delivery Address</p>
                            <p className="text-sm font-medium text-text-secondary leading-relaxed">
                              {fullAddress}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="bg-surface-dark p-8 rounded-sm text-text-inverse">
                  <div className="flex justify-between items-end mb-4">
                    <span className="label-caps text-text-muted">Total Settlement</span>
                    <span className="text-3xl font-black text-accent">{formatPrice(selectedOrder.total)}</span>
                  </div>
                  <div className="flex items-center gap-2 label-caps text-status-success">
                    <ShieldCheck className="h-4 w-4" />
                    Transaction Verified via Cashfree
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
