import React from 'react';
import { FiCheck } from 'react-icons/fi';
import './Checkbox.scss';

/**
 * Reusable Luxury Checkbox matching the Bond theme
 * - Crisp white border and white tick in dark mode
 * - Crisp dark border and black tick in light mode
 * - Smooth squircle border radius and pop animation
 */
export const Checkbox = ({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  id,
  name,
  className = '',
  size = 'md',
  ...rest
}) => {
  const handleChange = (e) => {
    if (disabled) return;
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <label 
      className={`bond-checkbox-wrapper bond-checkbox-${size} ${checked ? 'is-checked' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
    >
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={!!checked}
        onChange={handleChange}
        disabled={disabled}
        className="bond-checkbox-native"
        {...rest}
      />
      <span className="bond-checkbox-box">
        {checked && <FiCheck className="bond-checkbox-icon" />}
      </span>
      {(label || description) && (
        <span className="bond-checkbox-content">
          {label && <span className="bond-checkbox-label">{label}</span>}
          {description && <span className="bond-checkbox-desc">{description}</span>}
        </span>
      )}
    </label>
  );
};
