import React from 'react';

export const Table = ({ columns, data, keyField = 'id', onRowClick, className = '' }) => {
  return (
    <div className={`overflow-x-auto rounded-sm border border-border-main bg-card-bg ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-app-bg border-b border-border-main">
            {columns.map((col, idx) => (
              <th key={idx} className="p-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-8 text-center text-text-muted text-sm font-medium">
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr 
                key={row[keyField] || rowIndex} 
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-app-bg' : ''}`}
              >
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="p-4 text-sm text-text-primary">
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
