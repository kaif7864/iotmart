import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';

const PIN_TYPES = ['power', 'gnd', 'digital', 'analog', 'pwm', 'serial', 'spi', 'i2c', 'output', 'special'];
const PIN_COLORS = {
  power: '#f59e0b', gnd: '#6b7280', digital: '#38bdf8', analog: '#a78bfa',
  pwm: '#34d399', serial: '#fb923c', spi: '#f472b6', i2c: '#facc15',
  output: '#10b981', special: '#94a3b8',
};

const CustomComponentModal = ({ onAdd, onClose }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Custom');
  const [icon, setIcon] = useState('🔌');
  const [pins, setPins] = useState([
    { id: 'vcc', label: 'VCC', type: 'power', side: 'left' },
    { id: 'gnd', label: 'GND', type: 'gnd', side: 'left' },
    { id: 'sig', label: 'SIG', type: 'digital', side: 'right' },
  ]);

  const addPin = () => setPins(prev => [...prev, { id: `pin_${Date.now()}`, label: 'PIN', type: 'digital', side: 'right' }]);
  const removePin = (id) => setPins(prev => prev.filter(p => p.id !== id));
  const updatePin = (id, key, val) => setPins(prev => prev.map(p => p.id === id ? { ...p, [key]: val } : p));

  const handleSubmit = () => {
    if (!name.trim()) return;
    const comp = {
      id: `CUSTOM_${name.toUpperCase().replace(/\s+/g, '_')}_${Date.now()}`,
      type: 'custom',
      name: name.trim(),
      shortName: name.trim().slice(0, 4).toUpperCase(),
      color: '#7c3aed',
      icon,
      pins,
      width: 90,
      height: Math.max(60, 20 + pins.length * 18),
      category,
      isCustom: true,
    };
    onAdd(comp);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-surface-dark border border-lab-border-light w-full max-w-lg rounded-sm p-7 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-white text-lg tracking-tighter">Create Custom Component</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-text-muted hover:text-white" /></button>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="col-span-2">
            <label className="block text-[8px] font-black text-text-muted uppercase tracking-widest mb-1.5">Component Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. HC-SR04 Ultrasonic"
              className="w-full bg-surface-dark text-white text-sm font-bold rounded-sm px-3 py-2.5 outline-none focus:ring-1 focus:ring-accent border border-lab-border"
            />
          </div>
          <div>
            <label className="block text-[8px] font-black text-text-muted uppercase tracking-widest mb-1.5">Icon (Emoji)</label>
            <input value={icon} onChange={e => setIcon(e.target.value)}
              className="w-full bg-surface-dark text-white text-2xl text-center rounded-sm px-3 py-2.5 outline-none focus:ring-1 focus:ring-accent border border-lab-border"
            />
          </div>
        </div>

        {/* Pins */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <label className="text-[8px] font-black text-text-muted uppercase tracking-widest">Pins</label>
            <button onClick={addPin} className="flex items-center gap-1 px-2 py-1 bg-violet-700 hover:bg-violet-600 text-white rounded-sm text-[8px] font-black uppercase tracking-widest transition-all">
              <Plus className="h-3 w-3" /> Add Pin
            </button>
          </div>
          <div className="space-y-2">
            {pins.map((pin, idx) => (
              <div key={pin.id} className="flex items-center gap-2 bg-surface-dark rounded-sm p-2">
                <span className="text-[8px] font-black text-text-secondary w-4">{idx + 1}</span>
                <input value={pin.label} onChange={e => updatePin(pin.id, 'label', e.target.value)}
                  className="w-20 bg-lab-surface text-white text-[10px] font-black rounded-sm px-2 py-1.5 outline-none focus:ring-1 focus:ring-accent"
                />
                <select value={pin.type} onChange={e => updatePin(pin.id, 'type', e.target.value)}
                  className="flex-grow bg-lab-surface rounded-sm px-2 py-1.5 text-[10px] font-bold outline-none focus:ring-1 focus:ring-accent"
                  style={{ color: PIN_COLORS[pin.type] || '#fff' }}
                >
                  {PIN_TYPES.map(t => <option key={t} value={t} style={{ color: PIN_COLORS[t] }}>{t}</option>)}
                </select>
                <select value={pin.side} onChange={e => updatePin(pin.id, 'side', e.target.value)}
                  className="w-16 bg-lab-surface text-text-muted rounded-sm px-2 py-1.5 text-[10px] font-bold outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
                <button onClick={() => removePin(pin.id)} className="text-red-400 hover:text-red-300 p-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Pin Color Legend */}
        <div className="mb-5 p-3 bg-surface-dark/50 rounded-sm">
          <p className="text-[7px] font-black text-text-secondary uppercase tracking-widest mb-2">Pin Type Colors</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PIN_COLORS).map(([type, color]) => (
              <span key={type} className="text-[7px] font-black px-1.5 py-0.5 rounded-md" style={{ backgroundColor: color + '22', color }}>
                {type}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-black text-[10px] uppercase tracking-widest rounded-sm transition-all"
        >
          Add to Palette
        </button>
      </motion.div>
    </motion.div>
  );
};

export default CustomComponentModal;
