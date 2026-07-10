import React from 'react';

/**
 * SectionCard - A styled content card used throughout the app.
 * Replaces direct usage of `bg-card-bg rounded-[32px] p-10 border border-border-main shadow-sm`
 */
export const SectionCard = ({ children, className = '', ...props }) => (
  <div
    className={`bg-card-bg rounded-[32px] p-8 lg:p-10 border border-border-main shadow-sm ${className}`}
    {...props}
  >
    {children}
  </div>
);

/**
 * SectionHeader - A section heading with optional action element.
 */
export const SectionHeader = ({ icon: Icon, title, action, className = '' }) => (
  <div className={`flex items-center justify-between mb-8 ${className}`}>
    <h3 className="heading-section flex items-center gap-3">
      {Icon && <Icon className="h-5 w-5 text-accent" />}
      {title}
    </h3>
    {action && <div>{action}</div>}
  </div>
);

/**
 * PageHeader - Top-level page title with optional subtitle and action.
 */
export const PageHeader = ({ title, subtitle, action, className = '' }) => (
  <div className={`flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12 pb-8 border-b border-border-main ${className}`}>
    <div>
      <h1 className="heading-page">{title}</h1>
      {subtitle && <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mt-2">{subtitle}</p>}
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);

/**
 * FormField - A label + input wrapper.
 */
export const FormField = ({ label, children, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {label && <label className="label-caps block">{label}</label>}
    {children}
  </div>
);

/**
 * StatCard - A KPI/stat display card.
 */
export const StatCard = ({ icon: Icon, label, value, trend, colorClass = 'text-accent', className = '' }) => (
  <div className={`card p-6 flex items-center gap-4 ${className}`}>
    {Icon && (
      <div className={`w-12 h-12 rounded-sm bg-accent-light flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon className="h-6 w-6" />
      </div>
    )}
    <div>
      <p className="label-caps mb-1">{label}</p>
      <p className="text-2xl font-black text-text-primary tracking-tight">{value}</p>
      {trend && <p className="text-[10px] font-bold text-status-success mt-1">{trend}</p>}
    </div>
  </div>
);

/**
 * InfoRow - A labeled key-value row, used in settings, detail panels etc.
 */
export const InfoRow = ({ label, value, className = '' }) => (
  <div className={`flex justify-between items-center py-3 border-b border-border-subtle last:border-0 ${className}`}>
    <span className="label-caps">{label}</span>
    <span className="text-sm font-bold text-text-primary">{value}</span>
  </div>
);

/**
 * TabNav - A tab navigation bar.
 * tabs: [{ id, label, icon? }]
 */
export const TabNav = ({ tabs, activeTab, onTabChange, className = '' }) => (
  <nav className={`flex flex-col gap-1 ${className}`}>
    {tabs.map(tab => (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all text-left ${
          activeTab === tab.id
            ? 'bg-accent text-text-inverse shadow-md shadow-accent/20'
            : 'text-text-secondary hover:bg-surface hover:text-accent'
        }`}
      >
        {tab.icon && <tab.icon className="h-4 w-4 flex-shrink-0" />}
        {tab.label}
      </button>
    ))}
  </nav>
);

/**
 * DividerLine - A horizontal section divider.
 */
export const DividerLine = ({ className = '' }) => (
  <hr className={`border-border-subtle ${className}`} />
);

/**
 * ChipTag - A small chip/tag badge.
 */
export const ChipTag = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-surface text-text-muted border-border-main',
    accent:  'bg-accent-light text-accent border-accent/20',
    success: 'bg-status-success-bg text-status-success border-status-success',
    warning: 'bg-status-warning-bg text-status-warning border-status-warning',
    danger:  'bg-status-danger-bg text-status-danger border-status-danger',
    dark:    'bg-surface-dark text-text-on-dark border-transparent',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

/**
 * IconButton - A square/circle icon-only button.
 */
export const IconButton = ({ icon: Icon, onClick, variant = 'default', title, size = 'md', className = '', ...props }) => {
  const variants = {
    default: 'text-text-muted hover:text-text-primary hover:bg-surface',
    accent:  'text-text-muted hover:text-accent hover:bg-accent-light hover:border-accent/20',
    danger:  'text-text-muted hover:text-status-danger hover:bg-status-danger-bg hover:border-status-danger/20',
  };
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };
  return (
    <button
      onClick={onClick}
      title={title}
      className={`${sizes[size]} flex items-center justify-center rounded-full border border-transparent transition-all ${variants[variant]} ${className}`}
      {...props}
    >
      <Icon className={size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'} />
    </button>
  );
};
