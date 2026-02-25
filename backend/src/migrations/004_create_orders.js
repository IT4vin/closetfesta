const up = async (database) => {
  await database.query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  `);

  // Tabela de pedidos
  await database.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      customer_name VARCHAR(255) NOT NULL,
      customer_email VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50) NOT NULL,
      customer_address TEXT,
      order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('rental', 'sale')),
      status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'returned', 'cancelled')),
      rental_start_date TIMESTAMP,
      rental_end_date TIMESTAMP,
      subtotal DECIMAL(10,2) NOT NULL,
      discount DECIMAL(10,2) DEFAULT 0,
      total DECIMAL(10,2) NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP
    )
  `);

  // Tabela de itens do pedido
  await database.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      order_id UUID NOT NULL,
      product_id UUID NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      size VARCHAR(50),
      unit_price DECIMAL(10,2) NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT
    )
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status)
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_orders_type ON orders (order_type)
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_orders_rental_dates 
    ON orders (rental_start_date, rental_end_date)
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_order_items_order 
    ON order_items (order_id)
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_order_items_product 
    ON order_items (product_id)
  `);

  console.log('✅ Migração executada: Tabelas de pedidos criadas');
};

const down = async (database) => {
  await database.query('DROP TABLE IF EXISTS order_items');
  await database.query('DROP TABLE IF EXISTS orders');
  console.log('✅ Rollback executado: Tabelas de pedidos removidas');
};

module.exports = { up, down };