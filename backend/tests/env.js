// Configuração de ambiente para testes
require('dotenv').config({ path: '.env.test' });

// Configurar variáveis de ambiente específicas para testes
process.env.NODE_ENV = 'test';
process.env.PORT = 3002;
process.env.DB_TYPE = 'sqlite';
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.LOG_LEVEL = 'error';
process.env.CACHE_ENABLED = 'false';
process.env.RATE_LIMIT_ENABLED = 'false';
process.env.HELMET_ENABLED = 'false';
process.env.COMPRESSION_ENABLED = 'false';

// Configurações de upload para testes
process.env.UPLOAD_MAX_FILE_SIZE = '5242880'; // 5MB
process.env.UPLOAD_ALLOWED_TYPES = 'image/jpeg,image/png,image/webp';

console.log('🧪 Test environment variables configured'); 