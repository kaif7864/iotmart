import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-24 right-8 z-[110] animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-white border border-border-main px-6 py-4 rounded-lg shadow-xl flex items-center gap-4">
        <div className="w-9 h-9 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-text-primary font-bold text-xs uppercase tracking-wider">Success</p>
          <p className="text-text-muted text-xs font-medium">{message}</p>
        </div>
        <button 
          onClick={onClose}
          className="ml-4 p-1 text-text-muted hover:text-text-primary transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
