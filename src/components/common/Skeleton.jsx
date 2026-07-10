import React from 'react';

export const Skeleton = ({ className = '', ...props }) => (
  <div
    className={`animate-pulse bg-surface-hover rounded-md ${className}`}
    {...props}
  />
);

export const SkeletonText = ({ lines = 1, className = '', ...props }) => (
  <div className={`space-y-3 ${className}`} {...props}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={`h-4 bg-surface-hover rounded animate-pulse ${
          i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full'
        }`}
      />
    ))}
  </div>
);

export const SkeletonProductCard = () => (
  <div className="card rounded-2xl p-4 flex flex-col h-full animate-pulse">
    <div className="w-full aspect-square bg-surface rounded-xl mb-4" />
    <div className="space-y-3 flex-grow flex flex-col">
      <div className="h-3 bg-surface-hover rounded w-1/3" />
      <div className="h-5 bg-surface-hover rounded w-full" />
      <div className="h-5 bg-surface-hover rounded w-5/6" />
      <div className="mt-auto pt-4 flex justify-between items-center">
        <div className="h-6 bg-surface-hover rounded w-1/3" />
        <div className="h-8 w-8 bg-surface-hover rounded-full" />
      </div>
    </div>
  </div>
);

export const SkeletonGrid = ({ count = 4, children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <React.Fragment key={i}>
        {children || <SkeletonProductCard />}
      </React.Fragment>
    ))}
  </div>
);

export const SkeletonTableRows = ({ rows = 6, cols = 5 }) => (
  <div className="card p-6 space-y-4">
    <Skeleton className="w-full h-12 mb-6" />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 items-center">
        {Array.from({ length: cols }).map((__, j) => (
          <Skeleton key={j} className={`h-6 ${j === 0 ? 'w-16' : j === 1 ? 'flex-grow' : 'w-20'}`} />
        ))}
      </div>
    ))}
  </div>
);
