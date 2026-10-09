import React from 'react';

// Main Table Wrapper Component
export const DataTable = ({ columns, data, renderRow, keyExtractor, emptyMessage = "No data available" }) => {
  return (
    <div className="table-responsive">
      <table className="bond-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={col.align === 'right' ? 'text-right' : ''}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data && data.length > 0 ? (
            data.map((item, idx) => (
              <tr key={keyExtractor ? keyExtractor(item) : idx}>
                {renderRow(item)}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="text-center" style={{ padding: '40px 0', color: 'var(--text-muted)' }}>
                {emptyMessage}
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
      <div className="store-text">
        <span className="store-name">{title}</span>
        {subtitle && <span className="store-sub">{subtitle}</span>}
      </div>
    </div>
  );
};
