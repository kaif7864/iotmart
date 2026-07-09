import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, ExternalLink, ShoppingCart, Plus, ChevronDown, ChevronUp, Package, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000/api';

const NexarSearch = ({ onAddToCanvas, onAddToCart }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const inputRef = useRef(null);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResults([]);
    try {
      const res = await fetch(`${API_URL}/nexar/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), limit: 6 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Search failed');
      setResults(data.results || []);
      if (data.results.length === 0) setError('No components found. Try a different search term.');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAIMagic = async (partName) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/ai/generate-part`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ part_name: partName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'AI Generation failed');
      
      const comp = {
        ...data,
        id: `AI_${data.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`,
        instanceId: `AI_${Date.now()}`,
        isCustom: true,
      };
      onAddToCanvas(comp);
      toast.success(`AI Generated: ${data.name}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCanvas = (part) => {
    // Build a component definition from Nexar data
    const comp = {
      id: `NEXAR_${part.mpn.replace(/[^a-zA-Z0-9]/g, '_')}`,
      type: 'custom',
      name: part.mpn,
      shortName: part.mpn.slice(0, 5).toUpperCase(),
      color: '#7c3aed',
      icon: getCategoryIcon(part.category),
      pins: inferPins(part),
      width: 90,
      height: 70,
      category: part.category,
      manufacturer: part.manufacturer,
      datasheet: part.datasheet,
      isCustom: true,
      nexarData: part,
    };
    onAddToCanvas(comp);
  };

  const getCategoryIcon = (cat = '') => {
    const c = cat.toLowerCase();
    if (c.includes('led') || c.includes('diode')) return '💡';
    if (c.includes('resistor')) return '⬛';
    if (c.includes('capacitor')) return '⚡';
    if (c.includes('microcontroller') || c.includes('mcu')) return '🟩';
    if (c.includes('sensor')) return '🌡️';
    if (c.includes('transistor')) return '🔺';
    if (c.includes('relay')) return '🔌';
    if (c.includes('display') || c.includes('lcd') || c.includes('oled')) return '🖥️';
    if (c.includes('motor') || c.includes('driver')) return '⚙️';
    if (c.includes('wifi') || c.includes('bluetooth') || c.includes('wireless')) return '📡';
    return '🔧';
  };

  const inferPins = (part) => {
    // Default pins based on category
    const cat = (part.category || '').toLowerCase();
    if (cat.includes('led') || cat.includes('diode')) {
      return [{ id: 'anode', label: 'Anode', type: 'digital', side: 'left' }, { id: 'cathode', label: 'Cathode', type: 'gnd', side: 'right' }];
    }
    if (cat.includes('resistor')) {
      return [{ id: 'p1', label: 'P1', type: 'digital', side: 'left' }, { id: 'p2', label: 'P2', type: 'digital', side: 'right' }];
    }
    if (cat.includes('transistor')) {
      return [{ id: 'base', label: 'B', type: 'digital', side: 'left' }, { id: 'collector', label: 'C', type: 'output', side: 'right' }, { id: 'emitter', label: 'E', type: 'gnd', side: 'right' }];
    }
    // Generic 4-pin
    return [
      { id: 'vcc', label: 'VCC', type: 'power', side: 'left' },
      { id: 'gnd', label: 'GND', type: 'gnd', side: 'left' },
      { id: 'sig', label: 'SIG', type: 'digital', side: 'right' },
      { id: 'out', label: 'OUT', type: 'output', side: 'right' },
    ];
  };

  return (
    <div className="border-t border-lab-border-dark bg-surface-dark">
      {/* Search bar */}
      <div className="p-3 border-b border-lab-border-dark">
        <p className="text-[7px] font-black text-violet-400 uppercase tracking-widest mb-2 flex items-center gap-1">
          <span>🔍</span> Nexar / Octopart Search
        </p>
        <div className="flex gap-1.5">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-text-secondary" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="ESP32, BC547, LM358..."
              className="w-full pl-7 pr-2 py-1.5 bg-surface-dark border border-lab-border text-white text-[10px] font-bold rounded-sm outline-none focus:border-violet-500 placeholder:text-text-secondary"
            />
          </div>
          <button
            onClick={search}
            disabled={loading || !query.trim()}
            className="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-sm transition-all"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="max-h-72 overflow-y-auto">
        {error && (
          <p className="text-[9px] text-red-400 px-3 py-2">{error}</p>
        )}
        {results.map((part, idx) => (
          <div key={idx} className="border-b border-lab-border-dark/60">
            <div className="flex items-start gap-2 p-2.5">
              {/* Image */}
              <div className="w-10 h-10 bg-surface-dark rounded-sm overflow-hidden flex-shrink-0 flex items-center justify-center">
                {part.image ? (
                  <img src={part.image} alt={part.mpn} className="w-full h-full object-contain p-1" />
                ) : (
                  <Package className="h-4 w-4 text-text-secondary" />
                )}
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-[9px] font-black text-white truncate">{part.mpn}</p>
                <p className="text-[7px] text-text-muted truncate">{part.manufacturer}</p>
                <p className="text-[7px] text-violet-400 truncate">{part.category}</p>
                {part.price && (
                  <p className="text-[8px] font-black text-green-400 mt-0.5">
                    ${part.price} · {part.stock?.toLocaleString()} in stock
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  onClick={() => handleAddToCanvas(part)}
                  title="Add Basic Version"
                  className="p-1 bg-lab-surface hover:bg-lab-surface-hover text-white rounded text-[7px] transition-all"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleAIMagic(part.mpn)}
                  title="AI Magic: Generate Detailed Part"
                  className="p-1 bg-violet-600 hover:bg-violet-500 text-white rounded text-[7px] transition-all"
                >
                  <Sparkles className="h-3 w-3" />
                </button>
                {part.datasheet && (
                  <a href={part.datasheet} target="_blank" rel="noopener noreferrer"
                    className="p-1 bg-lab-surface hover:bg-lab-surface-hover text-text-muted rounded transition-all">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <button
                  onClick={() => setExpanded(expanded === idx ? null : idx)}
                  className="p-1 bg-surface-dark hover:bg-lab-surface text-text-muted rounded transition-all"
                >
                  {expanded === idx ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              </div>
            </div>

            {/* Expanded specs */}
            <AnimatePresence>
              {expanded === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 space-y-1">
                    <p className="text-[7px] font-black text-text-secondary uppercase tracking-widest mb-1.5">Specifications</p>
                    {Object.entries(part.specs || {}).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-[8px] text-text-secondary">{k}</span>
                        <span className="text-[8px] font-bold text-text-muted">{v}</span>
                      </div>
                    ))}
                    {part.seller && (
                      <div className="mt-2 pt-2 border-t border-lab-border-dark">
                        <p className="text-[7px] text-text-secondary">Available at: <span className="text-green-400 font-bold">{part.seller}</span></p>
                      </div>
                    )}
                    <button
                      onClick={() => handleAddToCanvas(part)}
                      className="w-full mt-2 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[8px] font-black uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add to Canvas
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NexarSearch;
