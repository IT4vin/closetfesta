const { v4: uuidv4 } = require('uuid');

const up = async (database) => {
  // Tabela de pedidos
  await database.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_address TEXT,
      order_type TEXT NOT NULL CHECK (order_type IN ('rental', 'sale')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'returned', 'cancelled')),
      rental_start_date TEXT,
      rental_end_date TEXT,
      subtotal DECIMAL(10,2) NOT NULL,
      discount DECIMAL(10,2) DEFAULT 0,
      total DECIMAL(10,2) NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    )
  `);

  // Tabela de itens do pedido
  await database.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      size TEXT,
      unit_price DECIMAL(10,2) NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT
    )
  `);

  // Índices para performance
  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status)
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_orders_type ON orders (order_type)
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_orders_rental_dates ON orders (rental_start_date, rental_end_date)
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id)
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items (product_id)
  `);

  console.log('✅ Migração executada: Tabelas de pedidos criadas');
};

const down = async (database) => {
  await database.query('DROP TABLE IF EXISTS order_items');
  await database.query('DROP TABLE IF EXISTS orders');
  console.log('✅ Rollback executado: Tabelas de pedidos removidas');
};

module.exports = { up, down }; 