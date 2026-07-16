import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api.client';
import { Star, Trash2, ShieldCheck, AlertTriangle, Loader2, Search, MessageSquare, Award, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// ── Animated Number ──────────────────────────────────────────────────────────
const AnimatedNumber = ({ value, decimals = 0 }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const end = parseFloat(value) || 0;
    if (end === 0) { setDisplay(0); return; }
    let cur = 0;
    const steps = 40;
    const inc = end / steps;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= end) { setDisplay(end); clearInterval(t); }
      else setDisplay(cur);
    }, 600 / steps);
    return () => clearInterval(t);
  }, [value]);
  return <>{display.toFixed(decimals)}</>;
};

// ── Star Rating ──────────────────────────────────────────────────────────────
const StarRating = ({ rating, size = 'sm' }) => {
  const cls = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`${cls} ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-border-main'}`} />
      ))}
    </div>
  );
};

// ── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, trend, trendUp, decimals }) => (
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
    <h4 className="text-3xl font-black text-text-primary tracking-tighter">
      <AnimatedNumber value={value} decimals={decimals} />
    </h4>
  </motion.div>
);

// ── Review Card ──────────────────────────────────────────────────────────────
const ReviewCard = ({ review, idx, onDelete }) => {
  const ratingColor = review.rating >= 4 ? '#10b981' : review.rating >= 3 ? '#f59e0b' : '#ef4444';

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
      className="card rounded-2xl p-6 border border-border-main hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
      {/* Rating accent top bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: ratingColor }} />

      <div className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-4 mb-4">
        {/* User info */}
        <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white flex-shrink-0 shadow-sm"
            style={{ background: ratingColor }}>
            {(review.user_name || 'A').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-black text-text-primary truncate">{review.user_name || 'Anonymous'}</p>
              {review.verified_buyer && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-status-success-bg text-status-success text-[9px] font-black uppercase tracking-widest rounded-lg border border-status-success/20 flex-shrink-0">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
            <p className="text-[10px] font-bold text-accent mt-0.5 truncate">{review.product_name}</p>
          </div>
        </div>

        {/* Rating + delete */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-border-subtle sm:border-0">
          <div className="flex flex-col sm:items-end gap-1">
            <StarRating rating={review.rating} />
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: ratingColor }}>
              {review.rating >= 4 ? 'Positive' : review.rating >= 3 ? 'Neutral' : 'Negative'}
            </span>
          </div>
          <button onClick={() => onDelete(review.product_id, review.review_index)}
            title="Delete Review"
            className="w-9 h-9 rounded-xl bg-app-bg border border-border-main text-text-muted hover:bg-status-danger-bg hover:text-status-danger hover:border-status-danger/20 transition-all flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Review body */}
      <div className="bg-app-bg border border-border-subtle rounded-xl p-4">
        <p className="text-sm font-medium text-text-primary leading-relaxed">{review.comment || 'No comment provided.'}</p>
        {review.date && (
          <p className="text-[10px] font-bold text-text-muted mt-3 pt-3 border-t border-border-subtle uppercase tracking-widest">
            {new Date(review.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>
    </motion.div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    try {
      const res = await apiClient.get('/products?limit=1000');
      const products = res.data.products || res.data;
      const all = [];
      products.forEach(p => {
        (p.reviews || []).forEach((r, i) => all.push({ ...r, product_id: p._id, product_name: p.name, review_index: i }));
      });
      all.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setReviews(all);
    } catch { toast.error('Failed to load reviews'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (productId, reviewIndex) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await apiClient.delete(`/products/${productId}/reviews/${reviewIndex}`);
      toast.success('Review deleted');
      fetchReviews();
    } catch { toast.error('Failed to delete review'); }
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
    : 0;
  const positiveCount = reviews.filter(r => r.rating >= 4).length;
  const negativeCount = reviews.filter(r => r.rating < 3).length;

  const filtered = reviews.filter(r => {
    if (filter === 'Positive' && r.rating < 4) return false;
    if (filter === 'Neutral' && (r.rating < 3 || r.rating >= 4)) return false;
    if (filter === 'Negative' && r.rating >= 3) return false;
    if (filter === 'Verified' && !r.verified_buyer) return false;
    if (search) {
      const s = search.toLowerCase();
      return (r.user_name || '').toLowerCase().includes(s) || (r.product_name || '').toLowerCase().includes(s) || (r.comment || '').toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-subtle pb-6">
        <div>
          <p className="text-[10px] font-black text-accent uppercase tracking-[0.25em] mb-1">Community</p>
          <h1 className="text-3xl font-black text-text-primary tracking-tighter">Review <span className="text-accent">Moderation</span></h1>
        </div>
        {/* Avg rating badge */}
        <div className="flex items-center gap-3 bg-app-bg border border-border-main px-4 py-2.5 rounded-xl">
          <div className="flex">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className={`w-4 h-4 ${i <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-border-main'}`} />
            ))}
          </div>
          <span className="text-sm font-black text-text-primary">{avgRating.toFixed(1)}</span>
          <span className="text-[10px] font-bold text-text-muted">avg rating</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard label="Total Reviews" value={reviews.length} icon={MessageSquare} color="#6366f1" trend="+reviews" trendUp />
        <StatCard label="Avg Rating" value={avgRating} icon={Star} color="#f59e0b" trend={`${avgRating.toFixed(1)} / 5`} trendUp decimals={1} />
        <StatCard label="Positive (4-5★)" value={positiveCount} icon={Award} color="#10b981" trend="Good reviews" trendUp />
        <StatCard label="Negative (1-2★)" value={negativeCount} icon={AlertTriangle} color="#ef4444"
          trend={negativeCount > 0 ? 'Needs attention' : 'All good!'} trendUp={negativeCount === 0} />
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input type="text" placeholder="Search by user, product or comment..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-app-bg border border-border-main rounded-xl text-sm font-bold text-text-primary outline-none focus:bg-card-bg focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-text-muted" />
        </div>
        <div className="flex bg-app-bg border border-border-main p-1 rounded-xl gap-1 shadow-inner w-full md:w-auto overflow-x-auto min-w-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
          <div className="flex gap-1 hide-scrollbar">
            {['All', 'Positive', 'Neutral', 'Negative', 'Verified'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 md:px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                  filter === f ? 'bg-accent text-white shadow-lg shadow-accent/30' : 'text-text-muted hover:text-text-primary'
                }`}>{f}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-10 h-10 animate-spin text-accent" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 card text-center">
          <Star className="w-16 h-16 text-text-muted opacity-20 mb-4" />
          <p className="text-sm font-black text-text-primary uppercase tracking-widest">No Reviews Found</p>
          <p className="text-sm font-medium text-text-muted mt-1">No reviews match the current filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((r, i) => (
              <ReviewCard key={`${r.product_id}-${r.review_index}`} review={r} idx={i} onDelete={handleDelete} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
