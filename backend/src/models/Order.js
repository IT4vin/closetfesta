const { Database } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Order {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.customer_name = data.customer_name;
    this.customer_email = data.customer_email;
    this.customer_phone = data.customer_phone;
    this.customer_address = data.customer_address;
    this.order_type = data.order_type; // 'rental' ou 'sale'
    this.status = data.status || 'pending';
    this.rental_start_date = data.rental_start_date;
    this.rental_end_date = data.rental_end_date;
    this.subtotal = data.subtotal || 0;
    this.discount = data.discount || 0;
    this.total = data.total || 0;
    this.notes = data.notes;
    this.items = data.items || [];
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
    this.deleted_at = data.deleted_at;
  }

  // Buscar todos os pedidos
  static async findAll(filters = {}) {
    const db = Database.getInstance();
    
    let whereConditions = ['o.deleted_at IS NULL'];
    let params = [];

    if (filters.status) {
      whereConditions.push('o.status = ?');
      params.push(filters.status);
    }

    if (filters.order_type) {
      whereConditions.push('o.order_type = ?');
      params.push(filters.order_type);
    }

    if (filters.customer_email) {
      whereConditions.push('o.customer_email LIKE ?');
      params.push(`%${filters.customer_email}%`);
    }

    if (filters.date_from) {
      whereConditions.push('o.created_at >= ?');
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      whereConditions.push('o.created_at <= ?');
      params.push(filters.date_to);
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const orders = await db.query(`
      SELECT o.*,
             COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // Buscar itens para cada pedido
    for (let order of orders) {
      order.items = await this.getOrderItems(order.id);
    }

    return orders;
  }

  // Buscar pedido por ID
  static async findById(id) {
    const db = Database.getInstance();
    
    const orders = await db.query(`
      SELECT * FROM orders 
      WHERE id = ? AND deleted_at IS NULL
    `, [id]);

    if (orders.length === 0) {
      return null;
    }

    const order = orders[0];
    order.items = await this.getOrderItems(id);
    
    return order;
  }

  // Buscar itens de um pedido
  static async getOrderItems(orderId) {
    const db = Database.getInstance();
    
    return await db.query(`
      SELECT oi.*,
             p.name as product_name,
             p.description as product_description,
             (SELECT url FROM product_images WHERE product_id = p.id ORDER BY order_index LIMIT 1) as product_image
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
      ORDER BY oi.created_at
    `, [orderId]);
  }

  // Salvar pedido
  async save() {
    const db = Database.getInstance();
    
    try {
      await db.query('BEGIN TRANSACTION');

      // Verificar se é atualização ou criação
      const existing = await db.query(
        'SELECT id FROM orders WHERE id = ?',
        [this.id]
      );

      if (existing.length > 0) {
        // Atualizar
        this.updated_at = new Date().toISOString();
        
        await db.query(`
          UPDATE orders SET
            customer_name = ?, customer_email = ?, customer_phone = ?,
            customer_address = ?, order_type = ?, status = ?,
            rental_start_date = ?, rental_end_date = ?,
            subtotal = ?, discount = ?, total = ?, notes = ?,
            updated_at = ?
          WHERE id = ?
        `, [
          this.customer_name, this.customer_email, this.customer_phone,
          this.customer_address, this.order_type, this.status,
          this.rental_start_date, this.rental_end_date,
          this.subtotal, this.discount, this.total, this.notes,
          this.updated_at, this.id
        ]);
      } else {
        // Criar novo
        await db.query(`
          INSERT INTO orders (
            id, customer_name, customer_email, customer_phone,
            customer_address, order_type, status,
            rental_start_date, rental_end_date,
            subtotal, discount, total, notes,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          this.id, this.customer_name, this.customer_email, this.customer_phone,
          this.customer_address, this.order_type, this.status,
          this.rental_start_date, this.rental_end_date,
          this.subtotal, this.discount, this.total, this.notes,
          this.created_at, this.updated_at
        ]);
      }

      // Salvar itens do pedido
      if (this.items && this.items.length > 0) {
        // Remover itens existentes
        await db.query('DELETE FROM order_items WHERE order_id = ?', [this.id]);
        
        // Inserir novos itens
        for (let item of this.items) {
          const itemId = item.id || uuidv4();
          await db.query(`
            INSERT INTO order_items (
              id, order_id, product_id, quantity, size,
              unit_price, total_price, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            itemId, this.id, item.product_id, item.quantity, item.size,
            item.unit_price, item.total_price, new Date().toISOString()
          ]);
        }
      }

      await db.query('COMMIT');
      return this;
      
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }

  // Atualizar status
  async updateStatus(newStatus) {
    const db = Database.getInstance();
    
    this.status = newStatus;
    this.updated_at = new Date().toISOString();
    
    await db.query(`
      UPDATE orders SET status = ?, updated_at = ?
      WHERE id = ?
    `, [newStatus, this.updated_at, this.id]);
    
    return this;
  }

  // Deletar pedido (soft delete)
  async delete() {
    const db = Database.getInstance();
    
    this.deleted_at = new Date().toISOString();
    
    await db.query(`
      UPDATE orders SET deleted_at = ?
      WHERE id = ?
    `, [this.deleted_at, this.id]);
    
    return this;
  }

  // Calcular totais do pedido
  calculateTotals() {
    this.subtotal = this.items.reduce((sum, item) => {
      return sum + (item.unit_price * item.quantity);
    }, 0);
    
    this.total = this.subtotal - (this.discount || 0);
    
    // Atualizar totais dos itens
    this.items.forEach(item => {
      item.total_price = item.unit_price * item.quantity;
    });
    
    return this;
  }

  // Verificar disponibilidade dos produtos
  static async checkProductAvailability(items, startDate, endDate) {
    const db = Database.getInstance();
    const unavailableItems = [];

    for (let item of items) {
      // Verificar estoque atual
      const product = await db.query(
        'SELECT quantity FROM products WHERE id = ? AND deleted_at IS NULL',
        [item.product_id]
      );

      if (product.length === 0) {
        unavailableItems.push({
          product_id: item.product_id,
          reason: 'Produto não encontrado'
        });
        continue;
      }

      if (product[0].quantity < item.quantity) {
        unavailableItems.push({
          product_id: item.product_id,
          reason: `Estoque insuficiente (disponível: ${product[0].quantity})`
        });
        continue;
      }

      // Se for aluguel, verificar conflitos de data
      if (startDate && endDate) {
        const conflicts = await db.query(`
          SELECT SUM(oi.quantity) as reserved_quantity
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE oi.product_id = ? 
            AND o.order_type = 'rental'
            AND o.status NOT IN ('cancelled', 'returned')
            AND o.deleted_at IS NULL
            AND (
              (o.rental_start_date <= ? AND o.rental_end_date >= ?) OR
              (o.rental_start_date <= ? AND o.rental_end_date >= ?) OR
              (o.rental_start_date >= ? AND o.rental_end_date <= ?)
            )
        `, [
          item.product_id,
          endDate, startDate,
          startDate, endDate,
          startDate, endDate
        ]);

        const reservedQuantity = conflicts[0]?.reserved_quantity || 0;
        const availableQuantity = product[0].quantity - reservedQuantity;

        if (availableQuantity < item.quantity) {
          unavailableItems.push({
            product_id: item.product_id,
            reason: `Produto indisponível no período (disponível: ${availableQuantity})`
          });
        }
      }
    }

    return unavailableItems;
  }

  // Estatísticas dos pedidos
  static async getStatistics(filters = {}) {
    const db = Database.getInstance();
    
    let whereConditions = ['deleted_at IS NULL'];
    let params = [];

    if (filters.date_from) {
      whereConditions.push('created_at >= ?');
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      whereConditions.push('created_at <= ?');
      params.push(filters.date_to);
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';

    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN order_type = 'rental' THEN 1 END) as rental_orders,
        COUNT(CASE WHEN order_type = 'sale' THEN 1 END) as sale_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        SUM(total) as total_revenue,
        AVG(total) as average_order_value
      FROM orders
      ${whereClause}
    `, params);

    return stats[0];
  }
}

module.exports = Order; 