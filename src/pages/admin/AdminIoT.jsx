import React, { useState } from 'react';
import { 
  Cpu, Wifi, Zap, Settings, RefreshCcw, 
  Terminal, ShieldCheck, Activity, Globe,
  Search, HardDrive, Bell, AlertTriangle, Cloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminIoT = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateLog, setUpdateLog] = useState([]);

  const fleet = [
    { id: 'IOT-8291-A', user: 'Engineer #201', type: 'ESP32 Gateway', version: 'v1.4.2', uptime: '12d 4h', status: 'Healthy' },
    { id: 'IOT-2234-B', user: 'Engineer #102', type: 'DHT Node', version: 'v1.4.0', uptime: '3d 2h', status: 'Warning' },
    { id: 'IOT-9901-C', user: 'Engineer #055', type: 'Relay Cluster', version: 'v1.4.2', uptime: '44d 11h', status: 'Healthy' },
  ];

  const handlePushUpdate = () => {
    setIsUpdating(true);
    setUpdateLog(['[SYS] Firmware v1.5.0 build identified...', '[PUSH] Broadcasting binary to fleet...']);
    
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setUpdateLog(prev => [`[NODE] Update successful for device chunk ${count}...`, ...prev]);
      if (count === 3) {
        clearInterval(interval);
        setUpdateLog(prev => ['[DONE] Fleet-wide firmware deployment complete.', ...prev]);
        setIsUpdating(false);
      }
    }, 1500);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12 pb-8 border-b border-border-main">
        <div>
          <p className="text-accent text-[10px] font-black uppercase tracking-[0.3em] mb-2">Fleet Management</p>
          <h1 className="text-4xl font-black text-text-primary tracking-tighter uppercase">Hardware <span className="text-accent">Orchestration</span></h1>
        </div>
        <button 
          onClick={handlePushUpdate}
          disabled={isUpdating}
          className="btn-premium px-10 py-5 text-xs flex items-center gap-3 shadow-xl shadow-accent/20"
        >
          {isUpdating ? <RefreshCcw className="h-5 w-5 animate-spin" /> : <Cloud className="h-5 w-5" />}
          Broadcast Firmware v1.5.0
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Global Node Map / Stats */}
        <div className="lg:col-span-2 bg-card-bg rounded-[40px] border border-border-main p-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[100px] rounded-full"></div>
          <h3 className="text-xl font-black text-text-primary uppercase tracking-tighter mb-10 flex items-center gap-3">
            <Globe className="h-6 w-6 text-accent" /> Active Infrastructure
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="py-6 px-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Device Node</th>
                  <th className="py-6 px-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Assignee</th>
                  <th className="py-6 px-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Firmware</th>
                  <th className="py-6 px-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Uptime</th>
                  <th className="py-6 px-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Pulse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {fleet.map((dev, i) => (
                  <tr key={i} className="group hover:bg-app-bg/50 transition-all">
                    <td className="py-6 px-4">
                      <div className="flex items-center gap-3">
                        <Cpu className="h-4 w-4 text-accent" />
                        <div>
                          <p className="text-xs font-black text-text-primary uppercase">{dev.id}</p>
                          <p className="text-[9px] text-text-muted font-bold uppercase">{dev.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-4 text-xs font-bold text-text-secondary uppercase">{dev.user}</td>
                    <td className="py-6 px-4 font-mono text-[10px] text-accent font-black">{dev.version}</td>
                    <td className="py-6 px-4 text-[10px] font-black text-text-muted uppercase tracking-widest">{dev.uptime}</td>
                    <td className="py-6 px-4">
                      <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${dev.status === 'Healthy' ? 'text-status-success' : 'text-status-warning'}`}>
                        <div className={`w-2 h-2 rounded-full animate-pulse ${dev.status === 'Healthy' ? 'bg-status-success' : 'bg-status-warning'}`}></div>
                        {dev.status}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Update Log */}
        <div className="bg-surface-dark rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/30 blur-[60px] rounded-full"></div>
          <h3 className="text-lg font-black uppercase tracking-tight mb-8 flex items-center gap-3 relative z-10">
            <Terminal className="h-5 w-5 text-status-success" /> Deployment Console
          </h3>
          <div className="flex-grow font-mono text-[10px] space-y-3 h-[400px] overflow-hidden relative z-10">
            <AnimatePresence mode="popLayout">
              {updateLog.length > 0 ? updateLog.map((log, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`${log.includes('DONE') ? 'text-status-success font-black' : 'text-status-success/80'} leading-relaxed`}
                >
                  <span className="text-white/20 mr-2">{'>'}</span> {log}
                </motion.div>
              )) : (
                <p className="text-white/20 italic">No active deployments. Systems nominal.</p>
              )}
            </AnimatePresence>
          </div>
          <div className="mt-8 pt-8 border-t border-card-bg/5 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <span className="text-[9px] font-black uppercase text-white/40">Secure Tunnel v2</span>
            </div>
            <Activity className="h-4 w-4 text-white/20" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminIoT;
