import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Loader2, Package, Truck, CheckCircle2 } from 'lucide-react';
import { createPortal } from 'react-dom';

const LiveTrackingModal = ({ showTracking, setShowTracking, trackingData, trackingLoading }) => {
  if (!showTracking) return null;
  
  return createPortal(
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-app-bg w-full max-w-md rounded-[32px] border border-border-main shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="p-5 flex justify-between items-center border-b border-border-subtle bg-card-bg shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center border border-accent/20 shadow-inner">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">Live Tracking</h3>
                <p className="text-[10px] font-bold text-text-muted mt-0.5 uppercase tracking-widest">Powered by Shiprocket</p>
              </div>
            </div>
            <button onClick={() => setShowTracking(false)} className="w-8 h-8 rounded-full bg-surface hover:bg-surface-hover flex items-center justify-center text-text-muted transition-colors shrink-0 ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Scrollable Body */}
          <div className="p-5 overflow-y-auto scrollbar-hide">
            {trackingLoading ? (
              <div className="py-24 flex flex-col items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl animate-pulse"></div>
                  <Loader2 className="h-10 w-10 text-accent animate-spin relative z-10" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mt-4">Locating your package...</p>
              </div>
            ) : trackingData ? (
              <div className="space-y-6">
                
                {/* Status Card */}
                <div className="bg-card-bg p-5 rounded-2xl border border-border-subtle shadow-sm flex justify-between items-center">
                  <div>
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1.5">Current Status</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                      <p className="text-sm font-black text-accent uppercase tracking-tight">{trackingData.current_status}</p>
                    </div>
                  </div>
                  <div className="text-right border-l border-border-subtle pl-4">
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1.5">Est. Arrival</p>
                    <p className="text-sm font-black text-text-primary uppercase tracking-tight">{trackingData.estimated_delivery || 'Calculating...'}</p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="px-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-6 px-1">Tracking History</h4>
                  
                  <div className="relative pl-7 space-y-6 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-[2px] before:bg-surface hover:before:bg-surface-hover before:transition-colors">
                    {trackingData.scans?.length > 0 ? (
                      trackingData.scans.map((scan, idx) => (
                        <div key={idx} className="relative group">
                          {/* Timeline Dot */}
                          <div className={`absolute -left-[34px] top-1 w-4 h-4 rounded-full border-2 border-app-bg shadow-sm z-10 flex items-center justify-center transition-colors ${idx === 0 ? 'bg-accent text-white scale-125' : 'bg-surface-dark group-hover:bg-text-muted'}`}>
                          </div>
                          
                          {/* Scan Content */}
                          <div className={`p-4 rounded-2xl border transition-all ml-2 ${idx === 0 ? 'bg-accent/5 border-accent/20 shadow-sm' : 'bg-surface/50 border-transparent hover:border-border-subtle hover:bg-card-bg'}`}>
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-1.5">
                              <span className={`font-black text-[11px] uppercase tracking-widest ${idx === 0 ? 'text-accent' : 'text-text-primary'}`}>
                                {scan.location}
                              </span>
                              <time className="text-[9px] font-black text-text-muted uppercase tracking-widest">{scan.date}</time>
                            </div>
                            <p className="text-xs text-text-secondary font-medium leading-relaxed">{scan.activity}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center bg-surface/50 rounded-2xl border border-border-subtle">
                        <Truck className="w-8 h-8 mx-auto text-text-muted mb-3 opacity-50" />
                        <p className="text-xs font-bold text-text-secondary">Tracking details not available yet.</p>
                        <p className="text-[10px] font-bold text-text-muted mt-1 uppercase tracking-widest">Please check back later</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 bg-status-danger/10 border border-status-danger/20 rounded-2xl">
                <X className="w-10 h-10 mx-auto text-status-danger mb-3" />
                <p className="text-sm font-bold text-status-danger uppercase tracking-tight">Failed to fetch data</p>
                <p className="text-xs font-medium text-status-danger/70 mt-1">Please try again later or contact support.</p>
              </div>
            )}
          </div>
          
          {/* Footer Action */}
          <div className="p-4 border-t border-border-subtle bg-surface/50 text-center shrink-0">
            <button onClick={() => setShowTracking(false)} className="w-full py-3.5 bg-text-primary text-white text-[11px] font-black rounded-xl uppercase tracking-widest hover:bg-text-secondary transition-all">
              Close Tracking
            </button>
          </div>
          
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default LiveTrackingModal;
