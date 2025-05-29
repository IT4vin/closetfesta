const { Database } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Importar migrações individuais
const createUsersTable = require('./001_create_users');
const createCategoriesTable = require('./002_create_categories');
const createProductsTable = require('./003_create_products');
const createOrdersTable = require('./004_create_orders');

// Lista de migrações na ordem de execução
const migrations = [
  createUsersTable,
  createCategoriesTable, 
  createProductsTable,
  createOrdersTable
];

async function runMigrations() {
  try {
    const db = Database.getInstance();
    const dbType = process.env.DB_TYPE || 'sqlite';
    
    console.log(`🔄 Executando migrações para ${dbType}...`);
    
    for (const migration of migrations) {
      try {
        await migration.up(db);
      } catch (error) {
        console.error(`❌ Erro na migração: ${error.message}`);
        throw error;
      }
    }
    
    console.log('🎉 Todas as migrações foram executadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar migrações:', error);
    throw error;
  }
}

async function rollbackMigrations() {
  try {
    const db = Database.getInstance();
    
    console.log('🔄 Fazendo rollback das migrações...');
    
    // Executar rollbacks na ordem reversa
    for (let i = migrations.length - 1; i >= 0; i--) {
      try {
        await migrations[i].down(db);
      } catch (error) {
        console.error(`❌ Erro no rollback: ${error.message}`);
        throw error;
      }
    }
    
    console.log('✅ Rollback concluído!');
  } catch (error) {
    console.error('❌ Erro no rollback:', error);
    throw error;
  }
}

module.exports = runMigrations; 