import React from 'react';

export const Table = ({ columns, data, keyField = 'id', onRowClick, className = '', mobileRenderer }) => {
  return (
    <div className={className}>
      {/* Desktop Table View */}
      <div className={`hidden md:block overflow-x-auto rounded-2xl border-2 border-border-main bg-card-bg shadow-sm`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-app-bg/80 border-b-2 border-border-main">
              {columns.map((col, idx) => (
                <th key={idx} className={`p-5 text-[10px] font-black uppercase tracking-widest text-text-muted ${col.align === 'right' ? 'text-right' : 'text-left'}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-12 text-center">
                  <span className="text-text-muted text-sm font-bold uppercase tracking-widest">No data available</span>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr 
                  key={row[keyField] || rowIndex} 
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`group transition-all hover:bg-app-bg/60 ${rowIndex % 2 === 0 ? 'bg-card-bg' : 'bg-app-bg/20'} ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className={`p-5 text-sm text-text-primary transition-colors ${col.align === 'right' ? 'text-right' : 'text-left'}`}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {data.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-sm font-medium border border-border-main rounded-[24px] bg-card-bg">
            No data available
          </div>
        ) : (
          data.map((row, rowIndex) => (
            mobileRenderer ? (
              <div key={row[keyField] || rowIndex}>
                {mobileRenderer(row)}
              </div>
            ) : (
              <div 
                key={row[keyField] || rowIndex} 
                onClick={() => onRowClick && onRowClick(row)}
                className={`p-5 rounded-[24px] border border-border-main bg-card-bg space-y-4 ${onRowClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}`}
              >
                {columns.map((col, colIndex) => (
                  <div key={colIndex} className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                      {col.header}
                    </span>
                    <div className="text-sm text-text-primary w-full overflow-hidden">
                      {col.render ? col.render(row) : row[col.accessor]}
                    </div>
                  </div>
                ))}
              </div>
            )
          ))
        )}
      </div>
    </div>
  );
};
