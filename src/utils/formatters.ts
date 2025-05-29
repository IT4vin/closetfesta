import { CURRENCY_CONFIG } from '@/config/productFormConfig';

// Formatador de moeda
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat(CURRENCY_CONFIG.locale, {
    style: 'currency',
    currency: CURRENCY_CONFIG.currency,
    minimumFractionDigits: CURRENCY_CONFIG.minimumFractionDigits,
    maximumFractionDigits: CURRENCY_CONFIG.maximumFractionDigits,
  }).format(value);
};

// Parser de moeda (remove formatação e converte para número)
export const parseCurrency = (value: string): number => {
  const cleanValue = value
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  return parseFloat(cleanValue) || 0;
};

// Máscara para NCM (0000.00.00)
export const formatNCM = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}.${digits.slice(4)}`;
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`;
};

// Máscara para CFOP (0000)
export const formatCFOP = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 4);
};

// Máscara para código do produto
export const formatProductCode = (value: string): string => {
  return value.toUpperCase().replace(/[^A-Z0-9\-_]/g, '').slice(0, 20);
};

// Formatador de porcentagem
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Validador de campo obrigatório
export const isRequired = (value: any): boolean => {
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return value > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value != null;
};

// Validador usando regex
export const validatePattern = (value: string, pattern: RegExp): boolean => {
  return pattern.test(value);
};

// Formatador de número para input
export const formatNumberInput = (value: number | string): string => {
  if (typeof value === 'string') return value;
  return value.toString();
};

// Máscara para CPF (000.000.000-00)
export const formatCPF = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};

// Máscara para telefone (11) 99999-9999
export const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

// Máscara para CEP (00000-000)
export const formatCEP = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
};

// Função para buscar endereço pelo CEP usando ViaCEP
export const fetchAddressByCEP = async (cep: string): Promise<{
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
} | null> => {
  const cleanCEP = cep.replace(/\D/g, '');
  
  if (cleanCEP.length !== 8) {
    return null;
  }
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    const data = await response.json();
    
    if (data.erro) {
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
};

// Gerador de código automático
export const generateProductCode = (productType: string): string => {
  const typePrefix = productType.substring(0, 3).toUpperCase() || "PRD";
  const timestamp = Date.now().toString().slice(-6);
  const randomSuffix = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `${typePrefix}${timestamp}${randomSuffix}`;
}; 