import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", 
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", 
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const AddAddressModal = ({ showAddAddress, setShowAddAddress, newAddr, setNewAddr, handleAddAddress }) => {
  if (!showAddAddress) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-surface-dark/80 backdrop-blur-md">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-card-bg w-full max-w-lg rounded-[40px] shadow-2xl relative overflow-hidden">
          <button onClick={() => setShowAddAddress(false)} className="absolute top-6 right-6 p-2 bg-surface-hover hover:bg-surface-hover rounded-full transition-all z-50">
            <X className="h-5 w-5 text-text-primary" />
          </button>
          
          <div className="p-10 max-h-[90vh] overflow-y-auto scrollbar-hide">
            <h3 className="text-2xl font-black text-text-primary mb-8 uppercase tracking-tighter">New Shipping Address</h3>
          <form onSubmit={handleAddAddress} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2">Full Name</label>
                <input required type="text" value={newAddr.name} onChange={(e) => setNewAddr({...newAddr, name: e.target.value})} className="w-full px-5 py-3 bg-app-bg border border-border-main rounded-sm text-sm font-medium outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2">Phone Number</label>
                <input 
                  required type="tel" 
                  maxLength="10"
                  value={newAddr.phone} 
                  onChange={(e) => setNewAddr({...newAddr, phone: e.target.value.replace(/\D/g, '')})} 
                  className={`w-full px-5 py-3 bg-app-bg border ${newAddr.phone && newAddr.phone.length !== 10 ? 'border-status-danger' : 'border-border-main'} rounded-sm text-sm font-medium outline-none focus:border-accent`} 
                />
                {newAddr.phone && newAddr.phone.length !== 10 && <p className="text-status-danger text-[10px] font-bold mt-1">Must be exactly 10 digits</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2">Pincode</label>
                <input 
                  required type="text" 
                  maxLength="6"
                  value={newAddr.pincode} 
                  onChange={(e) => setNewAddr({...newAddr, pincode: e.target.value.replace(/\D/g, '')})} 
                  className={`w-full px-5 py-3 bg-app-bg border ${newAddr.pincode && newAddr.pincode.length !== 6 ? 'border-status-danger' : 'border-border-main'} rounded-sm text-sm font-medium outline-none focus:border-accent`} 
                />
                {newAddr.pincode && newAddr.pincode.length !== 6 && <p className="text-status-danger text-[10px] font-bold mt-1">Must be exactly 6 digits</p>}
              </div>
              <div>
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2">State</label>
                <select 
                  required 
                  value={newAddr.state} 
                  onChange={(e) => setNewAddr({...newAddr, state: e.target.value})} 
                  className="w-full px-5 py-3 bg-app-bg border border-border-main rounded-sm text-sm font-medium outline-none focus:border-accent"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2">City / District / Town</label>
              <input required type="text" value={newAddr.city} onChange={(e) => setNewAddr({...newAddr, city: e.target.value})} className="w-full px-5 py-3 bg-app-bg border border-border-main rounded-sm text-sm font-medium outline-none focus:border-accent" />
            </div>

            <div>
              <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2">House No., Building, Company, Apartment</label>
              <input required type="text" value={newAddr.house} onChange={(e) => setNewAddr({...newAddr, house: e.target.value})} className="w-full px-5 py-3 bg-app-bg border border-border-main rounded-sm text-sm font-medium outline-none focus:border-accent" />
            </div>

            <div>
              <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2">Area, Street, Sector, Village</label>
              <input required type="text" value={newAddr.area} onChange={(e) => setNewAddr({...newAddr, area: e.target.value})} className="w-full px-5 py-3 bg-app-bg border border-border-main rounded-sm text-sm font-medium outline-none focus:border-accent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2">Landmark (Optional)</label>
                <input type="text" value={newAddr.landmark} onChange={(e) => setNewAddr({...newAddr, landmark: e.target.value})} className="w-full px-5 py-3 bg-app-bg border border-border-main rounded-sm text-sm font-medium outline-none focus:border-accent" />
              </div>
              <div>
              <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2">Address Type</label>
              <select 
                value={newAddr.type}
                onChange={(e) => setNewAddr({...newAddr, type: e.target.value})}
                className="w-full px-5 py-3 bg-app-bg border border-border-main rounded-sm text-sm font-bold outline-none"
              >
                <option>Home</option>
                <option>Lab / Office</option>
                <option>Warehouse</option>
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full btn-premium py-4 text-sm font-black uppercase tracking-widest shadow-xl shadow-accent/20">
              Save Address
            </button>
          </div>
          </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddAddressModal;
