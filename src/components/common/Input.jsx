import React from 'react';

export const Input = React.forwardRef(({ 
  label, 
  error, 
  className = '', 
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`w-full px-4 py-3 bg-app-bg border ${error ? 'border-red-500 focus:border-red-500' : 'border-border-main focus:border-accent'} rounded-sm text-sm font-medium focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-[10px] font-bold text-status-danger">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
