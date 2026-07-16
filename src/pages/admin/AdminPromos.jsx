import React, { useState, useEffect } from 'react';
import { Plus, Tag, Trash2, Edit2, Loader2, CheckCircle2, AlertCircle, Percent, TrendingUp, X, ToggleLeft, ToggleRight, ArrowUpRight, Search, LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../services/api.client';
import toast from 'react-hot-toast';

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
const StatCard = ({ label, value, icon: Icon, color, trend, trendUp, sub }) => (
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
          {trendUp && <ArrowUpRight className="h-3 w-3" />}
          {trend}
        </div>
      )}
    </div>
    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{label}</p>
    <h4 className="text-3xl font-black text-text-primary tracking-tighter mb-1"><AnimatedNumber value={value} /></h4>
    {sub && <p className="text-[10px] font-bold text-text-muted">{sub}</p>}
  </motion.div>
);

// ── Promo Form Modal ─────────────────────────────────────────────────────────
const PromoModal = ({ isOpen, onClose, currentPromo, onSubmit }) => {
  const [formData, setFormData] = useState({
    code: '', discount_percentage: 10, min_order_value: 500,
    max_discount_amount: 1000, valid_until: '', is_active: true,
    description: '', usage_limit: '', per_user_limit: 1
  });

  useEffect(() => {
    if (currentPromo) {
      setFormData({
        code: currentPromo.code,
        discount_percentage: currentPromo.discount_percentage,
        min_order_value: currentPromo.min_order_value,
        max_discount_amount: currentPromo.max_discount_amount || '',
        valid_until: currentPromo.valid_until ? currentPromo.valid_until.split('T')[0] : '',
        is_active: currentPromo.is_active,
        description: currentPromo.description || '',
        usage_limit: currentPromo.usage_limit || '',
        per_user_limit: currentPromo.per_user_limit || 1
      });
    } else {
      setFormData({ code: '', discount_percentage: 10, min_order_value: 500, max_discount_amount: 1000, valid_until: '', is_active: true, description: '', usage_limit: '', per_user_limit: 1 });
    }
  }, [currentPromo, isOpen]);

  const handleSubmit = (e) => { e.preventDefault(); onSubmit({ ...formData, code: formData.code.toUpperCase() }); };
  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-card-bg rounded-3xl border border-border-main shadow-2xl p-8 max-w-lg w-full"
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-7">
            <div>
              <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">Marketing Hub</p>
              <h3 className="text-xl font-black text-text-primary tracking-tight">
                {currentPromo ? 'Edit Promo Code' : 'Create New Code'}
              </h3>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-xl bg-app-bg border border-border-main text-text-muted hover:text-text-primary hover:border-accent transition-all flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Code */}
            <div>
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 block">Promo Code</label>
              <input value={formData.code} onChange={e => set('code', e.target.value.toUpperCase())}
                placeholder="e.g. SUMMER24" required
                className="w-full bg-app-bg border border-border-main rounded-xl px-4 py-3 text-sm font-black text-text-primary font-mono tracking-widest outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:font-normal placeholder:text-text-muted" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 block">Discount %</label>
                <input type="number" value={formData.discount_percentage} onChange={e => set('discount_percentage', Number(e.target.value))}
                  min="1" max="100" required
                  className="w-full bg-app-bg border border-border-main rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-accent transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 block">Min Order (₹)</label>
                <input type="number" value={formData.min_order_value} onChange={e => set('min_order_value', Number(e.target.value))} required
                  className="w-full bg-app-bg border border-border-main rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-accent transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 block">Max Discount (₹)</label>
                <input type="number" value={formData.max_discount_amount} onChange={e => set('max_discount_amount', Number(e.target.value))}
                  className="w-full bg-app-bg border border-border-main rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-accent transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 block">Valid Until</label>
                <input type="date" value={formData.valid_until} onChange={e => set('valid_until', e.target.value)}
                  className="w-full bg-app-bg border border-border-main rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-accent transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 block">Total Usage Limit</label>
                <input type="number" value={formData.usage_limit} onChange={e => set('usage_limit', e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 100"
                  className="w-full bg-app-bg border border-border-main rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-accent transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 block">Uses Per User</label>
                <input type="number" value={formData.per_user_limit} onChange={e => set('per_user_limit', Number(e.target.value))} min="1" required
                  className="w-full bg-app-bg border border-border-main rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-accent transition-all" />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 block">Custom Description</label>
              <textarea rows={2} value={formData.description} onChange={e => set('description', e.target.value)}
                placeholder="Optional. Will override the auto-generated description."
                className="w-full bg-app-bg border border-border-main rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-accent transition-all resize-none placeholder:text-text-muted placeholder:font-normal" />
            </div>

            {/* Toggle */}
            <div className="flex items-center justify-between p-4 bg-app-bg border border-border-main rounded-xl">
              <div>
                <p className="text-xs font-black text-text-primary">Active Status</p>
                <p className="text-[10px] font-bold text-text-muted mt-0.5">{formData.is_active ? 'Code is live & usable' : 'Code is paused'}</p>
              </div>
              <button type="button" onClick={() => set('is_active', !formData.is_active)} className="transition-all">
                {formData.is_active
                  ? <ToggleRight className="w-10 h-10 text-accent" />
                  : <ToggleLeft className="w-10 h-10 text-text-muted" />}
              </button>
            </div>

            <button type="submit"
              className="w-full py-3.5 rounded-xl bg-accent hover:bg-accent/90 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-accent/20">
              {currentPromo ? 'Update Promo Code' : 'Create Promo Code'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ── Promo List Row ───────────────────────────────────────────────────────────
const PromoRow = ({ promo, onEdit, onDelete }) => {
  const isExpired = promo.valid_until && new Date(promo.valid_until) < new Date();
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="group flex flex-col md:grid md:grid-cols-[25%_20%_1fr_20%_80px] gap-4 p-4 md:px-6 md:py-4 bg-card-bg md:bg-transparent md:hover:bg-app-bg border border-border-main md:border-0 md:border-b md:border-border-subtle rounded-2xl md:rounded-none transition-all last:border-0 relative overflow-hidden mb-3 md:mb-0 shadow-sm md:shadow-none mx-2 md:mx-0 md:items-center">
      
      {/* Mobile-only accent strip */}
      {promo.is_active && !isExpired && <div className="absolute left-0 top-0 bottom-0 w-1.5 md:hidden bg-accent" />}
      
      {/* Code and Status */}
      <div className="flex items-center justify-between md:justify-start gap-4 flex-shrink-0 min-w-0 pl-2 md:pl-0">
        <span className="font-mono font-black text-base md:text-lg tracking-widest text-text-primary bg-app-bg border border-border-main px-3 py-1.5 rounded-xl truncate">
          {promo.code}
        </span>
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex-shrink-0 ${
          promo.is_active && !isExpired ? 'bg-status-success-bg text-status-success border border-status-success/20' : 'bg-status-danger-bg text-status-danger border border-status-danger/20'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full bg-current ${promo.is_active && !isExpired ? 'animate-pulse' : ''}`} />
          <span className="hidden sm:inline">{isExpired ? 'Expired' : promo.is_active ? 'Active' : 'Inactive'}</span>
        </span>
      </div>

      {/* Discount and Valid Until */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between md:justify-start gap-1 md:gap-4 border-t border-border-subtle pt-3 mt-1 md:border-t-0 md:pt-0 md:mt-0 px-2 md:px-0">
         <div>
            <div className="text-xl md:text-2xl font-black text-accent tracking-tighter leading-none">
              {promo.discount_percentage}% <span className="text-[10px] text-text-muted uppercase tracking-widest">OFF</span>
            </div>
            {promo.valid_until && (
              <p className="text-[9px] font-bold text-text-muted mt-1">Until {new Date(promo.valid_until).toLocaleDateString('en-GB')}</p>
            )}
         </div>
      </div>

      {/* Stats (Desktop Only) */}
      <div className="hidden md:flex flex-grow items-center justify-around px-4 border-x border-border-subtle mx-2">
        <div className="text-center"><p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Min Order</p><p className="text-xs font-black text-text-primary">₹{promo.min_order_value}</p></div>
        <div className="text-center"><p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Max Save</p><p className="text-xs font-black text-text-primary">{promo.max_discount_amount ? `₹${promo.max_discount_amount}` : '∞'}</p></div>
        <div className="text-center"><p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Uses</p><p className="text-xs font-black text-text-primary">{promo.usage_count || 0}</p></div>
      </div>
      
      {/* Total Savings & Mobile Stats */}
      <div className="flex items-start md:items-center justify-between md:justify-end px-2 md:px-0 pt-3 md:pt-0 border-t border-border-subtle md:border-0">
         <div className="md:hidden flex flex-col gap-0.5 text-[10px] font-bold text-text-muted">
            <div>Min <span className="font-black text-text-primary">₹{promo.min_order_value}</span> <span className="mx-1 opacity-50">•</span> Max <span className="font-black text-text-primary">₹{promo.max_discount_amount || '∞'}</span></div>
            <div>Used <span className="font-black text-accent">{promo.usage_count || 0}</span> times</div>
         </div>
         <div className="text-right">
           <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-0.5">Total Saved</p>
           <p className={`text-sm font-black ${(promo.total_discount_given || 0) > 0 ? 'text-status-success' : 'text-text-primary'}`}>₹{(promo.total_discount_given || 0).toFixed(2)}</p>
         </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 px-2 md:px-0 mt-3 md:mt-0 border-t border-border-subtle md:border-0 pt-3 md:pt-0">
        <button onClick={() => onEdit(promo)}
          className="md:w-8 md:h-8 flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-0 rounded-xl bg-app-bg md:bg-transparent border border-border-main text-text-primary md:text-text-muted md:opacity-0 group-hover:opacity-100 hover:text-accent hover:border-accent md:hover:bg-accent/10 transition-all py-2 md:py-0 text-[10px] md:text-base font-black uppercase tracking-widest">
          <Edit2 className="w-3.5 h-3.5" /> <span className="md:hidden">Edit</span>
        </button>
        <button onClick={() => onDelete(promo._id)}
          className="md:w-8 md:h-8 flex-none flex items-center justify-center rounded-xl bg-status-danger-bg md:bg-transparent border border-status-danger/20 md:border-border-main text-status-danger md:text-text-muted md:opacity-0 group-hover:opacity-100 hover:text-status-danger hover:border-status-danger/30 hover:bg-status-danger-bg transition-all p-2 md:p-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};

// ── Promo Card ───────────────────────────────────────────────────────────────
const PromoCard = ({ promo, onEdit, onDelete }) => {
  const isExpired = promo.valid_until && new Date(promo.valid_until) < new Date();
  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="card rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group relative overflow-hidden border border-border-main">
      {/* Active glow */}
      {promo.is_active && !isExpired && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent" />
      )}

      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="font-mono font-black text-xl tracking-widest text-text-primary bg-app-bg border border-border-main px-3 py-1.5 rounded-xl inline-block">
            {promo.code}
          </span>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
              promo.is_active && !isExpired
                ? 'bg-status-success-bg text-status-success border border-status-success/20'
                : 'bg-status-danger-bg text-status-danger border border-status-danger/20'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full bg-current ${promo.is_active && !isExpired ? 'animate-pulse' : ''}`} />
              {isExpired ? 'Expired' : promo.is_active ? 'Active' : 'Inactive'}
            </span>
            {promo.valid_until && (
              <span className="text-[9px] font-bold text-text-muted">
                Until {new Date(promo.valid_until).toLocaleDateString('en-GB')}
              </span>
            )}
          </div>
        </div>

        {/* Big discount */}
        <div className="text-right flex-shrink-0 ml-4">
          <div className="text-3xl md:text-4xl font-black text-accent tracking-tighter leading-none">
            {promo.discount_percentage}%
          </div>
          <div className="text-[9px] font-black text-text-muted uppercase tracking-widest mt-1">OFF</div>
        </div>
      </div>

      {/* Description text */}
      <div className="mb-5 bg-app-bg/50 p-3 rounded-xl border border-border-subtle">
        {promo.description ? (
          <p className="text-xs font-bold text-text-primary leading-relaxed">
            {promo.description}
          </p>
        ) : (
          <p className="text-xs font-bold text-text-primary leading-relaxed">
            Gives <span className="text-accent font-black">{promo.discount_percentage}% off</span> on the total order value.
            <br className="md:hidden" />
            <span className="md:ml-1 text-text-muted">
              Valid on orders above <span className="font-black text-text-primary">₹{promo.min_order_value}</span>
              {promo.max_discount_amount ? <span>, up to a maximum discount of <span className="font-black text-text-primary">₹{promo.max_discount_amount}</span></span> : ''}.
            </span>
          </p>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-app-bg border border-border-subtle rounded-xl p-3 text-center">
          <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Min Order</p>
          <p className="text-xs font-black text-text-primary">₹{promo.min_order_value}</p>
        </div>
        <div className="bg-app-bg border border-border-subtle rounded-xl p-3 text-center">
          <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Max Save</p>
          <p className="text-xs font-black text-text-primary">{promo.max_discount_amount ? `₹${promo.max_discount_amount}` : '∞'}</p>
        </div>
        <div className="bg-app-bg border border-border-subtle rounded-xl p-3 text-center">
          <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Uses</p>
          <p className="text-xs font-black text-text-primary">{promo.usage_count || 0}</p>
        </div>
      </div>

      {/* Savings bar */}
      <div className={`mb-5 p-3 rounded-xl border ${
        (promo.total_discount_given || 0) > 0 
          ? 'bg-status-success-bg border-status-success/20' 
          : 'bg-app-bg border-border-subtle'
      }`}>
        <p className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${
          (promo.total_discount_given || 0) > 0 ? 'text-status-success' : 'text-text-muted'
        }`}>Total Savings Given</p>
        <p className={`text-sm font-black ${
          (promo.total_discount_given || 0) > 0 ? 'text-status-success' : 'text-text-primary'
        }`}>₹{(promo.total_discount_given || 0).toFixed(2)}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={() => onEdit(promo)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-app-bg hover:bg-accent hover:text-white text-text-primary font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border border-border-main">
          <Edit2 className="h-3.5 w-3.5" /> Edit
        </button>
        <button onClick={() => onDelete(promo._id)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-app-bg hover:bg-status-danger hover:text-white text-status-danger font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border border-status-danger/20">
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>
    </motion.div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
const AdminPromos = () => {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPromo, setCurrentPromo] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list');

  const fetchPromos = async () => {
    try { setLoading(true); const res = await apiClient.get('/coupons'); setPromos(res.data); }
    catch { toast.error('Failed to load promo codes'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPromos(); }, []);

  const handleSubmit = async (data) => {
    try {
      if (currentPromo) { await apiClient.put(`/coupons/${currentPromo._id}`, data); toast.success('Promo updated!'); }
      else { await apiClient.post('/coupons', data); toast.success('Promo created!'); }
      setIsModalOpen(false); fetchPromos();
    } catch (err) { toast.error(err.response?.data?.detail || 'Action failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this promo code?')) return;
    try { await apiClient.delete(`/coupons/${id}`); toast.success('Deleted'); fetchPromos(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleEdit = (promo) => { setCurrentPromo(promo); setIsModalOpen(true); };

  const activeCount = promos.filter(p => p.is_active && (!p.valid_until || new Date(p.valid_until) > new Date())).length;
  const totalUses = promos.reduce((a, p) => a + (p.usage_count || 0), 0);
  const totalSaved = promos.reduce((a, p) => a + (p.total_discount_given || 0), 0);

  const filtered = promos.filter(p => {
    if (filter === 'Active') { if (!(p.is_active && (!p.valid_until || new Date(p.valid_until) > new Date()))) return false; }
    if (filter === 'Inactive') { if (p.is_active) return false; }
    if (filter === 'Expired') { if (!(p.valid_until && new Date(p.valid_until) < new Date())) return false; }
    if (search) return (p.code || '').toLowerCase().includes(search.toLowerCase());
    return true;
  });

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-subtle pb-6">
        <div>
          <p className="text-[10px] font-black text-accent uppercase tracking-[0.25em] mb-1">Marketing Hub</p>
          <h1 className="text-3xl font-black text-text-primary tracking-tighter">Promo <span className="text-accent">Codes</span></h1>
        </div>
        <button onClick={() => { setCurrentPromo(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-3 bg-accent hover:bg-accent/90 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-accent/20 w-full sm:w-auto justify-center">
          <Plus className="h-4 w-4" /> Create Promo
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard label="Total Codes" value={promos.length} icon={Tag} color="#6366f1" trend={`${promos.length} total`} trendUp />
        <StatCard label="Active" value={activeCount} icon={CheckCircle2} color="#10b981" trend="Live" trendUp />
        <StatCard label="Total Uses" value={totalUses} icon={TrendingUp} color="#3b82f6" trend="+uses" trendUp />
        <StatCard label="Savings Given" value={Math.round(totalSaved)} icon={Percent} color="#f59e0b"
          sub={`₹${totalSaved.toFixed(0)} total`} trend="Discount" trendUp />
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input type="text" placeholder="Search promo code..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-app-bg border border-border-main rounded-xl text-sm font-bold text-text-primary outline-none focus:bg-card-bg focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-text-muted" />
        </div>
        <div className="flex items-center justify-between gap-4 w-full md:w-auto min-w-0">
          <div className="flex bg-app-bg border border-border-main p-1 rounded-xl gap-1 shadow-inner overflow-x-auto flex-shrink min-w-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
            <div className="flex gap-1 hide-scrollbar">
              {['All', 'Active', 'Inactive', 'Expired'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 md:px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                    filter === f ? 'bg-accent text-white shadow-lg shadow-accent/30' : 'text-text-muted hover:text-text-primary'
                  }`}>{f}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* View toggle */}
            <div className="flex items-center gap-1 p-1 bg-app-bg border border-border-main rounded-xl shadow-inner flex-shrink-0">
              {[['list', List], ['grid', LayoutGrid]].map(([m, Icon]) => (
                <button key={m} onClick={() => setViewMode(m)}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === m ? 'bg-card-bg text-accent shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
            <p className="text-[10px] font-bold text-text-muted whitespace-nowrap">
              <span className="font-black text-text-primary">{filtered.length}</span> / {promos.length}
            </p>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-10 h-10 animate-spin text-accent" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 card text-center">
          <Tag className="w-16 h-16 text-text-muted opacity-20 mb-4" />
          <p className="text-sm font-black text-text-primary uppercase tracking-widest">No Promo Codes Found</p>
          <p className="text-sm font-medium text-text-muted mt-1">Create your first campaign to get started.</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="card !p-0 border-0 md:border md:border-border-main bg-transparent md:bg-card-bg overflow-hidden">
          {/* Table header (Desktop Only) */}
          <div className="grid-cols-[25%_20%_1fr_20%_80px] gap-4 px-6 py-4 bg-app-bg border-b border-border-subtle hidden md:grid">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-2">Code & Status</p>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Discount</p>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest text-center">Rules & Uses</p>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest text-right">Total Savings</p>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest text-right">Actions</p>
          </div>
          <div>
            <AnimatePresence mode="popLayout">
              {filtered.map(p => (
                <PromoRow key={p._id} promo={p} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mx-2 md:mx-0">
          <AnimatePresence mode="popLayout">
            {filtered.map(p => (
              <PromoCard key={p._id} promo={p} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <PromoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} currentPromo={currentPromo} onSubmit={handleSubmit} />
    </div>
  );
};

export default AdminPromos;
