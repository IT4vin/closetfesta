const path = require('path');

// Configurar timeout para testes
jest.setTimeout(30000);

// Mock de console para testes mais limpos
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Configurar variáveis de ambiente se não estiverem definidas
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
}

if (!process.env.DB_TYPE) {
  process.env.DB_TYPE = 'sqlite';
  process.env.DB_PATH = ':memory:';
}

// Limpar módulos em cache antes de cada teste
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  // Limpar qualquer estado global se necessário
});

// Configurar variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.PORT = 3002;
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = 5432;
process.env.DB_NAME = 'closetfesta_test';
process.env.DB_USER = 'test_user';
process.env.DB_PASS = 'test_password';
process.env.JWT_EXPIRES_IN = '1h';
process.env.LOG_LEVEL = 'error';
process.env.CACHE_ENABLED = 'false';

// Utilitários globais para testes
global.testUtils = {
  // Gerar dados mock
  mockUser: () => ({
    id: 1,
    email: 'test@example.com',
    password: 'hashedpassword',
    name: 'Test User',
    created_at: new Date(),
    updated_at: new Date()
  }),
  
  mockProduct: () => ({
    id: 1,
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    category_id: 1,
    in_stock: true,
    created_at: new Date(),
    updated_at: new Date()
  }),
  
  mockCategory: () => ({
    id: 1,
    name: 'Test Category',
    description: 'Test Category Description',
    created_at: new Date(),
    updated_at: new Date()
  }),
  
  // Gerar JWT token para testes
  generateTestToken: () => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { 
        id: 1, 
        email: 'test@example.com',
        role: 'admin'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
  },
  
  // Limpar database entre testes
  cleanDatabase: async (db) => {
    const tables = ['products', 'product_categories', 'admin_users'];
    
    for (const table of tables) {
      await db.query(`DELETE FROM ${table}`);
      await db.query(`ALTER SEQUENCE ${table}_id_seq RESTART WITH 1`);
    }
  }
};

// Error handler global para testes
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Cleanup após todos os testes
afterAll(async () => {
  // Fechar conexões de banco se existirem
  if (global.__DATABASE__) {
    await global.__DATABASE__.close();
  }
  
  // Fechar servidor se existir
  if (global.__SERVER__) {
    await global.__SERVER__.close();
  }
}); 