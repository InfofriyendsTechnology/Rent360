import React from 'react';
import { TableRowSkeleton } from '../Skeleton/Skeleton';

// Main Table Wrapper Component
export const DataTable = ({ 
  columns = [], 
  data = [], 
  renderRow, 
  keyExtractor, 
  emptyMessage,
  emptyTitle,
  emptyDescription,
  loading = false 
}) => {
  const displayEmpty = emptyTitle || emptyMessage || "No data available";

  return (
    <div className="table-responsive">
      <table className="bond-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th 
                key={idx} 
                className={col.align === 'right' ? 'text-right' : (col.align === 'center' ? 'text-center' : '')}
                style={{
                  ...(col.width ? { width: col.width } : {}),
                  ...(col.style || {})
                }}
              >
                {col.header || col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableRowSkeleton rows={5} columns={columns.length || 4} />
          ) : data && data.length > 0 ? (
            data.map((item, idx) => (
              <tr key={keyExtractor ? keyExtractor(item) : (item?.id || idx)}>
                {typeof renderRow === 'function' ? (
                  renderRow(item)
                ) : (
                  columns.map((col, cIdx) => (
                    <td 
                      key={cIdx} 
                      className={col.align === 'right' ? 'text-right' : ''}
                    >
                      {col.cell ? col.cell(item) : (col.accessor ? item[col.accessor] : null)}
                    </td>
                  ))
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length || 1} className="text-center" style={{ padding: '48px 0', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>{displayEmpty}</span>
                  {emptyDescription && (
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{emptyDescription}</span>
                  )}
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// Reusable Sub-components for common cell types
export const StatusPill = ({ status, activeValue = 'ACTIVE' }) => {
  const isUp = (status || activeValue).toUpperCase() === activeValue.toUpperCase();
  const styleClass = isUp ? 'active' : 'inactive';
  return (
    <span className={`bond-status-pill ${styleClass}`}>
      <span className="status-indicator" />
      {status || activeValue}
    </span>
  );
};

export const AvatarCell = ({ src, title, subtitle, fallbackChars }) => {
  return (
    <div className="store-identity">
      {src ? (
        <img src={src} alt="Avatar" className="avatar-image" />
      ) : (
        <div className="avatar-initials">
          {fallbackChars}
        </div>
      )}
      <div className="identity-text">
        <span className="primary-title">{title}</span>
        {subtitle && <span className="subtitle-desc">{subtitle}</span>}
      </div>
    </div>
  );
};
