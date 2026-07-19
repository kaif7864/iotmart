import React from 'react';
import { Package, Truck, CheckCircle, Clock, ShoppingBag, XCircle, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';

const OrderTimeline = ({ status }) => {
  const steps = [
    { label: 'Pending', icon: Clock, color: 'text-accent' },
    { label: 'Processing', icon: ShoppingBag, color: 'text-accent' },
    { label: 'Shipped', icon: Truck, color: 'text-accent' },
    { label: 'Delivered', icon: CheckCircle, color: 'text-status-success' },
  ];

  const currentStep = Math.max(0, steps.findIndex(step => step.label === status));
  const isCancelled = status === 'Cancelled';
  const isReturn = status === 'Return Requested' || status === 'Refunded';

  if (isCancelled || isReturn) {
    return (
      <div className={`relative overflow-hidden border rounded-[24px] p-8 text-center flex flex-col items-center justify-center gap-4 ${
        isCancelled 
          ? 'bg-status-danger/5 border-status-danger/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]' 
          : 'bg-status-warning/5 border-status-warning/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]'
      }`}>
        <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full pointer-events-none ${isCancelled ? 'bg-status-danger/20' : 'bg-status-warning/20'}`} />
        <div className={`w-16 h-16 rounded-full flex items-center justify-center relative z-10 shadow-inner border ${
          isCancelled ? 'bg-status-danger/20 text-status-danger border-status-danger/30' : 'bg-status-warning/20 text-status-warning border-status-warning/30'
        }`}>
          {isCancelled ? <XCircle className="w-8 h-8" /> : <RefreshCcw className="w-8 h-8" />}
        </div>
        <div className="relative z-10">
          <p className={`font-black text-xl uppercase tracking-tight ${isCancelled ? 'text-status-danger' : 'text-status-warning'}`}>
            {status}
          </p>
          <p className="text-text-muted text-xs font-bold mt-2">
            {isCancelled ? 'This order has been cancelled.' : 'Return process has been initiated.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full py-8 px-4 md:px-10">
      {/* Background Line */}
      <div className="absolute top-1/2 left-[10%] w-[80%] h-1 bg-surface-dark/50 rounded-full -translate-y-1/2 z-0" />
      
      {/* Progress Line */}
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${(currentStep / (steps.length - 1)) * 80}%` }}
        className="absolute top-1/2 left-[10%] h-1 bg-gradient-to-r from-accent to-status-success rounded-full -translate-y-1/2 z-0 transition-all duration-1000 shadow-[0_0_15px_rgba(2,132,199,0.5)]"
      />

      <div className="relative z-10 flex justify-between items-center">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index <= currentStep;
          const isCurrent = index === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.label} className="flex flex-col items-center gap-4 relative">
              <motion.div 
                animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center border transition-all duration-500 z-10 ${
                  isActive 
                    ? isLast && isCurrent 
                      ? 'bg-status-success/20 border-status-success text-status-success shadow-[0_0_25px_rgba(34,197,94,0.3)] backdrop-blur-md'
                      : 'bg-accent/20 border-accent text-accent shadow-[0_0_25px_rgba(2,132,199,0.3)] backdrop-blur-md'
                    : 'bg-surface border-border-subtle text-text-muted opacity-60'
                }`}
              >
                <Icon className={`h-5 w-5 md:h-6 md:w-6 ${isCurrent ? 'animate-pulse' : ''}`} />
              </motion.div>
              
              <div className="text-center absolute -bottom-10 w-32 left-1/2 -translate-x-1/2">
                <p className={`text-[9px] md:text-[11px] font-black uppercase tracking-[0.1em] ${
                  isActive ? isLast && isCurrent ? 'text-status-success' : 'text-text-primary' : 'text-text-muted'
                }`}>
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTimeline;
