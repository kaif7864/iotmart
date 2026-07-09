import React from 'react';

export const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-card-bg border border-border-main rounded-sm">
      {Icon && (
        <div className="w-20 h-20 bg-app-bg rounded-full flex items-center justify-center mb-6">
          <Icon className="w-10 h-10 text-text-muted" />
        </div>
      )}
      <h3 className="text-xl font-bold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary mb-6 max-w-sm">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
