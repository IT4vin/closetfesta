import { useState, useEffect } from 'react';
import { VALIDATION_RULES } from '@/config/productFormConfig';
import { validatePattern, isRequired } from '@/utils/formatters';

interface ValidationRule {
  required?: boolean;
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  custom?: (value: any) => string | null;
}

interface ValidationSchema {
  [fieldName: string]: ValidationRule;
}

interface UseFormValidationProps {
  data: any;
  schema: ValidationSchema;
  validateOnChange?: boolean;
}

export const useFormValidation = ({
  data,
  schema,
  validateOnChange = true,
}: UseFormValidationProps) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isValid, setIsValid] = useState(true);
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  // Função auxiliar para acessar propriedades aninhadas
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  };

  // Função auxiliar para obter o nome amigável do campo
  const getFieldDisplayName = (fieldName: string): string => {
    const fieldNameMap: { [key: string]: string } = {
      'name': 'Nome',
      'email': 'Email',
      'phone': 'Telefone',
      'document': 'CPF',
      'address.cep': 'CEP',
      'address.street': 'Logradouro',
      'address.number': 'Número',
      'address.neighborhood': 'Bairro',
      'address.city': 'Cidade',
      'address.state': 'Estado',
      'address': 'Endereço',
      // Adicione outros mapeamentos conforme necessário
    };
    
    return fieldNameMap[fieldName] || fieldName;
  };

  // Valida um campo específico
  const validateField = (fieldName: string, value?: any): string | null => {
    const rule = schema[fieldName];
    if (!rule) return null;

    // Se value não foi fornecido, busca do data usando notação de ponto
    const fieldValue = value !== undefined ? value : getNestedValue(data, fieldName);
    const displayName = getFieldDisplayName(fieldName);

    // Validação de campo obrigatório
    if (rule.required && !isRequired(fieldValue)) {
      return `${displayName} é obrigatório`;
    }

    // Se campo não é obrigatório e está vazio, não valida outras regras
    if (!rule.required && (!fieldValue || fieldValue.toString().trim() === '')) {
      return null;
    }

    // Validação de padrão/regex
    if (rule.pattern && typeof fieldValue === 'string' && !validatePattern(fieldValue, rule.pattern)) {
      return getPatternErrorMessage(fieldName, rule.pattern);
    }

    // Validação de comprimento mínimo
    if (rule.minLength && typeof fieldValue === 'string' && fieldValue.length < rule.minLength) {
      return `${displayName} deve ter pelo menos ${rule.minLength} caracteres`;
    }

    // Validação de comprimento máximo
    if (rule.maxLength && typeof fieldValue === 'string' && fieldValue.length > rule.maxLength) {
      return `${displayName} deve ter no máximo ${rule.maxLength} caracteres`;
    }

    // Validação de valor mínimo
    if (rule.min !== undefined && typeof fieldValue === 'number' && fieldValue < rule.min) {
      return `${displayName} deve ser pelo menos ${rule.min}`;
    }

    // Validação de valor máximo
    if (rule.max !== undefined && typeof fieldValue === 'number' && fieldValue > rule.max) {
      return `${displayName} deve ser no máximo ${rule.max}`;
    }

    // Validação customizada
    if (rule.custom) {
      return rule.custom(fieldValue);
    }

    return null;
  };

  // Obtém mensagem de erro para padrões conhecidos
  const getPatternErrorMessage = (fieldName: string, pattern: RegExp): string => {
    const displayName = getFieldDisplayName(fieldName);
    
    if (pattern === VALIDATION_RULES.NCM.pattern) {
      return VALIDATION_RULES.NCM.message;
    }
    if (pattern === VALIDATION_RULES.CFOP.pattern) {
      return VALIDATION_RULES.CFOP.message;
    }
    if (pattern === VALIDATION_RULES.CODE.pattern) {
      return VALIDATION_RULES.CODE.message;
    }
    return `${displayName} tem formato inválido`;
  };

  // Valida todos os campos
  const validateAll = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    let formIsValid = true;

    Object.keys(schema).forEach(fieldName => {
      const error = validateField(fieldName);
      if (error) {
        newErrors[fieldName] = error;
        formIsValid = false;
      }
    });

    setErrors(newErrors);
    setIsValid(formIsValid);
    return formIsValid;
  };

  // Valida um campo específico e atualiza o estado
  const validateSingleField = (fieldName: string): boolean => {
    const error = validateField(fieldName);
    
    setErrors(prev => ({
      ...prev,
      [fieldName]: error || ''
    }));

    // Remove erro se não houver
    if (!error) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }

    return !error;
  };

  // Marca campo como tocado
  const touchField = (fieldName: string) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));
  };

  // Limpa erros
  const clearErrors = () => {
    setErrors({});
    setIsValid(true);
  };

  // Limpa erro de um campo específico
  const clearFieldError = (fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  // Effect para validação automática quando dados mudam
  useEffect(() => {
    if (validateOnChange && Object.keys(touched).length > 0) {
      const newErrors: { [key: string]: string } = {};
      let formIsValid = true;

      // Só valida campos que foram tocados
      Object.keys(touched).forEach(fieldName => {
        if (touched[fieldName]) {
          const error = validateField(fieldName);
          if (error) {
            newErrors[fieldName] = error;
            formIsValid = false;
          }
        }
      });

      setErrors(newErrors);
      setIsValid(formIsValid);
    }
  }, [data, validateOnChange, touched]);

  return {
    errors,
    isValid,
    touched,
    validateAll,
    validateSingleField,
    validateField,
    touchField,
    clearErrors,
    clearFieldError,
    hasErrors: Object.keys(errors).length > 0,
    getFieldError: (fieldName: string) => errors[fieldName] || null,
    isFieldTouched: (fieldName: string) => touched[fieldName] || false,
  };
}; 