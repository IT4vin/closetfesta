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
    
    console.log('🔄 Executando migrações para PostgreSQL...');
    
    for (const migration of migrations) {
      await migration.up(db);
    }
    
    console.log('🎉 Todas as migrações foram executadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar migrações:', error);
    throw error;
  }
}
module.exports = runMigrations; 