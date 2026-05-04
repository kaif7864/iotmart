import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Search, Filter, 
  ChevronDown, Package, AlertTriangle, 
  CheckCircle, Loader2, X, Upload, Camera,
  Zap, Cpu, Settings, BrainCircuit, Sparkles, TrendingUp
} from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct, getAIChatReply } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const AdminProducts = () => {
  const { formatPrice } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', price: '', category: '', description: '', image: '', inStock: true, stockQuantity: 100, specs: []
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentProduct) {
        await updateProduct(currentProduct._id, formData);
      } else {
        await createProduct(formData);
      }
      fetchProducts();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      alert("Error saving product");
    }
  };

  const handleEdit = (product) => {
    setCurrentProduct(product);
    setFormData(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Terminate this component from inventory?")) {
      try {
        await deleteProduct(id);
        fetchProducts();
      } catch (error) {
        alert("Delete failed");
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', category: '', description: '', image: '', inStock: true, stockQuantity: 100, specs: [] });
    setCurrentProduct(null);
  };

  const handleAISuggestion = async () => {
    setIsSuggesting(true);
    try {
      const lowStockItems = products.filter(p => (p.stockQuantity || 50) < 30).map(p => p.name).join(', ');
      const msg = `Based on current sales trends and low stock items (${lowStockItems || 'none'}), what should be my restocking priority for this month? Give a short 20-word response.`;
      const data = await getAIChatReply(msg);
      alert("AI RESTOCK ADVICE: " + data.reply);
    } catch (error) {
      alert("AI engine is recalibrating...");
    } finally {
      setIsSuggesting(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-10 border-b border-slate-100">
        <div>
          <p className="text-accent text-[10px] font-black uppercase tracking-[0.4em] mb-2">Operational Registry</p>
          <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter uppercase leading-none">Inventory <span className="text-accent">Control</span></h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={handleAISuggestion}
            disabled={isSuggesting}
            className="h-14 px-6 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50"
          >
            {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin text-accent" /> : <BrainCircuit className="h-5 w-5 text-accent" />}
            AI Strategic Restock
          </button>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="btn-premium h-14 px-8 text-[9px] flex items-center gap-3"
          >
            <Plus className="h-5 w-5" />
            Add Module
          </button>
        </div>
      </div>

      {/* Analytics Grid - Cards are now fixed width to prevent mixing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 relative group">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Filter inventory..." 
              className="w-full pl-12 pr-6 h-16 bg-white border border-border-main rounded-2xl text-xs font-bold focus:outline-none focus:border-accent transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {[
          { label: 'In Stock', count: products.filter(p => (p.stockQuantity || 100) > 20).length, icon: TrendingUp, color: 'emerald' },
          { label: 'Low Stock', count: products.filter(p => (p.stockQuantity || 100) <= 20 && (p.stockQuantity || 100) > 0).length, icon: AlertTriangle, color: 'amber' },
          { label: 'Stock Out', count: products.filter(p => (p.stockQuantity || 0) === 0).length, icon: X, color: 'red' }
        ].map((stat, i) => (
          <div key={i} className="h-16 bg-white border border-border-main rounded-2xl px-5 flex items-center gap-4 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${stat.color}-50 text-${stat.color}-500`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <div>
              <p className={`text-[8px] font-black text-${stat.color}-600 uppercase tracking-widest`}>{stat.label}</p>
              <p className="text-lg font-black text-text-primary leading-none mt-1">{stat.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-[32px] border border-border-main shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-border-main">
                <th className="py-6 px-8 text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Module Info</th>
                <th className="py-6 px-8 text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Category</th>
                <th className="py-6 px-8 text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Pricing</th>
                <th className="py-6 px-8 text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Stock Level</th>
                <th className="py-6 px-8 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="py-24 text-center"><Loader2 className="h-10 w-10 text-accent animate-spin mx-auto" /></td></tr>
              ) : filteredProducts.map(product => {
                const stock = product.stockQuantity || 45; // Fallback for existing data
                return (
                  <tr key={product._id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl p-2 border border-border-main group-hover:border-accent transition-all">
                          <img src={product.image} className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-text-primary uppercase tracking-tight">{product.name}</p>
                          <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-1">ID: {product._id.slice(-8).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-8">
                      <span className="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em] px-3 py-1 bg-slate-100 rounded-lg">{product.category}</span>
                    </td>
                    <td className="py-6 px-8">
                      <p className="text-sm font-black text-text-primary">{formatPrice(product.price)}</p>
                    </td>
                    <td className="py-6 px-8">
                      <div className="space-y-2 max-w-[120px]">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase">
                          <span className={stock < 20 ? 'text-red-500' : stock < 50 ? 'text-amber-500' : 'text-emerald-500'}>
                            {stock} Units
                          </span>
                          <span className="text-text-muted">{stock}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${stock < 20 ? 'bg-red-500' : stock < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, stock)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-8 text-right space-x-2">
                      <button onClick={() => handleEdit(product)} className="p-3 bg-slate-50 rounded-xl text-text-muted hover:text-accent hover:bg-accent/5 transition-all">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(product._id)} className="p-3 bg-slate-50 rounded-xl text-text-muted hover:text-red-500 hover:bg-red-50 transition-all">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-3xl rounded-[40px] p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-10 right-10 p-2 hover:bg-slate-50 rounded-full transition-all">
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-3xl font-black text-text-primary mb-10 uppercase tracking-tighter">
                {currentProduct ? 'Modify Registry' : 'Register Module'}
              </h2>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-3">Module Name</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-border-main rounded-2xl text-sm font-black outline-none focus:border-accent" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-3">Unit Price ($)</label>
                      <input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-border-main rounded-2xl text-sm font-black outline-none focus:border-accent" required />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-3">Category</label>
                      <input type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-border-main rounded-2xl text-sm font-black outline-none focus:border-accent" required />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-3">Stock Quantity</label>
                    <input type="number" value={formData.stockQuantity} onChange={(e) => setFormData({...formData, stockQuantity: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-border-main rounded-2xl text-sm font-black outline-none focus:border-accent" required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-3">Technical Description</label>
                    <textarea rows="4" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-border-main rounded-2xl text-sm font-medium outline-none focus:border-accent resize-none" required />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-3">Visual Asset URL</label>
                    <div className="relative group">
                      <input type="text" value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-border-main rounded-2xl text-sm font-medium outline-none focus:border-accent" required />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted"><Camera className="h-5 w-5" /></div>
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-border-main flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-text-primary uppercase tracking-widest mb-1">Inventory Pulse</p>
                      <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest">Active in Marketplace</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, inStock: !formData.inStock})}
                      className={`w-14 h-8 rounded-full relative transition-all ${formData.inStock ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md ${formData.inStock ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>
                  <div className="pt-8">
                    <button type="submit" className="w-full btn-premium py-5 text-sm font-black uppercase tracking-widest shadow-xl shadow-accent/20">
                      {currentProduct ? 'Execute Update' : 'Initialize Module'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProducts;
