const { v4: uuidv4 } = require('uuid');
const { Database } = require('../config/database');

class Category {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.description = data.description || '';
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async findAll() {
    try {
      const database = Database.getInstance();
      const query = `
        SELECT 
          pc.*,
          COUNT(p.id) as product_count
        FROM product_categories pc
        LEFT JOIN products p ON pc.id = p.category_id AND p.deleted_at IS NULL
        WHERE pc.deleted_at IS NULL
        GROUP BY pc.id
        ORDER BY pc.name ASC
      `;

      const rows = await database.query(query);
      
      return rows.map(row => {
        const category = new Category(row);
        category.product_count = parseInt(row.product_count) || 0;
        return category;
      });

    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const database = Database.getInstance();
      const query = `
        SELECT 
          pc.*,
          COUNT(p.id) as product_count
        FROM product_categories pc
        LEFT JOIN products p ON pc.id = p.category_id AND p.deleted_at IS NULL
        WHERE pc.id = ? AND pc.deleted_at IS NULL
        GROUP BY pc.id
      `;

      const rows = await database.query(query, [id]);
      
      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];
      const category = new Category(row);
      category.product_count = parseInt(row.product_count) || 0;
      return category;

    } catch (error) {
      console.error('Erro ao buscar categoria por ID:', error);
      throw error;
    }
  }

  static async findByName(name) {
    try {
      const database = Database.getInstance();
      const query = 'SELECT * FROM product_categories WHERE name = ? AND deleted_at IS NULL';
      const rows = await database.query(query, [name]);
      
      return rows.length > 0 ? new Category(rows[0]) : null;
    } catch (error) {
      console.error('Erro ao buscar categoria por nome:', error);
      throw error;
    }
  }

  async save() {
    try {
      const database = Database.getInstance();
      const now = new Date().toISOString();
      
      // Verificar se é uma nova categoria
      const existing = await Category.findById(this.id);
      
      if (existing) {
        // Atualizar categoria existente
        this.updated_at = now;
        
        await database.query(`
          UPDATE product_categories 
          SET name = ?, description = ?, updated_at = ?
          WHERE id = ?
        `, [this.name, this.description, this.updated_at, this.id]);
      } else {
        // Criar nova categoria
        this.created_at = now;
        this.updated_at = now;
        
        await database.query(`
          INSERT INTO product_categories (id, name, description, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `, [this.id, this.name, this.description, this.created_at, this.updated_at]);
      }

      return this;
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      throw error;
    }
  }

  async delete() {
    try {
      const database = Database.getInstance();
      
      // Verificar se há produtos associados
      const productCount = await this.getProductCount();
      
      if (productCount > 0) {
        throw new Error(`Não é possível deletar a categoria. Há ${productCount} produto(s) associado(s).`);
      }

      // Soft delete
      const now = new Date().toISOString();
      await database.query(`
        UPDATE product_categories 
        SET deleted_at = ?, updated_at = ?
        WHERE id = ?
      `, [now, now, this.id]);
      
      return true;
    } catch (error) {
      console.error('Erro ao deletar categoria:', error);
      throw error;
    }
  }

  async getProductCount() {
    try {
      const database = Database.getInstance();
      const query = 'SELECT COUNT(*) as count FROM products WHERE category_id = ? AND deleted_at IS NULL';
      const rows = await database.query(query, [this.id]);
      return parseInt(rows[0].count) || 0;
    } catch (error) {
      console.error('Erro ao contar produtos da categoria:', error);
      throw error;
    }
  }

  async getProducts(options = {}) {
    try {
      const Product = require('./Product');
      return await Product.findAll({
        ...options,
        categoryId: this.id
      });
    } catch (error) {
      console.error('Erro ao buscar produtos da categoria:', error);
      throw error;
    }
  }

  static async search(term) {
    try {
      const categories = await this.findAll();
      
      const filteredCategories = categories.filter(category => {
        const searchTerm = term.toLowerCase();
        return (
          category.name.toLowerCase().includes(searchTerm) ||
          category.description.toLowerCase().includes(searchTerm)
        );
      });

      return filteredCategories;
    } catch (error) {
      console.error('Erro ao pesquisar categorias:', error);
      throw error;
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      product_count: this.product_count || 0,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Category; 