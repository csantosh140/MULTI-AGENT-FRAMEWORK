import React from 'react';

const Table = ({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'No logs available.',
  onRowClick,
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border-custom bg-card-custom theme-transition">
      <table className="w-full border-collapse text-left text-[11px]">
        <thead>
          <tr className="border-b border-border-custom text-text-muted font-normal">
            {columns.map((col, idx) => (
              <th key={col.key || idx} className={`pb-2 px-3.5 pt-2.5 font-normal ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-custom/40 text-text-custom">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, rIdx) => (
              <tr key={rIdx} className="animate-pulse">
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className="py-2.5 px-3.5">
                    <div className="h-3.5 bg-border-custom/60 rounded w-3/4"></div>
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-8 px-3.5 text-center text-text-muted">
                <div className="flex flex-col items-center justify-center space-y-1.5">
                  <span className="text-xl">🔍</span>
                  <p>{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, rIdx) => (
              <tr
                key={row.id || rIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors ${
                  onRowClick
                    ? 'cursor-pointer hover:bg-border-custom/20'
                    : 'hover:bg-border-custom/10'
                }`}
              >
                {columns.map((col, cIdx) => {
                  const val = row[col.key];
                  return (
                    <td
                      key={col.key || cIdx}
                      className={`py-2.5 px-3.5 font-normal align-middle ${col.className || ''}`}
                    >
                      {col.render ? col.render(row, val) : val}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
