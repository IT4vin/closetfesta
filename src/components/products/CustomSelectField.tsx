import React, { useState, useRef, useEffect } from 'react';

interface CustomSelectFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
  options: string[];
  onAddOption: (newOption: string) => boolean;
  onRemoveOption?: (option: string) => boolean;
  isCustomOption?: (option: string) => boolean;
  required?: boolean;
  placeholder?: string;
  error?: string;
  help?: string;
  className?: string;
  disabled?: boolean;
}

const CustomSelectField: React.FC<CustomSelectFieldProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  onAddOption,
  onRemoveOption,
  isCustomOption,
  required = false,
  placeholder = "Selecione uma opção",
  error,
  help,
  className = '',
  disabled = false,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newOptionValue, setNewOptionValue] = useState('');
  const [showCustomOptions, setShowCustomOptions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getInputClasses = () => {
    const baseClasses = "w-full border rounded px-3 py-2 transition-colors";
    const errorClasses = error ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500";
    const disabledClasses = disabled ? "bg-gray-100 cursor-not-allowed" : "";
    
    return `${baseClasses} ${errorClasses} ${disabledClasses}`.trim();
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === '_ADD_NEW_') {
      setIsAddingNew(true);
      return;
    }
    onChange(e);
  };

  const handleAddNewOption = () => {
    const trimmedValue = newOptionValue.trim();
    
    if (!trimmedValue) {
      alert('Por favor, digite uma opção válida.');
      return;
    }

    const success = onAddOption(trimmedValue);
    
    if (success) {
      // Simula evento de mudança para atualizar o valor no formulário
      const syntheticEvent = {
        target: {
          name,
          value: trimmedValue,
        }
      } as React.ChangeEvent<HTMLSelectElement>;
      
      onChange(syntheticEvent);
      setIsAddingNew(false);
      setNewOptionValue('');
    } else {
      alert('Esta opção já existe ou é inválida. Tente outra.');
    }
  };

  const handleCancelAdd = () => {
    setIsAddingNew(false);
    setNewOptionValue('');
  };

  const handleRemoveCustomOption = (optionToRemove: string) => {
    if (onRemoveOption && isCustomOption && isCustomOption(optionToRemove)) {
      const confirmed = window.confirm(`Tem certeza que deseja remover "${optionToRemove}"?`);
      if (confirmed) {
        const success = onRemoveOption(optionToRemove);
        if (success && value === optionToRemove) {
          // Se a opção removida era a selecionada, limpa o valor
          const syntheticEvent = {
            target: { name, value: '' }
          } as React.ChangeEvent<HTMLSelectElement>;
          onChange(syntheticEvent);
        }
      }
    }
  };

  // Foca no input quando entra no modo de adicionar
  useEffect(() => {
    if (isAddingNew && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingNew]);

  // Separa opções padrão e customizadas
  const defaultOptions = options.filter(option => !isCustomOption || !isCustomOption(option));
  const customOptions = options.filter(option => isCustomOption && isCustomOption(option));

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={name} className="block font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {customOptions.length > 0 && (
          <button
            type="button"
            onClick={() => setShowCustomOptions(!showCustomOptions)}
            className="text-xs text-marsala hover:text-marsala-700"
          >
            {showCustomOptions ? 'Ocultar' : 'Ver'} customizadas ({customOptions.length})
          </button>
        )}
      </div>
      
      {!isAddingNew ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={handleSelectChange}
          className={getInputClasses()}
          required={required}
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          
          {/* Opções padrão */}
          {defaultOptions.length > 0 && (
            <optgroup label="Opções padrão">
              {defaultOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </optgroup>
          )}
          
          {/* Opções customizadas */}
          {customOptions.length > 0 && (
            <optgroup label="Opções personalizadas">
              {customOptions.map(option => (
                <option key={option} value={option}>
                  {option} ✨
                </option>
              ))}
            </optgroup>
          )}
          
          {/* Opção para adicionar nova */}
          <option value="_ADD_NEW_">➕ Adicionar nova opção...</option>
        </select>
      ) : (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newOptionValue}
            onChange={(e) => setNewOptionValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddNewOption();
              } else if (e.key === 'Escape') {
                handleCancelAdd();
              }
            }}
            className={getInputClasses()}
            placeholder="Digite a nova opção..."
            maxLength={50}
          />
          <button
            type="button"
            onClick={handleAddNewOption}
            className="px-3 py-2 bg-marsala text-white rounded hover:bg-marsala-700 transition-colors"
            title="Adicionar"
          >
            ✓
          </button>
          <button
            type="button"
            onClick={handleCancelAdd}
            className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            title="Cancelar"
          >
            ✕
          </button>
        </div>
      )}

      {/* Lista de opções customizadas (quando expandida) */}
      {showCustomOptions && customOptions.length > 0 && (
        <div className="mt-2 p-3 bg-gray-50 rounded border">
          <p className="text-sm font-medium text-gray-700 mb-2">Opções personalizadas:</p>
          <div className="space-y-1">
            {customOptions.map(option => (
              <div key={option} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">✨ {option}</span>
                {onRemoveOption && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomOption(option)}
                    className="text-red-600 hover:text-red-800 ml-2"
                    title={`Remover "${option}"`}
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
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

      {!error && !help && (
        <p className="text-xs text-gray-400">
          Dica: Selecione "➕ Adicionar nova opção..." para criar uma opção personalizada
        </p>
      )}
    </div>
  );
};

export default CustomSelectField; 