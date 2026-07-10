import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Users, ShoppingBag, DollarSign,
  ArrowUpRight, Package, BarChart3, Activity,
  ShieldCheck, Cpu, HardDrive, Bell, Globe
} from 'lucide-react';
import { getDashboardStats } from '../../services/api';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Skeleton, SkeletonGrid, Badge } from '../../components/common';

const AdminDashboard = () => {
  const { formatPrice } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState('7D');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const kpis = [
    { label: 'Total Revenue',         value: stats?.total_revenue || 0, icon: DollarSign, trend: '+12.5%', isPrice: true  },
    { label: 'Active Orders',          value: stats?.total_orders  || 0, icon: ShoppingBag, trend: '+5.2%',  isPrice: false },
    { label: 'Registered Engineers',   value: stats?.total_users   || 0, icon: Users,       trend: '+8.1%',  isPrice: false },
    { label: 'IoT Nodes Online',       value: 124,                        icon: Cpu,         trend: '+24.3%', isPrice: false },
  ];

  const systemMetrics = [
    { label: 'Broker Uptime',    val: '99.99%',   icon: ShieldCheck, colorClass: 'text-status-success' },
    { label: 'Storage Cluster',  val: '82%',       icon: HardDrive,   colorClass: 'text-accent' },
    { label: 'API Latency',      val: '24ms',      icon: Activity,    colorClass: 'text-status-warning' },
    { label: 'Critical Alerts',  val: '0 Active',  icon: Bell,        colorClass: 'text-text-inverse' },
  ];

  if (loading) {
    return (
      <div className="space-y-10">
        <div className="mb-12">
          <Skeleton className="w-32 h-4 mb-2" />
          <Skeleton className="w-64 h-10" />
        </div>
        <SkeletonGrid count={4}>
          <div className="card p-8 rounded-[32px] flex flex-col items-center">
            <Skeleton className="w-12 h-12 rounded-full mb-4" />
            <Skeleton className="w-1/2 h-4 mb-2" />
            <Skeleton className="w-3/4 h-8" />
          </div>
        </SkeletonGrid>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="w-full h-[400px] rounded-[40px]" />
          <Skeleton className="w-full h-[400px] rounded-[40px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div>
          <p className="label-caps text-accent mb-2">Central Command</p>
          <h1 className="heading-page">Operations <span className="text-accent">Overview</span></h1>
        </div>
        <div className="flex bg-card-bg border border-border-main p-1 rounded-sm shadow-sm">
          {['24H', '7D', '30D', 'ALL'].map(t => (
            <button
              key={t}
              onClick={() => setActiveRange(t)}
              className={`px-6 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${
                activeRange === t ? 'bg-accent text-text-inverse shadow-lg' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card rounded-[32px] p-8 hover:shadow-xl transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-sm bg-accent text-text-inverse shadow-lg group-hover:scale-110 transition-transform">
                <kpi.icon className="h-6 w-6" />
              </div>
              <div className="flex items-center gap-1 text-status-success font-black text-[10px] bg-status-success-bg px-2 py-1 rounded-sm border border-status-success/20">
                <ArrowUpRight className="h-3 w-3" />
                {kpi.trend}
              </div>
            </div>
            <p className="label-caps mb-2">{kpi.label}</p>
            <h4 className="text-3xl font-black text-text-primary tracking-tighter uppercase">
              {kpi.isPrice ? formatPrice(kpi.value) : kpi.value.toLocaleString()}
            </h4>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Revenue Chart */}
        <div className="xl:col-span-2 card rounded-[40px] p-10">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="heading-section flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-accent" /> Financial Trajectory
              </h3>
              <p className="label-caps mt-1">Revenue distribution across components</p>
            </div>
          </div>
          <div className="h-80 flex items-end gap-4 p-4 bg-app-bg rounded-[32px] border-2 border-dashed border-border-subtle relative">
            {[65, 45, 75, 55, 90, 70, 85, 40, 60, 95, 50, 80].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                className="flex-grow bg-accent/20 rounded-t-xl relative group"
              >
                <div className="absolute inset-0 bg-accent rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[8px] font-black opacity-0 group-hover:opacity-100 transition-opacity text-text-primary">
                  {formatPrice(h * 100)}
                </div>
              </motion.div>
            ))}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
              <Activity className="h-32 w-32 text-accent" />
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-surface-dark rounded-[40px] p-10 text-text-inverse shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 blur-[100px] rounded-full" />
          <h3 className="heading-section text-text-inverse mb-10 flex items-center gap-3">
            <Globe className="h-6 w-6 text-accent" /> Global Infrastructure
          </h3>
          <div className="space-y-8">
            {systemMetrics.map((sys, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-card-bg/5 rounded-sm border border-card-bg/10 group-hover:bg-accent/20 transition-all">
                    <sys.icon className={`h-5 w-5 ${sys.colorClass}`} />
                  </div>
                  <span className="label-caps text-text-muted">{sys.label}</span>
                </div>
                <span className="text-sm font-black uppercase">{sys.val}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-12 py-4 bg-card-bg/10 border border-card-bg/20 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-card-bg hover:text-text-primary transition-all">
            System Diagnostics
          </button>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card rounded-[40px] p-10">
        <div className="flex items-center justify-between mb-10">
          <h3 className="heading-section">Live Order Stream</h3>
          <button className="btn-ghost text-[10px]">Monitor All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-subtle">
                {['Order ID', 'Customer', 'Revenue', 'Node Status'].map(h => (
                  <th key={h} className="py-6 px-4 label-caps">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {[1, 2, 3].map(i => (
                <tr key={i} className="hover:bg-app-bg transition-all">
                  <td className="py-6 px-4 font-black text-xs text-text-primary uppercase">#IM-8291-{i}</td>
                  <td className="py-6 px-4 font-bold text-xs text-text-secondary uppercase">Engineer {i}</td>
                  <td className="py-6 px-4 font-black text-sm text-text-primary">{formatPrice(1249 * i)}</td>
                  <td className="py-6 px-4">
                    <Badge variant="success">Deployed</Badge>
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

export default AdminDashboard;
