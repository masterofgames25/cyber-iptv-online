import React, { useState, useEffect, useRef } from 'react';
import { parseDateString, formatDateForDisplay } from '../utils/date';
import flatpickr from 'flatpickr';
import { Portuguese } from 'flatpickr/dist/l10n/pt.js';
import 'flatpickr/dist/flatpickr.min.css';
import 'flatpickr/dist/themes/dark.css';

interface CyberDateInputProps {
  value: string; // ISO format YYYY-MM-DD
  onChange: (value: string) => void;
  label: string;
  error?: string;
  className?: string;
  calendar?: boolean;
}

export const CyberDateInput: React.FC<CyberDateInputProps> = ({
  value,
  onChange,
  label,
  error,
  className = '',
  calendar = true
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fpRef = useRef<any>(null);

  useEffect(() => {
    if (calendar) return;
    if (!isEditing && value) {
      const date = parseDateString(value);
      if (date) {
        setDisplayValue(formatDateForDisplay(date));
      } else {
        setDisplayValue('');
      }
    }
  }, [value, isEditing, calendar]);

  useEffect(() => {
    if (!calendar || !inputRef.current) return;
    fpRef.current = flatpickr(inputRef.current, {
      dateFormat: 'd/m/Y',
      allowInput: false,
      locale: Portuguese,
      defaultDate: displayValue,
      onChange: (selectedDates, dateStr) => {
        const [day, month, year] = dateStr.split('/').map(Number);
        if (day && month && year) {
          const dd = String(day).padStart(2, '0');
          const mm = String(month).padStart(2, '0');
          const iso = `${year}-${mm}-${dd}`;
          onChange(iso);
        }
      },
      onValueUpdate: undefined
    });
    return () => {
      fpRef.current && fpRef.current.destroy();
      fpRef.current = null;
    };
  }, [calendar]);

  useEffect(() => {
    if (!calendar || !fpRef.current) return;
    const date = parseDateString(value);
    if (date) {
      fpRef.current.setDate(date, false);
    }
  }, [calendar, value]);

  const handleDisplayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    // Format as DD/MM/YYYY
    if (inputValue.length >= 2) {
      inputValue = inputValue.slice(0, 2) + '/' + inputValue.slice(2);
    }
    if (inputValue.length >= 5) {
      inputValue = inputValue.slice(0, 5) + '/' + inputValue.slice(5);
    }
    if (inputValue.length > 10) {
      inputValue = inputValue.slice(0, 10);
    }
    
    setDisplayValue(inputValue);
  };

  const handleDisplayBlur = () => {
    setIsEditing(false);
    
    if (displayValue) {
      // Convert DD/MM/YYYY to ISO format
      const [day, month, year] = displayValue.split('/').map(Number);
      if (day && month && year && day <= 31 && month <= 12) {
        const dd = String(day).padStart(2, '0');
        const mm = String(month).padStart(2, '0');
        const isoDate = `${year}-${mm}-${dd}`;
        onChange(isoDate);
      } else {
        // Invalid date, revert to original value
        const originalDate = parseDateString(value);
        if (originalDate) {
          setDisplayValue(formatDateForDisplay(originalDate));
        } else {
          setDisplayValue('');
        }
      }
    } else {
      onChange('');
    }
  };

  const handleDisplayFocus = () => {
    setIsEditing(true);
    // Show raw value for editing
    if (value) {
      const date = parseDateString(value);
      if (date) {
        setDisplayValue(formatDateForDisplay(date));
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <div className="relative">
        {calendar ? (
          <input
            type="text"
            ref={inputRef}
            defaultValue={displayValue}
            className={`w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all ${
              error ? 'border-red-500' : ''
            }`}
            placeholder="DD/MM/YYYY"
            maxLength={10}
            readOnly={false}
          />
        ) : (
          <input
            type="text"
            ref={inputRef}
            value={displayValue}
            onChange={handleDisplayChange}
            onBlur={handleDisplayBlur}
            onFocus={handleDisplayFocus}
            className={`w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all ${
              error ? 'border-red-500' : ''
            }`}
            placeholder="DD/MM/YYYY"
            maxLength={10}
          />
        )}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};