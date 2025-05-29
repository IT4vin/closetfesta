const { v4: uuidv4 } = require('uuid');

const up = async (database) => {
  await database.query(`
    CREATE TABLE IF NOT EXISTS product_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    )
  `);

  // Índices para performance
  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_categories_name ON product_categories (name)
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_categories_deleted ON product_categories (deleted_at)
  `);

  console.log('✅ Migração executada: Tabela de categorias criada');
};

const down = async (database) => {
  await database.query('DROP TABLE IF EXISTS product_categories');
  console.log('✅ Rollback executado: Tabela de categorias removida');
};

module.exports = { up, down }; 