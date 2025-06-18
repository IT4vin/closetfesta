import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { z } from 'zod';

// Importar schemas e hooks de validação
import { 
  ClientSchema, 
  ProductSchema, 
  BaseSchemas,
  AddressSchema 
} from '@/utils/validation/schemas';
import { useAdvancedValidation } from '@/hooks/useAdvancedValidation';
import {
  sanitizeCPF,
  sanitizeCNPJ,
  sanitizeCEP,
  sanitizePhone,
  sanitizeEmail,
  sanitizeName,
  formatCPF,
  formatCNPJ,
  formatPhone,
  applyCPFMask,
  applyCNPJMask,
  applyPhoneMask
} from '@/utils/validation/sanitizers';

describe('Validation Schemas', () => {
  describe('BaseSchemas', () => {
    it('should validate required string correctly', () => {
      const schema = BaseSchemas.requiredString('Nome', 2);
      
      expect(() => schema.parse('')).toThrow();
      expect(() => schema.parse('A')).toThrow();
      expect(() => schema.parse('João')).not.toThrow();
    });

    it('should validate email correctly', () => {
      const schema = BaseSchemas.email;
      
      expect(() => schema.parse('')).toThrow();
      expect(() => schema.parse('invalid-email')).toThrow();
      expect(() => schema.parse('test@example.com')).not.toThrow();
      
      // Deve converter para lowercase
      const result = schema.parse('TEST@EXAMPLE.COM');
      expect(result).toBe('test@example.com');
    });

    it('should validate CPF correctly', () => {
      const schema = BaseSchemas.cpf;
      
      expect(() => schema.parse('')).toThrow();
      expect(() => schema.parse('123.456.789-00')).toThrow(); // CPF inválido
      expect(() => schema.parse('11111111111')).toThrow(); // CPF com dígitos iguais
      expect(() => schema.parse('12345678901')).not.toThrow(); // CPF válido (mock)
    });

    it('should validate positive numbers correctly', () => {
      const schema = BaseSchemas.positiveNumber('Preço');
      
      expect(() => schema.parse(-1)).toThrow();
      expect(() => schema.parse(0)).not.toThrow();
      expect(() => schema.parse(10.5)).not.toThrow();
      expect(() => schema.parse('15')).not.toThrow(); // Coerção
    });

    it('should validate percentage correctly', () => {
      const schema = BaseSchemas.percentage;
      
      expect(() => schema.parse(-1)).toThrow();
      expect(() => schema.parse(101)).toThrow();
      expect(() => schema.parse(50)).not.toThrow();
      expect(() => schema.parse('25')).not.toThrow(); // Coerção
    });
  });

  describe('AddressSchema', () => {
    it('should validate complete address', () => {
      const validAddress = {
        cep: '12345678',
        street: 'Rua das Flores',
        number: '123',
        complement: 'Apto 45',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'sp'
      };

      const result = AddressSchema.parse(validAddress);
      expect(result.state).toBe('SP'); // Deve converter para maiúscula
    });

    it('should reject invalid address', () => {
      const invalidAddress = {
        cep: '123', // CEP muito curto
        street: 'R', // Rua muito curta
        number: '',
        neighborhood: '',
        city: '',
        state: 'ABC' // Estado inválido
      };

      expect(() => AddressSchema.parse(invalidAddress)).toThrow();
    });
  });

  describe('ClientSchema', () => {
    it('should validate complete client data', () => {
      const validClient = {
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '11987654321',
        document: '12345678901',
        birthdate: '1990-01-01',
        address: {
          cep: '12345678',
          street: 'Rua das Flores',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP'
        },
        notes: 'Cliente VIP'
      };

      expect(() => ClientSchema.parse(validClient)).not.toThrow();
    });

    it('should reject client with invalid data', () => {
      const invalidClient = {
        name: 'J', // Nome muito curto
        email: 'invalid-email',
        phone: '123', // Telefone inválido
        document: '123', // CPF inválido
        address: {
          cep: '123',
          street: '',
          number: '',
          neighborhood: '',
          city: '',
          state: ''
        }
      };

      expect(() => ClientSchema.parse(invalidClient)).toThrow();
    });
  });

  describe('ProductSchema', () => {
    it('should validate product with percentage commission', () => {
      const validProduct = {
        name: 'Vestido Elegante',
        productType: 'vestido',
        quantity: 5,
        fullCode: 'VE-001',
        cost: 100,
        rentalPrice: 50,
        salePrice: 200,
        commissionType: 'percentage' as const,
        commissionValue: 10
      };

      expect(() => ProductSchema.parse(validProduct)).not.toThrow();
    });

    it('should reject product with invalid percentage commission', () => {
      const invalidProduct = {
        name: 'Vestido Elegante',
        productType: 'vestido',
        quantity: 5,
        fullCode: 'VE-001',
        cost: 100,
        rentalPrice: 50,
        salePrice: 200,
        commissionType: 'percentage' as const,
        commissionValue: 150 // Mais de 100%
      };

      expect(() => ProductSchema.parse(invalidProduct)).toThrow();
    });
  });
});

describe('useAdvancedValidation Hook', () => {
  const testSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    age: z.number().min(18, 'Deve ser maior de idade')
  });

  it('should validate data correctly', async () => {
    const validData = {
      name: 'João',
      email: 'joao@example.com',
      age: 25
    };

    const { result } = renderHook(() =>
      useAdvancedValidation({
        schema: testSchema,
        data: validData,
        validateOnChange: false
      })
    );

    await act(async () => {
      const validation = await result.current.validate();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  it('should detect validation errors', async () => {
    const invalidData = {
      name: 'J',
      email: 'invalid-email',
      age: 16
    };

    const { result } = renderHook(() =>
      useAdvancedValidation({
        schema: testSchema,
        data: invalidData,
        validateOnChange: false
      })
    );

    await act(async () => {
      const validation = await result.current.validate();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(3);
      expect(validation.fieldErrors.name).toBe('Nome deve ter pelo menos 2 caracteres');
      expect(validation.fieldErrors.email).toBe('Email inválido');
      expect(validation.fieldErrors.age).toBe('Deve ser maior de idade');
    });
  });

  it('should validate individual fields', async () => {
    const data = {
      name: 'João',
      email: 'invalid-email',
      age: 25
    };

    const { result } = renderHook(() =>
      useAdvancedValidation({
        schema: testSchema,
        data,
        validateOnChange: false
      })
    );

    await act(async () => {
      const nameError = await result.current.validateField('name');
      const emailError = await result.current.validateField('email');
      
      expect(nameError).toBeNull();
      expect(emailError).toBe('Email inválido');
    });
  });

  it('should clear errors correctly', async () => {
    const invalidData = {
      name: 'J',
      email: 'invalid-email',
      age: 16
    };

    const { result } = renderHook(() =>
      useAdvancedValidation({
        schema: testSchema,
        data: invalidData,
        validateOnChange: false
      })
    );

    await act(async () => {
      await result.current.validate();
      expect(result.current.errors).toHaveLength(3);
      
      result.current.clearErrors();
      expect(result.current.errors).toHaveLength(0);
      expect(result.current.isValid).toBe(true);
    });
  });

  it('should set and clear field errors manually', () => {
    const data = {
      name: 'João',
      email: 'joao@example.com',
      age: 25
    };

    const { result } = renderHook(() =>
      useAdvancedValidation({
        schema: testSchema,
        data,
        validateOnChange: false
      })
    );

    act(() => {
      result.current.setFieldError('name', 'Erro customizado');
      expect(result.current.getFieldError('name')).toBe('Erro customizado');
      expect(result.current.hasFieldError('name')).toBe(true);
      expect(result.current.isValid).toBe(false);
      
      result.current.clearFieldError('name');
      expect(result.current.getFieldError('name')).toBeNull();
      expect(result.current.hasFieldError('name')).toBe(false);
    });
  });

  it('should validate conditionally', async () => {
    const data = {
      name: 'J', // Inválido
      email: 'joao@example.com',
      age: 25
    };

    const { result } = renderHook(() =>
      useAdvancedValidation({
        schema: testSchema,
        data,
        validateOnChange: false
      })
    );

    await act(async () => {
      // Não deve validar quando condição é false
      const result1 = await result.current.validateIf(false);
      expect(result1.isValid).toBe(true);
      
      // Deve validar quando condição é true
      const result2 = await result.current.validateIf(true);
      expect(result2.isValid).toBe(false);
    });
  });
});

describe('Sanitizers', () => {
  describe('Document sanitizers', () => {
    it('should sanitize CPF correctly', () => {
      expect(sanitizeCPF('123.456.789-00')).toBe('12345678900');
      expect(sanitizeCPF('123 456 789 00')).toBe('12345678900');
      expect(sanitizeCPF('abc123def456ghi789jkl00')).toBe('12345678900');
    });

    it('should sanitize CNPJ correctly', () => {
      expect(sanitizeCNPJ('12.345.678/0001-99')).toBe('12345678000199');
      expect(sanitizeCNPJ('12 345 678 0001 99')).toBe('12345678000199');
    });

    it('should sanitize CEP correctly', () => {
      expect(sanitizeCEP('12345-678')).toBe('12345678');
      expect(sanitizeCEP('12.345-678')).toBe('12345678');
    });

    it('should sanitize phone correctly', () => {
      expect(sanitizePhone('(11) 98765-4321')).toBe('11987654321');
      expect(sanitizePhone('11 9 8765-4321')).toBe('11987654321');
    });
  });

  describe('String sanitizers', () => {
    it('should sanitize email correctly', () => {
      expect(sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
      expect(sanitizeEmail('User@Domain.COM')).toBe('user@domain.com');
    });

    it('should sanitize name correctly', () => {
      expect(sanitizeName('  joão  silva  ')).toBe('João Silva');
      expect(sanitizeName('MARIA DOS SANTOS')).toBe('Maria Dos Santos');
    });
  });

  describe('Formatters', () => {
    it('should format CPF correctly', () => {
      expect(formatCPF('12345678900')).toBe('123.456.789-00');
      expect(formatCPF('123')).toBe('123'); // Não formata se incompleto
    });

    it('should format CNPJ correctly', () => {
      expect(formatCNPJ('12345678000199')).toBe('12.345.678/0001-99');
      expect(formatCNPJ('123')).toBe('123'); // Não formata se incompleto
    });

    it('should format phone correctly', () => {
      expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
      expect(formatPhone('1134567890')).toBe('(11) 3456-7890');
      expect(formatPhone('123')).toBe('123'); // Não formata se incompleto
    });
  });

  describe('Mask appliers', () => {
    it('should apply CPF mask during typing', () => {
      expect(applyCPFMask('123')).toBe('123');
      expect(applyCPFMask('123456')).toBe('123.456');
      expect(applyCPFMask('123456789')).toBe('123.456.789');
      expect(applyCPFMask('12345678900')).toBe('123.456.789-00');
    });

    it('should apply CNPJ mask during typing', () => {
      expect(applyCNPJMask('12')).toBe('12');
      expect(applyCNPJMask('12345')).toBe('12.345');
      expect(applyCNPJMask('12345678')).toBe('12.345.678');
      expect(applyCNPJMask('123456780001')).toBe('12.345.678/0001');
      expect(applyCNPJMask('12345678000199')).toBe('12.345.678/0001-99');
    });

    it('should apply phone mask during typing', () => {
      expect(applyPhoneMask('11')).toBe('11');
      expect(applyPhoneMask('119876')).toBe('(11) 9876');
      expect(applyPhoneMask('1198765432')).toBe('(11) 9876-5432');
      expect(applyPhoneMask('11987654321')).toBe('(11) 98765-4321');
    });
  });
});

describe('Integration Tests', () => {
  it('should validate and sanitize client data end-to-end', async () => {
    const rawClientData = {
      name: '  joão  silva  ',
      email: '  JOAO@EXAMPLE.COM  ',
      phone: '(11) 98765-4321',
      document: '123.456.789-00',
      address: {
        cep: '12345-678',
        street: '  rua das flores  ',
        number: '123',
        neighborhood: '  centro  ',
        city: '  são paulo  ',
        state: 'sp'
      }
    };

    // Sanitizar dados primeiro
    const sanitizedData = {
      name: sanitizeName(rawClientData.name),
      email: sanitizeEmail(rawClientData.email),
      phone: sanitizePhone(rawClientData.phone),
      document: sanitizeCPF(rawClientData.document),
      address: {
        cep: sanitizeCEP(rawClientData.address.cep),
        street: rawClientData.address.street.trim(),
        number: rawClientData.address.number,
        neighborhood: rawClientData.address.neighborhood.trim(),
        city: sanitizeName(rawClientData.address.city),
        state: rawClientData.address.state.toUpperCase()
      }
    };

    // Validar com schema
    const { result } = renderHook(() =>
      useAdvancedValidation({
        schema: ClientSchema,
        data: sanitizedData,
        validateOnChange: false
      })
    );

    await act(async () => {
      const validation = await result.current.validate();
      expect(validation.isValid).toBe(true);
    });

    // Verificar se dados foram sanitizados corretamente
    expect(sanitizedData.name).toBe('João Silva');
    expect(sanitizedData.email).toBe('joao@example.com');
    expect(sanitizedData.phone).toBe('11987654321');
    expect(sanitizedData.document).toBe('12345678900');
    expect(sanitizedData.address.state).toBe('SP');
  });
}); 