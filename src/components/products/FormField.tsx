import React, { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'number' | 'textarea' | 'select' | 'currency' | 'masked';
  value: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onMaskedChange?: (name: string, value: string) => void;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  mask?: (value: string) => string;
  error?: string;
  help?: string;
  className?: string;
  disabled?: boolean;
  children?: ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onMaskedChange,
  required = false,
  placeholder,
  options = [],
  rows = 3,
  min,
  max,
  step,
  mask,
  error,
  help,
  className = '',
  disabled = false,
  children,
}) => {
  const handleMaskedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (mask && onMaskedChange) {
      const maskedValue = mask(e.target.value);
      onMaskedChange(name, maskedValue);
    } else {
      onChange(e);
    }
  };

  const getInputClasses = () => {
    const baseClasses = "w-full border rounded px-3 py-2 transition-colors";
    const errorClasses = error ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500";
    const disabledClasses = disabled ? "bg-gray-100 cursor-not-allowed" : "";
    
    return `${baseClasses} ${errorClasses} ${disabledClasses}`.trim();
  };

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            rows={rows}
            className={`${getInputClasses()} resize-none`}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
          />
        );

      case 'select':
        return (
          <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className={getInputClasses()}
            required={required}
            disabled={disabled}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'currency':
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              R$
            </span>
            <input
              id={name}
              name={name}
              type="number"
              value={value}
              onChange={onChange}
              className={`${getInputClasses()} pl-10`}
              placeholder={placeholder || "0,00"}
              min={min}
              max={max}
              step={step || "0.01"}
              required={required}
              disabled={disabled}
            />
          </div>
        );

      case 'masked':
        return (
          <input
            id={name}
            name={name}
            type="text"
            value={value}
            onChange={handleMaskedChange}
            className={getInputClasses()}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
          />
        );

      default:
        return (
          <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            className={getInputClasses()}
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
            required={required}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={name} className="block font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {children || renderInput()}
      
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <span>⚠️</span>
          {error}
        </p>
      )}
      
      {help && !error && (
        <p className="text-sm text-gray-500">
          {help}
        </p>
      )}
    </div>
  );
};

export default FormField; 