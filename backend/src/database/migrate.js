const dotenv = require('dotenv');
const runMigrations = require('./migrations');
const { Database } = require('../config/database');

// Carregar variáveis de ambiente
dotenv.config();

async function migrate() {
  try {
    console.log('🚀 Iniciando migrações do banco de dados...');
    await runMigrations();
    console.log('✅ Migrações concluídas com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante as migrações:', error);
    process.exit(1);
  }
}

migrate(); 