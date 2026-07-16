import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api.client';
import { Mail, CheckCircle, Clock, AlertCircle, Loader2, MessageSquare, ArrowUpRight, Inbox, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

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
        <div className={`flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-full ${trendUp ? 'bg-status-success-bg text-status-success' : 'bg-status-warning-bg text-status-warning'}`}>
          <ArrowUpRight className="h-3 w-3" />
          {trend}
        </div>
      )}
    </div>
    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{label}</p>
    <h4 className="text-3xl font-black text-text-primary tracking-tighter"><AnimatedNumber value={value} /></h4>
  </motion.div>
);

// ── Ticket Card ──────────────────────────────────────────────────────────────
const TicketCard = ({ ticket, onResolve }) => {
  const [expanded, setExpanded] = useState(false);
  const isResolved = ticket.status === 'Resolved';

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`card rounded-2xl border border-border-main overflow-hidden hover:shadow-lg transition-all duration-300 ${isResolved ? 'opacity-70' : ''}`}>
      {/* Top accent line */}
      <div className={`h-1 w-full ${isResolved ? 'bg-status-success' : 'bg-status-warning'}`} />

      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 className="text-sm font-black text-text-primary">{ticket.subject || 'General Inquiry'}</h3>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                isResolved
                  ? 'bg-status-success-bg text-status-success border border-status-success/20'
                  : 'bg-status-warning-bg text-status-warning border border-status-warning/20'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full bg-current ${!isResolved ? 'animate-pulse' : ''}`} />
                {ticket.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-text-muted">
              <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{ticket.email || 'N/A'}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />
                {new Date(ticket.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              {ticket.order_id && (
                <span className="flex items-center gap-1.5 text-accent"><AlertCircle className="w-3 h-3" />Order #{ticket.order_id.slice(-8)}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setExpanded(e => !e)}
              className="px-4 py-2 bg-app-bg border border-border-main text-text-muted hover:text-text-primary text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">
              {expanded ? 'Collapse' : 'View'}
            </button>
            {!isResolved && (
              <button onClick={() => onResolve(ticket._id)}
                className="flex items-center gap-2 px-4 py-2 bg-status-success-bg hover:bg-status-success border border-status-success/20 text-status-success hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">
                <CheckCircle className="w-3.5 h-3.5" /> Resolve
              </button>
            )}
          </div>
        </div>

        {/* Message body (expandable) */}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="bg-app-bg border border-border-subtle rounded-xl p-4 mt-2">
                <p className="text-sm font-medium text-text-primary leading-relaxed whitespace-pre-wrap">{ticket.message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const AdminSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try { const res = await apiClient.get('/support'); setTickets(res.data); }
      catch { toast.error('Failed to load support tickets'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleResolve = async (id) => {
    try {
      await apiClient.put(`/support/${id}/resolve`);
      toast.success('Ticket resolved');
      setTickets(prev => prev.map(t => t._id === id ? { ...t, status: 'Resolved' } : t));
    } catch { toast.error('Failed to resolve ticket'); }
  };

  const openCount = tickets.filter(t => t.status !== 'Resolved').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;

  const filtered = tickets.filter(t => {
    if (filter === 'Open' && t.status === 'Resolved') return false;
    if (filter === 'Resolved' && t.status !== 'Resolved') return false;
    if (search) {
      const s = search.toLowerCase();
      return (t.subject || '').toLowerCase().includes(s) || (t.email || '').toLowerCase().includes(s) || (t.message || '').toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-subtle pb-6">
        <div>
          <p className="text-[10px] font-black text-accent uppercase tracking-[0.25em] mb-1">Customer Service</p>
          <h1 className="text-3xl font-black text-text-primary tracking-tighter">Support <span className="text-accent">Tickets</span></h1>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
          openCount > 0 ? 'bg-status-warning-bg border-status-warning/30 text-status-warning' : 'bg-status-success-bg border-status-success/30 text-status-success'
        }`}>
          {openCount > 0 ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {openCount > 0 ? `${openCount} Open` : 'Inbox Clear'}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard label="Total Tickets" value={tickets.length} icon={Inbox} color="#6366f1" trend="All time" trendUp />
        <StatCard label="Open" value={openCount} icon={AlertCircle} color="#f59e0b"
          trend={openCount > 0 ? 'Needs attention' : 'All clear'} trendUp={openCount === 0} />
        <StatCard label="Resolved" value={resolvedCount} icon={CheckCircle} color="#10b981" trend="Closed" trendUp />
        <StatCard label="Resolution Rate" value={tickets.length > 0 ? Math.round((resolvedCount / tickets.length) * 100) : 0}
          icon={MessageSquare} color="#3b82f6"
          trend={`${tickets.length > 0 ? Math.round((resolvedCount / tickets.length) * 100) : 0}%`} trendUp />
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input type="text" placeholder="Search by subject, email or message..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-app-bg border border-border-main rounded-xl text-sm font-bold text-text-primary outline-none focus:bg-card-bg focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-text-muted" />
        </div>
        <div className="flex bg-app-bg border border-border-main p-1 rounded-xl gap-1 shadow-inner w-full md:w-auto">
          {['All', 'Open', 'Resolved'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap ${
                filter === f ? 'bg-accent text-white shadow-lg shadow-accent/30' : 'text-text-muted hover:text-text-primary'
              }`}>{f}</button>
          ))}
        </div>
      </div>

      {/* Ticket List */}
      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-10 h-10 animate-spin text-accent" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 card text-center">
          <Mail className="w-16 h-16 text-text-muted opacity-20 mb-4" />
          <p className="text-sm font-black text-text-primary uppercase tracking-widest">
            {filter === 'Open' ? 'Inbox Zero! 🎉' : 'No Tickets Found'}
          </p>
          <p className="text-sm font-medium text-text-muted mt-1">All customer tickets are resolved.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filtered.map(ticket => (
              <TicketCard key={ticket._id} ticket={ticket} onResolve={handleResolve} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default AdminSupport;
