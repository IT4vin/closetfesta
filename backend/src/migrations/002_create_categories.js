const up = async (database) => {
  await database.query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  `);

  await database.query(`
    CREATE TABLE IF NOT EXISTS product_categories (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP
    )
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_categories_name 
    ON product_categories (name)
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_categories_deleted 
    ON product_categories (deleted_at)
  `);

  console.log('✅ Migração executada: Tabela de categorias criada');
};

const down = async (database) => {
  await database.query('DROP TABLE IF EXISTS product_categories');
  console.log('✅ Rollback executado: Tabela de categorias removida');
};

module.exports = { up, down };