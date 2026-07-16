import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Edit2, Trash2, Search, Package, AlertTriangle,
  Loader2, Camera, BrainCircuit, X, LayoutGrid,
  List, Check, Zap, ShieldCheck, Layers,
  ImageOff, TrendingUp, TrendingDown, Filter, ArrowUpRight, ChevronDown
} from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct, getAIChatReply } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { ConfirmModal } from '../../components/common';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Microcontrollers', 'Sensors', 'Actuators', 'Connectivity', 'Power', 'Accessories', 'Displays', 'Robotics'];

const CAT_META = {
  Microcontrollers: { color: '#6366f1' },
  Sensors:          { color: '#0891b2' },
  Actuators:        { color: '#d97706' },
  Connectivity:     { color: '#059669' },
  Power:            { color: '#dc2626' },
  Accessories:      { color: '#7c3aed' },
  Displays:         { color: '#db2777' },
  Robotics:         { color: '#0d9488' },
};

// ── Animated Number ───────────────────────────────────────────────────────────
const AnimatedNumber = ({ value }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let n = 0;
    const step = Math.max(1, Math.ceil(value / 20));
    const t = setInterval(() => { n = Math.min(n + step, value); setVal(n); if (n >= value) clearInterval(t); }, 30);
    return () => clearInterval(t);
  }, [value]);
  return <>{val}</>;
};

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ qty }) => {
  if (qty === 0) return (
    <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-status-danger-bg text-status-danger border border-status-danger/20">
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />Out of Stock
    </span>
  );
  if (qty <= 20) return (
    <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-status-warning-bg text-status-warning border border-status-warning/20">
      <span className="w-1.5 h-1.5 rounded-full bg-current" />Low Stock
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-status-success-bg text-status-success border border-status-success/20">
      <span className="w-1.5 h-1.5 rounded-full bg-current" />In Stock
    </span>
  );
};

// ── KPI / Stat Card ───────────────────────────────────────────────────────────
const KpiCard = ({ label, value, icon: Icon, color, trend, trendUp, active, onClick }) => (
  <motion.button
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2 }}
    onClick={onClick}
    className={`card rounded-2xl p-6 relative overflow-hidden text-left w-full transition-all duration-300 hover:shadow-xl ${
      active ? 'ring-2 ring-accent shadow-lg shadow-accent/10' : ''
    }`}
  >
    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-xl" style={{ background: color }} />
    <Icon className="absolute -right-2 -bottom-2 w-24 h-24 opacity-[0.04]" style={{ color }} />
    <div className="flex items-start justify-between mb-4">
      <div className="p-2.5 rounded-xl" style={{ background: color + '20' }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-full ${trendUp ? 'bg-status-success-bg text-status-success' : 'bg-status-danger-bg text-status-danger'}`}>
          {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{label}</p>
    <h4 className="text-3xl font-black text-text-primary tracking-tighter"><AnimatedNumber value={value} /></h4>
  </motion.button>
);

// ── Product List Row ──────────────────────────────────────────────────────────
const ProductRow = ({ product, onEdit, onDelete, formatPrice }) => {
  const qty = product.stockQuantity ?? 0;
  const cat = CAT_META[product.category] || { color: '#64748b' };
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      className="group flex flex-col md:grid md:grid-cols-[1fr_120px_180px_80px] gap-4 p-4 md:px-6 md:py-4 bg-card-bg md:bg-transparent md:hover:bg-app-bg border border-border-main md:border-0 md:border-b md:border-border-subtle rounded-2xl md:rounded-none transition-all last:border-0 md:items-center mb-3 md:mb-0 relative overflow-hidden shadow-sm md:shadow-none">

      {/* Mobile-only background accent strip */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 md:hidden" style={{ background: cat.color }} />

      {/* Shared Layout (Image + Info) */}
      <div className="flex items-start md:items-center gap-4 pl-2 md:pl-0 w-full min-w-0">
        
        {/* Image */}
        <div className="w-20 h-20 md:w-11 md:h-11 rounded-xl bg-app-bg border border-border-subtle flex items-center justify-center p-2 flex-shrink-0 relative overflow-hidden">
          {product.image
            ? <img src={product.image} className="w-full h-full object-contain" alt="" />
            : <ImageOff className="w-6 h-6 md:w-4 md:h-4 text-text-muted" />}
        </div>
        
        {/* Info Stack */}
        <div className="flex-grow min-w-0 py-1">
          <p className="text-[15px] md:text-sm font-black text-text-primary line-clamp-2 md:line-clamp-1 group-hover:text-accent transition-colors leading-tight mb-1.5 md:mb-0.5">{product.name}</p>
          
          <div className="flex flex-wrap md:block items-center gap-2 md:gap-0">
            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md inline-block"
              style={{ background: cat.color + '18', color: cat.color }}>
              {product.category}
            </span>
            {/* Mobile Only Inline Price */}
            <div className="flex md:hidden items-center gap-2 text-xs font-black text-text-muted">
              <span className="opacity-30">•</span>
              <span className="text-accent">{formatPrice(product.price)}</span>
            </div>
          </div>

          {/* Mobile Actions and Stock Row */}
          <div className="flex md:hidden items-center justify-between mt-4 border-t border-border-subtle pt-3">
             <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${qty > 0 ? 'bg-status-success animate-pulse' : 'bg-status-danger'}`} />
               <span className="text-[10px] font-black tracking-widest uppercase text-text-muted">{qty} In Stock</span>
             </div>
             
             <div className="flex items-center gap-2">
               <button onClick={() => onEdit(product)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-app-bg text-text-primary border border-border-main active:scale-95 transition-transform">
                 <Edit2 className="w-3.5 h-3.5" />
               </button>
               <button onClick={() => onDelete(product._id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-status-danger-bg text-status-danger border border-status-danger/20 active:scale-95 transition-transform">
                 <Trash2 className="w-3.5 h-3.5" />
               </button>
             </div>
          </div>
        </div>
      </div>

      {/* Desktop Exclusives (Hidden on Mobile) */}
      <div className="hidden md:block text-right">
        <p className="text-sm font-black text-text-primary">{formatPrice(product.price)}</p>
      </div>
      <div className="hidden md:flex items-center justify-end gap-3">
        <StatusBadge qty={qty} />
        <span className="text-xs font-black text-text-muted w-8 text-right">{qty}</span>
      </div>
      <div className="hidden md:flex items-center gap-1.5 justify-end">
        <button onClick={() => onEdit(product)}
          className="w-8 h-8 flex items-center justify-center rounded-xl border border-border-main text-text-muted opacity-0 group-hover:opacity-100 hover:text-accent hover:border-accent hover:bg-accent/10 transition-all">
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(product._id)}
          className="w-8 h-8 flex items-center justify-center rounded-xl border border-border-main text-text-muted opacity-0 group-hover:opacity-100 hover:text-status-danger hover:border-status-danger/30 hover:bg-status-danger-bg transition-all">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

    </motion.div>
  );
};

// ── Product Grid Card ─────────────────────────────────────────────────────────
const ProductGrid = ({ product, onEdit, onDelete, formatPrice }) => {
  const qty = product.stockQuantity ?? 0;
  const cat = CAT_META[product.category] || { color: '#64748b' };

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
      className="card rounded-2xl border border-border-main overflow-hidden hover:shadow-xl hover:border-accent/20 transition-all duration-300 flex flex-col group">

      {/* Image area */}
      <div className="relative aspect-[4/3] bg-app-bg flex items-center justify-center p-5 border-b border-border-subtle overflow-hidden">
        {product.image
          ? <img src={product.image} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" alt="" />
          : <ImageOff className="w-10 h-10 text-text-muted opacity-30" />}

        <div className="absolute top-3 left-3"><StatusBadge qty={qty} /></div>

        {/* Hover actions (Desktop Only) */}
        <div className="absolute inset-x-0 top-0 p-3 bg-gradient-to-b from-card-bg/90 to-transparent -translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10 hidden md:flex justify-end gap-2">
          <button onClick={() => onEdit(product)}
            className="w-9 h-9 rounded-xl bg-card-bg border border-border-main text-text-muted hover:text-accent transition-all flex items-center justify-center shadow-sm">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(product._id)}
            className="w-9 h-9 rounded-xl bg-card-bg border border-border-main text-text-muted hover:text-status-danger transition-all flex items-center justify-center shadow-sm">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 md:p-5 flex-grow flex flex-col">
        <span className="self-start text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg mb-2 md:mb-3"
          style={{ background: cat.color + '18', color: cat.color }}>
          {product.category}
        </span>
        <h3 className="text-sm font-black text-text-primary leading-snug line-clamp-2 flex-grow">{product.name}</h3>
        
        <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-border-subtle flex items-end justify-between">
          <p className="text-sm md:text-lg font-black text-text-primary">{formatPrice(product.price)}</p>
          <p className="text-[10px] font-black text-text-muted">{qty} <span className="hidden md:inline">units</span></p>
        </div>

        {/* Mobile Actions Bottom Bar */}
        <div className="flex md:hidden items-center justify-between mt-3 pt-3 border-t border-border-subtle gap-2">
           <button onClick={() => onEdit(product)} className="flex-1 h-8 rounded-lg bg-app-bg border border-border-main text-text-primary flex items-center justify-center gap-1.5 active:scale-95 transition-transform text-[10px] font-black uppercase tracking-widest">
             <Edit2 className="w-3 h-3" /> Edit
           </button>
           <button onClick={() => onDelete(product._id)} className="w-8 h-8 rounded-lg bg-status-danger-bg border border-status-danger/20 text-status-danger flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform">
             <Trash2 className="w-3.5 h-3.5" />
           </button>
        </div>
      </div>
    </motion.div>
  );
};

// ── Drawer / Form Panel ───────────────────────────────────────────────────────
const Drawer = ({ isOpen, onClose, onSubmit, formData, setFormData, isEdit, isUploading, onImageUpload }) => {
  const [specInput, setSpecInput] = useState('');
  const set = (k, v) => setFormData(f => ({ ...f, [k]: v }));
  const inputCls = "w-full px-4 py-3 bg-app-bg border border-border-main rounded-xl text-sm font-bold text-text-primary outline-none focus:bg-card-bg focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-text-muted";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.aside
            initial={{ x: '100%', opacity: 0.5 }} animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-2 right-2 bottom-2 w-full max-w-[480px] z-[101] bg-card-bg rounded-3xl shadow-2xl border border-border-main flex flex-col overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="px-8 py-6 border-b border-border-subtle flex items-center justify-between bg-card-bg z-10">
              <div>
                <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">
                  {isEdit ? 'Update Product' : 'New Listing'}
                </p>
                <h2 className="text-2xl font-black text-text-primary tracking-tight">
                  {isEdit ? 'Edit Product' : 'Add to Inventory'}
                </h2>
              </div>
              <button onClick={onClose}
                className="w-10 h-10 rounded-xl bg-app-bg border border-border-main text-text-muted hover:text-text-primary hover:border-accent transition-all flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="flex-grow overflow-y-auto px-8 py-6 space-y-6">

              {/* Image Upload */}
              <div>
                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Product Image</label>
                <div className={`p-4 rounded-2xl border transition-all ${formData.image ? 'border-border-main bg-app-bg' : 'border-dashed border-border-main bg-app-bg hover:border-accent'}`}>
                  {formData.image ? (
                    <div className="relative w-full h-40 bg-card-bg rounded-xl border border-border-subtle mb-4 p-4 flex items-center justify-center overflow-hidden">
                      <img src={formData.image} className="w-full h-full object-contain" alt="" />
                      <button type="button" onClick={() => set('image', '')}
                        className="absolute top-2 right-2 w-7 h-7 bg-card-bg rounded-full shadow-md text-status-danger flex items-center justify-center hover:bg-status-danger-bg border border-border-main">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-32 flex flex-col items-center justify-center text-text-muted">
                      <ImageOff className="w-8 h-8 mb-2 opacity-30" />
                      <p className="text-xs font-bold text-text-muted">Upload product image</p>
                    </div>
                  )}
                  {!formData.image && (
                    <label className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-card-bg border border-border-main rounded-xl text-xs font-bold text-text-primary cursor-pointer hover:border-accent transition-all">
                      <input type="file" className="hidden" accept="image/*" onChange={onImageUpload} disabled={isUploading} />
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-text-muted" /> : <Camera className="w-4 h-4 text-text-muted" />}
                      {isUploading ? 'Uploading...' : 'Choose File'}
                    </label>
                  )}
                </div>
                {!formData.image && (
                  <input type="text" value={formData.image} onChange={e => set('image', e.target.value)}
                    placeholder="Or paste image URL..." className={`${inputCls} mt-2 py-2 text-xs`} />
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Product Name</label>
                <input type="text" value={formData.name} onChange={e => set('name', e.target.value)}
                  className={inputCls} placeholder="e.g. Raspberry Pi 4 Model B" required />
              </div>

              {/* Price + Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Price (₹)</label>
                  <input type="number" value={formData.price} onChange={e => set('price', e.target.value)}
                    className={inputCls} placeholder="0.00" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Category</label>
                  <select value={formData.category} onChange={e => set('category', e.target.value)} className={inputCls} required>
                    <option value="" disabled>Select...</option>
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Stock + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Stock Quantity</label>
                  <input type="number" value={formData.stockQuantity} onChange={e => set('stockQuantity', Number(e.target.value))}
                    className={inputCls} placeholder="0" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Listing Status</label>
                  <button type="button" onClick={() => set('inStock', !formData.inStock)}
                    className={`w-full h-[46px] rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all border uppercase tracking-widest ${
                      formData.inStock
                        ? 'bg-status-success-bg text-status-success border-status-success/20'
                        : 'bg-app-bg text-text-muted border-border-main hover:border-accent'
                    }`}>
                    {formData.inStock ? <><Check className="w-4 h-4" />Active</> : <><X className="w-4 h-4" />Hidden</>}
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Description</label>
                <textarea rows={3} value={formData.description} onChange={e => set('description', e.target.value)}
                  className={`${inputCls} resize-none`} placeholder="Product specs and details..." required />
              </div>

              {/* Specs Tags */}
              <div>
                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Tech Specs (Tags)</label>
                <div className="flex gap-2 mb-3">
                  <input type="text" value={specInput} onChange={e => setSpecInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (specInput.trim()) { setFormData(f => ({ ...f, specs: [...(f.specs || []), specInput.trim()] })); setSpecInput(''); } } }}
                    className={inputCls} placeholder="e.g. 5V, I2C, WiFi" />
                  <button type="button"
                    onClick={() => { if (specInput.trim()) { setFormData(f => ({ ...f, specs: [...(f.specs || []), specInput.trim()] })); setSpecInput(''); } }}
                    className="px-4 py-3 bg-app-bg border border-border-main rounded-xl text-xs font-black text-text-primary hover:border-accent hover:text-accent transition-all">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData.specs || []).map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 text-accent text-[11px] font-black border border-accent/20">
                      {s}
                      <button type="button" onClick={() => setFormData(f => ({ ...f, specs: f.specs.filter((_, idx) => idx !== i) }))}
                        className="text-accent/50 hover:text-status-danger transition-colors"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            </form>

            {/* Submit */}
            <div className="px-8 py-5 border-t border-border-subtle bg-app-bg">
              <button onClick={onSubmit}
                className="w-full py-3.5 rounded-xl bg-accent hover:bg-accent/90 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2">
                {isEdit ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const AdminProducts = () => {
  const { formatPrice } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentProduct, setCurrentProduct] = useState(null);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');
  const [viewMode, setViewMode] = useState('list');
  const [stockDropdownOpen, setStockDropdownOpen] = useState(false);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);

  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [aiTip, setAiTip] = useState('');
  const [formData, setFormData] = useState({ name: '', price: '', category: '', description: '', image: '', inStock: true, stockQuantity: 100, specs: [] });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try { const data = await getProducts(1, 10000); setProducts(data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setIsUploading(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const { uploadProductImage } = await import('../../services/api');
      const res = await uploadProductImage(fd);
      if (res.data?.image_url) {
        setFormData(f => ({ ...f, image: (res.data.image_url.startsWith('http') ? '' : 'http://localhost:8000') + res.data.image_url }));
        toast.success('Image uploaded successfully');
      }
    } catch (err) { toast.error(err.response?.data?.detail || 'Upload failed'); }
    finally { setIsUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, stockQuantity: Number(formData.stockQuantity), price: Number(formData.price) };
      if (currentProduct) {
        await updateProduct(currentProduct._id, payload);
        toast.success('Product updated successfully');
      } else {
        await createProduct(payload);
        toast.success('Product added successfully');
      }
      fetchProducts(); setDrawerOpen(false); resetForm();
    } catch (error) { 
      const detail = error.response?.data?.detail;
      toast.error(Array.isArray(detail) ? detail.map(d => d.msg).join(', ') : (detail || 'Error saving product')); 
    }
  };

  const handleEdit = (p) => { setCurrentProduct(p); setFormData({ ...p }); setDrawerOpen(true); };
  const handleDelete = (id) => { setDeleteTarget(id); setDeleteOpen(true); };
  const confirmDelete = async () => {
    try { 
      await deleteProduct(deleteTarget); 
      toast.success('Product deleted successfully');
      fetchProducts(); setDeleteOpen(false); setDeleteTarget(null); 
    }
    catch (error) { toast.error(error.response?.data?.detail || 'Delete failed'); }
  };
  const resetForm = () => { setFormData({ name: '', price: '', category: '', description: '', image: '', inStock: true, stockQuantity: 100, specs: [] }); setCurrentProduct(null); };

  const handleAI = async () => {
    setIsSuggesting(true);
    try {
      const low = products.filter(p => (p.stockQuantity || 50) < 30).map(p => p.name).join(', ');
      const data = await getAIChatReply(`Low stock items: (${low || 'none'}). Give me a 15-word restock priority tip.`);
      setAiTip(data.reply || 'Restock high-demand items first to maintain availability.');
    } catch { setAiTip('AI service currently unavailable.'); }
    finally { setIsSuggesting(false); }
  };

  const filtered = useMemo(() => products
    .filter(p => activeCategory === 'All' || p.category === activeCategory)
    .filter(p => {
      const q = p.stockQuantity ?? 0;
      if (stockFilter === 'Low') return q > 0 && q <= 20;
      if (stockFilter === 'Out') return q === 0;
      if (stockFilter === 'Healthy') return q > 20;
      return true;
    })
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()))
  , [products, activeCategory, stockFilter, search]);

  const inOk  = products.filter(p => (p.stockQuantity ?? 0) > 20).length;
  const inLow = products.filter(p => { const q = p.stockQuantity ?? 0; return q > 0 && q <= 20; }).length;
  const inOut = products.filter(p => (p.stockQuantity ?? 0) === 0).length;

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-subtle pb-6">
        <div>
          <p className="text-[10px] font-black text-accent uppercase tracking-[0.25em] mb-1">Stock Management</p>
          <h1 className="text-3xl font-black text-text-primary tracking-tighter">
            Inventory <span className="text-accent">Control</span>
          </h1>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button onClick={handleAI} disabled={isSuggesting}
            className="flex items-center gap-2 px-4 py-2.5 bg-app-bg border border-border-main text-text-muted hover:text-accent hover:border-accent rounded-xl text-xs font-black uppercase tracking-widest transition-all flex-1 sm:flex-none justify-center">
            {isSuggesting ? <Loader2 className="w-4 h-4 animate-spin text-accent" /> : <BrainCircuit className="w-4 h-4 text-accent" />}
            AI Insight
          </button>
          <button onClick={() => { resetForm(); setDrawerOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent/90 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-accent/20 flex-1 sm:flex-none justify-center">
            <Plus className="w-4 h-4" /> New Product
          </button>
        </div>
      </div>

      {/* ── AI Tip Banner ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {aiTip && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-accent/5 border border-accent/20 text-text-primary">
              <div className="p-2.5 bg-accent/10 rounded-xl flex-shrink-0"><Zap className="w-5 h-5 text-accent" /></div>
              <div className="flex-grow pt-0.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">AI Recommendation</p>
                <p className="text-sm font-bold text-text-primary">{aiTip}</p>
              </div>
              <button onClick={() => setAiTip('')} className="p-2 text-text-muted hover:text-text-primary hover:bg-app-bg rounded-xl transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard label="Total Stock" value={products.length} icon={Layers} color="#6366f1"
          trend={12} trendUp active={stockFilter === 'All'} onClick={() => { setStockFilter('All'); setActiveCategory('All'); }} />
        <KpiCard label="Healthy Stock" value={inOk} icon={ShieldCheck} color="#10b981"
          trendUp active={stockFilter === 'Healthy'} onClick={() => setStockFilter('Healthy')} />
        <KpiCard label="Low Stock" value={inLow} icon={AlertTriangle} color="#f59e0b"
          trend={-4} trendUp={false} active={stockFilter === 'Low'} onClick={() => setStockFilter('Low')} />
        <KpiCard label="Sold Out" value={inOut} icon={X} color="#ef4444"
          trendUp={inOut === 0} active={stockFilter === 'Out'} onClick={() => setStockFilter('Out')} />
      </div>

      {/* ── Search + View Mode ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input type="text" placeholder="Search inventory by name or category..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-app-bg border border-border-main rounded-xl text-sm font-bold text-text-primary outline-none focus:bg-card-bg focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-text-muted" />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto min-w-0">
          {/* Stock filter pills (Desktop) */}
          <div className="hidden md:flex bg-app-bg border border-border-main p-1 rounded-xl gap-1 shadow-inner overflow-x-auto flex-grow min-w-0 hide-scrollbar">
            {['All', 'Healthy', 'Low', 'Out'].map(f => (
              <button key={f} onClick={() => setStockFilter(f)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                  stockFilter === f ? 'bg-accent text-white shadow-lg shadow-accent/30' : 'text-text-muted hover:text-text-primary'
                }`}>{f}</button>
            ))}
          </div>
          {/* Stock filter dropdown (Mobile Custom) */}
          <div className="md:hidden flex-grow relative z-30">
             <button onClick={() => { setStockDropdownOpen(!stockDropdownOpen); setCatDropdownOpen(false); }}
               className="w-full flex items-center justify-between bg-app-bg border border-border-main px-4 py-2.5 rounded-xl text-xs font-black text-text-primary uppercase tracking-widest outline-none focus:border-accent">
               {stockFilter === 'All' ? 'All Stock' : stockFilter}
               <ChevronDown className={`w-4 h-4 transition-transform ${stockDropdownOpen ? 'rotate-180' : ''}`} />
             </button>
             <AnimatePresence>
               {stockDropdownOpen && (
                 <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                   className="absolute top-full left-0 right-0 mt-2 p-2 bg-card-bg border border-border-main rounded-xl shadow-2xl flex flex-col gap-1">
                   {['All', 'Healthy', 'Low', 'Out'].map(f => (
                     <button key={f} onClick={() => { setStockFilter(f); setStockDropdownOpen(false); }}
                       className={`text-left px-4 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                         stockFilter === f ? 'bg-accent text-white' : 'text-text-muted hover:bg-app-bg hover:text-text-primary'
                       }`}>{f === 'All' ? 'All Stock' : f}</button>
                   ))}
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 bg-app-bg border border-border-main rounded-xl shadow-inner flex-shrink-0">
            {[['list', List], ['grid', LayoutGrid]].map(([m, Icon]) => (
              <button key={m} onClick={() => setViewMode(m)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                  viewMode === m ? 'bg-accent text-white shadow-lg shadow-accent/30' : 'text-text-muted hover:text-text-primary'
                }`}>
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Category Pills ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 w-full min-w-0">
        <div className="hidden md:block">
          <Filter className="w-4 h-4 text-text-muted flex-shrink-0" />
        </div>
        
        {/* Category Dropdown (Mobile Custom) */}
        <div className="md:hidden w-full relative z-20">
          <button onClick={() => { setCatDropdownOpen(!catDropdownOpen); setStockDropdownOpen(false); }}
            className="w-full flex items-center justify-between bg-app-bg border border-border-main px-4 py-3.5 rounded-xl text-xs font-black text-text-primary uppercase tracking-widest outline-none focus:border-accent">
            {activeCategory}
            <ChevronDown className={`w-4 h-4 transition-transform ${catDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {catDropdownOpen && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 p-2 bg-card-bg border border-border-main rounded-xl shadow-2xl flex flex-col gap-1 max-h-[40vh] overflow-y-auto">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => { setActiveCategory(cat); setCatDropdownOpen(false); }}
                    className={`text-left px-4 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeCategory === cat ? 'bg-accent text-white' : 'text-text-muted hover:bg-app-bg hover:text-text-primary'
                    }`}>{cat}</button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Category Pills (Desktop) */}
        <div className="hidden md:flex gap-2 overflow-x-auto pb-1 w-full min-w-0 hide-scrollbar">
          {CATEGORIES.map(cat => {
            const meta = CAT_META[cat];
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all border uppercase tracking-widest ${
                  activeCategory === cat
                    ? 'text-white border-transparent shadow-md'
                    : 'bg-app-bg text-text-muted border-border-main hover:border-accent hover:text-text-primary'
                }`}
                style={activeCategory === cat ? (meta ? { background: meta.color, borderColor: meta.color } : { background: '#6366f1', borderColor: '#6366f1' }) : {}}>
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Result count + Clear ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between -mt-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
          <span className="font-black text-text-primary">{filtered.length}</span> {filtered.length === 1 ? 'result' : 'results'}
        </p>
        {(search || activeCategory !== 'All' || stockFilter !== 'All') && (
          <button onClick={() => { setSearch(''); setActiveCategory('All'); setStockFilter('All'); }}
            className="text-[10px] font-black uppercase tracking-widest text-accent hover:text-accent/70 transition-colors flex items-center gap-1">
            <X className="w-3 h-3" /> Clear filters
          </button>
        )}
      </div>

      {/* ── Product Content ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-[72px] rounded-2xl card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-24 text-center border border-dashed border-border-main">
          <Package className="w-16 h-16 text-text-muted opacity-20 mb-4" />
          <p className="text-sm font-black text-text-primary uppercase tracking-widest">No Products Found</p>
          <p className="text-sm font-medium text-text-muted mt-1">Try adjusting your filters or search term.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((p, i) => <ProductGrid key={p._id || `g-${i}`} product={p} onEdit={handleEdit} onDelete={handleDelete} formatPrice={formatPrice} />)}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="card !p-0 border-0 md:border md:border-border-main bg-transparent md:bg-card-bg overflow-hidden">
          {/* Table header (Desktop Only) */}
          <div className="grid-cols-[1fr_120px_180px_80px] gap-4 px-6 py-4 bg-app-bg border-b border-border-subtle hidden md:grid">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Product</p>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest text-right">Price</p>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest text-right">Stock Status</p>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest text-right">Actions</p>
          </div>
          <div>
            <AnimatePresence mode="popLayout">
              {filtered.map((p, i) => <ProductRow key={p._id || `r-${i}`} product={p} onEdit={handleEdit} onDelete={handleDelete} formatPrice={formatPrice} />)}
            </AnimatePresence>
          </div>
        </div>
      )}

      <Drawer isOpen={drawerOpen} onClose={() => { setDrawerOpen(false); resetForm(); }} onSubmit={handleSubmit}
        formData={formData} setFormData={setFormData} isEdit={!!currentProduct} isUploading={isUploading} onImageUpload={handleImageUpload} />
      <ConfirmModal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={confirmDelete}
        title="Delete Product" message="This action cannot be undone. This product will be permanently removed from your catalog."
        confirmLabel="Delete Permanently" variant="danger" />
    </div>
  );
};

export default AdminProducts;
