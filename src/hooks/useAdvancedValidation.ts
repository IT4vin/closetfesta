import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';

interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  fieldErrors: Record<string, string>;
}

interface UseAdvancedValidationProps<T> {
  schema: z.ZodSchema<T>;
  data: T;
  validateOnChange?: boolean;
  debounceMs?: number;
  onValidationChange?: (result: ValidationResult) => void;
}

interface UseAdvancedValidationReturn<T> {
  // Estado de validação
  isValid: boolean;
  errors: ValidationError[];
  fieldErrors: Record<string, string>;
  isValidating: boolean;
  
  // Métodos de validação
  validate: () => Promise<ValidationResult>;
  validateField: (fieldPath: string, value?: any) => Promise<string | null>;
  validateFields: (fieldPaths: string[]) => Promise<Record<string, string | null>>;
  
  // Controle de estado
  clearErrors: () => void;
  clearFieldError: (fieldPath: string) => void;
  setFieldError: (fieldPath: string, message: string) => void;
  
  // Utilitários
  getFieldError: (fieldPath: string) => string | null;
  hasFieldError: (fieldPath: string) => boolean;
  getErrorsForFields: (fieldPaths: string[]) => Record<string, string>;
  
  // Validação condicional
  validateIf: (condition: boolean) => Promise<ValidationResult>;
  validateFieldIf: (fieldPath: string, condition: boolean, value?: any) => Promise<string | null>;
}

export const useAdvancedValidation = <T>({
  schema,
  data,
  validateOnChange = true,
  debounceMs = 300,
  onValidationChange
}: UseAdvancedValidationProps<T>): UseAdvancedValidationReturn<T> => {
  const [isValid, setIsValid] = useState(true);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Função para extrair valor de campo aninhado
  const getNestedValue = useCallback((obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }, []);

  // Função para converter erros do Zod em formato padronizado
  const formatZodErrors = useCallback((zodErrors: z.ZodIssue[]): ValidationError[] => {
    return zodErrors.map(error => ({
      field: error.path.join('.'),
      message: error.message,
      code: error.code
    }));
  }, []);

  // Função para criar mapa de erros por campo
  const createFieldErrorMap = useCallback((validationErrors: ValidationError[]): Record<string, string> => {
    const map: Record<string, string> = {};
    validationErrors.forEach(error => {
      if (!map[error.field]) {
        map[error.field] = error.message;
      }
    });
    return map;
  }, []);

  // Validação completa
  const validate = useCallback(async (): Promise<ValidationResult> => {
    setIsValidating(true);
    
    try {
      await schema.parseAsync(data);
      
      const result: ValidationResult = {
        isValid: true,
        errors: [],
        fieldErrors: {}
      };
      
      setIsValid(true);
      setErrors([]);
      setFieldErrors({});
      
      onValidationChange?.(result);
      return result;
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = formatZodErrors(error.errors);
        const fieldErrorMap = createFieldErrorMap(validationErrors);
        
        const result: ValidationResult = {
          isValid: false,
          errors: validationErrors,
          fieldErrors: fieldErrorMap
        };
        
        setIsValid(false);
        setErrors(validationErrors);
        setFieldErrors(fieldErrorMap);
        
        onValidationChange?.(result);
        return result;
      }
      
      throw error;
    } finally {
      setIsValidating(false);
    }
  }, [schema, data, formatZodErrors, createFieldErrorMap, onValidationChange]);

  // Validação de campo específico
  const validateField = useCallback(async (fieldPath: string, value?: any): Promise<string | null> => {
    try {
      // Se value não foi fornecido, usar valor do data
      const fieldValue = value !== undefined ? value : getNestedValue(data, fieldPath);
      
      // Criar dados temporários com apenas o campo alterado
      const tempData = { ...data };
      if (fieldPath.includes('.')) {
        // Para campos aninhados, atualizar o valor no objeto
        const keys = fieldPath.split('.');
        let current = tempData as any;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = fieldValue;
      } else {
        (tempData as any)[fieldPath] = fieldValue;
      }
      
      // Validar dados completos para capturar erros do campo específico
      await schema.parseAsync(tempData);
      
      return null;
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find(err => err.path.join('.') === fieldPath);
        return fieldError?.message || null;
      }
      return 'Erro de validação';
    }
  }, [schema, data, getNestedValue]);

  // Validação de múltiplos campos
  const validateFields = useCallback(async (fieldPaths: string[]): Promise<Record<string, string | null>> => {
    const results: Record<string, string | null> = {};
    
    await Promise.all(
      fieldPaths.map(async (fieldPath) => {
        results[fieldPath] = await validateField(fieldPath);
      })
    );
    
    return results;
  }, [validateField]);

  // Limpar todos os erros
  const clearErrors = useCallback(() => {
    setIsValid(true);
    setErrors([]);
    setFieldErrors({});
  }, []);

  // Limpar erro de campo específico
  const clearFieldError = useCallback((fieldPath: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldPath];
      return newErrors;
    });
    
    setErrors(prev => prev.filter(error => error.field !== fieldPath));
    
    // Recalcular isValid
    setIsValid(prev => {
      const remainingErrors = Object.keys(fieldErrors).filter(key => key !== fieldPath);
      return remainingErrors.length === 0;
    });
  }, [fieldErrors]);

  // Definir erro de campo manualmente
  const setFieldError = useCallback((fieldPath: string, message: string) => {
    const newError: ValidationError = {
      field: fieldPath,
      message
    };
    
    setFieldErrors(prev => ({
      ...prev,
      [fieldPath]: message
    }));
    
    setErrors(prev => {
      const filtered = prev.filter(error => error.field !== fieldPath);
      return [...filtered, newError];
    });
    
    setIsValid(false);
  }, []);

  // Obter erro de campo específico
  const getFieldError = useCallback((fieldPath: string): string | null => {
    return fieldErrors[fieldPath] || null;
  }, [fieldErrors]);

  // Verificar se campo tem erro
  const hasFieldError = useCallback((fieldPath: string): boolean => {
    return fieldPath in fieldErrors;
  }, [fieldErrors]);

  // Obter erros para múltiplos campos
  const getErrorsForFields = useCallback((fieldPaths: string[]): Record<string, string> => {
    const result: Record<string, string> = {};
    fieldPaths.forEach(fieldPath => {
      const error = fieldErrors[fieldPath];
      if (error) {
        result[fieldPath] = error;
      }
    });
    return result;
  }, [fieldErrors]);

  // Validação condicional
  const validateIf = useCallback(async (condition: boolean): Promise<ValidationResult> => {
    if (condition) {
      return await validate();
    }
    
    return {
      isValid: true,
      errors: [],
      fieldErrors: {}
    };
  }, [validate]);

  // Validação condicional de campo
  const validateFieldIf = useCallback(async (
    fieldPath: string, 
    condition: boolean, 
    value?: any
  ): Promise<string | null> => {
    if (condition) {
      return await validateField(fieldPath, value);
    }
    return null;
  }, [validateField]);

  // Validação automática com debounce quando dados mudam
  useEffect(() => {
    if (!validateOnChange) return;

    // Limpar timer anterior
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Configurar novo timer
    const timer = setTimeout(() => {
      validate().catch(console.error);
    }, debounceMs);

    setDebounceTimer(timer);

    // Cleanup
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [data, validateOnChange, debounceMs, validate]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return {
    // Estado
    isValid,
    errors,
    fieldErrors,
    isValidating,
    
    // Métodos de validação
    validate,
    validateField,
    validateFields,
    
    // Controle de estado
    clearErrors,
    clearFieldError,
    setFieldError,
    
    // Utilitários
    getFieldError,
    hasFieldError,
    getErrorsForFields,
    
    // Validação condicional
    validateIf,
    validateFieldIf
  };
}; 