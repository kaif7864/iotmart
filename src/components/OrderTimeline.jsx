import React from 'react';
import { Package, Truck, CheckCircle, Clock, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';

const OrderTimeline = ({ status }) => {
  const steps = [
    { label: 'Pending', icon: Clock, color: 'text-amber-500' },
    { label: 'Processing', icon: ShoppingBag, color: 'text-blue-500' },
    { label: 'Shipped', icon: Truck, color: 'text-purple-500' },
    { label: 'Delivered', icon: CheckCircle, color: 'text-emerald-500' },
  ];

  const currentStep = steps.findIndex(step => step.label === status);
  const isCancelled = status === 'Cancelled';

  if (isCancelled) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
        <p className="text-red-600 font-bold text-xs uppercase tracking-widest">Order Cancelled</p>
      </div>
    );
  }

  return (
    <div className="relative w-full py-8 px-4">
      {/* Background Line */}
      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
      
      {/* Progress Line */}
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        className="absolute top-1/2 left-0 h-0.5 bg-accent -translate-y-1/2 z-0 transition-all duration-1000"
      />

      <div className="relative z-10 flex justify-between items-center">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index <= currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={step.label} className="flex flex-col items-center gap-3">
              <motion.div 
                animate={isCurrent ? { scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-4 ${
                  isActive 
                    ? 'bg-white border-accent text-accent shadow-md' 
                    : 'bg-white border-slate-100 text-slate-300'
                }`}
              >
                <Icon className={`h-4 w-4 ${isCurrent ? 'animate-pulse' : ''}`} />
              </motion.div>
              <div className="text-center">
                <p className={`text-[9px] font-black uppercase tracking-widest ${
                  isActive ? 'text-text-primary' : 'text-text-muted'
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
