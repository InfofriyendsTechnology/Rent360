import React from 'react';

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

// Standard Row Actions block (Ensures 3-icon theme consistency everywhere)
export const RowActions = ({ actions }) => {
  return (
    <div className="row-action-btns">
      {actions.map((act, index) => (
        <IconButton 
          key={index}
          variant={act.variant}
          title={act.title}
          icon={act.icon}
          onClick={act.onClick}
        />
      ))}
    </div>
  );
};
