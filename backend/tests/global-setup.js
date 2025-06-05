module.exports = async () => {
  console.log('🧪 Setting up test environment...');
  
  // Configurar variáveis de ambiente para testes
  process.env.NODE_ENV = 'test';
  process.env.PORT = 3002;
  process.env.DB_TYPE = 'sqlite';
  process.env.DB_PATH = ':memory:';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.LOG_LEVEL = 'error';
  process.env.CACHE_ENABLED = 'false';
  
  console.log('✅ Test environment configured');
}; 