import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronDown, FiCheck, FiSearch, FiX } from 'react-icons/fi';
import './Select.scss';

/**
 * Custom Bond CRM Theme Select Dropdown
 * Drop-in replacement for native <select>
 * Uses React Portal and auto-flipping upwards/downwards so it never gets clipped by modals or containers with overflow: hidden
 */
export const Select = ({
  options = [],
  children,
  value,
  onChange,
  placeholder = 'Select an option...',
  name,
  disabled = false,
  required = false,
  className = '',
  style = {},
  searchable,
  size = 'md', // 'sm', 'md', 'lg'
  isClearable = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);

  // Position state for portal
  const [menuPos, setMenuPos] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    width: 0,
    maxHeight: 280,
    openUpwards: false
  });

  // Normalize options from either options prop or children
  const parsedOptions = useMemo(() => {
    if (options && options.length > 0) {
      return options.map((opt) => {
        if (typeof opt === 'string' || typeof opt === 'number') {
          return { value: String(opt), label: String(opt) };
        }
        return opt;
      });
    }

    if (children) {
      const list = [];
      React.Children.forEach(children, (child) => {
        if (!child) return;
        if (child.type === 'option') {
          list.push({
            value: child.props.value !== undefined ? child.props.value : child.props.children,
            label: child.props.children,
            disabled: child.props.disabled,
            style: child.props.style,
            className: child.props.className
          });
        }
      });
      return list;
    }

    return [];
  }, [options, children]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    return parsedOptions.find((opt) => String(opt.value) === String(value));
  }, [parsedOptions, value]);

  // Automatically enable search if more than 7 options
  const isSearchable = searchable !== undefined ? searchable : parsedOptions.length > 7;

  // Filtered options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return parsedOptions;
    const term = searchTerm.toLowerCase();
    return parsedOptions.filter((opt) => {
      const labelStr = typeof opt.label === 'string' ? opt.label : String(opt.value);
      return labelStr.toLowerCase().includes(term);
    });
  }, [parsedOptions, searchTerm]);

  // Calculate and update menu fixed position
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Flip upwards if space below is less than 240px and space above is larger
    const openUpwards = spaceBelow < 240 && spaceAbove > spaceBelow;
    const maxHeight = openUpwards
      ? Math.max(120, Math.min(280, spaceAbove - 20))
      : Math.max(120, Math.min(280, spaceBelow - 20));

    let left = rect.left;
    let width = rect.width;
    if (left + width > window.innerWidth - 10) {
      left = Math.max(10, window.innerWidth - width - 10);
    }

    setMenuPos({
      top: rect.bottom + 5,
      bottom: window.innerHeight - rect.top + 5,
      left,
      width,
      maxHeight,
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
        (menuRef.current && menuRef.current.contains(e.target))
      ) {
        return;
      }
      setIsOpen(false);
      setSearchTerm('');
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, updatePosition]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && isSearchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, isSearchable]);

  const handleSelect = (opt, e) => {
    e?.stopPropagation();
    if (opt.disabled) return;

    if (onChange) {
      const syntheticEvent = {
        target: { name, value: opt.value },
        currentTarget: { name, value: opt.value },
        preventDefault: () => {},
        stopPropagation: () => {},
        valueOf: () => opt.value,
        toString: () => String(opt.value)
      };
      onChange(syntheticEvent, opt.value);
    }

    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (disabled) return;
    if (onChange) {
      const syntheticEvent = {
        target: { name, value: '' },
        currentTarget: { name, value: '' },
        preventDefault: () => {},
        stopPropagation: () => {},
        valueOf: () => '',
        toString: () => ''
      };
      onChange(syntheticEvent, '');
    }
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      if (!isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div
      className={`bond-select-container ${size} ${isOpen ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
      style={style}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Box */}
      <button
        ref={triggerRef}
        type="button"
        className="bond-select-trigger"
        onClick={() => {
          if (!disabled) {
            if (!isOpen) updatePosition();
            setIsOpen(!isOpen);
          }
        }}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`trigger-label ${!selectedOption ? 'is-placeholder' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <div className="trigger-actions">
          {isClearable && selectedOption && !disabled && (
            <span className="clear-icon" onClick={handleClear} title="Clear">
              <FiX />
            </span>
          )}
          <FiChevronDown className={`chevron-icon ${isOpen ? 'rotated' : ''}`} />
        </div>
      </button>

      {/* Floating Menu via Portal to document.body */}
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className={`bond-select-menu ${menuPos.openUpwards ? 'is-upwards' : ''} ${size === 'sm' ? 'sm-menu' : ''}`}
            style={{
              position: 'fixed',
              top: menuPos.openUpwards ? 'auto' : `${menuPos.top}px`,
              bottom: menuPos.openUpwards ? `${menuPos.bottom}px` : 'auto',
              left: `${menuPos.left}px`,
              width: `${menuPos.width}px`,
              maxHeight: `${menuPos.maxHeight}px`,
              zIndex: 999999
            }}
          >
            {isSearchable && (
              <div className="select-search-box">
                <FiSearch className="search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="search-clear"
                    onClick={() => setSearchTerm('')}
                  >
                    <FiX />
                  </button>
                )}
              </div>
            )}

            <div className="select-options-list" role="listbox">
              {filteredOptions.length === 0 ? (
                <div className="no-options">No options found</div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = selectedOption && String(selectedOption.value) === String(opt.value);
                  const isAction = opt.value === '__create_new__' || opt.isAction;

                  return (
                    <div
                      key={String(opt.value)}
                      role="option"
                      aria-selected={isSelected}
                      className={`select-option-item ${isSelected ? 'is-selected' : ''} ${opt.disabled ? 'is-disabled' : ''} ${isAction ? 'is-action' : ''} ${opt.className || ''}`}
                      style={opt.style || {}}
                      onClick={(e) => handleSelect(opt, e)}
                    >
                      <span className="option-label">{opt.label}</span>
                      {isSelected && !isAction && <FiCheck className="option-check-icon" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Hidden input for HTML form validation if required */}
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

export default Select;
