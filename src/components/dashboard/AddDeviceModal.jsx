import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Radio } from 'lucide-react';

const AddDeviceModal = ({ isOpen, onClose, onSubmit, newDeviceId, setNewDeviceId }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-surface-dark/80 backdrop-blur-md">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-card-bg w-full max-w-lg rounded-[40px] p-12 shadow-2xl relative">
          <button onClick={onClose} className="absolute top-10 right-10 p-2 hover:bg-app-bg rounded-full transition-all">
            <X className="h-5 w-5" />
          </button>
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-accent/10 rounded-sm flex items-center justify-center mx-auto mb-6 text-accent">
              <Radio className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-black text-text-primary uppercase tracking-tight">Add New Device</h3>
          </div>
          <form onSubmit={onSubmit} className="space-y-8">
            <input 
              type="text" 
              value={newDeviceId}
              onChange={(e) => setNewDeviceId(e.target.value)}
              placeholder="Device ID (e.g. IOT-ESP32-004)"
              className="w-full px-6 py-4 bg-app-bg border border-border-main rounded-sm text-sm font-black text-text-primary focus:border-accent outline-none"
              required
            />
            <button type="submit" className="w-full btn-premium py-5 text-sm font-black uppercase tracking-widest">
              Connect Node
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddDeviceModal;
