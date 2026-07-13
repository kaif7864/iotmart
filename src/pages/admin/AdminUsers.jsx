import React, { useState, useEffect } from 'react';
import {
  Users, Search,
  ShieldCheck, Shield,
  Ban, CheckSquare
} from 'lucide-react';
import { getUsers, updateUserRole, updateUserStatus } from '../../services/api';
import { SkeletonTableRows, Input, Table, Badge, Button, EmptyState, ConfirmModal } from '../../components/common';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, userId: null, newStatus: null, message: '' });

  useEffect(() => { fetchUsers(); }, []);

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

  const handleToggleStatus = (user) => {
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    setConfirmState({
      open: true,
      userId: user._id,
      newStatus,
      message: `Are you sure you want to ${newStatus === 'blocked' ? 'suspend' : 'restore'} this engineer's access?`,
    });
  };

  const confirmStatusChange = async () => {
    try {
      await updateUserStatus(confirmState.userId, confirmState.newStatus);
      setUsers(prev => prev.map(u => u._id === confirmState.userId ? { ...u, status: confirmState.newStatus } : u));
    } catch (error) {
      alert('Status update failed');
    }
    setConfirmState({ open: false, userId: null, newStatus: null, message: '' });
  };

  const handleToggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await updateUserRole(user._id, newRole);
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, role: newRole } : u));
    } catch (error) {
      alert('Role update failed');
    }
  };

  const filteredUsers = users.filter(u => {
    const fullName = (u.name || `${u.first_name || ''} ${u.last_name || ''}`).toLowerCase();
    const userEmail = (u.email || '').toLowerCase();
    const search = (searchTerm || '').toLowerCase();
    return fullName.includes(search) || userEmail.includes(search);
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
                    <p className="label-caps lowercase mt-1">{u.email}</p>
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
                    onClick={() => handleToggleRole(u)}
                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${u.role === 'admin' ? 'bg-status-info-bg text-accent' : 'text-text-muted hover:text-accent hover:bg-accent-light'}`}
                    title="Toggle Admin Access"
                  >
                    <Shield className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(u)}
                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${u.status === 'active' ? 'text-text-muted hover:text-status-danger hover:bg-status-danger-bg' : 'bg-status-danger-bg text-status-danger'}`}
                    title={u.status === 'active' ? 'Suspend Access' : 'Restore Access'}
                  >
                    {u.status === 'active' ? <Ban className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
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
        title={confirmState.newStatus === 'blocked' ? 'Suspend Engineer?' : 'Restore Access?'}
        message={confirmState.message}
        confirmLabel={confirmState.newStatus === 'blocked' ? 'Suspend' : 'Restore'}
        variant={confirmState.newStatus === 'blocked' ? 'danger' : 'info'}
      />
    </div>
  );
};

export default AdminUsers;
