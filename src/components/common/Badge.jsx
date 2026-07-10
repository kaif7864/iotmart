import React from 'react';

export const Badge = ({ children, variant = 'info', className = '' }) => {
  const variants = {
    info:    'bg-status-info-bg text-status-info border-status-info',
    success: 'bg-status-success-bg text-status-success border-status-success',
    warning: 'bg-status-warning-bg text-status-warning border-status-warning',
    danger:  'bg-status-danger-bg text-status-danger border-status-danger',
    default: 'bg-surface text-text-secondary border-border-main',
    accent:  'bg-accent-light text-accent border-accent/20',
    dark:    'bg-surface-dark text-text-on-dark border-transparent',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${variants[variant] ?? variants.default} ${className}`}
    >
      {children}
    </span>
  );
};
