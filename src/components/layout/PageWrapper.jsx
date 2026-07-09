import React from 'react';

export const PageWrapper = ({ children, className = '' }) => {
  return (
    <div className={`pt-32 pb-24 min-h-screen bg-app-bg ${className}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {children}
      </div>
    </div>
  );
};
