const { v4: uuidv4 } = require('uuid');

const up = async (database) => {
  // Tabela de produtos
  await database.query(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      quantity INTEGER DEFAULT 0,
      category_id TEXT NOT NULL,
      sizes TEXT DEFAULT 'único',
      featured BOOLEAN DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      FOREIGN KEY (category_id) REFERENCES product_categories (id)
    )
  `);

  // Tabela de imagens de produtos
  await database.query(`
    CREATE TABLE IF NOT EXISTS product_images (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      url TEXT NOT NULL,
      order_index INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    )
  `);

  // Índices para performance
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
  console.log('✅ Rollback executado: Tabelas de produtos removidas');
};

module.exports = { up, down }; 