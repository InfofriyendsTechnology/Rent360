import React from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

// Reusable standard button (Primary/Secondary)
export const Button = ({ variant = 'primary', className = '', children, ...props }) => {
  return (
    <button className={`pill-btn-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
};

// Reusable Action Icon Button (for Tables/Lists)
export const IconButton = ({ variant = 'default', icon: Icon, title, onClick, className = '', ...props }) => {
  // variant can be 'edit', 'delete', 'login', 'default'
  return (
    <button 
      className={`icon-action-btn ${variant} ${className}`} 
      title={title} 
      onClick={onClick}
      {...props}
    >
      {Icon && <Icon />}
    </button>
  );
};

// Standard Row Actions block (Supports both actions array and direct onEdit / onDelete props)
export const RowActions = ({ actions, onEdit, onDelete, editTitle = "Edit", deleteTitle = "Delete" }) => {
  const finalActions = Array.isArray(actions) ? actions : [
    ...(onEdit ? [{ icon: FiEdit2, variant: 'edit', title: editTitle, onClick: onEdit }] : []),
    ...(onDelete ? [{ icon: FiTrash2, variant: 'delete', title: deleteTitle, onClick: onDelete }] : [])
  ];

  return (
    <div className="row-action-btns">
      {finalActions.map((act, index) => (
        <IconButton 
          key={index}
          variant={act.variant}
          title={act.title}
          icon={act.icon}
          onClick={act.onClick}
          disabled={act.disabled}
        />
      ))}
    </div>
  );
};
