import { z } from 'zod';

// ========================================
// VALIDADORES BÁSICOS REUTILIZÁVEIS
// ========================================

// Validador de CPF
const validateCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/[^\d]+/g, '');
  
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(10))) return false;
  
  return true;
};

// Validador de CNPJ
const validateCNPJ = (cnpj: string): boolean => {
  cnpj = cnpj.replace(/[^\d]+/g, '');
  
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  const digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1));
};

// Validador de CEP
const validateCEP = (cep: string): boolean => {
  const cleanCEP = cep.replace(/[^\d]/g, '');
  return cleanCEP.length === 8 && /^\d{8}$/.test(cleanCEP);
};

// Validador de telefone brasileiro
const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/[^\d]/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
};

// Validador de senha forte
const validateStrongPassword = (password: string): boolean => {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^a-zA-Z0-9]/.test(password)
  );
};

// ========================================
// SCHEMAS BÁSICOS REUTILIZÁVEIS
// ========================================

export const BaseSchemas = {
  // Strings básicas
  requiredString: (fieldName: string, minLength = 1) =>
    z.string()
      .min(1, `${fieldName} é obrigatório`)
      .min(minLength, `${fieldName} deve ter pelo menos ${minLength} caracteres`)
      .trim(),

  optionalString: (maxLength?: number) =>
    maxLength 
      ? z.string().max(maxLength, `Máximo ${maxLength} caracteres`).optional()
      : z.string().optional(),

  // Email
  email: z.string()
    .min(1, "E-mail é obrigatório")
    .email("E-mail inválido")
    .toLowerCase()
    .trim(),

  // CPF
  cpf: z.string()
    .min(1, "CPF é obrigatório")
    .refine(validateCPF, { message: "CPF inválido" }),

  // CNPJ
  cnpj: z.string()
    .min(1, "CNPJ é obrigatório")
    .refine(validateCNPJ, { message: "CNPJ inválido" }),

  // CEP
  cep: z.string()
    .min(1, "CEP é obrigatório")
    .refine(validateCEP, { message: "CEP inválido" }),

  // Telefone
  phone: z.string()
    .min(1, "Telefone é obrigatório")
    .refine(validatePhone, { message: "Telefone inválido" }),

  // Senha forte
  strongPassword: z.string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .refine(validateStrongPassword, {
      message: "Senha deve conter: maiúscula, minúscula, número e símbolo"
    }),

  // Números
  positiveNumber: (fieldName: string) =>
    z.coerce.number()
      .min(0, `${fieldName} deve ser positivo`),

  requiredPositiveNumber: (fieldName: string) =>
    z.coerce.number()
      .min(0.01, `${fieldName} deve ser maior que zero`),

  percentage: z.coerce.number()
    .min(0, "Porcentagem deve ser positiva")
    .max(100, "Porcentagem não pode ser maior que 100%"),

  // Datas
  futureDate: z.date()
    .refine(date => date > new Date(), { message: "Data deve ser futura" }),

  pastDate: z.date()
    .refine(date => date < new Date(), { message: "Data deve ser passada" }),

  // URLs
  url: z.string().url("URL inválida").optional(),

  // Códigos específicos
  ncmCode: z.string()
    .regex(/^\d{4}\.\d{2}\.\d{2}$/, "NCM deve ter o formato 0000.00.00")
    .optional(),

  cfopCode: z.string()
    .regex(/^\d{4}$/, "CFOP deve ter 4 dígitos")
    .optional(),

  productCode: z.string()
    .min(3, "Código deve ter pelo menos 3 caracteres")
    .max(20, "Código deve ter no máximo 20 caracteres")
    .regex(/^[A-Z0-9\-_]+$/, "Código deve conter apenas letras maiúsculas, números, hífen e underscore"),
};

// ========================================
// SCHEMAS DE ENDEREÇO
// ========================================

export const AddressSchema = z.object({
  cep: BaseSchemas.cep,
  street: BaseSchemas.requiredString("Logradouro", 5),
  number: BaseSchemas.requiredString("Número"),
  complement: BaseSchemas.optionalString(50),
  neighborhood: BaseSchemas.requiredString("Bairro", 2),
  city: BaseSchemas.requiredString("Cidade", 2),
  state: z.string()
    .length(2, "UF deve ter 2 caracteres")
    .toUpperCase(),
});

// ========================================
// SCHEMAS DE CLIENTE
// ========================================

export const ClientSchema = z.object({
  name: BaseSchemas.requiredString("Nome", 2),
  email: BaseSchemas.email,
  phone: BaseSchemas.phone,
  document: BaseSchemas.cpf,
  birthdate: z.string().optional(),
  address: AddressSchema,
  measurements: z.object({
    bust: BaseSchemas.optionalString(),
    waist: BaseSchemas.optionalString(),
    hips: BaseSchemas.optionalString(),
    height: BaseSchemas.optionalString(),
  }).optional(),
  notes: BaseSchemas.optionalString(500),
});

// ========================================
// SCHEMAS DE PRODUTO
// ========================================

export const ProductSchema = z.object({
  name: BaseSchemas.requiredString("Nome do produto", 2),
  productType: BaseSchemas.requiredString("Tipo de produto"),
  quantity: z.coerce.number().min(1, "Quantidade deve ser pelo menos 1"),
  fullCode: BaseSchemas.productCode,
  ncmCode: BaseSchemas.ncmCode,
  cfopCode: BaseSchemas.cfopCode,
  cost: BaseSchemas.positiveNumber("Custo"),
  rentalPrice: BaseSchemas.positiveNumber("Preço de aluguel"),
  firstRentalPrice: BaseSchemas.positiveNumber("Preço primeira locação"),
  salePrice: BaseSchemas.positiveNumber("Preço de venda"),
  commissionType: z.enum(["percentage", "fixed"]),
  commissionValue: z.coerce.number().min(0, "Comissão deve ser positiva"),
  description: BaseSchemas.optionalString(1000),
  brand: BaseSchemas.optionalString(50),
  model: BaseSchemas.optionalString(50),
  color: BaseSchemas.optionalString(30),
  size: BaseSchemas.optionalString(10),
  material: BaseSchemas.optionalString(100),
}).refine(data => {
  if (data.commissionType === 'percentage' && data.commissionValue > 100) {
    return false;
  }
  return true;
}, {
  message: "Comissão percentual não pode ser maior que 100%",
  path: ["commissionValue"]
});

// ========================================
// SCHEMAS DE VENDA
// ========================================

export const SaleSchema = z.object({
  client: BaseSchemas.requiredString("Cliente"),
  product: BaseSchemas.requiredString("Produto"),
  quantity: z.coerce.number().min(1, "Quantidade mínima é 1"),
  paymentMethod: BaseSchemas.requiredString("Forma de pagamento"),
  installments: z.coerce.number().min(1).max(24).optional(),
  discount: BaseSchemas.percentage.optional(),
  observations: BaseSchemas.optionalString(500),
});

// ========================================
// SCHEMAS DE ALUGUEL
// ========================================

export const RentalSchema = z.object({
  client: BaseSchemas.requiredString("Cliente"),
  product: BaseSchemas.requiredString("Produto"),
  startDate: z.date({ required_error: "Data de retirada é obrigatória" }),
  endDate: z.date({ required_error: "Data de devolução é obrigatória" }),
  rentalValue: BaseSchemas.requiredPositiveNumber("Valor do aluguel"),
  paymentMethod: BaseSchemas.requiredString("Forma de pagamento"),
  observations: BaseSchemas.optionalString(500),
}).refine(data => data.endDate > data.startDate, {
  message: "Data de devolução deve ser posterior à data de retirada",
  path: ["endDate"]
});

// ========================================
// SCHEMAS DE AGENDAMENTO
// ========================================

export const AppointmentSchema = z.object({
  appointmentType: z.enum(["prova", "evento"], {
    required_error: "Selecione o tipo de agendamento"
  }),
  client: BaseSchemas.requiredString("Cliente"),
  product: BaseSchemas.requiredString("Produto"),
  date: BaseSchemas.futureDate,
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Horário inválido"),
  duration: z.coerce.number().min(1, "Duração mínima é 1 hora").max(8, "Duração máxima é 8 horas"),
  observations: BaseSchemas.optionalString(500),
});

// ========================================
// SCHEMAS DE FUNCIONÁRIO
// ========================================

export const EmployeeSchema = z.object({
  name: BaseSchemas.requiredString("Nome", 3),
  email: BaseSchemas.email,
  cpf: BaseSchemas.cpf,
  phone: BaseSchemas.phone,
  address: BaseSchemas.requiredString("Endereço", 10),
  accessLevel: z.enum(["admin", "manager", "atendente", "vendedor"]),
  sectors: BaseSchemas.requiredString("Setores"),
  password: BaseSchemas.strongPassword.optional(),
});

// ========================================
// SCHEMAS DE CONFIGURAÇÕES DA LOJA
// ========================================

export const StoreDataSchema = z.object({
  tradingName: BaseSchemas.requiredString("Nome fantasia", 3),
  companyName: BaseSchemas.requiredString("Razão social", 3),
  cnpj: BaseSchemas.cnpj,
  zipcode: BaseSchemas.cep,
  address: BaseSchemas.requiredString("Endereço", 5),
  number: BaseSchemas.requiredString("Número"),
  complement: BaseSchemas.optionalString(50),
  neighborhood: BaseSchemas.requiredString("Bairro", 2),
  city: BaseSchemas.requiredString("Cidade", 2),
  state: z.string().length(2, "UF deve ter 2 caracteres").toUpperCase(),
  phone: BaseSchemas.phone,
  email: BaseSchemas.email,
});

// ========================================
// SCHEMAS DE SEGURANÇA
// ========================================

export const SecuritySchema = z.object({
  enableTwoFactor: z.boolean().default(false),
  twoFactorMethod: z.enum(["app", "sms", "email"]).default("app"),
  currentPassword: BaseSchemas.requiredString("Senha atual"),
  newPassword: BaseSchemas.strongPassword,
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

// ========================================
// SCHEMAS DE INTEGRAÇÃO
// ========================================

export const IntegrationSchema = z.object({
  mercadoPago: z.object({
    enabled: z.boolean().default(false),
    accessToken: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    testMode: z.boolean().default(true),
  }),
  pagarMe: z.object({
    enabled: z.boolean().default(false),
    apiKey: z.string().optional(),
    encryptionKey: z.string().optional(),
    testMode: z.boolean().default(true),
  }),
  fiscal: z.object({
    enabled: z.boolean().default(false),
    certificateFile: z.any().optional(),
    certificatePassword: z.string().optional(),
    certificateExpiryDate: z.string()
      .regex(/^(0[1-9]|1[0-2])\/(2[3-9]|[3-9][0-9])$/, "Data inválida (MM/AA)")
      .optional(),
  }),
});

// ========================================
// TIPOS TYPESCRIPT INFERIDOS
// ========================================

export type ClientFormData = z.infer<typeof ClientSchema>;
export type ProductFormData = z.infer<typeof ProductSchema>;
export type SaleFormData = z.infer<typeof SaleSchema>;
export type RentalFormData = z.infer<typeof RentalSchema>;
export type AppointmentFormData = z.infer<typeof AppointmentSchema>;
export type EmployeeFormData = z.infer<typeof EmployeeSchema>;
export type StoreDataFormData = z.infer<typeof StoreDataSchema>;
export type SecurityFormData = z.infer<typeof SecuritySchema>;
export type IntegrationFormData = z.infer<typeof IntegrationSchema>;
export type AddressFormData = z.infer<typeof AddressSchema>; 