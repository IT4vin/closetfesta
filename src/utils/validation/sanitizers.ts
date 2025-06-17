// ========================================
// UTILITÁRIOS DE SANITIZAÇÃO DE DADOS
// ========================================

/**
 * Remove caracteres especiais e mantém apenas números
 */
export const sanitizeNumericString = (value: string): string => {
  return value.replace(/[^\d]/g, '');
};

/**
 * Sanitiza CPF removendo formatação
 */
export const sanitizeCPF = (cpf: string): string => {
  return cpf.replace(/[^\d]/g, '');
};

/**
 * Sanitiza CNPJ removendo formatação
 */
export const sanitizeCNPJ = (cnpj: string): string => {
  return cnpj.replace(/[^\d]/g, '');
};

/**
 * Sanitiza CEP removendo formatação
 */
export const sanitizeCEP = (cep: string): string => {
  return cep.replace(/[^\d]/g, '');
};

/**
 * Sanitiza telefone removendo formatação
 */
export const sanitizePhone = (phone: string): string => {
  return phone.replace(/[^\d]/g, '');
};

/**
 * Sanitiza string removendo espaços extras e caracteres perigosos
 */
export const sanitizeString = (value: string): string => {
  return value
    .trim()
    .replace(/\s+/g, ' ') // Múltiplos espaços em um só
    .replace(/[<>]/g, ''); // Remove caracteres perigosos básicos
};

/**
 * Sanitiza email convertendo para lowercase e removendo espaços
 */
export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

/**
 * Sanitiza nome próprio (primeira letra maiúscula)
 */
export const sanitizeName = (name: string): string => {
  return name
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/\s+/g, ' ');
};

/**
 * Sanitiza código de produto (maiúsculas, sem espaços)
 */
export const sanitizeProductCode = (code: string): string => {
  return code
    .toUpperCase()
    .replace(/[^A-Z0-9\-_]/g, '')
    .trim();
};

/**
 * Sanitiza valor monetário
 */
export const sanitizeMoneyValue = (value: string | number): number => {
  if (typeof value === 'number') return Math.max(0, value);
  
  const cleaned = value
    .replace(/[^\d,.-]/g, '')
    .replace(',', '.');
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
};

/**
 * Sanitiza porcentagem (0-100)
 */
export const sanitizePercentage = (value: string | number): number => {
  const num = typeof value === 'number' ? value : parseFloat(value.replace(/[^\d.]/g, ''));
  return isNaN(num) ? 0 : Math.min(100, Math.max(0, num));
};

/**
 * Sanitiza texto longo removendo HTML e limitando tamanho
 */
export const sanitizeLongText = (text: string, maxLength = 1000): string => {
  return text
    .replace(/<[^>]*>/g, '') // Remove tags HTML
    .replace(/&[^;]+;/g, '') // Remove entidades HTML
    .trim()
    .substring(0, maxLength);
};

/**
 * Sanitiza URL
 */
export const sanitizeURL = (url: string): string => {
  const trimmed = url.trim();
  
  // Adiciona protocolo se não tiver
  if (trimmed && !trimmed.match(/^https?:\/\//)) {
    return `https://${trimmed}`;
  }
  
  return trimmed;
};

// ========================================
// FORMATADORES DE EXIBIÇÃO
// ========================================

/**
 * Formata CPF para exibição
 */
export const formatCPF = (cpf: string): string => {
  const cleaned = sanitizeCPF(cpf);
  if (cleaned.length !== 11) return cpf;
  
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formata CNPJ para exibição
 */
export const formatCNPJ = (cnpj: string): string => {
  const cleaned = sanitizeCNPJ(cnpj);
  if (cleaned.length !== 14) return cnpj;
  
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

/**
 * Formata CEP para exibição
 */
export const formatCEP = (cep: string): string => {
  const cleaned = sanitizeCEP(cep);
  if (cleaned.length !== 8) return cep;
  
  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
};

/**
 * Formata telefone para exibição
 */
export const formatPhone = (phone: string): string => {
  const cleaned = sanitizePhone(phone);
  
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
};

/**
 * Formata valor monetário para exibição
 */
export const formatMoney = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Formata porcentagem para exibição
 */
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// ========================================
// VALIDADORES DE FORMATO
// ========================================

/**
 * Verifica se string está em formato de CPF válido
 */
export const isValidCPFFormat = (cpf: string): boolean => {
  return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf) || /^\d{11}$/.test(cpf);
};

/**
 * Verifica se string está em formato de CNPJ válido
 */
export const isValidCNPJFormat = (cnpj: string): boolean => {
  return /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(cnpj) || /^\d{14}$/.test(cnpj);
};

/**
 * Verifica se string está em formato de CEP válido
 */
export const isValidCEPFormat = (cep: string): boolean => {
  return /^\d{5}-\d{3}$/.test(cep) || /^\d{8}$/.test(cep);
};

/**
 * Verifica se string está em formato de telefone válido
 */
export const isValidPhoneFormat = (phone: string): boolean => {
  return /^\(\d{2}\) \d{4,5}-\d{4}$/.test(phone) || /^\d{10,11}$/.test(phone);
};

// ========================================
// SANITIZADORES COMPOSTOS
// ========================================

/**
 * Sanitiza dados de endereço completo
 */
export const sanitizeAddress = (address: {
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}) => {
  return {
    cep: address.cep ? sanitizeCEP(address.cep) : '',
    street: address.street ? sanitizeString(address.street) : '',
    number: address.number ? sanitizeString(address.number) : '',
    complement: address.complement ? sanitizeString(address.complement) : '',
    neighborhood: address.neighborhood ? sanitizeString(address.neighborhood) : '',
    city: address.city ? sanitizeName(address.city) : '',
    state: address.state ? address.state.toUpperCase().trim() : ''
  };
};

/**
 * Sanitiza dados de cliente
 */
export const sanitizeClientData = (client: {
  name?: string;
  email?: string;
  phone?: string;
  document?: string;
  [key: string]: any;
}) => {
  return {
    ...client,
    name: client.name ? sanitizeName(client.name) : '',
    email: client.email ? sanitizeEmail(client.email) : '',
    phone: client.phone ? sanitizePhone(client.phone) : '',
    document: client.document ? sanitizeCPF(client.document) : ''
  };
};

/**
 * Sanitiza dados de produto
 */
export const sanitizeProductData = (product: {
  name?: string;
  fullCode?: string;
  cost?: string | number;
  rentalPrice?: string | number;
  salePrice?: string | number;
  [key: string]: any;
}) => {
  return {
    ...product,
    name: product.name ? sanitizeString(product.name) : '',
    fullCode: product.fullCode ? sanitizeProductCode(product.fullCode) : '',
    cost: product.cost ? sanitizeMoneyValue(product.cost) : 0,
    rentalPrice: product.rentalPrice ? sanitizeMoneyValue(product.rentalPrice) : 0,
    salePrice: product.salePrice ? sanitizeMoneyValue(product.salePrice) : 0
  };
};

// ========================================
// UTILITÁRIOS DE MÁSCARA
// ========================================

/**
 * Aplica máscara de CPF durante digitação
 */
export const applyCPFMask = (value: string): string => {
  const cleaned = sanitizeCPF(value);
  
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
};

/**
 * Aplica máscara de CNPJ durante digitação
 */
export const applyCNPJMask = (value: string): string => {
  const cleaned = sanitizeCNPJ(value);
  
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
  if (cleaned.length <= 8) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
  if (cleaned.length <= 12) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`;
  
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
};

/**
 * Aplica máscara de CEP durante digitação
 */
export const applyCEPMask = (value: string): string => {
  const cleaned = sanitizeCEP(value);
  
  if (cleaned.length <= 5) return cleaned;
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
};

/**
 * Aplica máscara de telefone durante digitação
 */
export const applyPhoneMask = (value: string): string => {
  const cleaned = sanitizePhone(value);
  
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  if (cleaned.length <= 10) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
}; 