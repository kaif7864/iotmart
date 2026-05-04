import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, ShoppingBag, DollarSign, 
  ArrowUpRight, ArrowDownRight, Package, Loader2,
  BarChart3, PieChart, Activity, ShieldCheck, 
  Cpu, HardDrive, Bell, Globe
} from 'lucide-react';
import { getDashboardStats } from '../../services/api';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { formatPrice } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const kpis = [
    { label: 'Total Revenue', value: stats?.total_revenue || 0, icon: DollarSign, trend: '+12.5%', color: 'bg-emerald-500', isPrice: true },
    { label: 'Active Orders', value: stats?.total_orders || 0, icon: ShoppingBag, trend: '+5.2%', color: 'bg-blue-500', isPrice: false },
    { label: 'Registered Engineers', value: stats?.total_users || 0, icon: Users, trend: '+8.1%', color: 'bg-indigo-500', isPrice: false },
    { label: 'IoT Nodes Online', value: 124, icon: Cpu, trend: '+24.3%', color: 'bg-accent', isPrice: false },
  ];

  if (loading) {
    return (
      <div className="h-[calc(100vh-200px)] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-accent animate-spin" />
        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Gathering Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div>
          <p className="text-accent text-[10px] font-black uppercase tracking-[0.3em] mb-2">Central Command</p>
          <h1 className="text-4xl font-black text-text-primary tracking-tighter uppercase">Operations <span className="text-accent">Overview</span></h1>
        </div>
        <div className="flex bg-white border border-border-main p-1 rounded-2xl shadow-sm">
          {['24H', '7D', '30D', 'ALL'].map(t => (
            <button key={t} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${t === '7D' ? 'bg-accent text-white shadow-lg' : 'text-text-muted hover:text-text-primary'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {kpis.map((kpi, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="bg-white p-8 rounded-[32px] border border-border-main shadow-sm hover:shadow-xl transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 rounded-2xl ${kpi.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <kpi.icon className="h-6 w-6" />
              </div>
              <div className="flex items-center gap-1 text-emerald-500 font-black text-[10px] bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                <ArrowUpRight className="h-3 w-3" />
                {kpi.trend}
              </div>
            </div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">{kpi.label}</p>
            <h4 className="text-3xl font-black text-text-primary tracking-tighter uppercase">
              {kpi.isPrice ? formatPrice(kpi.value) : kpi.value.toLocaleString()}
            </h4>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        
        {/* Revenue Analytics Chart */}
        <div className="xl:col-span-2 bg-white p-10 rounded-[40px] border border-border-main shadow-sm">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-xl font-black text-text-primary uppercase tracking-tighter flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-accent" /> Financial Trajectory
              </h3>
              <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-1">Revenue distribution across components</p>
            </div>
          </div>
          <div className="h-80 flex items-end gap-4 p-4 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-100 relative">
            {[65, 45, 75, 55, 90, 70, 85, 40, 60, 95, 50, 80].map((h, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                className="flex-grow bg-accent/20 rounded-t-xl relative group"
              >
                <div className="absolute inset-0 bg-accent rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[8px] font-black opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatPrice(h * 100)}
                </div>
              </motion.div>
            ))}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
              <Activity className="h-32 w-32 text-accent" />
            </div>
          </div>
        </div>

        {/* System Health / IoT Status */}
        <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 blur-[100px] rounded-full"></div>
          <h3 className="text-xl font-black uppercase tracking-tight mb-10 flex items-center gap-3">
            <Globe className="h-6 w-6 text-accent" /> Global Infrastructure
          </h3>
          <div className="space-y-8">
            {[
              { label: 'Broker Uptime', val: '99.99%', icon: ShieldCheck, color: 'text-emerald-400' },
              { label: 'Storage Cluster', val: '82%', icon: HardDrive, color: 'text-blue-400' },
              { label: 'API Latency', val: '24ms', icon: Activity, color: 'text-amber-400' },
              { label: 'Critical Alerts', val: '0 Active', icon: Bell, color: 'text-white' },
            ].map((sys, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:bg-accent/20 transition-all">
                    <sys.icon className={`h-5 w-5 ${sys.color}`} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{sys.label}</span>
                </div>
                <span className="text-sm font-black uppercase">{sys.val}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-12 py-4 bg-white/10 border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all">
            System Diagnostics
          </button>
        </div>

      </div>

      {/* Recent Orders Table Integration */}
      <div className="bg-white p-10 rounded-[40px] border border-border-main shadow-sm">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-xl font-black text-text-primary uppercase tracking-tighter">Live Order Stream</h3>
          <button className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline">Monitor All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="py-6 px-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Order ID</th>
                <th className="py-6 px-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Customer</th>
                <th className="py-6 px-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Revenue</th>
                <th className="py-6 px-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Node Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[1, 2, 3].map(i => (
                <tr key={i} className="group hover:bg-slate-50/50 transition-all">
                  <td className="py-6 px-4 font-black text-xs text-text-primary uppercase">#IM-8291-{i}</td>
                  <td className="py-6 px-4 font-bold text-xs text-text-secondary uppercase">Engineer {i}</td>
                  <td className="py-6 px-4 font-black text-sm text-text-primary">{formatPrice(1249 * i)}</td>
                  <td className="py-6 px-4">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">Deployed</span>
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
