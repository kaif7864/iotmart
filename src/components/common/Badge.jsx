import React from 'react';

export const Badge = ({ children, variant = 'info', className = '' }) => {
  const variants = {
    info: 'bg-status-info-bg text-status-info border-status-info',
    success: 'bg-status-success-bg text-status-success border-status-success',
    warning: 'bg-status-warning-bg text-status-warning border-status-warning',
    danger: 'bg-red-50 text-status-danger border-status-danger',
    default: 'bg-app-bg text-text-secondary border-border-main'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
