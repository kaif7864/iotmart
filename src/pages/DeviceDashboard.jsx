import React, { useState, useEffect } from 'react';
import { 
  Cpu, Power, Activity, Thermometer, 
  Droplets, Shield, Bell, Plus, Settings, 
  Wifi, WifiOff, Zap, BarChart3, Radio, 
  Trash2, Info, AlertTriangle, RefreshCcw, CheckCircle2,
  Terminal, ShieldAlert, HeartPulse, HardDrive, X,
  Sparkles, BrainCircuit, Wrench
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AddDeviceModal from '../components/dashboard/AddDeviceModal';

const DeviceDashboard = () => {
  const { user } = useAuth();
  const [devices, setDevices] = useState([
    { id: 'IOT-ESP32-001', name: 'Living Room Gateway', type: 'Microcontroller', status: 'Online', temp: 24.5, humidity: 45, relay: true, signal: 88, health: 98 },
    { id: 'IOT-DHT-002', name: 'Greenhouse Sensor', type: 'Sensor Node', status: 'Online', temp: 28.2, humidity: 62, relay: false, signal: 72, health: 94 },
    { id: 'IOT-REL-003', name: 'Smart AC Control', type: 'Relay Module', status: 'Offline', temp: 0, humidity: 0, relay: false, signal: 0, health: 0 },
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDeviceId, setNewDeviceId] = useState('');
  const [consoleLogs, setConsoleLogs] = useState([
    '[SYSTEM] Booting IoT Control Center...',
    '[MQTT] Connected to broker.iotmart.com',
    '[AUTH] Token validated for engineer session.'
  ]);
  const [activeDevice, setActiveDevice] = useState(devices[0]);

  // Connect to Real-time WebSocket Telemetry
  useEffect(() => {
    if (!activeDevice || !user) return;

    const ws = new WebSocket(`ws://localhost:8000/api/ws/telemetry/${activeDevice.id}`);

    ws.onopen = () => {
      setConsoleLogs(prev => [`[WS] Connected to telemetry stream for ${activeDevice.id}`, ...prev].slice(0, 8));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      setDevices(prev => prev.map(d => {
        if (d.id === activeDevice.id) {
          return {
            ...d,
            temp: data.temperature,
            humidity: data.humidity,
            signal: data.networkStrength,
            health: Math.min(100, Math.max(0, 100 - (data.cpuUsage / 2))) // Mock calculation
          };
        }
        return d;
      }));

      // Update active device reference
      setDevices(prev => {
        const found = prev.find(d => d.id === activeDevice.id);
        if (found) setActiveDevice(found);
        return prev;
      });

      setConsoleLogs(prev => [`[DATA] Temp: ${data.temperature}°C, Hum: ${data.humidity}%, CPU: ${data.cpuUsage}%`, ...prev].slice(0, 8));
    };

    ws.onclose = () => {
      setConsoleLogs(prev => [`[WS] Connection closed for ${activeDevice.id}`, ...prev].slice(0, 8));
    };

    return () => {
      ws.close();
    };
  }, [activeDevice?.id, user]);

  const toggleRelay = (id) => {
    setDevices(prev => prev.map(d => {
        if (d.id === id) {
            const newState = !d.relay;
            setConsoleLogs(prevLogs => [`[CMD] Relay ${newState ? 'ON' : 'OFF'} command sent to ${id}`, ...prevLogs]);
            return { ...d, relay: newState };
        }
        return d;
    }));
  };

  const handleAddDevice = (e) => {
    e.preventDefault();
    if (newDeviceId) {
      const newDev = {
        id: newDeviceId,
        name: 'New Node',
        type: 'Generic Device',
        status: 'Online',
        temp: 22.0,
        humidity: 50,
        relay: false,
        signal: 100,
        health: 100
      };
      setDevices([...devices, newDev]);
      setNewDeviceId('');
      setShowAddModal(false);
    }
  };

  if (!user) {
    return (
      <div className="pt-48 pb-32 min-h-screen text-center bg-app-bg">
        <h2 className="text-3xl font-black text-text-primary mb-6 uppercase tracking-tighter">IoT Control Center Locked</h2>
        <p className="text-text-muted mb-10 max-w-sm mx-auto font-medium">Please login to authorize device telemetry access.</p>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-32 min-h-screen bg-app-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 border-b border-border-main pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 bg-status-success rounded-full animate-ping"></div>
              <p className="text-status-success text-[10px] font-black uppercase tracking-[0.3em]">MQTT Broker Online</p>
            </div>
            <h1 className="text-4xl font-black text-text-primary tracking-tighter uppercase leading-none">Real-Time <span className="text-accent">Monitoring</span></h1>
          </div>
          <div className="flex gap-4">
            {/* <div className="bg-card-bg px-6 py-3 rounded-sm border border-border-main shadow-sm flex items-center gap-3">
              <HeartPulse className="h-5 w-5 text-status-danger" />
              <div>
                <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">Network Health</p>
                <p className="text-sm font-black text-text-primary uppercase">Excellent (98%)</p>
              </div>
            </div> */}
            <button onClick={() => setShowAddModal(true)} className="btn-premium px-8 py-4 text-xs flex items-center gap-3">
              <Plus className="h-5 w-5" /> Add Device
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Sidebar - Device List */}
          <aside className="lg:col-span-4 space-y-6">
            <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-2">Connected Devices</h3>
            <div className="space-y-4">
              {devices.map(device => (
                <button 
                  key={device.id}
                  onClick={() => setActiveDevice(device)}
                  className={`w-full text-left p-6 rounded-sm border-2 transition-all relative group ${
                    activeDevice.id === device.id 
                      ? 'border-accent bg-card-bg shadow-xl shadow-accent/5' 
                      : 'border-transparent bg-card-bg/50 hover:bg-card-bg hover:border-border-main'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-sm flex items-center justify-center ${activeDevice.id === device.id ? 'bg-accent text-white' : 'bg-surface-hover text-text-muted'}`}>
                        <Cpu className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-text-primary uppercase tracking-tight">{device.name}</h4>
                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{device.id}</p>
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${device.status === 'Online' ? 'bg-status-success shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-status-danger'}`}></div>
                  </div>
                </button>
              ))}
            </div>

            {/* MQTT Console */}
            <div className="bg-surface-dark rounded-sm p-6 shadow-2xl overflow-hidden relative group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-status-success" />
                  <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Telemetry Stream</span>
                </div>
                <div className="w-1.5 h-1.5 bg-status-success rounded-full animate-pulse"></div>
              </div>
              <div className="font-mono text-[10px] space-y-2 h-40 overflow-hidden">
                <AnimatePresence mode="popLayout">
                  {consoleLogs.map((log, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-status-success/80 leading-relaxed truncate"
                    >
                      <span className="text-white/20 mr-2">{'>'}</span> {log}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </aside>

          {/* Main Monitor - Active Device Details */}
          <main className="lg:col-span-8 space-y-8">
            <div className="bg-card-bg rounded-[40px] p-10 border border-border-main shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[100px] rounded-full"></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
                <div>
                  <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter">{activeDevice.name}</h2>
                  <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mt-1">Status: <span className={activeDevice.status === 'Online' ? 'text-status-success' : 'text-status-danger'}>{activeDevice.status}</span> • ID: {activeDevice.id}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Signal Strength</p>
                    <div className="flex gap-0.5 h-4 items-end">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`w-1 rounded-full ${i <= 4 ? 'bg-accent' : 'bg-surface-hover'}`} style={{ height: `${i * 20}%` }}></div>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => activeDevice.status === 'Online' && toggleRelay(activeDevice.id)}
                    className={`btn-premium px-8 py-4 text-[10px] flex items-center gap-3 ${activeDevice.status !== 'Online' && 'opacity-50 grayscale cursor-not-allowed'}`}
                  >
                    <Power className="h-4 w-4" />
                    {activeDevice.relay ? 'Shutdown Node' : 'Initialize Node'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <div className="bg-app-bg p-8 rounded-sm border border-border-subtle text-center">
                  <div className="w-12 h-12 bg-card-bg rounded-sm flex items-center justify-center mx-auto mb-4 text-status-danger shadow-sm">
                    <Thermometer className="h-6 w-6" />
                  </div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Temperature</p>
                  <h4 className="text-4xl font-black text-text-primary tracking-tighter">{activeDevice.temp}°C</h4>
                </div>
                <div className="bg-app-bg p-8 rounded-sm border border-border-subtle text-center">
                  <div className="w-12 h-12 bg-card-bg rounded-sm flex items-center justify-center mx-auto mb-4 text-accent shadow-sm">
                    <Droplets className="h-6 w-6" />
                  </div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Humidity</p>
                  <h4 className="text-4xl font-black text-text-primary tracking-tighter">{activeDevice.humidity}%</h4>
                </div>
                <div className="bg-app-bg p-8 rounded-sm border border-border-subtle text-center">
                  <div className="w-12 h-12 bg-card-bg rounded-sm flex items-center justify-center mx-auto mb-4 text-status-success shadow-sm">
                    <Zap className="h-6 w-6" />
                  </div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Device Health</p>
                  <h4 className="text-4xl font-black text-text-primary tracking-tighter">{activeDevice.health}%</h4>
                </div>
              </div>
            </div>

            {/* AI Predictive Maintenance */}
            <div className="bg-gradient-to-br from-secondary to-surface-dark p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 blur-[100px] rounded-full"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                      <BrainCircuit className="h-6 w-6 text-accent" /> AI Predictive Insights
                    </h3>
                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">Machine Learning Analysis Engine</p>
                  </div>
                  <div className="px-4 py-2 bg-card-bg/10 rounded-sm border border-card-bg/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    AI Status Active
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <div>
                      <div className="flex justify-between items-end mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Estimated Lifespan</span>
                        <span className="text-sm font-black text-status-success">842 Days Left</span>
                      </div>
                      <div className="h-2 bg-card-bg/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-status-success"></motion.div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-end mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Component Wear Factor</span>
                        <span className="text-sm font-black text-amber-400">Low (12%)</span>
                      </div>
                      <div className="h-2 bg-card-bg/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: '12%' }} className="h-full bg-amber-500"></motion.div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-card-bg/5 border border-card-bg/10 rounded-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <Wrench className="h-5 w-5 text-accent" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest">Maintenance Alert</h4>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed font-medium mb-6">
                      AI model predicts high probability of capacitor fatigue in the next 120 days based on usage patterns. Recommendation: Schedule preventive inspection.
                    </p>
                    <button className="w-full py-3 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:shadow-lg transition-all shadow-accent/20">
                      Order Replacement Kit
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics - Advanced Charting */}
            <div className="bg-card-bg p-10 rounded-[40px] border border-border-main shadow-sm">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-xl font-black text-text-primary uppercase tracking-tighter flex items-center gap-3">
                    <BarChart3 className="h-6 w-6 text-accent" /> Analytics Engine
                  </h3>
                  <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-1">Deep packet inspection telemetry</p>
                </div>
                <div className="flex bg-app-bg p-1 rounded-sm">
                  {['Live', 'History'].map(v => (
                    <button key={v} className={`px-5 py-2 rounded-sm text-[9px] font-black uppercase tracking-widest transition-all ${v === 'Live' ? 'bg-card-bg text-accent shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">Processing Load</span>
                    <span className="text-sm font-black text-accent">42%</span>
                  </div>
                  <div className="h-2 bg-app-bg rounded-full overflow-hidden border border-border-subtle">
                    <motion.div initial={{ width: 0 }} animate={{ width: '42%' }} className="h-full bg-accent"></motion.div>
                  </div>
                  
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">Memory Utilization</span>
                    <span className="text-sm font-black text-accent">28%</span>
                  </div>
                  <div className="h-2 bg-app-bg rounded-full overflow-hidden border border-border-subtle">
                    <motion.div initial={{ width: 0 }} animate={{ width: '28%' }} className="h-full bg-accent"></motion.div>
                  </div>

                  <div className="flex justify-between items-end mb-4">
                    <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">Network Jitter</span>
                    <span className="text-sm font-black text-status-success">12ms</span>
                  </div>
                  <div className="h-2 bg-app-bg rounded-full overflow-hidden border border-border-subtle">
                    <motion.div initial={{ width: 0 }} animate={{ width: '15%' }} className="h-full bg-status-success"></motion.div>
                  </div>
                </div>

                <div className="bg-surface-dark rounded-sm p-8 flex flex-col justify-between border border-card-bg/10 shadow-2xl">
                  <div>
                    <h4 className="text-white text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-accent" /> Security Protocol
                    </h4>
                    <p className="text-white/60 text-xs font-medium leading-relaxed">
                      All telemetry is end-to-end encrypted using AES-256. Connection is persistent via MQTT over WebSockets.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-6 border-t border-card-bg/5">
                    <div className="w-2 h-2 bg-status-success rounded-full animate-pulse"></div>
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Secure Link Established</span>
                  </div>
                </div>
              </div>
            </div>
          </main>

        </div>
      </div>

      {/* Add Device Modal */}
      <AddDeviceModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddDevice}
        newDeviceId={newDeviceId}
        setNewDeviceId={setNewDeviceId}
      />
    </div>
  );
};

export default DeviceDashboard;
