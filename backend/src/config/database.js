const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    this.db = null;
    this.type = process.env.DB_TYPE || 'sqlite';
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
    if (this.connected) {
      return this.db;
    }

    try {
      if (this.type === 'sqlite') {
        await this.connectSQLite();
      } else if (this.type === 'postgres') {
        await this.connectPostgreSQL();
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
    this.db = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Testar conexão
    const client = await this.db.connect();
    client.release();
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