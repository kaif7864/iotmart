import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api.client';
import { Activity, ShieldCheck, User, Package, Settings, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await apiClient.get('/logs');
      setLogs(res.data);
    } catch (error) {
      toast.error('Failed to load system logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    const act = action.toLowerCase();
    if (act.includes('login') || act.includes('auth')) return <User className="h-4 w-4" />;
    if (act.includes('product') || act.includes('stock')) return <Package className="h-4 w-4" />;
    if (act.includes('setting')) return <Settings className="h-4 w-4" />;
    if (act.includes('delete') || act.includes('remove')) return <AlertCircle className="h-4 w-4 text-status-danger" />;
    return <Activity className="h-4 w-4" />;
  };

  if (loading) return <div className="p-8 text-text-primary font-bold text-xl">Initializing Audit Trail...</div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-border-main">
        <div>
          <p className="label-caps text-accent mb-2">Security Hub</p>
          <h1 className="heading-page flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-accent" /> System <span className="text-accent">Audit Logs</span>
          </h1>
          <p className="text-text-muted mt-2 font-medium">Real-time security monitoring and activity tracking</p>
        </div>
        <button onClick={fetchLogs} className="btn-outline px-4 py-3 text-xs flex items-center justify-center gap-2 rounded-xl border-border-main text-text-primary font-bold hover:text-accent hover:border-accent/30 transition-all w-full md:w-auto">
          <Activity className="h-4 w-4" /> REFRESH
        </button>
      </div>

      <div className="card border border-border-main p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-subtle bg-app-bg/50">
                {['Timestamp', 'User Identity', 'Action', 'Target', 'Details'].map(h => (
                  <th key={h} className="py-4 px-6 label-caps text-[10px] tracking-widest text-text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-text-muted">
                    No activity logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-app-bg/30 transition-colors">
                    <td className="py-4 px-6 text-xs text-text-secondary font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 font-bold text-xs text-text-primary">
                      {log.user}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-accent">
                        {getActionIcon(log.action)}
                        {log.action}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-text-secondary uppercase">
                      {log.target}
                    </td>
                    <td className="py-4 px-6 text-xs text-text-muted max-w-xs truncate" title={log.details}>
                      {log.details || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminLogs;
