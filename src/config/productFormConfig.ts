export const PRODUCT_TYPES = [
  "Vestido", "Terno", "Acessório", "Sapato", "Bolsa", "Joia", "Gravata", 
  "Colete", "Smoking", "Saia", "Blusa", "Casaco", "Outro"
] as const;

export const EVENT_TYPES = [
  "Casamento", "Festa", "Formatura", "Aniversário", "Batizado", 
  "Primeira Comunhão", "Debutante", "Gala", "Corporativo", "Outro"
] as const;

export const SIZE_OPTIONS = [
  "PP", "P", "M", "G", "GG", "XG", "XXG", 
  "34", "36", "38", "40", "42", "44", "46", "48", "50",
  "Único", "Ajustável"
] as const;

export const COLOR_OPTIONS = [
  "Branco", "Preto", "Azul", "Vermelho", "Verde", "Amarelo", "Rosa", "Roxo",
  "Marrom", "Cinza", "Bege", "Dourado", "Prateado", "Multicolorido", "Outro"
] as const;

// Configurações de validação
export const VALIDATION_RULES = {
  NCM: {
    pattern: /^\d{4}\.\d{2}\.\d{2}$/,
    format: "0000.00.00",
    message: "NCM deve ter o formato 0000.00.00"
  },
  CFOP: {
    pattern: /^\d{4}$/,
    format: "0000",
    message: "CFOP deve ter 4 dígitos"
  },
  CODE: {
    minLength: 3,
    maxLength: 20,
    pattern: /^[A-Z0-9\-_]+$/,
    message: "Código deve conter apenas letras maiúsculas, números, hífen e underscore"
  }
} as const;

// Configurações de moeda
export const CURRENCY_CONFIG = {
  locale: 'pt-BR',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
} as const;

// Configurações de salvamento automático
export const AUTO_SAVE_CONFIG = {
  enabled: true,
  intervalMs: 30000, // 30 segundos
  storageKey: 'product_form_draft'
} as const;

// Configurações de opções customizadas
export const CUSTOM_OPTIONS_CONFIG = {
  PRODUCT_TYPES: {
    storageKey: 'custom_product_types',
    maxLength: 50,
    minLength: 2
  },
  COLORS: {
    storageKey: 'custom_colors',
    maxLength: 30,
    minLength: 2
  },
  SIZES: {
    storageKey: 'custom_sizes',
    maxLength: 20,
    minLength: 1
  },
  EVENT_TYPES: {
    storageKey: 'custom_event_types',
    maxLength: 40,
    minLength: 2
  },
  BRANDS: {
    storageKey: 'custom_brands',
    maxLength: 50,
    minLength: 2
  },
  STYLISTS: {
    storageKey: 'custom_stylists',
    maxLength: 50,
    minLength: 2
  },
  MATERIALS: {
    storageKey: 'custom_materials',
    maxLength: 40,
    minLength: 2
  }
} as const; 