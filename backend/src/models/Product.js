const { v4: uuidv4 } = require('uuid');
const { Database } = require('../config/database');

class Product {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.description = data.description || '';
    this.price = parseFloat(data.price);
    this.quantity = parseInt(data.quantity) || 0;
    this.category_id = data.category_id;
    this.sizes = data.sizes || 'único';
    this.featured = Boolean(data.featured);
    this.deleted = Boolean(data.deleted);
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async findAll(options = {}) {
    try {
      const database = Database.getInstance();
      const {
        includeDeleted = false,
        includeCategory = true,
        includeImages = true,
        categoryId = null,
        featured = null,
        inStock = null,
        limit = null,
        offset = 0
      } = options;

      let query = `
        SELECT 
          p.*
          ${includeCategory ? ', pc.name as category_name, pc.description as category_description' : ''}
        FROM products p
        ${includeCategory ? 'LEFT JOIN product_categories pc ON p.category_id = pc.id' : ''}
        WHERE 1=1
      `;

      const params = [];

      if (!includeDeleted) {
        query += ' AND p.deleted_at IS NULL';
      }

      if (categoryId) {
        query += ' AND p.category_id = ?';
        params.push(categoryId);
      }

      if (featured !== null) {
        query += ' AND p.featured = ?';
        params.push(featured ? 1 : 0);
      }

      if (inStock) {
        query += ' AND p.quantity > 0';
      }

      query += ' ORDER BY p.featured DESC, p.created_at DESC';

      if (limit) {
        query += ' LIMIT ?';
        params.push(limit);
        
        if (offset > 0) {
          query += ' OFFSET ?';
          params.push(offset);
        }
      }

      const rows = await database.query(query, params);
      
      // Buscar imagens separadamente para cada produto se necessário
      const products = [];
      
      for (const row of rows) {
        const product = new Product(row);
        
        if (includeCategory) {
          product.category = {
            name: row.category_name,
            description: row.category_description
          };
        }
        
        if (includeImages) {
          const imageQuery = `
            SELECT id, url, order_index
            FROM product_images 
            WHERE product_id = ? 
            ORDER BY order_index ASC
          `;
          const images = await database.query(imageQuery, [product.id]);
          product.images = images || [];
        }
        
        products.push(product);
      }

      return products;

    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      throw error;
    }
  }

  static async findById(id, options = {}) {
    try {
      const database = Database.getInstance();
      
      let query = `
        SELECT p.*
        FROM products p
        WHERE p.id = ?
      `;

      if (!options.includeDeleted) {
        query += ' AND p.deleted_at IS NULL';
      }

      const rows = await database.query(query, [id]);
      
      if (rows.length === 0) {
        return null;
      }

      const product = new Product(rows[0]);

      if (options.includeImages) {
        const imageQuery = `
          SELECT id, url, order_index
          FROM product_images 
          WHERE product_id = ? 
          ORDER BY order_index ASC
        `;
        const images = await database.query(imageQuery, [product.id]);
        product.images = images || [];
      }

      return product;
    } catch (error) {
      console.error('Erro ao buscar produto por ID:', error);
      throw error;
    }
  }

  static async findByCategory(categoryId, options = {}) {
    return this.findAll({
      ...options,
      categoryId
    });
  }

  static async findFeatured(options = {}) {
    return this.findAll({
      ...options,
      featured: true
    });
  }

  async save() {
    try {
      const database = Database.getInstance();
      const now = new Date().toISOString();
      
      // Verificar se é um novo produto
      const existing = await Product.findById(this.id, { includeDeleted: true });
      
      if (existing) {
        // Atualizar produto existente
        this.updated_at = now;
        
        await database.query(`
          UPDATE products 
          SET name = ?, description = ?, price = ?, quantity = ?, 
              category_id = ?, sizes = ?, featured = ?, updated_at = ?
          WHERE id = ?
        `, [
          this.name, this.description, this.price, this.quantity,
          this.category_id, this.sizes, this.featured ? 1 : 0, 
          this.updated_at, this.id
        ]);
      } else {
        // Criar novo produto
        this.created_at = now;
        this.updated_at = now;
        
        await database.query(`
          INSERT INTO products (id, name, description, price, quantity, category_id, sizes, featured, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          this.id, this.name, this.description, this.price, this.quantity,
          this.category_id, this.sizes, this.featured ? 1 : 0, 
          this.created_at, this.updated_at
        ]);
      }

      return this;
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      throw error;
    }
  }

  async delete(softDelete = true) {
    try {
      const database = Database.getInstance();
      
      if (softDelete) {
        this.deleted_at = new Date().toISOString();
        this.updated_at = this.deleted_at;
        
        await database.query(`
          UPDATE products SET deleted_at = ?, updated_at = ?
          WHERE id = ?
        `, [this.deleted_at, this.updated_at, this.id]);
      } else {
        // Deletar imagens relacionadas primeiro
        await database.query('DELETE FROM product_images WHERE product_id = ?', [this.id]);
        // Deletar produto
        await database.query('DELETE FROM products WHERE id = ?', [this.id]);
      }
      return true;
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      throw error;
    }
  }

  async addImage(imageData) {
    try {
      const database = Database.getInstance();
      const imageId = uuidv4();
      const now = new Date().toISOString();
      
      await database.query(`
        INSERT INTO product_images (id, product_id, file_name, file_path, file_size, mime_type, display_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        imageId, this.id, imageData.file_name, imageData.file_path,
        imageData.file_size, imageData.mime_type, imageData.display_order || 0, now
      ]);

      return imageId;
    } catch (error) {
      console.error('Erro ao adicionar imagem:', error);
      throw error;
    }
  }

  async removeImage(imageId) {
    try {
      const database = Database.getInstance();
      await database.query('DELETE FROM product_images WHERE id = ? AND product_id = ?', [imageId, this.id]);
      return true;
    } catch (error) {
      console.error('Erro ao remover imagem:', error);
      throw error;
    }
  }

  static async search(term, options = {}) {
    try {
      const database = Database.getInstance();
      
      let query = `
        SELECT p.*
        FROM products p
        WHERE (p.name LIKE ? OR p.description LIKE ?)
      `;
      
      const params = [`%${term}%`, `%${term}%`];

      if (!options.includeDeleted) {
        query += ' AND p.deleted_at IS NULL';
      }

      if (options.categoryId) {
        query += ' AND p.category_id = ?';
        params.push(options.categoryId);
      }

      if (options.featured !== null) {
        query += ' AND p.featured = ?';
        params.push(options.featured ? 1 : 0);
      }

      if (options.inStock) {
        query += ' AND p.quantity > 0';
      }

      query += ' ORDER BY p.featured DESC, p.created_at DESC';

      if (options.limit) {
        query += ' LIMIT ?';
        params.push(options.limit);
        
        if (options.offset > 0) {
          query += ' OFFSET ?';
          params.push(options.offset);
        }
      }

      const rows = await database.query(query, params);
      
      const products = [];
      
      for (const row of rows) {
        const product = new Product(row);
        
        if (options.includeImages) {
          const imageQuery = `
            SELECT id, url, order_index
            FROM product_images 
            WHERE product_id = ? 
            ORDER BY order_index ASC
          `;
          const images = await database.query(imageQuery, [product.id]);
          product.images = images || [];
        }
        
        products.push(product);
      }

      return products;
    } catch (error) {
      console.error('Erro ao pesquisar produtos:', error);
      throw error;
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      quantity: this.quantity,
      category_id: this.category_id,
      sizes: this.sizes,
      featured: this.featured,
      deleted: this.deleted,
      created_at: this.created_at,
      updated_at: this.updated_at,
      category: this.category,
      images: this.images
    };
  }
}

module.exports = Product; 