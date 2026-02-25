const up = async (database) => {
  // Ativa extensão UUID
  await database.query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  `);

  // Tabela de produtos
  await database.query(`
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      quantity INTEGER DEFAULT 0,
      category_id UUID NOT NULL,
      sizes TEXT DEFAULT 'único',
      featured BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES product_categories (id)
    )
  `);

  // Tabela de imagens
  await database.query(`
    CREATE TABLE IF NOT EXISTS product_images (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      product_id UUID NOT NULL,
      url VARCHAR(500) NOT NULL,
      order_index INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    )
  `);

  // Índices
  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id)
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_products_deleted ON products (deleted_at)
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_products_featured ON products (featured)
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images (product_id)
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_product_images_order ON product_images (order_index)
  `);

  console.log('✅ Migração executada: Tabelas de produtos criadas');
};

const down = async (database) => {
  await database.query('DROP TABLE IF EXISTS product_images');
  await database.query('DROP TABLE IF EXISTS products');
  console.log('✅ Rollback executado: Tabelas removidas');
};

module.exports = { up, down };