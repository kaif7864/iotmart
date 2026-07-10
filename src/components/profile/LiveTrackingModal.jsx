import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Loader2 } from 'lucide-react';

const LiveTrackingModal = ({ showTracking, setShowTracking, trackingData, trackingLoading }) => {
  if (!showTracking) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-surface-dark/80 backdrop-blur-md">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-card-bg w-full max-w-lg rounded-[40px] shadow-2xl relative overflow-hidden">
          <button onClick={() => setShowTracking(false)} className="absolute top-6 right-6 p-2 bg-surface-hover hover:bg-surface-hover rounded-full transition-all z-50">
            <X className="h-5 w-5 text-text-primary" />
          </button>
          
          <div className="p-10 max-h-[80vh] overflow-y-auto scrollbar-hide">
            <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-sm flex items-center justify-center mx-auto mb-6 text-emerald-500">
              <MapPin className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-black text-text-primary uppercase tracking-tighter">Live Tracking</h3>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-2">Powered by Shiprocket</p>
          </div>

          {trackingLoading ? (
            <div className="py-20 flex justify-center"><Loader2 className="h-10 w-10 text-accent animate-spin" /></div>
          ) : trackingData ? (
            <div>
              <div className="bg-app-bg p-6 rounded-sm border border-border-subtle mb-8 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Current Status</p>
                  <p className="text-sm font-black text-accent uppercase tracking-tight">{trackingData.current_status}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Estimated Arrival</p>
                  <p className="text-sm font-black text-text-primary uppercase tracking-tight">{trackingData.estimated_delivery}</p>
                </div>
              </div>

              <div className="relative pl-8 space-y-8 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-[2px] before:bg-surface-hover">
                {trackingData.scans?.map((scan, idx) => (
                  <div key={idx} className="relative">
                    {/* Timeline Dot */}
                    <div className={`absolute -left-[35.5px] top-1 w-5 h-5 rounded-full border-4 border-card-bg shadow-sm z-10 flex items-center justify-center ${idx === 0 ? 'bg-accent text-white' : 'bg-text-muted'}`}>
                    </div>
                    
                    {/* Scan Content */}
                    <div className="bg-card-bg p-5 rounded-2xl border border-border-subtle shadow-sm hover:shadow-md transition-shadow ml-4">
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                        <span className="font-black text-text-primary text-xs uppercase tracking-widest">{scan.location}</span>
                        <time className="text-[10px] font-black text-accent uppercase bg-accent/10 px-3 py-1 rounded-full">{scan.date}</time>
                      </div>
                      <p className="text-sm text-text-secondary font-medium leading-relaxed">{scan.activity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center p-8 bg-red-50 text-status-danger rounded-sm text-sm font-bold">
              Failed to fetch tracking data. Please try again.
            </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LiveTrackingModal;
