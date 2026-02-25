const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    this.db = null;
    // Decide o tipo automaticamente: PostgreSQL quando existir DATABASE_URL, senão SQLite
    this.type = process.env.DATABASE_URL ? 'postgres' : 'sqlite';
    this.connected = false;
  }

  getConfig() {
    return {
      type: this.type
    };
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
      Database.instance.connect();
    }
    return Database.instance;
  }

  async connect() {
    if (this.connected && this.db) {
      return this.db;
    }

    try {
      // Se existir DATABASE_URL, sempre usa PostgreSQL
      if (process.env.DATABASE_URL) {
        this.type = 'postgres';
        await this.connectPostgreSQL();
      } else {
        // Fallback para SQLite apenas quando NÃO houver DATABASE_URL
        this.type = 'sqlite';
        await this.connectSQLite();
      }

      this.connected = true;
      console.log(`✅ Conectado ao banco de dados (${this.type})`);
      return this.db;
    } catch (error) {
      console.error('❌ Erro ao conectar com o banco de dados:', error);
      throw error;
    }
  }

  async connectSQLite() {
    const dbPath = process.env.DB_PATH || './data/database.db';
    const dbDir = path.dirname(dbPath);
    
    // Criar diretório se não existir
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        throw err;
      }
    });

    // Habilitar foreign keys
    this.db.run("PRAGMA foreign_keys = ON");
    
    return new Promise((resolve, reject) => {
      this.db.get("SELECT 1", (err) => {
        if (err) reject(err);
        else resolve(this.db);
      });
    });
  }

  async connectPostgreSQL() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        'DATABASE_URL não está definido. Defina a variável de ambiente DATABASE_URL para usar PostgreSQL.'
      );
    }

    const isProduction = process.env.NODE_ENV === 'production';

    this.db = new Pool({
      connectionString,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });

    // Testar conexão
    const client = await this.db.connect();
    try {
      await client.query('SELECT 1');
    } finally {
      client.release();
    }
  }

  async query(sql, params = []) {
    if (this.type === 'sqlite') {
      return this.querySQLite(sql, params);
    } else {
      return this.queryPostgreSQL(sql, params);
    }
  }

  async querySQLite(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        this.db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      } else {
        this.db.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve({ 
            lastID: this.lastID, 
            changes: this.changes,
            affectedRows: this.changes
          });
        });
      }
    });
  }

  // Converte placeholders ? para $1, $2, ... (compatível com driver pg)
  convertPlaceholdersToPg(sql) {
    let i = 0;
    return sql.replace(/\?/g, () => `$${++i}`);
  }

  async queryPostgreSQL(sql, params = []) {
    const client = await this.db.connect();
    try {
      const pgSql = this.convertPlaceholdersToPg(sql);
      const result = await client.query(pgSql, params);
      if (result.rows) return result.rows;
      return { rowCount: result.rowCount, lastID: result.rows?.[0]?.id, changes: result.rowCount };
    } finally {
      client.release();
    }
  }

  async get(sql, params = []) {
    if (this.type === 'sqlite') {
      return new Promise((resolve, reject) => {
        this.db.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    } else {
      const result = await this.queryPostgreSQL(sql, params);
      return result[0] || null;
    }
  }

  async close() {
    if (this.db) {
      if (this.type === 'sqlite') {
        this.db.close();
      } else {
        await this.db.end();
      }
      this.connected = false;
    }
  }
}

module.exports = { Database };