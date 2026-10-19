import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FiChevronDown, FiCheck, FiSearch, FiX } from 'react-icons/fi';
import './Select.scss';

/**
 * Custom Bond CRM Theme Select Dropdown
 * Drop-in replacement for native <select>
 * Supports both `options={[...]}` prop and `<option>` children
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
  isClearable = false,
  align = 'left' // 'left', 'right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

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

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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
        stopPropagation: () => {}
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
        stopPropagation: () => {}
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
      ref={containerRef}
      className={`bond-select-container ${size} ${isOpen ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
      style={style}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Box */}
      <button
        type="button"
        className="bond-select-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
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

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div className={`bond-select-menu align-${align}`}>
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
        </div>
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
