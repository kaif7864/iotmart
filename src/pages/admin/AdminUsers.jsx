import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Users, Search, ShieldCheck, Shield, Ban, CheckSquare,
  Trash2, Package, ExternalLink, ArrowRight, X, Loader2,
  TrendingUp, UserCheck, UserX, Activity, ArrowUpRight
} from 'lucide-react';
import { getUsers, updateUserRole, updateUserStatus, getUserOrders } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Avatar colors ────────────────────────────────────────────────────────────
const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];
const avatarColor = (str = '') => PALETTE[str.charCodeAt(0) % PALETTE.length];
const getName = (u) => (u?.name || `${u?.first_name || ''} ${u?.last_name || ''}`.trim() || 'Unknown').trim();

// ─── Animated Counter ────────────────────────────────────────────────────────
const AnimatedNumber = ({ value }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const end = parseInt(value, 10) || 0;
    if (end === 0) { setDisplay(0); return; }
    let cur = 0;
    const step = Math.max(Math.floor(600 / end), 8);
    const t = setInterval(() => { cur++; setDisplay(cur); if (cur >= end) clearInterval(t); }, step);
    return () => clearInterval(t);
  }, [value]);
  return <>{display}</>;
};

// ─── Premium Stat Card — Progress Bar Style (improved, NOT dashboard clone) ──
const StatCard = ({ label, value, total, icon: Icon, color, sub }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="card rounded-2xl p-6 relative overflow-hidden cursor-default group transition-shadow duration-300 hover:shadow-xl"
    >
      {/* Soft glow orb */}
      <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full blur-2xl opacity-15 group-hover:opacity-25 transition-opacity"
        style={{ background: color }} />

      {/* Large decorative background icon */}
      <Icon className="absolute -right-3 -bottom-2 w-24 h-24 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity"
        style={{ color }} />

      {/* Top row: icon pill + percentage badge */}
      <div className="flex items-start justify-between mb-5">
        <div className="p-2.5 rounded-xl" style={{ background: color + '20' }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg"
            style={{ background: color + '15', color }}>
            {pct}%
          </span>
        </div>
      </div>

      {/* Number */}
      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-3xl font-black text-text-primary tracking-tighter mb-1">
        <AnimatedNumber value={value} />
      </h4>
      {sub && <p className="text-[10px] font-bold text-text-muted mb-4">{sub}</p>}
      {!sub && <div className="mb-4" />}

      {/* Animated glowing progress bar */}
      <div className="h-1.5 bg-border-subtle rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.4, duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
          className="h-full rounded-full relative"
          style={{ background: `linear-gradient(90deg, ${color}99, ${color})` }}
        >
          {/* Sheen sweep on the bar */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
        </motion.div>
      </div>
    </motion.div>
  );
};


// ─── Pill Styles ─────────────────────────────────────────────────────────────
const statusStyle = (s) => s === 'active'
  ? 'bg-status-success-bg text-status-success border border-status-success/20'
  : 'bg-status-danger-bg text-status-danger border border-status-danger/20';

const roleStyle = (r) => r === 'admin'
  ? 'bg-accent/10 text-accent border border-accent/20'
  : 'bg-app-bg text-text-muted border border-border-main';

// ─── Table Column Grid ── (must be identical in header + rows) ────────────────
// grid-cols: [avatar+name=2fr] [role=120px] [status=120px] [joined=110px] [actions=140px]
const ROW_GRID = 'grid grid-cols-[1fr_120px_120px_110px_140px] items-center gap-4 px-6';

// ─── User Row ─────────────────────────────────────────────────────────────────
const UserRow = ({ user, idx, onClick, onToggleStatus, onToggleRole, onDelete }) => {
  const name = getName(user);
  const color = avatarColor(name);

  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.025 }}
      onClick={() => onClick(user)}
      className={`group flex flex-col md:grid md:grid-cols-[1fr_120px_120px_110px_140px] md:items-center gap-3 md:gap-4 p-4 md:px-6 md:py-3.5 bg-card-bg md:bg-app-bg md:hover:bg-card-bg border border-border-main md:border-0 md:border-b md:border-border-subtle rounded-2xl md:rounded-none transition-all cursor-pointer relative last:border-0 mx-2 md:mx-0 mb-3 md:mb-0 shadow-sm md:shadow-none`}
    >
      {/* Left accent bar */}
      <div className="hidden md:block absolute left-0 top-0 bottom-0 w-1 bg-accent scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />

      {/* Customer (name + email + avatar) & Mobile Top Row */}
      <div className="flex items-center justify-between md:justify-start gap-3 min-w-0 border-b border-border-subtle md:border-0 pb-3 md:pb-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 md:w-9 md:h-9 rounded-xl flex items-center justify-center font-black text-sm text-white flex-shrink-0 shadow-inner"
            style={{ background: color }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-text-primary truncate leading-tight">{name}</p>
            <p className="text-[10px] font-bold text-text-muted truncate mt-0.5">{user.email}</p>
          </div>
        </div>
        {/* Mobile View Arrow */}
        <div className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-text-muted bg-app-bg border border-border-main flex-shrink-0">
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Role */}
      <div className="flex md:block items-center justify-between">
        <span className="md:hidden text-[10px] font-black text-text-muted uppercase tracking-widest">Role</span>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${roleStyle(user.role)}`}>
          {user.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <Users className="w-3 h-3" />}
          {user.role === 'admin' ? 'Admin' : 'Customer'}
        </span>
      </div>

      {/* Status */}
      <div className="flex md:block items-center justify-between">
        <span className="md:hidden text-[10px] font-black text-text-muted uppercase tracking-widest">Status</span>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${statusStyle(user.status)}`}>
          <div className={`w-1.5 h-1.5 rounded-full bg-current ${user.status === 'active' ? 'animate-pulse' : ''}`} />
          {user.status === 'active' ? 'Active' : 'Suspended'}
        </span>
      </div>

      {/* Joined */}
      <div className="flex md:block items-center justify-between">
        <span className="md:hidden text-[10px] font-black text-text-muted uppercase tracking-widest">Joined</span>
        <p className="text-[10px] md:text-[10px] font-bold text-text-primary md:text-text-muted">
          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 justify-end pt-3 md:pt-0 border-t border-border-subtle md:border-0" onClick={e => e.stopPropagation()}>
        <button onClick={() => onToggleRole(user)} title={user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${user.role === 'admin' ? 'bg-accent/15 text-accent md:opacity-100' : 'text-text-primary md:text-text-muted hover:bg-accent/10 hover:text-accent border border-border-main md:border-0 bg-app-bg md:bg-transparent md:opacity-0 group-hover:opacity-100'}`}>
          <Shield className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onToggleStatus(user)} title={user.status === 'active' ? 'Suspend' : 'Restore'}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${user.status !== 'active' ? 'bg-status-danger-bg text-status-danger md:opacity-100' : 'text-text-primary md:text-text-muted hover:bg-status-danger-bg hover:text-status-danger border border-border-main md:border-0 bg-app-bg md:bg-transparent md:opacity-0 group-hover:opacity-100'}`}>
          {user.status === 'active' ? <Ban className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
        </button>
        <button onClick={() => onDelete(user)} title="Delete Account"
          className="w-8 h-8 rounded-xl flex items-center justify-center text-text-primary md:text-text-muted hover:bg-status-danger-bg hover:text-status-danger transition-all border border-border-main md:border-0 bg-app-bg md:bg-transparent md:opacity-0 group-hover:opacity-100">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <div className="hidden md:flex w-8 h-8 rounded-full items-center justify-center text-text-muted group-hover:bg-accent/10 group-hover:text-accent transition-all">
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
};

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
const ConfirmDialog = ({ state, onClose, onConfirm }) => {
  const isDanger = state.newStatus === 'delete' || state.newStatus === 'blocked';
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-card-bg rounded-3xl border border-border-main shadow-2xl p-8 max-w-md w-full"
        onClick={e => e.stopPropagation()}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${isDanger ? 'bg-status-danger-bg' : 'bg-accent/10'}`}>
          {isDanger ? <Trash2 className="w-6 h-6 text-status-danger" /> : <Shield className="w-6 h-6 text-accent" />}
        </div>
        <h3 className="text-xl font-black text-text-primary tracking-tight mb-2">
          {state.newStatus === 'delete' ? 'Delete Account?' : state.newStatus === 'blocked' ? 'Suspend User?' : state.newStatus?.startsWith('role_') ? 'Change Role?' : 'Restore Access?'}
        </h3>
        <p className="text-sm font-medium text-text-muted leading-relaxed mb-7">{state.message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-app-bg border border-border-main text-text-primary font-black text-xs uppercase tracking-widest hover:border-accent transition-all">
            Cancel
          </button>
          <button onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all text-white ${isDanger ? 'bg-status-danger shadow-lg shadow-status-danger/20' : 'bg-accent shadow-lg shadow-accent/20'}`}>
            Confirm
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── User Profile Drawer ──────────────────────────────────────────────────────
const UserDrawer = ({ user, orders, loadingOrders, onClose, formatPrice }) => {
  const name = getName(user);
  const color = avatarColor(name);
  const totalSpent = orders.reduce((a, o) => a + (o.total || 0), 0);

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end p-3 sm:p-5"
        onClick={onClose}>
        <motion.div initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 200 }}
          className="bg-card-bg w-full max-w-[540px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-border-main"
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-7 py-5 border-b border-border-subtle bg-app-bg flex-shrink-0">
            <div>
              <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-1">Customer Profile</p>
              <h3 className="text-xl font-black text-text-primary tracking-tight">{name}</h3>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-xl bg-card-bg border border-border-main text-text-muted hover:text-text-primary hover:border-accent transition-all flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto px-7 py-6 space-y-6">
            {/* Identity */}
            <div className="p-5 bg-card-bg border border-border-main rounded-2xl flex gap-4 items-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl text-white flex-shrink-0 shadow-lg"
                style={{ background: color }}>
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-base font-black text-text-primary">{name}</p>
                <p className="text-xs font-bold text-text-muted mt-0.5 truncate">{user.email}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${roleStyle(user.role)}`}>
                    {user.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                    {user.role === 'admin' ? 'Admin' : 'Customer'}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${statusStyle(user.status)}`}>
                    <div className={`w-1.5 h-1.5 rounded-full bg-current ${user.status === 'active' ? 'animate-pulse' : ''}`} />
                    {user.status === 'active' ? 'Active' : 'Suspended'}
                  </span>
                </div>
              </div>
            </div>

            {/* Spend Summary — Dark Card */}
            <div className="bg-surface-dark rounded-3xl p-7 text-white relative overflow-hidden shadow-xl">
              <div className="absolute -right-8 -top-8 w-40 h-40 bg-accent rounded-full blur-3xl opacity-25 pointer-events-none" />
              <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-purple-600 rounded-full blur-3xl opacity-15 pointer-events-none" />
              <div className="relative z-10">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/40 mb-1">Lifetime Spend</p>
                <p className="text-4xl font-black tracking-tighter mb-5">{formatPrice(totalSpent)}</p>
                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/40">
                    <Package className="w-3.5 h-3.5" /> {orders.length} Orders
                  </div>
                  {orders.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-300 bg-emerald-500/20 px-3 py-1.5 rounded-lg">
                      <TrendingUp className="w-3.5 h-3.5" /> Avg {formatPrice(totalSpent / orders.length)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order History */}
            <div>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Order History ({orders.length})</p>
              {loadingOrders ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center bg-card-bg border border-border-main rounded-2xl">
                  <Package className="w-12 h-12 text-text-muted opacity-20 mb-3" />
                  <p className="text-xs font-black text-text-muted uppercase tracking-widest">No Orders Yet</p>
                </div>
              ) : (
                <div className="bg-card-bg border border-border-main rounded-2xl overflow-hidden divide-y divide-border-subtle">
                  {orders.map((order) => (
                    <div key={order._id} className="flex items-center gap-4 p-4 hover:bg-app-bg transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-app-bg border border-border-subtle flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-text-muted" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-xs font-black text-text-primary">#{order._id.slice(-8).toUpperCase()}</p>
                        <p className="text-[10px] font-bold text-text-muted mt-0.5">
                          {order.items?.length || 0} item(s) • {new Date(order.createdAt).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-black text-text-primary">{formatPrice(order.total)}</p>
                        <span className={`inline-flex text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md mt-1 ${
                          order.status === 'Delivered' ? 'bg-status-success-bg text-status-success' :
                          order.status === 'Shipped' ? 'bg-accent/10 text-accent' :
                          'bg-status-warning-bg text-status-warning'
                        }`}>{order.status}</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-3.5 bg-app-bg">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Total</p>
                    <p className="text-sm font-black text-text-primary">{formatPrice(totalSpent)}</p>
                  </div>
                </div>
              )}
            </div>

            <Link to={`/admin/orders?search=${user._id}`}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-app-bg border border-border-main text-text-muted hover:text-accent hover:border-accent text-[10px] font-black uppercase tracking-widest transition-all">
              View All Orders <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const AdminUsers = () => {
  const { formatPrice } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState(() => new URLSearchParams(location.search).get('search') || '');
  const [roleFilter, setRoleFilter] = useState('All');
  const [confirmState, setConfirmState] = useState({ open: false, userId: null, newStatus: null, message: '' });
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    const s = new URLSearchParams(location.search).get('search');
    if (s !== null) setSearchTerm(s);
  }, [location.search]);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try { setUsers(await getUsers()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openProfile = async (user) => {
    setSelectedProfile(user);
    setLoadingOrders(true);
    try { setUserOrders(await getUserOrders(user._id)); }
    catch { setUserOrders([]); }
    finally { setLoadingOrders(false); }
  };

  const openConfirm = (userId, newStatus, message) =>
    setConfirmState({ open: true, userId, newStatus, message });

  const handleToggleStatus = (user) =>
    openConfirm(user._id, user.status === 'active' ? 'blocked' : 'active',
      `Are you sure you want to ${user.status === 'active' ? 'suspend' : 'restore'} this user?`);

  const handleToggleRole = (user) => {
    const r = user.role === 'admin' ? 'user' : 'admin';
    openConfirm(user._id, `role_${r}`, `Change role to ${r === 'admin' ? 'Admin' : 'Customer'}?`);
  };

  const handleDelete = (user) =>
    openConfirm(user._id, 'delete', 'Permanently delete this account? This cannot be undone.');

  const confirmAction = async () => {
    try {
      if (confirmState.newStatus === 'delete') {
        const { deleteUser } = await import('../../services/api');
        await deleteUser(confirmState.userId);
        setUsers(p => p.filter(u => u._id !== confirmState.userId));
      } else if (confirmState.newStatus?.startsWith('role_')) {
        const r = confirmState.newStatus.split('_')[1];
        await updateUserRole(confirmState.userId, r);
        setUsers(p => p.map(u => u._id === confirmState.userId ? { ...u, role: r } : u));
      } else {
        await updateUserStatus(confirmState.userId, confirmState.newStatus);
        setUsers(p => p.map(u => u._id === confirmState.userId ? { ...u, status: confirmState.newStatus } : u));
      }
    } catch (e) { alert(e.response?.data?.detail || e.message || 'Failed'); }
    setConfirmState({ open: false, userId: null, newStatus: null, message: '' });
  };

  const filtered = users.filter(u => {
    // Role/Status filter
    if (roleFilter === 'Active' && u.status !== 'active') return false;
    if (roleFilter === 'Suspended' && u.status === 'active') return false;
    if (roleFilter === 'Admin' && u.role !== 'admin') return false;
    if (roleFilter === 'Customer' && u.role !== 'user') return false;
    // Search filter
    const t = (searchTerm || '').toLowerCase().trim();
    if (!t) return true;
    return getName(u).toLowerCase().includes(t)
      || (u.email || '').toLowerCase().includes(t)
      || (u._id || '').includes(t);
  });

  const activeCount = users.filter(u => u.status === 'active').length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const suspendedCount = users.filter(u => u.status !== 'active').length;

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-subtle pb-6">
        <div>
          <p className="text-[10px] font-black text-accent uppercase tracking-[0.25em] mb-1">Personnel Registry</p>
          <h1 className="text-3xl font-black text-text-primary tracking-tighter">
            Customer <span className="text-accent">Directory</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-widest bg-app-bg border border-border-main px-4 py-2.5 rounded-xl">
          <Activity className="w-4 h-4 text-accent" />
          {users.length} Registered Users
        </div>
      </div>

      {/* Stat Cards — Premium Progress Bar Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard label="Total Users" value={users.length} total={users.length}
          icon={Users} color="#6366f1" sub="All registered accounts" />
        <StatCard label="Active Users" value={activeCount} total={users.length}
          icon={UserCheck} color="#10b981" sub={`${users.length - activeCount} inactive`} />
        <StatCard label="Admins" value={adminCount} total={users.length}
          icon={ShieldCheck} color="#3b82f6" sub="Elevated privileges" />
        <StatCard label="Suspended" value={suspendedCount} total={users.length}
          icon={UserX} color="#ef4444" sub={suspendedCount === 0 ? 'All clear ✓' : 'Blocked accounts'} />
      </div>

      {/* Search + Filter — exact Dashboard segmented control style */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-app-bg border border-border-main rounded-xl text-sm font-bold text-text-primary outline-none focus:bg-card-bg focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-text-muted"
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Filter — same as Dashboard time-range pills */}
          <div className="flex bg-app-bg border border-border-main p-1 rounded-xl gap-1 shadow-inner w-full md:w-auto overflow-x-auto min-w-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
            <div className="flex gap-1 hide-scrollbar">
              {['All', 'Active', 'Suspended', 'Admin', 'Customer'].map(f => (
                <button key={f} onClick={() => setRoleFilter(f)}
                  className={`px-3 md:px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                    roleFilter === f
                      ? 'bg-accent text-white shadow-lg shadow-accent/30'
                      : 'text-text-muted hover:text-text-primary'
                  }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[10px] font-bold text-text-muted whitespace-nowrap hidden md:block">
            <span className="font-black text-text-primary">{filtered.length}</span> / {users.length}
          </p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-10 h-10 animate-spin text-accent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center card">
          <Users className="w-16 h-16 text-text-muted opacity-20 mb-4" />
          <p className="text-sm font-black text-text-primary uppercase tracking-widest">No Users Found</p>
          <p className="text-sm font-medium text-text-muted mt-1">Try adjusting your search.</p>
        </div>
      ) : (
        <div className="md:card !p-0 border-0 md:border md:border-border-main bg-transparent md:bg-card-bg overflow-hidden mx-2 md:mx-0">
          {/* Header — same ROW_GRID class as rows */}
          <div className={`hidden md:grid grid-cols-[1fr_120px_120px_110px_140px] items-center gap-4 px-6 py-4 bg-app-bg border-b border-border-subtle`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Customer</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Role</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Status</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Joined</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted text-right">Actions</p>
          </div>

          <div className="bg-card-bg">
            <AnimatePresence mode="popLayout">
              {filtered.map((u, i) => (
                <UserRow
                  key={u._id || `user-${i}`}
                  user={u} idx={i}
                  onClick={openProfile}
                  onToggleStatus={handleToggleStatus}
                  onToggleRole={handleToggleRole}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      <AnimatePresence>
        {confirmState.open && (
          <ConfirmDialog state={confirmState} onClose={() => setConfirmState({ open: false })} onConfirm={confirmAction} />
        )}
      </AnimatePresence>

      {selectedProfile && (
        <UserDrawer
          user={selectedProfile}
          orders={userOrders}
          loadingOrders={loadingOrders}
          onClose={() => setSelectedProfile(null)}
          formatPrice={formatPrice}
        />
      )}
    </div>
  );
};

export default AdminUsers;
