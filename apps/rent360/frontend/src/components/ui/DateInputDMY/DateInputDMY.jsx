import React, { useState, useEffect, useRef } from 'react';
import { FiCalendar } from 'react-icons/fi';
import './DateInputDMY.scss';

/**
 * Format YYYY-MM-DD to DD/MM/YYYY
 */
export const toDMY = (iso) => {
  if (!iso) return '';
  const dateOnly = String(iso).split('T')[0];
  const parts = dateOnly.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return iso;
};

/**
 * Convert DD/MM/YYYY or DD-MM-YYYY to YYYY-MM-DD
 */
export const toISO = (dmy) => {
  if (!dmy) return '';
  const clean = String(dmy).replace(/-/g, '/').trim();
  const parts = clean.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    if (d && m && y && y.length === 4) {
      const dNum = parseInt(d, 10);
      const mNum = parseInt(m, 10);
      const yNum = parseInt(y, 10);
      if (dNum >= 1 && dNum <= 31 && mNum >= 1 && mNum <= 12 && yNum >= 1900) {
        return `${yNum}-${String(mNum).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
      }
    }
  }
  return '';
};

/**
 * Reusable DD/MM/YYYY Date Picker Input
 * Displays dates strictly in DD/MM/YYYY format while storing and emitting ISO YYYY-MM-DD
 */
export const DateInputDMY = ({
  value,
  onChange,
  disabled = false,
  placeholder = 'DD/MM/YYYY',
  className = '',
  min,
  max,
  id,
  name
}) => {
  const hiddenDateRef = useRef(null);
  const [textVal, setTextVal] = useState(toDMY(value));

  // Sync internal text state with external prop changes
  useEffect(() => {
    setTextVal(toDMY(value));
  }, [value]);

  const handleTextChange = (e) => {
    const input = e.target.value;
    setTextVal(input);
    const iso = toISO(input);
    if (iso && !isNaN(Date.parse(iso))) {
      onChange(iso);
    }
  };

  const handleBlur = () => {
    const iso = toISO(textVal);
    if (!iso || isNaN(Date.parse(iso))) {
      // Revert back to the valid value from prop
      setTextVal(toDMY(value));
    } else {
      setTextVal(toDMY(iso));
    }
  };

  const handlePickerChange = (e) => {
    const iso = e.target.value;
    if (iso) {
      onChange(iso);
      setTextVal(toDMY(iso));
    }
  };

  const handleOpenPicker = () => {
    if (disabled) return;
    try {
      hiddenDateRef.current?.showPicker();
    } catch {
      hiddenDateRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    // Alt + Down or F4 opens picker
    if ((e.altKey && e.key === 'ArrowDown') || e.key === 'F4') {
      e.preventDefault();
      handleOpenPicker();
    }
  };

  return (
    <div className={`dmy-input-wrapper ${disabled ? 'is-disabled' : ''} ${className}`.trim()}>
      <input
        type="text"
        id={id}
        name={name}
        className="dmy-text-field"
        value={textVal}
        onChange={handleTextChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={10}
        disabled={disabled}
      />
      <button
        type="button"
        className="calendar-icon-btn"
        onClick={handleOpenPicker}
        disabled={disabled}
        tabIndex={-1}
        title="Open calendar (Alt+Down)"
      >
        <FiCalendar />
      </button>
      <input
        type="date"
        ref={hiddenDateRef}
        value={value || ''}
        min={min}
        max={max}
        onChange={handlePickerChange}
        className="hidden-native-date-input"
        tabIndex={-1}
        disabled={disabled}
      />
    </div>
  );
};

export default DateInputDMY;
