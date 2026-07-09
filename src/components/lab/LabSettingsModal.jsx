import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Shield, Zap, Database, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const LabSettingsModal = ({ isOpen, onClose }) => {
  const [keys, setKeys] = useState({
    nexar_id: '',
    nexar_secret: '',
    snapeda_key: '',
    groq_key: ''
  });

  useEffect(() => {
    // Load from localStorage for quick persistence in browser
    const saved = localStorage.getItem('iotmart_lab_keys');
    if (saved) setKeys(JSON.parse(saved));
  }, []);

  const saveKeys = () => {
    localStorage.setItem('iotmart_lab_keys', JSON.stringify(keys));
    toast.success("API Settings Saved Locally!");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
            className="bg-surface-dark border border-lab-border w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl">
            
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Settings className="h-5 w-5 text-violet-400" /> Lab Integration Hub
                </h2>
                <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-1">Configure external component engines</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-surface-dark rounded-full transition-all">
                <X className="h-5 w-5 text-text-muted" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Nexar Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-accent">
                  <Database className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Nexar / Octopart (Parts Data)</span>
                </div>
                <input 
                  value={keys.nexar_id} 
                  onChange={e => setKeys({...keys, nexar_id: e.target.value})}
                  placeholder="Client ID"
                  className="w-full bg-surface-dark border border-lab-border rounded-sm px-4 py-3 text-xs text-white outline-none focus:border-accent"
                />
                <input 
                  type="password"
                  value={keys.nexar_secret} 
                  onChange={e => setKeys({...keys, nexar_secret: e.target.value})}
                  placeholder="Client Secret"
                  className="w-full bg-surface-dark border border-lab-border rounded-sm px-4 py-3 text-xs text-white outline-none focus:border-accent"
                />
              </div>

              {/* SnapEDA Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-orange-400">
                  <Zap className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">SnapEDA (Symbol/Pin API)</span>
                </div>
                <input 
                  value={keys.snapeda_key} 
                  onChange={e => setKeys({...keys, snapeda_key: e.target.value})}
                  placeholder="SnapEDA API Key"
                  className="w-full bg-surface-dark border border-lab-border rounded-sm px-4 py-3 text-xs text-white outline-none focus:border-orange-500"
                />
              </div>

              {/* Simulation Intelligence */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-violet-400">
                  <Shield className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Simulation Brain (Groq AI)</span>
                </div>
                <input 
                  value={keys.groq_key} 
                  onChange={e => setKeys({...keys, groq_key: e.target.value})}
                  placeholder="Groq API Key (for Logic Generation)"
                  className="w-full bg-surface-dark border border-lab-border rounded-sm px-4 py-3 text-xs text-white outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <button 
              onClick={saveKeys}
              className="w-full mt-8 bg-violet-600 hover:bg-violet-500 text-white font-black py-4 rounded-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-500/20"
            >
              <CheckCircle2 className="h-5 w-5" /> Activate Lab Engine
            </button>
            
            <p className="text-center text-[9px] text-text-secondary mt-4">Keys are stored securely in your browser's local storage.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LabSettingsModal;
