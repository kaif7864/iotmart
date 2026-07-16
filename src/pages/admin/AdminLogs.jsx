import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api.client';
import {
  Activity, ShieldCheck, User, Package, Settings, AlertCircle,
  RefreshCw, Loader2, Search, Shield, Clock, ArrowUpRight, Terminal, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// ── Log type config ──────────────────────────────────────────────────────────
const getLogMeta = (action = '') => {
  const a = action.toLowerCase();
  if (a.includes('login') || a.includes('auth')) return { icon: User, color: '#6366f1', label: 'Auth' };
  if (a.includes('delete') || a.includes('remove')) return { icon: AlertCircle, color: '#ef4444', label: 'Delete' };
  if (a.includes('product') || a.includes('stock')) return { icon: Package, color: '#f59e0b', label: 'Product' };
  if (a.includes('setting')) return { icon: Settings, color: '#8b5cf6', label: 'Config' };
  if (a.includes('order')) return { icon: ShieldCheck, color: '#10b981', label: 'Order' };
  return { icon: Activity, color: '#3b82f6', label: 'System' };
};

// ── Animated Number ──────────────────────────────────────────────────────────
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

// ── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, trend, trendUp }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    className="card rounded-2xl p-6 relative overflow-hidden hover:shadow-xl transition-all duration-300">
    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-xl" style={{ background: color }} />
    <Icon className="absolute -right-2 -bottom-2 w-24 h-24 opacity-[0.04]" style={{ color }} />
    <div className="flex items-start justify-between mb-4">
      <div className="p-2.5 rounded-xl" style={{ background: color + '20' }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-full ${trendUp ? 'bg-status-success-bg text-status-success' : 'bg-status-danger-bg text-status-danger'}`}>
          <ArrowUpRight className="h-3 w-3" /> {trend}
        </div>
      )}
    </div>
    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{label}</p>
    <h4 className="text-3xl font-black text-text-primary tracking-tighter"><AnimatedNumber value={value} /></h4>
  </motion.div>
);

// ── Grid Column Definition ───────────────────────────────────────────────────
const GRID = 'flex flex-col md:grid md:grid-cols-[160px_1fr_120px_120px_1fr] gap-3 md:gap-4 md:items-center px-4 md:px-6';

// ── Log Row ──────────────────────────────────────────────────────────────────
const LogRow = ({ log, idx }) => {
  const meta = getLogMeta(log.action);
  const MetaIcon = meta.icon;
  const isDelete = (log.action || '').toLowerCase().includes('delete') || (log.action || '').toLowerCase().includes('remove');

  return (
    <motion.div layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.02 }}
      className={`group ${GRID} py-4 border-b border-border-subtle transition-all last:border-0 relative ${isDelete ? 'bg-status-danger-bg/20 hover:bg-status-danger-bg/30' : 'bg-app-bg hover:bg-card-bg'}`}>

      {/* Mobile Top Row */}
      <div className="flex md:hidden items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest"
            style={{ background: meta.color + '18', color: meta.color }}>
            <MetaIcon className="w-3 h-3" />
            {meta.label}
          </span>
          <span className={`text-[10px] font-black uppercase tracking-wider ${isDelete ? 'text-status-danger' : 'text-accent'}`}>
            {log.action}
          </span>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-mono font-bold text-text-muted">
            {new Date(log.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
          </p>
        </div>
      </div>

      {/* Timestamp (Desktop only) */}
      <div className="hidden md:block">
        <p className="text-[10px] font-mono font-bold text-text-muted">
          {new Date(log.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
        </p>
        <p className="text-[9px] font-mono font-bold text-text-muted/60">
          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      </div>

      {/* User */}
      <div className="min-w-0 flex items-center gap-2">
        <span className="md:hidden text-[10px] font-black text-text-muted uppercase tracking-widest">User:</span>
        <p className="text-xs font-black text-text-primary truncate">{log.user || '—'}</p>
      </div>

      {/* Type badge (Desktop only) */}
      <div className="hidden md:block">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest"
          style={{ background: meta.color + '18', color: meta.color }}>
          <MetaIcon className="w-3 h-3" />
          {meta.label}
        </span>
      </div>

      {/* Action (Desktop only) */}
      <div className="hidden md:block">
        <span className={`text-[10px] font-black uppercase tracking-wider ${isDelete ? 'text-status-danger' : 'text-accent'}`}>
          {log.action}
        </span>
      </div>

      {/* Details */}
      <div className="min-w-0 bg-card-bg md:bg-transparent p-3 md:p-0 rounded-xl border border-border-main md:border-0 mt-1 md:mt-0 w-full">
        <p className="text-[10px] font-bold text-text-muted md:truncate" title={log.details}>
          {log.target && <span className="text-text-primary mr-1">{log.target}</span>}
          {log.details || '—'}
        </p>
      </div>
    </motion.div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try { const res = await apiClient.get('/logs'); setLogs(res.data); }
    catch { toast.error('Failed to load system logs'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const deleteCount = logs.filter(l => (l.action || '').toLowerCase().includes('delete') || (l.action || '').toLowerCase().includes('remove')).length;
  const authCount = logs.filter(l => (l.action || '').toLowerCase().includes('login') || (l.action || '').toLowerCase().includes('auth')).length;

  const FILTERS = ['All', 'Auth', 'Product', 'Order', 'Delete', 'Config', 'System'];

  const filtered = logs.filter(l => {
    if (filter !== 'All') {
      const meta = getLogMeta(l.action);
      if (meta.label !== filter) return false;
    }
    if (search) {
      const s = search.toLowerCase();
      return (l.user || '').toLowerCase().includes(s)
        || (l.action || '').toLowerCase().includes(s)
        || (l.target || '').toLowerCase().includes(s)
        || (l.details || '').toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-subtle pb-6">
        <div>
          <p className="text-[10px] font-black text-accent uppercase tracking-[0.25em] mb-1">Security Hub</p>
          <h1 className="text-3xl font-black text-text-primary tracking-tighter">System <span className="text-accent">Audit Logs</span></h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-status-success-bg border border-status-success/20 rounded-xl text-[10px] font-black text-status-success uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            Live Monitoring
          </div>
          <button onClick={() => fetchLogs(true)} disabled={refreshing}
            className="w-10 h-10 rounded-xl bg-app-bg border border-border-main text-text-muted hover:text-accent hover:border-accent transition-all flex items-center justify-center">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-accent' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard label="Total Events" value={logs.length} icon={Terminal} color="#6366f1" trend="All time" trendUp />
        <StatCard label="Auth Events" value={authCount} icon={Shield} color="#3b82f6" trend="Login/Logout" trendUp />
        <StatCard label="Delete Actions" value={deleteCount} icon={AlertCircle} color="#ef4444"
          trend={deleteCount > 0 ? 'High risk ops' : 'None'} trendUp={deleteCount === 0} />
        <StatCard label="Recent (1h)" value={logs.filter(l => Date.now() - new Date(l.timestamp) < 3600000).length}
          icon={Clock} color="#10b981" trend="Last hour" trendUp />
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="relative w-full md:max-w-md flex-shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input type="text" placeholder="Search user, action, or target..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-app-bg border border-border-main rounded-xl text-sm font-bold text-text-primary outline-none focus:bg-card-bg focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-text-muted" />
        </div>
        <div className="flex bg-app-bg border border-border-main p-1 rounded-xl gap-1 shadow-inner w-full md:w-auto overflow-x-auto min-w-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
          <div className="flex gap-1 hide-scrollbar">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 md:px-3.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                  filter === f ? 'bg-accent text-white shadow-lg shadow-accent/30' : 'text-text-muted hover:text-text-primary'
                }`}>{f}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Log Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-10 h-10 animate-spin text-accent" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 card text-center">
          <Terminal className="w-16 h-16 text-text-muted opacity-20 mb-4" />
          <p className="text-sm font-black text-text-primary uppercase tracking-widest">No Log Events Found</p>
          <p className="text-sm font-medium text-text-muted mt-1">No activity matches the current filter.</p>
        </div>
      ) : (
        <div className="card overflow-hidden !p-0 border border-border-main">
          {/* Table Header */}
          <div className={`${GRID} py-4 bg-app-bg border-b border-border-subtle hidden md:grid`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Timestamp</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">User</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Type</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Action</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Details</p>
          </div>

          <div className="bg-card-bg">
            <AnimatePresence mode="popLayout">
              {filtered.map((log, i) => (
                <LogRow key={log._id || `log-${i}`} log={log} idx={i} />
              ))}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-app-bg border-t border-border-subtle flex items-center justify-between">
            <p className="text-[10px] font-bold text-text-muted">
              Showing <span className="font-black text-text-primary">{filtered.length}</span> of {logs.length} events
            </p>
            <div className="flex items-center gap-2 text-[9px] font-black text-text-muted uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
              Real-time
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogs;
