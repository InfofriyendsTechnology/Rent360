import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  FiCalendar, FiChevronLeft, FiChevronRight, 
  FiX 
} from 'react-icons/fi';
import './DatePicker.scss';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * Format Date object to YYYY-MM-DD string
 */
const formatDateToISO = (date) => {
  if (!date || isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Format YYYY-MM-DD string to Human Readable "DD MMM YYYY"
 */
const formatHumanDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[d.getMonth()].slice(0, 3);
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

export const DatePicker = ({
  value,
  onChange,
  placeholder = 'Select date...',
  name,
  disabled = false,
  required = false,
  minDate,
  maxDate,
  className = '',
  style = {},
  isClearable = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  // Position state for portal
  const [popoverPos, setPopoverPos] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    openUpwards: false
  });

  // Parse initial selected date
  const selectedDate = useMemo(() => {
    if (!value) return null;
    const parts = String(value).split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }, [value]);

  // Current view month & year (for calendar paging)
  const [viewDate, setViewDate] = useState(() => {
    return selectedDate ? new Date(selectedDate) : new Date();
  });

  // Sync view when opened or when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setViewDate(new Date(selectedDate));
    }
  }, [value]);

  // Calculate and update popover fixed position
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const popoverHeight = 330;
    const popoverWidth = 290;

    const openUpwards = spaceBelow < popoverHeight && spaceAbove > spaceBelow;

    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - 10) {
      left = Math.max(10, window.innerWidth - popoverWidth - 10);
    }

    setPopoverPos({
      top: rect.bottom + 5,
      bottom: window.innerHeight - rect.top + 5,
      left,
      openUpwards
    });
  }, []);

  // Sync position on open, scroll, or resize
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    const handleClickOutside = (e) => {
      if (
        (triggerRef.current && triggerRef.current.contains(e.target)) ||
        (popoverRef.current && popoverRef.current.contains(e.target))
      ) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, updatePosition]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const handleYearChange = (e) => {
    const newYear = Number(e.target.value);
    setViewDate(new Date(newYear, viewMonth, 1));
  };

  const handleMonthChange = (e) => {
    const newMonth = Number(e.target.value);
    setViewDate(new Date(viewYear, newMonth, 1));
  };

  // Generate Month Days Grid (42 cells: 6 rows x 7 days)
  const calendarDays = useMemo(() => {
    const days = [];
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    // Previous month trailing days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth - 1, daysInPrevMonth - i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(viewYear, viewMonth, i);
      days.push({ date: d, isCurrentMonth: true });
    }

    // Next month leading days
    const totalSlots = days.length > 35 ? 42 : 35;
    const remaining = totalSlots - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(viewYear, viewMonth + 1, i);
      days.push({ date: d, isCurrentMonth: false });
    }

    return days;
  }, [viewYear, viewMonth]);

  // Today checking
  const today = useMemo(() => new Date(), []);
  const isToday = (d) => {
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (d) => {
    if (!selectedDate) return false;
    return (
      d.getDate() === selectedDate.getDate() &&
      d.getMonth() === selectedDate.getMonth() &&
      d.getFullYear() === selectedDate.getFullYear()
    );
  };

  // Check min / max bounds
  const isDisabledDate = (d) => {
    if (minDate) {
      const min = new Date(minDate);
      min.setHours(0, 0, 0, 0);
      if (d < min) return true;
    }
    if (maxDate) {
      const max = new Date(maxDate);
      max.setHours(23, 59, 59, 999);
      if (d > max) return true;
    }
    return false;
  };

  const emitChange = (dateVal) => {
    if (onChange) {
      const syntheticEvent = {
        target: { name, value: dateVal },
        currentTarget: { name, value: dateVal },
        preventDefault: () => {},
        stopPropagation: () => {}
      };
      onChange(syntheticEvent, dateVal);
    }
  };

  const handleSelectDay = (d, e) => {
    e.stopPropagation();
    if (isDisabledDate(d)) return;
    const isoString = formatDateToISO(d);
    emitChange(isoString);
    setIsOpen(false);
  };

  const handleSelectToday = (e) => {
    e.stopPropagation();
    const t = new Date();
    if (isDisabledDate(t)) return;
    setViewDate(new Date(t));
    emitChange(formatDateToISO(t));
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (disabled) return;
    emitChange('');
    setIsOpen(false);
  };

  // Generate Year Options (-15 to +15 years)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear - 15; y <= currentYear + 15; y++) {
      years.push(y);
    }
    return years;
  }, []);

  return (
    <div
      className={`bond-datepicker-container ${isOpen ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
      style={style}
    >
      {/* Trigger Box */}
      <button
        ref={triggerRef}
        type="button"
        className="bond-datepicker-trigger"
        onClick={() => {
          if (!disabled) {
            if (!isOpen) updatePosition();
            setIsOpen(!isOpen);
          }
        }}
        disabled={disabled}
      >
        <div className="trigger-left">
          <FiCalendar className="calendar-icon" />
          <span className={`trigger-label ${!value ? 'is-placeholder' : ''}`}>
            {value ? formatHumanDate(value) : placeholder}
          </span>
        </div>

        <div className="trigger-actions">
          {isClearable && value && !disabled && (
            <span className="clear-icon" onClick={handleClear} title="Clear date">
              <FiX />
            </span>
          )}
        </div>
      </button>

      {/* Floating Calendar Popover via Portal to document.body */}
      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            className={`bond-calendar-popover ${popoverPos.openUpwards ? 'is-upwards' : ''}`}
            style={{
              position: 'fixed',
              top: popoverPos.openUpwards ? 'auto' : `${popoverPos.top}px`,
              bottom: popoverPos.openUpwards ? `${popoverPos.bottom}px` : 'auto',
              left: `${popoverPos.left}px`,
              zIndex: 999999
            }}
          >
            {/* Calendar Header */}
            <div className="calendar-header">
              <button
                type="button"
                className="nav-btn prev-btn"
                onClick={handlePrevMonth}
                title="Previous Month"
              >
                <FiChevronLeft />
              </button>

              <div className="month-year-pickers">
                <select
                  value={viewMonth}
                  onChange={handleMonthChange}
                  className="picker-select month-select"
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={m} value={idx}>{m}</option>
                  ))}
                </select>

                <select
                  value={viewYear}
                  onChange={handleYearChange}
                  className="picker-select year-select"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="nav-btn next-btn"
                onClick={handleNextMonth}
                title="Next Month"
              >
                <FiChevronRight />
              </button>
            </div>

            {/* Days of Week Row */}
            <div className="calendar-weekdays">
              {DAYS_SHORT.map((day) => (
                <span key={day} className="weekday-col">{day}</span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="calendar-days-grid">
              {calendarDays.map((item, idx) => {
                const d = item.date;
                const disabledDay = isDisabledDate(d);
                const selected = isSelected(d);
                const todayDay = isToday(d);

                return (
                  <button
                    type="button"
                    key={idx}
                    disabled={disabledDay}
                    className={`day-cell ${!item.isCurrentMonth ? 'outside-month' : ''} ${selected ? 'is-selected' : ''} ${todayDay ? 'is-today' : ''} ${disabledDay ? 'is-disabled' : ''}`}
                    onClick={(e) => handleSelectDay(d, e)}
                  >
                    <span className="day-number">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>

            {/* Calendar Footer Actions */}
            <div className="calendar-footer">
              <button
                type="button"
                className="footer-btn today-btn"
                onClick={handleSelectToday}
              >
                Today
              </button>
              {value && isClearable && (
                <button
                  type="button"
                  className="footer-btn clear-btn"
                  onClick={handleClear}
                >
                  Clear
                </button>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Hidden input for HTML validation if required */}
      {required && (
        <input
          tabIndex={-1}
          autoComplete="off"
          style={{ opacity: 0, width: 0, height: 0, position: 'absolute', pointerEvents: 'none' }}
          value={value || ''}
          onChange={() => {}}
          required={required}
        />
      )}
    </div>
  );
};

export default DatePicker;
