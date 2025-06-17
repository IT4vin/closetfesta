import React, { useState, useCallback, useEffect } from 'react';
import { Input } from './input';
import { Label } from './label';
import { cn } from '@/lib/utils';
import { 
  applyCPFMask, 
  applyCNPJMask, 
  applyCEPMask, 
  applyPhoneMask,
  sanitizeString,
  sanitizeMoneyValue,
  formatMoney
} from '@/utils/validation/sanitizers';

interface BaseValidatedInputProps {
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  onValueChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

interface ValidatedInputProps extends BaseValidatedInputProps {
  type?: 'text' | 'email' | 'password';
  value: string;
  maxLength?: number;
  sanitize?: boolean;
}

interface MaskedInputProps extends BaseValidatedInputProps {
  type: 'cpf' | 'cnpj' | 'cep' | 'phone';
  value: string;
}

interface MoneyInputProps {
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  value: number;
  onValueChange?: (value: number) => void;
  showCurrency?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
}

// ========================================
// INPUT BÁSICO COM VALIDAÇÃO
// ========================================

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  error,
  required,
  className,
  disabled,
  placeholder,
  value,
  type = 'text',
  maxLength,
  sanitize = true,
  onValueChange,
  onBlur,
  onFocus
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    if (sanitize && type === 'text') {
      newValue = sanitizeString(newValue);
    }
    
    if (maxLength && newValue.length > maxLength) {
      newValue = newValue.substring(0, maxLength);
    }
    
    onValueChange?.(newValue);
  }, [sanitize, type, maxLength, onValueChange]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className={cn(
          "text-sm font-medium",
          error ? "text-red-600" : "text-gray-700",
          required && "after:content-['*'] after:text-red-500 after:ml-1"
        )}>
          {label}
        </Label>
      )}
      
      <div className="relative">
        <Input
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            "transition-all duration-200",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            isFocused && !error && "border-blue-500 ring-2 ring-blue-500/20",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${label}-error` : undefined}
        />
        
        {maxLength && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
            {value.length}/{maxLength}
          </div>
        )}
      </div>
      
      {error && (
        <p id={`${label}-error`} className="text-sm text-red-600 flex items-center gap-1">
          <span className="text-red-500">⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
};

// ========================================
// INPUT COM MÁSCARA
// ========================================

export const MaskedInput: React.FC<MaskedInputProps> = ({
  label,
  error,
  required,
  className,
  disabled,
  placeholder,
  value,
  type,
  onValueChange,
  onBlur,
  onFocus
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);

  // Aplicar máscara baseada no tipo
  const applyMask = useCallback((inputValue: string) => {
    switch (type) {
      case 'cpf':
        return applyCPFMask(inputValue);
      case 'cnpj':
        return applyCNPJMask(inputValue);
      case 'cep':
        return applyCEPMask(inputValue);
      case 'phone':
        return applyPhoneMask(inputValue);
      default:
        return inputValue;
    }
  }, [type]);

  // Atualizar display value quando value prop muda
  useEffect(() => {
    setDisplayValue(applyMask(value));
  }, [value, applyMask]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const maskedValue = applyMask(inputValue);
    
    setDisplayValue(maskedValue);
    
    // Retornar valor limpo (sem máscara) para o parent
    const cleanValue = inputValue.replace(/[^\d]/g, '');
    onValueChange?.(cleanValue);
  }, [applyMask, onValueChange]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    
    switch (type) {
      case 'cpf': return '000.000.000-00';
      case 'cnpj': return '00.000.000/0000-00';
      case 'cep': return '00000-000';
      case 'phone': return '(00) 00000-0000';
      default: return '';
    }
  };

  const getMaxLength = () => {
    switch (type) {
      case 'cpf': return 14;
      case 'cnpj': return 18;
      case 'cep': return 9;
      case 'phone': return 15;
      default: return undefined;
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className={cn(
          "text-sm font-medium",
          error ? "text-red-600" : "text-gray-700",
          required && "after:content-['*'] after:text-red-500 after:ml-1"
        )}>
          {label}
        </Label>
      )}
      
      <Input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={getPlaceholder()}
        maxLength={getMaxLength()}
        className={cn(
          "transition-all duration-200 font-mono",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500",
          isFocused && !error && "border-blue-500 ring-2 ring-blue-500/20",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${label}-error` : undefined}
      />
      
      {error && (
        <p id={`${label}-error`} className="text-sm text-red-600 flex items-center gap-1">
          <span className="text-red-500">⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
};

// ========================================
// INPUT MONETÁRIO
// ========================================

export const MoneyInput: React.FC<MoneyInputProps> = ({
  label,
  error,
  required,
  className,
  disabled,
  placeholder = "0,00",
  value,
  showCurrency = true,
  onValueChange,
  onBlur,
  onFocus
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState('');

  // Formatar valor para exibição
  useEffect(() => {
    if (isFocused) {
      // Durante edição, mostrar apenas números
      setDisplayValue(value.toFixed(2).replace('.', ','));
    } else {
      // Fora de foco, mostrar formatado
      if (showCurrency) {
        setDisplayValue(formatMoney(value).replace('R$', '').trim());
      } else {
        setDisplayValue(value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
      }
    }
  }, [value, isFocused, showCurrency]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = sanitizeMoneyValue(inputValue);
    
    onValueChange?.(numericValue);
  }, [onValueChange]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setDisplayValue(value.toFixed(2).replace('.', ','));
    onFocus?.();
  }, [value, onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className={cn(
          "text-sm font-medium",
          error ? "text-red-600" : "text-gray-700",
          required && "after:content-['*'] after:text-red-500 after:ml-1"
        )}>
          {label}
        </Label>
      )}
      
      <div className="relative">
        {showCurrency && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
            R$
          </div>
        )}
        
        <Input
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "transition-all duration-200 text-right font-mono",
            showCurrency && "pl-10",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            isFocused && !error && "border-blue-500 ring-2 ring-blue-500/20",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${label}-error` : undefined}
        />
      </div>
      
      {error && (
        <p id={`${label}-error`} className="text-sm text-red-600 flex items-center gap-1">
          <span className="text-red-500">⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
};

// ========================================
// INPUT DE PORCENTAGEM
// ========================================

interface PercentageInputProps {
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  value: number;
  onValueChange?: (value: number) => void;
  max?: number;
  onBlur?: () => void;
  onFocus?: () => void;
}

export const PercentageInput: React.FC<PercentageInputProps> = ({
  label,
  error,
  required,
  className,
  disabled,
  placeholder = "0",
  value,
  max = 100,
  onValueChange,
  onBlur,
  onFocus
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/[^\d.]/g, '');
    const numericValue = parseFloat(inputValue) || 0;
    const clampedValue = Math.min(max, Math.max(0, numericValue));
    
    onValueChange?.(clampedValue);
  }, [max, onValueChange]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className={cn(
          "text-sm font-medium",
          error ? "text-red-600" : "text-gray-700",
          required && "after:content-['*'] after:text-red-500 after:ml-1"
        )}>
          {label}
        </Label>
      )}
      
      <div className="relative">
        <Input
          type="text"
          value={value.toString()}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "transition-all duration-200 text-right font-mono pr-8",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            isFocused && !error && "border-blue-500 ring-2 ring-blue-500/20",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${label}-error` : undefined}
        />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
          %
        </div>
      </div>
      
      {error && (
        <p id={`${label}-error`} className="text-sm text-red-600 flex items-center gap-1">
          <span className="text-red-500">⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
}; 