import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, MoreVertical, 
  Mail, Shield, ShieldCheck, ShieldAlert,
  Loader2, Trash2, X, Clock, CheckCircle,
  Ban, CheckSquare
} from 'lucide-react';
import { getUsers, updateUserRole, updateUserStatus } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

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
            <div className="bg-white px-6 py-4 rounded-2xl border border-border-main shadow-sm flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-accent" />
                <div className="text-right">
                    <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">Active Admins</p>
                    <p className="text-sm font-black text-text-primary">{users.filter(u => u.role === 'admin').length}</p>
                </div>
            </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-6 rounded-[32px] border border-border-main flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input 
            type="text" 
            placeholder="Search by name, email or clearance..." 
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-border-main rounded-2xl text-sm font-medium focus:border-accent outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-[40px] border border-border-main shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-border-main">
                <th className="py-6 px-8 text-[10px] font-black text-text-muted uppercase tracking-widest">Engineer Identity</th>
                <th className="py-6 px-8 text-[10px] font-black text-text-muted uppercase tracking-widest">Clearance Level</th>
                <th className="py-6 px-8 text-[10px] font-black text-text-muted uppercase tracking-widest">Deployment Status</th>
                <th className="py-6 px-8 text-[10px] font-black text-text-muted uppercase tracking-widest text-right">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="4" className="py-20 text-center"><Loader2 className="h-10 w-10 text-accent animate-spin mx-auto" /></td></tr>
              ) : filteredUsers.map(u => (
                <tr key={u._id} className="group hover:bg-slate-50/50 transition-all">
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-lg">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-text-primary uppercase tracking-tight">{u.name}</p>
                        <p className="text-[10px] text-text-muted font-bold lowercase mt-1">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-8">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        u.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                        {u.role === 'admin' ? 'System Admin' : 'Field Engineer'}
                    </span>
                  </td>
                  <td className="py-6 px-8">
                    <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${u.status === 'active' ? 'text-emerald-600' : 'text-red-500'}`}>
                      <div className={`w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
                      {u.status === 'active' ? 'Operational' : 'Suspended'}
                    </div>
                  </td>
                  <td className="py-6 px-8 text-right space-x-2">
                    <button 
                        onClick={() => handleToggleRole(u)}
                        className={`p-3 rounded-xl transition-all ${u.role === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-text-muted hover:text-indigo-600'}`}
                        title="Toggle Admin Access"
                    >
                        <Shield className="h-4 w-4" />
                    </button>
                    <button 
                        onClick={() => handleToggleStatus(u)}
                        className={`p-3 rounded-xl transition-all ${u.status === 'active' ? 'bg-slate-50 text-text-muted hover:text-red-500' : 'bg-red-50 text-red-500'}`}
                        title={u.status === 'active' ? 'Suspend Access' : 'Restore Access'}
                    >
                        {u.status === 'active' ? <Ban className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
