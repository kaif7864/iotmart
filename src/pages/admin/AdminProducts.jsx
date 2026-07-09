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
import { Button, Input, Modal, Badge, Table, EmptyState } from '../../components/common';

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-10 border-b border-border-subtle">
        <div>
          <p className="text-accent text-[10px] font-black uppercase tracking-[0.4em] mb-2">Operational Registry</p>
          <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter uppercase leading-none">Inventory <span className="text-accent">Control</span></h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button 
            onClick={handleAISuggestion}
            disabled={isSuggesting}
            variant="secondary"
            className="h-14 bg-surface-dark text-white hover:bg-surface-dark"
          >
            {isSuggesting ? <Loader2 className="h-4 w-4 mr-2 animate-spin text-accent" /> : <BrainCircuit className="h-5 w-5 mr-2 text-accent" />}
            AI Strategic Restock
          </Button>
          <Button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="h-14"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Module
          </Button>
        </div>
      </div>

      {/* Analytics Grid - Cards are now fixed width to prevent mixing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 relative group">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input 
              type="text" 
              placeholder="Filter inventory..." 
              className="pl-12 h-16"
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
          <div key={i} className="h-16 bg-card-bg border border-border-main rounded-sm px-5 flex items-center gap-4 shadow-sm">
            <div className={`w-10 h-10 rounded-sm flex items-center justify-center bg-${stat.color}-50 text-${stat.color}-500`}>
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
      {loading ? (
        <div className="py-24 text-center"><Loader2 className="h-10 w-10 text-accent animate-spin mx-auto" /></div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState 
          icon={Package} 
          title="No Modules Found" 
          description="Try adjusting your filters or add a new module to the registry." 
        />
      ) : (
        <Table 
          keyField="_id"
          data={filteredProducts}
          columns={[
            {
              header: 'Module Info',
              render: (product) => (
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-app-bg rounded-sm p-2 border border-border-main">
                    <img src={product.image} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-text-primary uppercase tracking-tight">{product.name}</p>
                    <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-1">ID: {product._id.slice(-8).toUpperCase()}</p>
                  </div>
                </div>
              )
            },
            {
              header: 'Category',
              render: (product) => <Badge variant="default">{product.category}</Badge>
            },
            {
              header: 'Pricing',
              render: (product) => <p className="text-sm font-black text-text-primary">{formatPrice(product.price)}</p>
            },
            {
              header: 'Stock Level',
              render: (product) => {
                const stock = product.stockQuantity || 45;
                const statusColor = stock < 20 ? 'status-danger' : stock < 50 ? 'status-warning' : 'status-success';
                return (
                  <div className="space-y-2 max-w-[120px]">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase">
                      <span className={`text-${statusColor}`}>{stock} Units</span>
                      <span className="text-text-muted">{stock}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 bg-${statusColor}`} style={{ width: `${Math.min(100, stock)}%` }}></div>
                    </div>
                  </div>
                )
              }
            },
            {
              header: 'Actions',
              render: (product) => (
                <div className="flex justify-end gap-2">
                  <button onClick={() => handleEdit(product)} className="p-3 bg-app-bg rounded-sm text-text-muted hover:text-accent hover:bg-accent/5 transition-all">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(product._id)} className="p-3 bg-app-bg rounded-sm text-text-muted hover:text-status-danger hover:bg-status-danger/5 transition-all">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            }
          ]}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={currentProduct ? 'Modify Registry' : 'Register Module'}
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Input label="Module Name" type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Unit Price ($)" type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required />
              <Input label="Category" type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} required />
            </div>
            <Input label="Stock Quantity" type="number" value={formData.stockQuantity} onChange={(e) => setFormData({...formData, stockQuantity: e.target.value})} required />
            <div>
              <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-3">Technical Description</label>
              <textarea rows="4" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-6 py-4 bg-app-bg border border-border-main rounded-sm text-sm font-medium outline-none focus:border-accent resize-none" required />
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative group">
              <Input label="Visual Asset URL" type="text" value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})} required />
              <div className="absolute right-4 top-[38px] text-text-muted"><Camera className="h-5 w-5" /></div>
            </div>
            <div className="p-6 bg-app-bg rounded-sm border border-border-main flex items-center justify-between mt-6">
              <div>
                <p className="text-[10px] font-black text-text-primary uppercase tracking-widest mb-1">Inventory Pulse</p>
                <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest">Active in Marketplace</p>
              </div>
              <button 
                type="button"
                onClick={() => setFormData({...formData, inStock: !formData.inStock})}
                className={`w-14 h-8 rounded-full relative transition-all ${formData.inStock ? 'bg-status-success' : 'bg-text-muted'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-card-bg rounded-full transition-all shadow-md ${formData.inStock ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
            <div className="pt-8">
              <Button type="submit" className="w-full py-5 text-sm shadow-xl shadow-accent/20">
                {currentProduct ? 'Execute Update' : 'Initialize Module'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminProducts;
