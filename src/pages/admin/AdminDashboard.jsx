import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Users, ShoppingBag, DollarSign, ArrowUpRight,
  Package, BarChart3, Activity, ShieldCheck, Bell, Star,
  AlertTriangle, Zap, ChevronRight, Clock, Eye, Award
} from 'lucide-react';
import { getDashboardStats } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Skeleton, SkeletonGrid, Badge } from '../../components/common';
import { Link } from 'react-router-dom';

// ── Mini Sparkline bars ────────────────────────────────────────────────────────
const Sparkline = ({ values, color = '#6366f1' }) => {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {values.map((v, i) => (
        <div
          key={i}
          style={{ height: `${(v / max) * 100}%`, background: color, opacity: 0.6 + (i / values.length) * 0.4 }}
          className="flex-1 rounded-sm transition-all"
        />
      ))}
    </div>
  );
};

// ── Radial Progress ───────────────────────────────────────────────────────────
const RadialProgress = ({ value, max, color, size = 80 }) => {
  const pct = Math.min((value / (max || 1)) * 100, 100);
  const r = 28, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="-rotate-90">
      <circle cx="32" cy="32" r={r} fill="none" strokeWidth="5" className="stroke-border-main" />
      <circle
        cx="32" cy="32" r={r} fill="none" strokeWidth="5"
        stroke={color} strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (pct / 100) * c}
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  );
};

// ── Bar Chart ──────────────────────────────────────────────────────────────────
const BarChart = ({ data, formatPrice }) => {
  const max = Math.max(...data.map(d => d.revenue), 1);
  const hasData = data.some(d => d.revenue > 0);

  if (!hasData) {
    return (
      <div className="relative h-64 rounded-2xl overflow-hidden bg-app-bg border border-border-subtle">
        {/* blurred dummy bars */}
        <div className="absolute inset-0 flex items-end gap-3 p-4 blur-sm opacity-25 pointer-events-none">
          {[30, 55, 40, 75, 50, 65, 45].map((h, i) => (
            <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-accent rounded-t-xl" />
          ))}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="bg-card-bg/90 backdrop-blur-sm border border-border-main px-8 py-5 rounded-2xl shadow-2xl text-center">
            <Activity className="h-8 w-8 text-accent mx-auto mb-3 animate-pulse" />
            <p className="text-sm font-black text-text-primary uppercase tracking-widest">Awaiting Sales Data</p>
            <p className="text-xs text-text-muted mt-1">Complete your first order to see analytics</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 flex items-end gap-2">
      {data.map((item, i) => {
        const h = (item.revenue / max) * 100;
        return (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(h, 4)}%` }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 200 }}
            className="flex-1 relative group cursor-pointer"
          >
            <div
              className="absolute inset-0 rounded-t-xl transition-all duration-300 group-hover:opacity-100"
              style={{
                background: `linear-gradient(to top, hsl(243,75%,59%), hsl(243,75%,79%))`,
                opacity: 0.6 + (i / data.length) * 0.4
              }}
            />
            {/* Tooltip */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface-dark text-white text-[9px] font-bold px-2 py-1 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
              {formatPrice(item.revenue)}
            </div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-bold text-text-muted whitespace-nowrap">
              {item.name}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { formatPrice } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);      // initial full load only
  const [isRefreshing, setIsRefreshing] = useState(false); // filter switch — no full skeleton
  const [activeRange, setActiveRange] = useState('7D');

  useEffect(() => {
    // First load → show skeleton; subsequent filter changes → subtle overlay only
    if (!stats) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    getDashboardStats(activeRange)
      .then(data => setStats(data))
      .catch(err => console.error('Dashboard fetch failed:', err))
      .finally(() => { setLoading(false); setIsRefreshing(false); });
  }, [activeRange]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center mb-8">
          <div><Skeleton className="w-32 h-3 mb-2" /><Skeleton className="w-56 h-9" /></div>
          <Skeleton className="w-48 h-10 rounded-xl" />
        </div>
        <SkeletonGrid count={4}><div className="card p-6 rounded-3xl"><Skeleton className="w-10 h-10 rounded-xl mb-4" /><Skeleton className="w-1/2 h-3 mb-2" /><Skeleton className="w-3/4 h-7" /></div></SkeletonGrid>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Skeleton className="xl:col-span-2 h-80 rounded-3xl" />
          <Skeleton className="h-80 rounded-3xl" />
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total Revenue', value: stats?.total_revenue || 0, icon: DollarSign,
      isPrice: true, trend: '+12.5%', trendUp: true, color: '#6366f1',
      spark: [20, 45, 30, 60, 50, 80, stats?.total_revenue > 0 ? 100 : 10]
    },
    {
      label: 'Total Orders', value: stats?.total_orders || 0, icon: ShoppingBag,
      isPrice: false, trend: '+5.2%', trendUp: true, color: '#10b981',
      spark: [10, 30, 20, 55, 40, 65, stats?.total_orders || 0]
    },
    {
      label: 'Registered Users', value: stats?.total_users || 0, icon: Users,
      isPrice: false, trend: '+8.1%', trendUp: true, color: '#f59e0b',
      spark: [5, 15, 25, 20, 35, 45, stats?.total_users || 0]
    },
    {
      label: 'Low Stock Items', value: stats?.low_stock?.length || 0, icon: AlertTriangle,
      isPrice: false, trend: `${stats?.low_stock?.length || 0} alerts`, trendUp: false, color: '#ef4444',
      spark: [0, 1, 0, 2, 1, 3, stats?.low_stock?.length || 0]
    },
  ];

  const conversionRate = stats?.total_users > 0
    ? Math.round((stats.total_orders / stats.total_users) * 100)
    : 0;

  return (
    <div className="space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-[10px] font-black text-accent uppercase tracking-[0.25em] mb-1">Central Command</p>
          <h1 className="text-3xl font-black text-text-primary tracking-tighter">
            Operations <span className="text-accent">Overview</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Subtle refresh spinner when switching filters */}
          {isRefreshing && (
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          )}
          <div className="flex bg-app-bg border border-border-main p-1 rounded-xl gap-1 shadow-inner">
            {['24H', '7D', '30D', 'ALL'].map(t => (
              <button
                key={t}
                onClick={() => setActiveRange(t)}
                className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
                  activeRange === t
                    ? 'bg-accent text-white shadow-lg shadow-accent/30'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card rounded-2xl p-6 hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
          >
            {/* Subtle glow */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-xl" style={{ background: kpi.color }} />

            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl" style={{ background: kpi.color + '20' }}>
                <kpi.icon className="h-5 w-5" style={{ color: kpi.color }} />
              </div>
              <div className={`flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-full ${
                kpi.trendUp ? 'bg-status-success-bg text-status-success' : 'bg-status-danger-bg text-status-danger'
              }`}>
                {kpi.trendUp && <ArrowUpRight className="h-3 w-3" />}
                {kpi.trend}
              </div>
            </div>

            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{kpi.label}</p>
            <h4 className="text-2xl font-black text-text-primary tracking-tighter mb-3">
              {kpi.isPrice ? formatPrice(kpi.value) : kpi.value.toLocaleString()}
            </h4>

            <Sparkline values={kpi.spark} color={kpi.color} />
          </motion.div>
        ))}
      </div>

      {/* ── Revenue Chart + Conversion Ring ───────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Revenue Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="xl:col-span-2 card rounded-3xl p-7"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-black text-text-primary flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-accent" /> Revenue Trajectory
              </h3>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-0.5">
                Revenue distribution • {activeRange}
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-status-success bg-status-success-bg px-3 py-1.5 rounded-full">
              <TrendingUp className="h-3 w-3" /> Trending Up
            </div>
          </div>
          <div className="pb-8">
            <BarChart data={stats?.revenueData || []} formatPrice={formatPrice} />
          </div>
        </motion.div>

        {/* Conversion + Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="card rounded-3xl p-7 flex flex-col gap-6"
        >
          {/* Conversion Ring */}
          <div className="text-center">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4">Order Conversion</p>
            <div className="relative inline-flex items-center justify-center">
              <RadialProgress value={conversionRate} max={100} color="#6366f1" size={100} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-text-primary">{conversionRate}%</span>
              </div>
            </div>
            <p className="text-xs font-bold text-text-muted mt-3">
              {stats?.total_orders || 0} orders from {stats?.total_users || 0} users
            </p>
          </div>

          <div className="h-px bg-border-subtle" />

          {/* Quick Stats */}
          <div className="space-y-3">
            {[
              { label: 'Avg Order Value', value: stats?.total_orders > 0 ? formatPrice(stats.total_revenue / stats.total_orders) : '₹0', icon: DollarSign, color: '#6366f1' },
              { label: 'Top Products', value: `${stats?.topSelling?.length || 0} tracked`, icon: Award, color: '#f59e0b' },
              { label: 'Low Stock Alerts', value: `${stats?.low_stock?.length || 0} items`, icon: Bell, color: '#ef4444' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-app-bg border border-border-subtle hover:border-border-main transition-all group">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg" style={{ background: item.color + '20' }}>
                    <item.icon className="h-3.5 w-3.5" style={{ color: item.color }} />
                  </div>
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{item.label}</span>
                </div>
                <span className="text-xs font-black text-text-primary">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Top Selling + Recent Reviews + Low Stock ──────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Top Selling Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="card rounded-3xl p-7"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-text-primary flex items-center gap-2">
              <Zap className="h-4 w-4 text-status-warning" /> Top Selling
            </h3>
            <Link to="/admin/products" className="text-[9px] font-black text-accent uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
              View All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {stats?.topSelling?.length > 0 ? (
            <div className="space-y-4">
              {stats.topSelling.map((product, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="flex items-center gap-4 p-3 rounded-xl bg-app-bg border border-border-subtle hover:border-accent/30 transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-[10px] font-black flex-shrink-0">
                    #{i + 1}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-xs font-bold text-text-primary truncate">{product.name}</p>
                    <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-0.5">{product.sales} units sold</p>
                  </div>
                  <div className="flex items-center gap-1 text-status-success text-[9px] font-black bg-status-success-bg px-2 py-0.5 rounded-full flex-shrink-0">
                    <ArrowUpRight className="h-2.5 w-2.5" /> {product.growth}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center text-text-muted">
              <Package className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-xs font-black uppercase tracking-widest">No sales data yet</p>
            </div>
          )}
        </motion.div>

        {/* Recent Reviews */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="card rounded-3xl p-7"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-text-primary flex items-center gap-2">
              <Star className="h-4 w-4 text-status-star fill-status-star" /> Recent Reviews
            </h3>
            <Link to="/admin/reviews" className="text-[9px] font-black text-accent uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
              View All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {stats?.recentReviews?.length > 0 ? (
            <div className="space-y-4">
              {stats.recentReviews.slice(0, 4).map((review, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className="p-3 rounded-xl bg-app-bg border border-border-subtle"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-[10px] font-black text-text-primary">{review.user}</p>
                      <p className="text-[9px] font-bold text-text-muted truncate max-w-[120px]">{review.product}</p>
                    </div>
                    <div className="flex gap-0.5 flex-shrink-0">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`h-2.5 w-2.5 ${s <= review.rating ? 'fill-status-star text-status-star' : 'text-border-main'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-[9px] text-text-muted line-clamp-2 leading-relaxed">"{review.comment}"</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center text-text-muted">
              <Star className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-xs font-black uppercase tracking-widest">No reviews yet</p>
            </div>
          )}
        </motion.div>

        {/* Low Stock Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="card rounded-3xl p-7 border border-status-danger/20"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-status-danger flex items-center gap-2">
              <Bell className="h-4 w-4" /> Low Stock
            </h3>
            <span className="text-[9px] font-black bg-status-danger text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
              {stats?.low_stock?.length || 0} Alerts
            </span>
          </div>

          {stats?.low_stock?.length > 0 ? (
            <div className="space-y-3">
              {stats.low_stock.map((item, i) => {
                const pct = Math.min((item.stockQuantity / 20) * 100, 100);
                const urgency = item.stockQuantity === 0 ? 'danger' : item.stockQuantity < 3 ? 'danger' : 'warning';
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    className="p-3 rounded-xl bg-app-bg border border-status-danger/20 hover:border-status-danger/40 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold text-text-primary truncate max-w-[150px]">{item.name}</p>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                        urgency === 'danger' ? 'bg-status-danger text-white' : 'bg-status-warning-bg text-status-warning'
                      }`}>
                        {item.stockQuantity === 0 ? 'Out' : `${item.stockQuantity} left`}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-border-subtle rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${urgency === 'danger' ? 'bg-status-danger' : 'bg-status-warning'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </motion.div>
                );
              })}
              <Link
                to="/admin/products"
                className="block w-full text-center py-2.5 rounded-xl border border-status-danger/30 text-status-danger text-[10px] font-black uppercase tracking-widest hover:bg-status-danger-bg transition-all mt-2"
              >
                Manage Inventory →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <ShieldCheck className="h-10 w-10 text-status-success opacity-60 mb-3" />
              <p className="text-xs font-black text-status-success uppercase tracking-widest">Inventory Healthy</p>
              <p className="text-[10px] text-text-muted mt-1">No critical stock alerts</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
