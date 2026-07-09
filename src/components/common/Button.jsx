import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold uppercase tracking-widest transition-all rounded-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-accent text-white hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20',
    secondary: 'bg-surface-hover text-text-primary hover:bg-surface-hover border border-border-main',
    outline: 'border-2 border-accent text-accent hover:bg-accent hover:text-white',
    danger: 'bg-status-danger text-white hover:bg-red-600',
    ghost: 'bg-transparent text-text-secondary hover:bg-surface-hover shadow-none'
  };

  const sizes = {
    sm: 'px-4 py-2 text-[10px]',
    md: 'px-6 py-3 text-xs',
    lg: 'px-8 py-4 text-sm'
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};
