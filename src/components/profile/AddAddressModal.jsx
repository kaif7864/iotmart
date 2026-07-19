import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin } from 'lucide-react';

const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", 
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", 
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

import { createPortal } from 'react-dom';

const AddAddressModal = ({ showAddAddress, setShowAddAddress, newAddr, setNewAddr, handleAddAddress }) => {
  if (!showAddAddress) return null;
  
  return createPortal(
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-app-bg w-full max-w-lg rounded-[32px] border border-border-main shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="p-6 flex justify-between items-center border-b border-border-subtle bg-card-bg shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center border border-accent/20 shadow-inner">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">New Address</h3>
                <p className="text-[10px] font-bold text-text-muted mt-0.5 uppercase tracking-widest">Enter shipping details</p>
              </div>
            </div>
            <button type="button" onClick={() => setShowAddAddress(false)} className="w-8 h-8 rounded-full bg-surface hover:bg-surface-hover flex items-center justify-center text-text-muted transition-colors shrink-0 ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Scrollable Body */}
          <div className="p-6 overflow-y-auto scrollbar-hide">
            <form onSubmit={handleAddAddress} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2 ml-1">Full Name</label>
                  <input required type="text" value={newAddr.name} onChange={(e) => setNewAddr({...newAddr, name: e.target.value})} className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-sm font-medium outline-none focus:border-accent focus:ring-1 focus:ring-accent text-text-primary transition-all placeholder:text-text-muted" placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2 ml-1">Phone Number</label>
                  <input 
                    required type="tel" 
                    maxLength="10"
                    value={newAddr.phone} 
                    onChange={(e) => setNewAddr({...newAddr, phone: e.target.value.replace(/\D/g, '')})} 
                    className={`w-full px-4 py-3 bg-surface border ${newAddr.phone && newAddr.phone.length !== 10 ? 'border-status-danger focus:ring-status-danger' : 'border-border-subtle focus:border-accent focus:ring-accent'} rounded-xl text-sm font-medium outline-none focus:ring-1 text-text-primary transition-all placeholder:text-text-muted`} 
                    placeholder="10-digit number"
                  />
                  {newAddr.phone && newAddr.phone.length !== 10 && <p className="text-status-danger text-[10px] font-bold mt-1.5 ml-1">Must be exactly 10 digits</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2 ml-1">Pincode</label>
                  <input 
                    required type="text" 
                    maxLength="6"
                    value={newAddr.pincode} 
                    onChange={(e) => setNewAddr({...newAddr, pincode: e.target.value.replace(/\D/g, '')})} 
                    className={`w-full px-4 py-3 bg-surface border ${newAddr.pincode && newAddr.pincode.length !== 6 ? 'border-status-danger focus:ring-status-danger' : 'border-border-subtle focus:border-accent focus:ring-accent'} rounded-xl text-sm font-medium outline-none focus:ring-1 text-text-primary transition-all placeholder:text-text-muted`} 
                    placeholder="6-digit PIN"
                  />
                  {newAddr.pincode && newAddr.pincode.length !== 6 && <p className="text-status-danger text-[10px] font-bold mt-1.5 ml-1">Must be exactly 6 digits</p>}
                </div>
                <div>
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2 ml-1">State</label>
                  <div className="relative">
                    <select 
                      required 
                      value={newAddr.state} 
                      onChange={(e) => setNewAddr({...newAddr, state: e.target.value})} 
                      className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-sm font-medium outline-none focus:border-accent focus:ring-1 focus:ring-accent text-text-primary transition-all appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Select State</option>
                      {INDIAN_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-text-muted">
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2 ml-1">City / District / Town</label>
                <input required type="text" value={newAddr.city} onChange={(e) => setNewAddr({...newAddr, city: e.target.value})} className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-sm font-medium outline-none focus:border-accent focus:ring-1 focus:ring-accent text-text-primary transition-all placeholder:text-text-muted" placeholder="City name" />
              </div>

              <div>
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2 ml-1">House No., Building, Company, Apartment</label>
                <input required type="text" value={newAddr.house} onChange={(e) => setNewAddr({...newAddr, house: e.target.value})} className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-sm font-medium outline-none focus:border-accent focus:ring-1 focus:ring-accent text-text-primary transition-all placeholder:text-text-muted" placeholder="Flat No. / House Name" />
              </div>

              <div>
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2 ml-1">Area, Street, Sector, Village</label>
                <input required type="text" value={newAddr.area} onChange={(e) => setNewAddr({...newAddr, area: e.target.value})} className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-sm font-medium outline-none focus:border-accent focus:ring-1 focus:ring-accent text-text-primary transition-all placeholder:text-text-muted" placeholder="Area / Street Name" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2 ml-1">Landmark (Optional)</label>
                  <input type="text" value={newAddr.landmark} onChange={(e) => setNewAddr({...newAddr, landmark: e.target.value})} className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-sm font-medium outline-none focus:border-accent focus:ring-1 focus:ring-accent text-text-primary transition-all placeholder:text-text-muted" placeholder="e.g. Near Apollo Hospital" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2 ml-1">Save As</label>
                  <div className="relative">
                    <input 
                      type="text"
                      list="address-types"
                      required
                      placeholder="e.g. Home, Office"
                      value={newAddr.type}
                      onChange={(e) => setNewAddr({...newAddr, type: e.target.value})}
                      className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-sm font-bold outline-none focus:border-accent focus:ring-1 focus:ring-accent text-text-primary transition-all placeholder:text-text-muted"
                    />
                    <datalist id="address-types">
                      <option value="Home" />
                      <option value="Work" />
                      <option value="Other" />
                    </datalist>
                  </div>
                </div>
              </div>

              <div className="pt-6 pb-2">
                <button type="submit" className="w-full py-4 bg-accent hover:bg-accent-hover text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all hover:-translate-y-0.5">
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default AddAddressModal;
