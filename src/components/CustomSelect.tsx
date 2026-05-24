import React, { useState } from 'react';

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label || value;
  
  return (
    <div className="custom-select">
      {label && <label>{label}</label>}
      <div className="select-trigger" onClick={() => setIsOpen(!isOpen)}>
        <span className="select-value">{selectedLabel}</span>
        <span className={`select-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </div>
      {isOpen && (
        <div className="select-options">
          {options.map(option => (
            <div
              key={option.value}
              className={`select-option ${option.value === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
