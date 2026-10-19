import React, { useState, useMemo, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { TableRowSkeleton } from '../Skeleton/Skeleton';
import { Select } from '../Select/Select';
import './Table.scss';

// Main Table Wrapper Component with Full Pagination and Responsive Layout
export const DataTable = ({ 
  columns = [], 
  data = [], 
  renderRow, 
  keyExtractor, 
  emptyMessage,
  emptyTitle,
  emptyDescription,
  loading = false,
  pagination = true,
  initialPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100]
}) => {
  const displayEmpty = emptyTitle || emptyMessage || "No data available";
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(Number(initialPageSize) || 10);

  // Safe parsed values guaranteed to never be NaN
  const safePageSize = Number(pageSize) && Number(pageSize) > 0 ? Number(pageSize) : 10;
  const totalItems = Number(data?.length) || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const validCurrentPage = Math.max(1, Math.min(Number(currentPage) || 1, totalPages));

  // Reset to first page when data length changes (e.g., search/filter applied)
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const paginatedData = useMemo(() => {
    if (!pagination) return data;
    const start = (validCurrentPage - 1) * safePageSize;
    return data.slice(start, start + safePageSize);
  }, [data, pagination, validCurrentPage, safePageSize]);

  const startItem = totalItems === 0 ? 0 : (validCurrentPage - 1) * safePageSize + 1;
  const endItem = Math.min(validCurrentPage * safePageSize, totalItems);

  return (
    <>
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
              <TableRowSkeleton rows={3} columns={columns.length || 4} />
            ) : paginatedData && paginatedData.length > 0 ? (
              paginatedData.map((item, idx) => (
                <tr key={keyExtractor ? keyExtractor(item) : (item?.id || idx)}>
                  {typeof renderRow === 'function' ? (
                    renderRow(item)
                  ) : (
                    columns.map((col, cIdx) => (
                      <td 
                        key={cIdx} 
                        className={col.align === 'right' ? 'text-right' : (col.align === 'center' ? 'text-center' : '')}
                      >
                        {col.cell ? col.cell(item, idx) : (col.accessor ? item[col.accessor] : null)}
                      </td>
                    ))
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length || 1} className="text-center" style={{ padding: '36px 0', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{displayEmpty}</span>
                    {emptyDescription && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{emptyDescription}</span>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && !loading && (
        <div className="bond-table-footer">
          <div className="table-footer-left">
            <span className="pagination-info">
              {totalItems === 0 ? (
                'No records found'
              ) : (
                <>
                  Showing <strong>{startItem}</strong> - <strong>{endItem}</strong> of <strong>{totalItems}</strong> entries
                </>
              )}
            </span>
            <div className="rows-per-page-selector">
              <span>Show</span>
              <div className="rows-select-wrapper">
                <Select
                  value={String(safePageSize)}
                  onChange={(e, val) => {
                    const chosen = val !== undefined ? val : (e?.target?.value ?? e);
                    const parsed = Number(chosen);
                    if (!isNaN(parsed) && parsed > 0) {
                      setPageSize(parsed);
                      setCurrentPage(1);
                    }
                  }}
                  options={pageSizeOptions.map((opt) => ({
                    value: String(opt),
                    label: String(opt)
                  }))}
                  size="sm"
                  searchable={false}
                  isClearable={false}
                />
              </div>
              <span>entries</span>
            </div>
          </div>

          <div className="table-footer-right">
            {/* Prev Page < */}
            <button
              type="button"
              className="pagination-nav-btn"
              disabled={validCurrentPage <= 1 || totalItems === 0}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              title="Previous page"
            >
              <FiChevronLeft />
            </button>

            {/* Page Summary badge: Page X of Y | Total Z */}
            <div className="pagination-page-badge">
              Page <strong>{totalItems === 0 ? 0 : validCurrentPage}</strong> of <strong>{totalItems === 0 ? 0 : totalPages}</strong>
              <span className="pagination-badge-divider">|</span>
              Total <strong>{totalItems}</strong>
            </div>

            {/* Next Page > */}
            <button
              type="button"
              className="pagination-nav-btn"
              disabled={validCurrentPage >= totalPages || totalItems === 0}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              title="Next page"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      )}
    </>
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
