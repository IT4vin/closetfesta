#!/usr/bin/env node

// ===============================
// SCRIPT DE TESTE DE CONECTIVIDADE
// ===============================

const dotenv = require('dotenv');
const { Database } = require('../src/config/database');

dotenv.config();

async function testConnection() {
  console.log('🔍 Testando conectividade do sistema...');
  
  try {
    // Testar conexão com banco
    console.log('📊 Testando banco de dados...');
    const database = Database.getInstance();
    
    // Testar query básica
    const result = await database.query('SELECT 1 as test');
    console.log('✅ Banco de dados conectado:', result);
    
    // Verificar tabelas
    const tables = await database.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
    console.log('📋 Tabelas encontradas:', tables.map(t => t.name));
    
    // Verificar categorias
    const categories = await database.query('SELECT * FROM product_categories WHERE deleted_at IS NULL');
    console.log('📁 Categorias disponíveis:', categories.length);
    categories.forEach(cat => {
      console.log(`   - ${cat.name} (ID: ${cat.id})`);
    });
    
    // Verificar produtos
    const products = await database.query('SELECT * FROM products WHERE deleted_at IS NULL');
    console.log('👗 Produtos disponíveis:', products.length);
    
    console.log('');
    console.log('✅ TESTE DE CONECTIVIDADE CONCLUÍDO COM SUCESSO!');
    console.log('');
    console.log('📊 RESUMO:');
    console.log(`   🗄️  Banco: ${process.env.DB_TYPE || 'sqlite'}`);
    console.log(`   📁 Categorias: ${categories.length}`);
    console.log(`   👗 Produtos: ${products.length}`);
    console.log(`   🌐 Porta: ${process.env.PORT || 3001}`);
    
    if (categories.length === 0) {
      console.log('');
      console.log('⚠️  ATENÇÃO: Nenhuma categoria encontrada!');
      console.log('   Execute: npm run seed');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste de conectividade:', error);
    process.exit(1);
  }
}

// Executar teste
testConnection()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Falha no teste:', error);
    process.exit(1);
  });
