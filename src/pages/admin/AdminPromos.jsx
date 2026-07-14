import React, { useState, useEffect } from 'react';
import { Plus, Tag, Trash2, Edit2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Modal, ConfirmModal, Table, EmptyState } from '../../components/common';
import apiClient from '../../services/api.client';
import toast from 'react-hot-toast';

const AdminPromos = () => {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPromo, setCurrentPromo] = useState(null);
  
  const [formData, setFormData] = useState({
    code: '',
    discount_percentage: 10,
    min_order_value: 500,
    max_discount_amount: 1000,
    valid_until: '',
    is_active: true
  });

  const fetchPromos = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/coupons');
      setPromos(res.data);
    } catch (err) {
      toast.error('Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const resetForm = () => {
    setCurrentPromo(null);
    setFormData({
      code: '',
      discount_percentage: 10,
      min_order_value: 500,
      max_discount_amount: 1000,
      valid_until: '',
      is_active: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, code: formData.code.toUpperCase() };
      
      if (currentPromo) {
        await apiClient.put(`/coupons/${currentPromo._id}`, payload);
        toast.success('Promo code updated!');
      } else {
        await apiClient.post('/coupons', payload);
        toast.success('Promo code created!');
      }
      setIsModalOpen(false);
      fetchPromos();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this promo?")) return;
    try {
      await apiClient.delete(`/coupons/${id}`);
      toast.success('Promo code deleted');
      fetchPromos();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleEdit = (promo) => {
    setCurrentPromo(promo);
    setFormData({
      code: promo.code,
      discount_percentage: promo.discount_percentage,
      min_order_value: promo.min_order_value,
      max_discount_amount: promo.max_discount_amount || '',
      valid_until: promo.valid_until ? promo.valid_until.split('T')[0] : '',
      is_active: promo.is_active
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-border-main">
        <div>
          <p className="label-caps text-accent mb-2">Marketing Hub</p>
          <h1 className="heading-page">Promo <span className="text-accent">Codes</span></h1>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="h-14 w-full md:w-auto">
          <Plus className="h-5 w-5 mr-2" /> Create Promo
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-accent" /></div>
      ) : promos.length === 0 ? (
        <EmptyState icon={Tag} title="No Promo Codes" description="Create your first promo code to run a marketing campaign." />
      ) : (
        <Table
          keyField="_id"
          data={promos}
          mobileRenderer={(p) => (
            <div className="card rounded-[24px] p-5 space-y-5 border border-border-main bg-card-bg shadow-sm">
              <div className="flex justify-between items-start">
                <span className="font-mono font-black text-lg tracking-widest text-text-primary bg-surface px-3 py-1 rounded-md border border-border-subtle">{p.code}</span>
                <div className={`flex items-center gap-1.5 label-caps px-2.5 py-1 rounded-full ${p.is_active ? 'bg-status-success-bg text-status-success' : 'bg-status-danger-bg text-status-danger'}`}>
                  {p.is_active ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                  {p.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 bg-app-bg p-4 rounded-[16px] border border-border-subtle mb-4">
                <div>
                  <p className="text-[9px] text-text-muted font-black uppercase tracking-widest mb-1">Discount</p>
                  <p className="text-sm font-black text-status-success">{p.discount_percentage}% OFF</p>
                </div>
                <div>
                  <p className="text-[9px] text-text-muted font-black uppercase tracking-widest mb-1">Constraints</p>
                  <div className="text-[10px] text-text-secondary font-medium leading-tight mt-1">
                    Min: ₹{p.min_order_value} <br/>
                    Max: {p.max_discount_amount ? `₹${p.max_discount_amount}` : 'None'}
                  </div>
                </div>
                <div className="col-span-2 border-t border-border-subtle pt-3 mt-1">
                  <p className="text-[9px] text-text-muted font-black uppercase tracking-widest mb-1">Usage & Savings</p>
                  <p className="text-xs font-bold text-text-primary">
                    {p.usage_count || 0} Uses • ₹{(p.total_discount_given || 0).toFixed(2)} Saved
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => handleEdit(p)} className="flex-1 py-3 bg-app-bg hover:bg-accent hover:text-white text-text-primary font-black text-[10px] uppercase tracking-widest rounded-[12px] transition-all border border-border-main flex items-center justify-center gap-2">
                  <Edit2 className="h-3 w-3" /> Edit
                </button>
                <button onClick={() => handleDelete(p._id)} className="flex-1 py-3 bg-app-bg hover:bg-status-danger hover:text-white text-status-danger font-black text-[10px] uppercase tracking-widest rounded-[12px] transition-all border border-border-main flex items-center justify-center gap-2">
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </div>
          )}
          columns={[
            {
              header: 'Code',
              render: (p) => <span className="font-mono font-black text-lg tracking-widest text-text-primary bg-surface px-3 py-1 rounded-sm">{p.code}</span>
            },
            {
              header: 'Discount',
              render: (p) => <span className="text-status-success font-bold">{p.discount_percentage}% OFF</span>
            },
            {
              header: 'Constraints',
              render: (p) => (
                <div className="text-xs text-text-muted">
                  Min: ₹{p.min_order_value} <br/>
                  Max: {p.max_discount_amount ? `₹${p.max_discount_amount}` : 'None'}
                </div>
              )
            },
            {
              header: 'Usage & Savings',
              render: (p) => (
                <div className="text-xs">
                  <span className="font-bold text-text-primary">{p.usage_count || 0} Uses</span>
                  <br />
                  <span className="text-status-success font-medium">₹{(p.total_discount_given || 0).toFixed(2)} Saved</span>
                </div>
              )
            },
            {
              header: 'Status',
              render: (p) => (
                <div className={`flex items-center gap-2 label-caps ${p.is_active ? 'text-status-success' : 'text-status-danger'}`}>
                  {p.is_active ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {p.is_active ? 'Active' : 'Inactive'}
                </div>
              )
            },
            {
              header: 'Actions',
              render: (p) => (
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(p)} className="w-9 h-9 flex items-center justify-center rounded-xl border border-border-main text-text-muted hover:text-accent hover:bg-accent/10 transition-all">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(p._id)} className="w-9 h-9 flex items-center justify-center rounded-xl border border-border-main text-text-muted hover:text-status-danger hover:bg-status-danger/10 transition-all">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            }
          ]}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentPromo ? 'Edit Promo Code' : 'New Promo Code'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="Promo Code (e.g. SUMMER24)" type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Discount %" type="number" value={formData.discount_percentage} onChange={(e) => setFormData({...formData, discount_percentage: Number(e.target.value)})} min="1" max="100" required />
            <Input label="Min Order Value (₹)" type="number" value={formData.min_order_value} onChange={(e) => setFormData({...formData, min_order_value: Number(e.target.value)})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Max Discount Amount (₹)" type="number" value={formData.max_discount_amount} onChange={(e) => setFormData({...formData, max_discount_amount: Number(e.target.value)})} />
            <Input label="Valid Until" type="date" value={formData.valid_until} onChange={(e) => setFormData({...formData, valid_until: e.target.value})} />
          </div>
          <div className="flex items-center justify-between p-4 bg-surface rounded-sm">
            <span className="label-caps text-text-primary">Is Active</span>
            <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="h-5 w-5 accent-accent" />
          </div>
          <Button type="submit" className="w-full py-4">{currentPromo ? 'Update Promo' : 'Create Promo'}</Button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminPromos;
