import React from 'react';

export const Section = ({ title, subtitle, children, className = '', headerAction }) => {
  return (
    <section className={`mb-16 ${className}`}>
      {(title || subtitle || headerAction) && (
        <div className="flex justify-between items-end mb-8">
          <div>
            {title && <h2 className="text-3xl font-black text-text-primary tracking-tight">{title}</h2>}
            {subtitle && <p className="text-text-secondary mt-2">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      {children}
    </section>
  );
};
