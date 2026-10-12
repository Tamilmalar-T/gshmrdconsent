import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';
import { formatDateToDDMMYYYY, parseDateToISO } from '../../utils/dateUtils';

/**
 * Standardized Date Input component that always displays dates in DD/MM/YYYY numeric format.
 * Includes a native calendar picker button on the right.
 */
export default function DateInput({
  name,
  value = '',
  onChange,
  className = 'info-input-plain',
  style = {},
  placeholder = 'DD/MM/YYYY',
  disabled = false,
  readOnly = false,
  min,
  max,
  required = false,
  id,
}) {
  const hiddenDateRef = useRef(null);

  // Normalize displayed value to DD/MM/YYYY
  const displayValue = formatDateToDDMMYYYY(value) || value;
  const isoValue = parseDateToISO(value);

  const handleTextChange = (e) => {
    let inputVal = e.target.value;
    
    // Auto-masking for digits if user types without slashes
    const digitsOnly = inputVal.replace(/[^\d]/g, '');
    if (inputVal.length <= 10 && digitsOnly.length > 0 && !inputVal.includes('/')) {
      if (digitsOnly.length <= 2) {
        inputVal = digitsOnly;
      } else if (digitsOnly.length <= 4) {
        inputVal = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
      } else {
        inputVal = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4, 8)}`;
      }
    }

    if (onChange) {
      onChange({
        target: {
          name,
          value: inputVal,
          id: id || name,
        },
      });
    }
  };

  const handleDatePickerChange = (e) => {
    const selectedIso = e.target.value; // YYYY-MM-DD
    if (!selectedIso) return;
    const formatted = formatDateToDDMMYYYY(selectedIso);
    if (onChange) {
      onChange({
        target: {
          name,
          value: formatted,
          id: id || name,
        },
      });
    }
  };

  const openPicker = () => {
    if (disabled || readOnly) return;
    if (hiddenDateRef.current) {
      if (typeof hiddenDateRef.current.showPicker === 'function') {
        try {
          hiddenDateRef.current.showPicker();
        } catch {
          hiddenDateRef.current.focus();
        }
      } else {
        hiddenDateRef.current.focus();
      }
    }
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        position: 'relative',
        width: style.width || 'auto',
        ...style,
      }}
      className="custom-date-input-container"
    >
      <input
        type="text"
        id={id || name}
        name={name}
        value={displayValue}
        onChange={handleTextChange}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        maxLength={10}
        className={className}
        style={{
          paddingRight: '24px',
          width: '100%',
          textAlign: style.textAlign || 'left',
          ...style,
        }}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={openPicker}
        disabled={disabled || readOnly}
        style={{
          position: 'absolute',
          right: '4px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          padding: '2px',
          cursor: disabled || readOnly ? 'default' : 'pointer',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Choose date"
      >
        <Calendar size={14} />
      </button>
      <input
        type="date"
        ref={hiddenDateRef}
        value={isoValue}
        onChange={handleDatePickerChange}
        min={min ? parseDateToISO(min) : undefined}
        max={max ? parseDateToISO(max) : undefined}
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          width: 0,
          height: 0,
          bottom: 0,
          right: 0,
        }}
        tabIndex={-1}
      />
    </div>
  );
}
