const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { Database } = require('../config/database');
const runMigrations = require('./migrations');

dotenv.config();

async function generateId() {
  return uuidv4();
}

async function seed() {
  try {
    console.log('🌱 Iniciando seed do banco de dados...');
    
    // Obter instância do banco
    const database = Database.getInstance();
    
    // Criar usuário admin padrão
    console.log('👤 Criando usuário admin...');
    const adminId = await generateId();
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const userResult = await database.query(`
      INSERT OR REPLACE INTO users (id, email, password_hash, is_admin)
      VALUES (?, ?, ?, ?)
    `, [adminId, 'admin@closetfesta.com', hashedPassword, 1]);
    
    console.log('✅ Usuário admin criado:', userResult);

    // Criar categorias
    console.log('📁 Criando categorias...');
    const categories = [
      { id: await generateId(), name: 'Vestidos', description: 'Vestidos elegantes para festas' },
      { id: await generateId(), name: 'Blusas', description: 'Blusas femininas variadas' },
      { id: await generateId(), name: 'Saias', description: 'Saias modernas e versáteis' },
      { id: await generateId(), name: 'Calças', description: 'Calças sociais e casuais' },
      { id: await generateId(), name: 'Conjuntos', description: 'Conjuntos completos' }
    ];

    for (const category of categories) {
      const categoryResult = await database.query(`
        INSERT OR REPLACE INTO product_categories (id, name, description)
        VALUES (?, ?, ?)
      `, [category.id, category.name, category.description]);
      console.log(`✅ Categoria criada: ${category.name}`);
    }

    // Criar produtos de exemplo
    console.log('👗 Criando produtos de exemplo...');
    const products = [
      {
        id: await generateId(),
        name: 'Vestido Longo Elegante',
        description: 'Vestido longo em crepe com detalhes em renda, perfeito para eventos noturnos',
        price: 180.00,
        quantity: 3,
        category_id: categories[0].id,
        sizes: 'P,M,G',
        featured: 1
      },
      {
        id: await generateId(),
        name: 'Vestido Midi Floral',
        description: 'Vestido midi com estampa floral delicada, ideal para eventos diurnos',
        price: 120.00,
        quantity: 5,
        category_id: categories[0].id,
        sizes: 'PP,P,M,G',
        featured: 0
      },
      {
        id: await generateId(),
        name: 'Blusa Social Branca',
        description: 'Blusa social em tecido nobre, perfeita para ambiente corporativo',
        price: 80.00,
        quantity: 8,
        category_id: categories[1].id,
        sizes: 'P,M,G,GG',
        featured: 0
      },
      {
        id: await generateId(),
        name: 'Saia Lápis Preta',
        description: 'Saia lápis clássica em alfaiataria, básica essencial do guarda-roupa',
        price: 90.00,
        quantity: 6,
        category_id: categories[2].id,
        sizes: 'P,M,G',
        featured: 1
      },
      {
        id: await generateId(),
        name: 'Conjunto Blazer + Saia',
        description: 'Conjunto executivo completo, blazer estruturado com saia combinando',
        price: 220.00,
        quantity: 2,
        category_id: categories[4].id,
        sizes: 'M,G',
        featured: 1
      }
    ];

    for (const product of products) {
      const productResult = await database.query(`
        INSERT OR REPLACE INTO products (id, name, description, price, quantity, category_id, sizes, featured)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        product.id, 
        product.name, 
        product.description, 
        product.price, 
        product.quantity, 
        product.category_id, 
        product.sizes, 
        product.featured
      ]);
      console.log(`✅ Produto criado: ${product.name}`);
    }

    console.log('✅ Seed concluído com sucesso!');
    console.log('📊 Dados criados:');
    console.log(`   👤 1 usuário admin (admin@closetfesta.com / admin123)`);
    console.log(`   📁 ${categories.length} categorias`);
    console.log(`   👗 ${products.length} produtos`);
    
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seed()
    .then(() => {
      console.log('Seed finalizado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro no seed:', error);
      process.exit(1);
    });
}

module.exports = seed; 