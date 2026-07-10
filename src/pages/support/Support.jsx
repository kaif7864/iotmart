import React, { useState } from 'react';
import { Send, FileText, AlertCircle, CheckCircle, Loader2, Info, Headphones } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Support = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    category: 'Technical Support',
    priority: 'Normal',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="pt-40 pb-24 min-h-screen bg-app-bg flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-card-bg p-12 rounded-[40px] text-center shadow-2xl border border-border-main"
        >
          <div className="w-20 h-20 bg-status-success/10 text-status-success rounded-sm flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter mb-4">Ticket Generated</h2>
          <p className="text-text-muted text-sm font-medium mb-8">Your support ticket has been submitted and assigned to our team. Reference: <span className="text-accent font-black">#TIC-9942</span></p>
          <button onClick={() => setSubmitted(false)} className="btn-premium w-full py-4 text-[10px]">Raise Another Ticket</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 bg-app-bg min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Info Sidebar */}
          <div className="space-y-8">
            <div>
              <p className="text-accent text-[10px] font-black uppercase tracking-[0.4em] mb-4">Support Center</p>
              <h1 className="text-4xl font-black text-text-primary tracking-tighter uppercase mb-6">Open a <span className="text-accent">Ticket</span></h1>
              <p className="text-text-muted font-medium text-sm leading-relaxed">Need technical assistance with a sensor or have an order query? Our engineering team is here to help.</p>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Avg. Response Time', val: '2-4 Hours', icon: Headphones },
                { label: 'Technical Expertise', val: 'Hardware Level', icon: FileText },
                { label: 'Status', val: 'System Online', icon: Info },
              ].map((item, i) => (
                <div key={i} className="bg-card-bg p-6 rounded-sm border border-border-main flex items-center gap-4">
                  <div className="w-10 h-10 bg-app-bg rounded-sm flex items-center justify-center text-accent">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">{item.label}</p>
                    <p className="text-sm font-black text-text-primary uppercase">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 bg-surface-dark rounded-[32px] text-white">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map(s => <AlertCircle key={s} className="h-3 w-3 text-accent fill-current" />)}
              </div>
              <p className="text-xs font-medium text-text-muted italic">"Our goal is to provide the same level of precision in our support as we do in our hardware modules."</p>
              <p className="text-[10px] font-black uppercase tracking-widest mt-4 text-white">— IoTMart Engineering Team</p>
            </div>
          </div>

          {/* Ticket Form */}
          <div className="lg:col-span-2">
            <div className="bg-card-bg p-10 md:p-12 rounded-[40px] shadow-sm border border-border-main">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-3">Ticket Subject</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g., ESP32 WiFi Connectivity Issue"
                      className="w-full px-6 py-4 bg-app-bg border border-transparent rounded-sm text-sm font-black focus:bg-card-bg focus:border-accent transition-all outline-none"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-3">Department</label>
                    <select 
                      className="w-full px-6 py-4 bg-app-bg border border-transparent rounded-sm text-sm font-black focus:bg-card-bg focus:border-accent transition-all outline-none"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      <option>Technical Support</option>
                      <option>Order Fulfillment</option>
                      <option>Returns & Exchanges</option>
                      <option>Billing Query</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-3">Priority Level</label>
                    <div className="flex gap-4">
                      {['Normal', 'High', 'Critical'].map(p => (
                        <button 
                          key={p}
                          type="button"
                          onClick={() => setFormData({...formData, priority: p})}
                          className={`flex-grow py-3 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${formData.priority === p ? 'bg-surface-dark text-white' : 'bg-app-bg text-text-muted hover:bg-surface-hover'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-3">Detailed Explanation</label>
                  <textarea 
                    rows="6"
                    required
                    placeholder="Provide technical details, order number, or code snippets..."
                    className="w-full px-6 py-4 bg-app-bg border border-transparent rounded-sm text-sm font-medium focus:bg-card-bg focus:border-accent transition-all outline-none resize-none"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full btn-premium py-5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-accent/20"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Initialize Support Protocol <Send className="h-4 w-4" /></>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
