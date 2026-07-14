import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Search,
  Package, AlertTriangle,
  Loader2, Camera,
  BrainCircuit, TrendingUp, X
} from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct, getAIChatReply, uploadProductImage } from '../../services/api';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Skeleton, SkeletonTableRows, Button, Input, Modal, ConfirmModal, Badge, Table, EmptyState } from '../../components/common';

const AdminProducts = () => {
  const { formatPrice } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', price: '', category: '', description: '', image: '', inStock: true, stockQuantity: 100, specs: []
  });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    
    try {
      const res = await uploadProductImage(fd);
      if (res.data.success) {
        setFormData(prev => ({ ...prev, image: 'http://localhost:8000' + res.data.image_url }));
        toast.success("Image uploaded!");
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed");
    } finally {
      setIsUploading(false);
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
      alert('Error saving product');
    }
  };

  const handleEdit = (product) => {
    setCurrentProduct(product);
    setFormData(product);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    setDeleteTarget(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteProduct(deleteTarget);
      fetchProducts();
      setIsDeleteOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      alert('Delete failed');
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
      alert('AI RESTOCK ADVICE: ' + data.reply);
    } catch (error) {
      alert('AI engine is recalibrating...');
    } finally {
      setIsSuggesting(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stockStats = [
    { label: 'In Stock',  count: products.filter(p => (p.stockQuantity || 100) > 20).length,                                          icon: TrendingUp,   variant: 'success' },
    { label: 'Low Stock', count: products.filter(p => (p.stockQuantity || 100) <= 20 && (p.stockQuantity || 100) > 0).length, icon: AlertTriangle, variant: 'warning' },
    { label: 'Stock Out', count: products.filter(p => (p.stockQuantity || 0) === 0).length,                                            icon: X,            variant: 'danger'  },
  ];

  const variantStyles = {
    success: 'bg-status-success-bg text-status-success',
    warning: 'bg-status-warning-bg text-status-warning',
    danger:  'bg-status-danger-bg text-status-danger',
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-10 border-b border-border-subtle">
        <div>
          <p className="label-caps text-accent mb-2">Operational Registry</p>
          <h1 className="heading-page">Inventory <span className="text-accent">Control</span></h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button
            onClick={handleAISuggestion}
            disabled={isSuggesting}
            variant="secondary"
            className="h-14 bg-surface-dark text-text-inverse hover:bg-black"
          >
            {isSuggesting
              ? <Loader2 className="h-4 w-4 mr-2 animate-spin text-accent" />
              : <BrainCircuit className="h-5 w-5 mr-2 text-accent" />
            }
            AI Strategic Restock
          </Button>
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="h-14">
            <Plus className="h-5 w-5 mr-2" /> Add Module
          </Button>
        </div>
      </div>

      {/* Stats & Search Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
        {stockStats.map((stat, i) => (
          <div key={i} className="card h-16 rounded-sm px-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-sm flex items-center justify-center ${variantStyles[stat.variant]}`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="label-caps">{stat.label}</p>
              <p className="text-lg font-black text-text-primary leading-none mt-1">{stat.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Products Table */}
      {loading ? (
        <SkeletonTableRows rows={6} cols={5} />
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
                  <div className="w-16 h-16 bg-app-bg rounded-sm p-2 border border-border-main flex-shrink-0">
                    <img src={product.image} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-text-primary uppercase tracking-tight">{product.name}</p>
                    <p className="label-caps mt-1">ID: {product._id.slice(-8).toUpperCase()}</p>
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
              header: 'Stock',
              render: (product) => {
                const stock = product.stockQuantity !== undefined ? product.stockQuantity : 45;
                const color = stock < 5 ? 'status-danger' : stock < 20 ? 'status-warning' : 'status-success';
                return (
                  <div className="space-y-2 min-w-[120px]">
                    <div className="flex justify-between items-center label-caps">
                      <span className={`text-${color} font-black`}>{stock} UNITS</span>
                      {stock < 5 && <span className="bg-status-danger text-text-inverse text-[8px] px-1.5 py-0.5 rounded-sm animate-pulse">LOW</span>}
                    </div>
                    <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                      <div className={`h-full rounded-full bg-${color}`} style={{ width: `${Math.min(100, (stock / 100) * 100)}%` }} />
                    </div>
                  </div>
                );
              }
            },
            {
              header: 'Actions',
              render: (product) => (
                <div className="flex justify-end gap-2">
                  <button onClick={() => handleEdit(product)} className="w-9 h-9 flex items-center justify-center rounded-full text-text-muted hover:text-accent hover:bg-accent-light transition-all">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(product._id)} className="w-9 h-9 flex items-center justify-center rounded-full text-text-muted hover:text-status-danger hover:bg-status-danger-bg transition-all">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            }
          ]}
        />
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentProduct ? 'Modify Registry' : 'Register Module'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Input label="Module Name" type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Unit Price (₹)" type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required />
              <div>
                <label className="label-caps block mb-3">Category</label>
                <select 
                  value={formData.category} 
                  onChange={(e) => setFormData({...formData, category: e.target.value})} 
                  className="field-input w-full appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a0a0a0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_auto] bg-no-repeat bg-[position:right_1rem_center]"
                  required
                >
                  <option value="" disabled>Select Category</option>
                  <option value="Microcontrollers">Microcontrollers</option>
                  <option value="Sensors">Sensors</option>
                  <option value="Actuators">Actuators</option>
                  <option value="Connectivity">Connectivity</option>
                  <option value="Power">Power</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Displays">Displays</option>
                  <option value="Robotics">Robotics</option>
                </select>
              </div>
            </div>
            <Input label="Stock Quantity" type="number" value={formData.stockQuantity} onChange={(e) => setFormData({...formData, stockQuantity: e.target.value})} required />
            <div>
              <label className="label-caps block mb-3">Technical Description</label>
              <textarea rows="4" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="field-input resize-none" required />
            </div>
          </div>
          <div className="space-y-6">
            <div className="relative">
              <label className="label-caps block mb-3">Visual Asset</label>
              <div className="flex gap-2 items-center">
                <input 
                  type="text" 
                  value={formData.image} 
                  onChange={(e) => setFormData({...formData, image: e.target.value})} 
                  placeholder="Image URL or upload" 
                  className="field-input flex-1" 
                  required 
                />
                <label className="cursor-pointer bg-surface hover:bg-surface-hover w-12 h-12 flex items-center justify-center rounded-sm border border-border-main transition-colors">
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                  {isUploading ? <Loader2 className="h-5 w-5 animate-spin text-accent" /> : <Camera className="h-5 w-5 text-text-muted hover:text-accent" />}
                </label>
              </div>
              {formData.image && <img src={formData.image} alt="Preview" className="w-full h-32 object-cover rounded-sm mt-4 border border-border-main" />}
            </div>
            <div className="card p-6 rounded-sm flex items-center justify-between">
              <div>
                <p className="label-caps text-text-primary mb-1">Inventory Pulse</p>
                <p className="label-caps">Active in Marketplace</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({...formData, inStock: !formData.inStock})}
                className={`w-14 h-8 rounded-full relative transition-all ${formData.inStock ? 'bg-status-success' : 'bg-text-muted'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-card-bg rounded-full transition-all shadow-md ${formData.inStock ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            <div className="pt-4">
              <Button type="submit" className="w-full py-5 text-sm shadow-xl shadow-accent/20">
                {currentProduct ? 'Execute Update' : 'Initialize Module'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Component?"
        message="This will permanently remove this module from the inventory registry. This cannot be undone."
        confirmLabel="Delete Module"
        variant="danger"
      />
    </div>
  );
};

export default AdminProducts;
