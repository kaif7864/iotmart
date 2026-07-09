import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, MoreVertical, 
  Mail, Shield, ShieldCheck, ShieldAlert,
  Loader2, Trash2, X, Clock, CheckCircle,
  Ban, CheckSquare
} from 'lucide-react';
import { getUsers, updateUserRole, updateUserStatus } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Input, Table, Badge, Button, EmptyState } from '../../components/common';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    if (window.confirm(`Are you sure you want to ${newStatus} this engineer?`)) {
        try {
            await updateUserStatus(user._id, newStatus);
            setUsers(prev => prev.map(u => u._id === user._id ? { ...u, status: newStatus } : u));
        } catch (error) {
            alert("Status update failed");
        }
    }
  };

  const handleToggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
        await updateUserRole(user._id, newRole);
        setUsers(prev => prev.map(u => u._id === user._id ? { ...u, role: newRole } : u));
    } catch (error) {
        alert("Role update failed");
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12 pb-8 border-b border-border-main">
        <div>
          <p className="text-accent text-[10px] font-black uppercase tracking-[0.3em] mb-2">Personnel Registry</p>
          <h1 className="text-4xl font-black text-text-primary tracking-tighter uppercase">Engineer <span className="text-accent">Directory</span></h1>
        </div>
        <div className="flex gap-4">
            <div className="bg-card-bg px-6 py-4 rounded-sm border border-border-main shadow-sm flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-accent" />
                <div className="text-right">
                    <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">Active Admins</p>
                    <p className="text-sm font-black text-text-primary">{users.filter(u => u.role === 'admin').length}</p>
                </div>
            </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-card-bg p-6 rounded-[32px] border border-border-main flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted z-10" />
          <Input 
            type="text" 
            placeholder="Search by name, email or clearance..." 
            className="pl-14 py-4"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="py-20 text-center"><Loader2 className="h-10 w-10 text-accent animate-spin mx-auto" /></div>
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
                  <div className="w-12 h-12 rounded-sm bg-surface-dark flex items-center justify-center text-white font-black text-lg">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-black text-text-primary uppercase tracking-tight">{u.name}</p>
                    <p className="text-[10px] text-text-muted font-bold lowercase mt-1">{u.email}</p>
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
                <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${u.status === 'active' ? 'text-emerald-600' : 'text-status-danger'}`}>
                  <div className={`w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-status-success shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-status-danger'}`}></div>
                  {u.status === 'active' ? 'Operational' : 'Suspended'}
                </div>
              )
            },
            {
              header: 'Access Control',
              render: (u) => (
                <div className="flex justify-end space-x-2">
                  <button 
                    onClick={() => handleToggleRole(u)}
                    className={`p-3 rounded-sm transition-all ${u.role === 'admin' ? 'bg-status-info-bg text-accent' : 'bg-app-bg text-text-muted hover:text-accent'}`}
                    title="Toggle Admin Access"
                  >
                    <Shield className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleToggleStatus(u)}
                    className={`p-3 rounded-sm transition-all ${u.status === 'active' ? 'bg-app-bg text-text-muted hover:text-status-danger' : 'bg-red-50 text-status-danger'}`}
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
    </div>
  );
};

export default AdminUsers;
