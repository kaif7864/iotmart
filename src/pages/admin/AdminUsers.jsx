import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Users, Search,
  ShieldCheck, Shield,
  Ban, CheckSquare, Trash2,
  Package, DollarSign, Clock, ExternalLink
} from 'lucide-react';
import { getUsers, updateUserRole, updateUserStatus, getUserOrders } from '../../services/api';
import { SkeletonTableRows, Input, Table, Badge, Button, EmptyState, ConfirmModal, Modal } from '../../components/common';
import { useAuth } from '../../context/AuthContext';

const AdminUsers = () => {
  const { formatPrice } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('search') || '';
  });
  const [confirmState, setConfirmState] = useState({ open: false, userId: null, newStatus: null, message: '' });

  // User Profile Modal State
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get('search');
    if (search !== null) {
      setSearchTerm(search);
    }
  }, [location.search]);

  useEffect(() => { fetchUsers(); }, []);

  const openUserProfile = async (user) => {
    setSelectedProfile(user);
    setLoadingOrders(true);
    try {
      const orders = await getUserOrders(user._id);
      setUserOrders(orders);
    } catch (err) {
      console.error(err);
      setUserOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = (e, user) => {
    e.stopPropagation();
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    setConfirmState({
      open: true,
      userId: user._id,
      newStatus,
      message: `Are you sure you want to ${newStatus === 'blocked' ? 'suspend' : 'restore'} this engineer's access?`,
    });
  };

  const handleDeleteUser = (e, user) => {
    e.stopPropagation();
    setConfirmState({
      open: true,
      userId: user._id,
      newStatus: 'delete',
      message: `Are you sure you want to permanently delete this engineer's account? This action cannot be undone.`,
    });
  };

  const confirmStatusChange = async () => {
    try {
      if (confirmState.newStatus === 'delete') {
        const { deleteUser } = await import('../../services/api');
        await deleteUser(confirmState.userId);
        setUsers(prev => prev.filter(u => u._id !== confirmState.userId));
      } else if (confirmState.newStatus.startsWith('role_')) {
        const newRole = confirmState.newStatus.split('_')[1];
        await updateUserRole(confirmState.userId, newRole);
        setUsers(prev => prev.map(u => u._id === confirmState.userId ? { ...u, role: newRole } : u));
      } else {
        await updateUserStatus(confirmState.userId, confirmState.newStatus);
        setUsers(prev => prev.map(u => u._id === confirmState.userId ? { ...u, status: confirmState.newStatus } : u));
      }
    } catch (error) {
      alert(error.response?.data?.detail || error.message || 'Operation failed');
    }
    setConfirmState({ open: false, userId: null, newStatus: null, message: '' });
  };

  const handleToggleRole = (e, user) => {
    e.stopPropagation();
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    setConfirmState({
      open: true,
      userId: user._id,
      newStatus: `role_${newRole}`,
      message: `Are you sure you want to change this engineer's clearance level to ${newRole === 'admin' ? 'System Admin' : 'Field Engineer'}?`,
    });
  };

  const filteredUsers = users.filter(u => {
    const fullName = (u.name || `${u.first_name || ''} ${u.last_name || ''}`).toLowerCase();
    const userEmail = (u.email || '').toLowerCase();
    const mongoId = (u._id || '').toLowerCase();
    const globalUserId = (u.user_id || '').toLowerCase();
    const search = (searchTerm || '').toLowerCase().trim();
    
    if (!search) return true;
    return fullName.includes(search) || userEmail.includes(search) || mongoId.includes(search) || globalUserId.includes(search);
  });

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12 pb-8 border-b border-border-main">
        <div>
          <p className="label-caps text-accent mb-2">Personnel Registry</p>
          <h1 className="heading-page">Engineer <span className="text-accent">Directory</span></h1>
        </div>
        <div className="card px-6 py-4 rounded-sm flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-accent" />
          <div className="text-right">
            <p className="label-caps">Active Admins</p>
            <p className="text-sm font-black text-text-primary">{users.filter(u => u.role === 'admin').length}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card rounded-[32px] p-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            type="text"
            placeholder="Search by name or email..."
            className="pl-14 py-4"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <SkeletonTableRows rows={6} cols={4} />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Engineers Found"
          description="We couldn't find any personnel matching your search."
        />
      ) : (
        <Table
          keyField="_id"
          data={filteredUsers}
          onRowClick={(u) => openUserProfile(u)}
          columns={[
            {
              header: 'Engineer Identity',
              render: (u) => (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-sm bg-surface-dark flex items-center justify-center text-text-inverse font-black text-lg flex-shrink-0">
                    {(u.name || u.first_name || 'U').charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-black text-text-primary uppercase tracking-tight">{u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unknown User'}</p>
                    <p className="label-caps lowercase mt-1">{u.email} <span className="uppercase text-text-muted">| ID: {u.user_id}</span></p>
                  </div>
                </div>
              )
            },
            {
              header: 'Clearance Level',
              render: (u) => (
                <Badge variant={u.role === 'admin' ? 'info' : 'default'}>
                  {u.role === 'admin' ? 'System Admin' : 'Field Engineer'}
                </Badge>
              )
            },
            {
              header: 'Account Status',
              render: (u) => (
                <div className={`flex items-center gap-2 label-caps ${u.status === 'active' ? 'text-status-success' : 'text-status-danger'}`}>
                  <div className={`w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-status-success' : 'bg-status-danger'}`} />
                  {u.status === 'active' ? 'Operational' : 'Suspended'}
                </div>
              )
            },
            {
              header: 'Access Control',
              render: (u) => (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={(e) => handleToggleRole(e, u)}
                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${u.role === 'admin' ? 'bg-status-info-bg text-accent' : 'text-text-muted hover:text-accent hover:bg-accent-light'}`}
                    title="Toggle Admin Access"
                  >
                    <Shield className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => handleToggleStatus(e, u)}
                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${u.status === 'active' ? 'text-text-muted hover:text-status-danger hover:bg-status-danger-bg' : 'bg-status-danger-bg text-status-danger'}`}
                    title={u.status === 'active' ? 'Suspend Access' : 'Restore Access'}
                  >
                    {u.status === 'active' ? <Ban className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={(e) => handleDeleteUser(e, u)}
                    className="w-9 h-9 flex items-center justify-center rounded-full text-text-muted hover:text-status-danger hover:bg-status-danger-bg transition-all"
                    title="Permanently Delete Engineer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            }
          ]}
        />
      )}

      {/* Status Change Confirm Modal */}
      <ConfirmModal
        isOpen={confirmState.open}
        onClose={() => setConfirmState({ open: false, userId: null, newStatus: null, message: '' })}
        onConfirm={confirmStatusChange}
        title={confirmState.newStatus === 'delete' ? 'Delete Engineer?' : confirmState.newStatus === 'blocked' ? 'Suspend Engineer?' : confirmState.newStatus?.startsWith('role_') ? 'Change Clearance?' : 'Restore Access?'}
        message={confirmState.message}
        confirmLabel={confirmState.newStatus === 'delete' ? 'Delete Permanently' : confirmState.newStatus === 'blocked' ? 'Suspend' : confirmState.newStatus?.startsWith('role_') ? 'Confirm Change' : 'Restore'}
        variant={confirmState.newStatus === 'delete' || confirmState.newStatus === 'blocked' ? 'danger' : 'info'}
      />

      {/* Complete User Profile Modal */}
      <Modal
        isOpen={!!selectedProfile}
        onClose={() => setSelectedProfile(null)}
        title="Personnel Record"
        maxWidth="max-w-4xl"
      >
        {selectedProfile && (
          <div className="space-y-10">
            {/* Header / Basic Info */}
            <div className="flex flex-col md:flex-row gap-8 items-start border-b border-border-subtle pb-10">
              <div className="w-32 h-32 rounded-3xl bg-accent/10 border-2 border-accent/20 flex items-center justify-center text-accent font-black text-6xl shadow-inner">
                {(selectedProfile.name || selectedProfile.first_name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-3xl font-black text-text-primary tracking-tight">
                      {selectedProfile.name || `${selectedProfile.first_name || ''} ${selectedProfile.last_name || ''}`.trim() || 'Unknown User'}
                    </h2>
                    <Badge variant={selectedProfile.role === 'admin' ? 'info' : 'default'}>
                      {selectedProfile.role === 'admin' ? 'System Admin' : 'Field Engineer'}
                    </Badge>
                  </div>
                  <p className="text-sm font-bold text-text-muted">{selectedProfile.email} • ID: {selectedProfile.user_id}</p>
                </div>
                
                <div className="flex gap-4">
                  <div className="card px-4 py-3 rounded-xl border border-border-main flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${selectedProfile.status === 'active' ? 'bg-status-success' : 'bg-status-danger'}`} />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Account Status</p>
                      <p className="text-sm font-bold text-text-primary">{selectedProfile.status === 'active' ? 'Operational' : 'Suspended'}</p>
                    </div>
                  </div>
                  <div className="card px-4 py-3 rounded-xl border border-border-main flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-accent" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Security Level</p>
                      <p className="text-sm font-bold text-text-primary">Level {selectedProfile.role === 'admin' ? '5 (Max)' : '1 (Standard)'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order History */}
            <div>
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="text-lg font-black text-text-primary uppercase tracking-tight flex items-center gap-2">
                    <Package className="h-5 w-5 text-accent" /> Requisition History
                  </h3>
                  <p className="text-xs text-text-muted mt-1">Total hardware requested by this engineer</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Total Spent</p>
                  <p className="text-xl font-black text-accent">{formatPrice(userOrders.reduce((acc, curr) => acc + curr.total, 0))}</p>
                </div>
              </div>

              {loadingOrders ? (
                <SkeletonTableRows rows={3} cols={4} />
              ) : userOrders.length === 0 ? (
                <EmptyState icon={Package} title="No Records" description="This engineer has not placed any orders yet." />
              ) : (
                <div className="overflow-x-auto rounded-2xl border-2 border-border-main bg-card-bg">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-app-bg/80 border-b-2 border-border-main">
                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Order ID & Date</th>
                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Items</th>
                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted text-right">Amount</th>
                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {userOrders.map((order, idx) => (
                        <tr key={order._id} className="hover:bg-app-bg/60 transition-colors">
                          <td className="p-4">
                            <p className="text-xs font-black text-text-primary uppercase">#{order._id.slice(-8)}</p>
                            <p className="text-[10px] text-text-muted mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm font-bold text-text-primary">{order.items?.length || 0} items</p>
                            <p className="text-[10px] text-text-muted truncate max-w-[150px]">
                              {order.items?.map(i => i.name).join(', ')}
                            </p>
                          </td>
                          <td className="p-4 text-right">
                            <p className="text-sm font-black text-text-primary">{formatPrice(order.total)}</p>
                          </td>
                          <td className="p-4">
                            <Badge variant={order.status === 'Delivered' ? 'success' : order.status === 'Shipped' ? 'info' : 'warning'}>
                              {order.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="flex justify-end pt-4">
              <Link to={`/admin/orders?search=${selectedProfile._id}`}>
                 <Button variant="secondary" className="text-xs">
                   View All Orders in Registry <ExternalLink className="h-3 w-3 inline ml-1" />
                 </Button>
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsers;
