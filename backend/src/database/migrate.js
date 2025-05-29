import dotenv from 'dotenv';
import { runMigrations } from './migrations.js';
import database from '../config/database.js';

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
  } finally {
    await database.close();
    process.exit(0);
  }
}

migrate(); 