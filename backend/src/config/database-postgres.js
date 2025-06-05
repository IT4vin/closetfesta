const { Pool } = require('pg');
const config = require('./config');
const { createLogger } = require('./logger');

const logger = createLogger(__filename);

class PostgreSQLDatabase {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  // Configurar pool de conexões PostgreSQL
  createPool() {
    const poolConfig = {
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.username,
      password: config.database.password,
      
      // Configurações do pool
      min: config.database.pool.min,
      max: config.database.pool.max,
      
      // Timeouts
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: 5000,
      
      // SSL para produção
      ssl: config.database.ssl ? {
        rejectUnauthorized: false
      } : false,
      
      // Configurações de performance
      statement_timeout: 30000,
      query_timeout: 30000,
      
      // Configurações de aplicação
      application_name: config.app.name,
    };

    logger.info('Creating PostgreSQL connection pool', {
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      poolMin: config.database.pool.min,
      poolMax: config.database.pool.max,
      ssl: config.database.ssl
    });

    return new Pool(poolConfig);
  }

  // Conectar ao banco
  async connect() {
    try {
      this.pool = this.createPool();

      // Testar conexão
      const client = await this.pool.connect();
      
      // Verificar versão do PostgreSQL
      const result = await client.query('SELECT version()');
      logger.info('PostgreSQL connected successfully', {
        version: result.rows[0].version,
        totalConnections: this.pool.totalCount,
        idleConnections: this.pool.idleCount
      });

      client.release();
      this.isConnected = true;

      // Configurar listeners de eventos
      this.setupEventListeners();

      return this.pool;
    } catch (error) {
      logger.error('Failed to connect to PostgreSQL', error);
      throw error;
    }
  }

  // Configurar listeners de eventos do pool
  setupEventListeners() {
    this.pool.on('connect', (client) => {
      logger.debug('New PostgreSQL client connected', {
        totalConnections: this.pool.totalCount,
        idleConnections: this.pool.idleCount
      });
    });

    this.pool.on('acquire', (client) => {
      logger.debug('PostgreSQL client acquired from pool', {
        totalConnections: this.pool.totalCount,
        idleConnections: this.pool.idleCount
      });
    });

    this.pool.on('remove', (client) => {
      logger.debug('PostgreSQL client removed from pool', {
        totalConnections: this.pool.totalCount,
        idleConnections: this.pool.idleCount
      });
    });

    this.pool.on('error', (error, client) => {
      logger.error('PostgreSQL pool error', error);
    });
  }

  // Executar query com log e métricas
  async query(text, params = []) {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    const start = Date.now();
    let client;

    try {
      client = await this.pool.connect();
      const result = await client.query(text, params);
      
      const duration = Date.now() - start;
      
      if (config.database.logging) {
        logger.database(text, duration);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.database(text, duration, error);
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  // Executar transação
  async transaction(callback) {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const result = await callback(client);
      
      await client.query('COMMIT');
      
      logger.debug('Transaction committed successfully');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction rolled back', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Executar query em lote
  async batchQuery(queries) {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    const client = await this.pool.connect();
    const results = [];
    
    try {
      await client.query('BEGIN');
      
      for (const query of queries) {
        const result = await client.query(query.text, query.params);
        results.push(result);
      }
      
      await client.query('COMMIT');
      
      logger.info('Batch query executed successfully', {
        queryCount: queries.length
      });
      
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Batch query failed', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Obter estatísticas do pool
  getPoolStats() {
    if (!this.pool) {
      return null;
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      maxConnections: config.database.pool.max,
      minConnections: config.database.pool.min
    };
  }

  // Verificar saúde da conexão
  async healthCheck() {
    try {
      const result = await this.query('SELECT 1 as health_check, NOW() as current_time');
      
      return {
        status: 'healthy',
        timestamp: result.rows[0].current_time,
        poolStats: this.getPoolStats()
      };
    } catch (error) {
      logger.error('Database health check failed', error);
      
      return {
        status: 'unhealthy',
        error: error.message,
        poolStats: this.getPoolStats()
      };
    }
  }

  // Fechar todas as conexões
  async close() {
    if (this.pool) {
      logger.info('Closing PostgreSQL connection pool...');
      await this.pool.end();
      this.isConnected = false;
      logger.info('PostgreSQL connection pool closed');
    }
  }

  // Limpar conexões idle
  async cleanupIdleConnections() {
    if (this.pool) {
      const stats = this.getPoolStats();
      logger.info('Cleaning up idle connections', stats);
      
      // O pg pool já gerencia isso automaticamente, mas podemos forçar se necessário
      // Em casos extremos, podemos recriar o pool
    }
  }
}

module.exports = PostgreSQLDatabase; 