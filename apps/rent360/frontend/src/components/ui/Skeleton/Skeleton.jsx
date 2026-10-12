import React from 'react';
import './Skeleton.scss';

export const Skeleton = ({ width, height, borderRadius, style = {}, className = '' }) => {
  return (
    <div
      className={`skeleton-shimmer skeleton-box ${className}`}
      style={{
        width: width || '100%',
        height: height || '16px',
        borderRadius: borderRadius || '6px',
        ...style
      }}
    />
  );
};

export const FolderGridSkeleton = ({ count = 8 }) => {
  return (
    <div className="skeleton-grid-view">
      {Array.from({ length: count }).map((_, idx) => (
        <div className="skeleton-folder-item" key={idx}>
          <div className="skeleton-shimmer skeleton-icon-wrapper" />
          <div className="skeleton-shimmer skeleton-text-line" />
        </div>
      ))}
    </div>
  );
};

export const TableRowSkeleton = ({ rows = 5, columns = 5 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr className="skeleton-table-row" key={`skel-row-${rIdx}`}>
          {Array.from({ length: columns }).map((_, cIdx) => (
            <td key={`skel-col-${cIdx}`}>
              <div
                className="skeleton-shimmer skeleton-cell-line"
                style={{
                  width: cIdx === 0 ? '75%' : cIdx === columns - 1 ? '45%' : '60%',
                  margin: cIdx === columns - 1 ? '0 0 0 auto' : undefined
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

export const CardSkeleton = ({ count = 3 }) => {
  return (
    <div className="skeleton-card-grid">
      {Array.from({ length: count }).map((_, idx) => (
        <div className="skeleton-shimmer skeleton-plan-card" key={idx} />
      ))}
    </div>
  );
};

export default Skeleton;
