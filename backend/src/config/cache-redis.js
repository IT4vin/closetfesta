const Redis = require('redis');
const config = require('./config');
const { createLogger } = require('./logger');

const logger = createLogger(__filename);

class RedisCache {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.retryAttempts = 0;
    this.maxRetries = 3;
  }

  // Configurar cliente Redis
  createClient() {
    const redisConfig = {
      socket: {
        host: config.cache.host || 'localhost',
        port: config.cache.port || 6379,
        connectTimeout: 5000,
        lazyConnect: true
      },
      
      // Configurações de reconexão
      retry_delay_on_failover: 100,
      enable_offline_queue: false,
      
      // Configurações de performance
      no_ready_check: false,
      maxRetriesPerRequest: 3,
      
      // Database
      db: config.cache.database || 0
    };

    // Adicionar senha se configurada
    if (config.cache.password) {
      redisConfig.password = config.cache.password;
    }

    // Configurações específicas para produção
    if (config.server.env === 'production') {
      redisConfig.socket.tls = config.cache.tls || false;
    }

    logger.info('Creating Redis client', {
      host: redisConfig.socket.host,
      port: redisConfig.socket.port,
      database: redisConfig.db,
      environment: config.server.env
    });

    return Redis.createClient(redisConfig);
  }

  // Conectar ao Redis
  async connect() {
    try {
      this.client = this.createClient();

      // Configurar listeners de eventos
      this.setupEventListeners();

      // Conectar
      await this.client.connect();
      
      // Testar conexão
      const pong = await this.client.ping();
      
      logger.info('Redis connected successfully', {
        response: pong,
        server: await this.client.info('server')
      });

      this.isConnected = true;
      this.retryAttempts = 0;

      return this.client;
    } catch (error) {
      logger.error('Failed to connect to Redis', error);
      this.isConnected = false;
      
      // Tentar reconectar
      if (this.retryAttempts < this.maxRetries) {
        this.retryAttempts++;
        logger.info(`Retrying Redis connection (${this.retryAttempts}/${this.maxRetries})...`);
        
        setTimeout(() => {
          this.connect();
        }, 2000 * this.retryAttempts);
      }
      
      throw error;
    }
  }

  // Configurar listeners de eventos
  setupEventListeners() {
    this.client.on('connect', () => {
      logger.info('Redis client connected');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
      this.isConnected = true;
    });

    this.client.on('error', (error) => {
      logger.error('Redis client error', error);
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });

    this.client.on('end', () => {
      logger.info('Redis client connection ended');
      this.isConnected = false;
    });
  }

  // Verificar se está conectado
  ensureConnected() {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis not connected');
    }
  }

  // Obter valor do cache
  async get(key) {
    this.ensureConnected();
    
    try {
      const start = Date.now();
      const value = await this.client.get(key);
      const duration = Date.now() - start;
      
      logger.debug('Cache GET operation', {
        key,
        hit: value !== null,
        duration: `${duration}ms`
      });

      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache GET error', error, { key });
      return null;
    }
  }

  // Definir valor no cache
  async set(key, value, ttl = config.cache.ttl) {
    this.ensureConnected();
    
    try {
      const start = Date.now();
      const serializedValue = JSON.stringify(value);
      
      let result;
      if (ttl > 0) {
        result = await this.client.setEx(key, ttl, serializedValue);
      } else {
        result = await this.client.set(key, serializedValue);
      }
      
      const duration = Date.now() - start;
      
      logger.debug('Cache SET operation', {
        key,
        ttl,
        size: `${serializedValue.length} bytes`,
        duration: `${duration}ms`
      });

      return result;
    } catch (error) {
      logger.error('Cache SET error', error, { key, ttl });
      return false;
    }
  }

  // Deletar valor do cache
  async del(key) {
    this.ensureConnected();
    
    try {
      const start = Date.now();
      const result = await this.client.del(key);
      const duration = Date.now() - start;
      
      logger.debug('Cache DEL operation', {
        key,
        deleted: result > 0,
        duration: `${duration}ms`
      });

      return result > 0;
    } catch (error) {
      logger.error('Cache DEL error', error, { key });
      return false;
    }
  }

  // Verificar se chave existe
  async exists(key) {
    this.ensureConnected();
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache EXISTS error', error, { key });
      return false;
    }
  }

  // Definir TTL para uma chave
  async expire(key, ttl) {
    this.ensureConnected();
    
    try {
      const result = await this.client.expire(key, ttl);
      
      logger.debug('Cache EXPIRE operation', {
        key,
        ttl,
        success: result === 1
      });

      return result === 1;
    } catch (error) {
      logger.error('Cache EXPIRE error', error, { key, ttl });
      return false;
    }
  }

  // Incrementar valor
  async incr(key, by = 1) {
    this.ensureConnected();
    
    try {
      const result = by === 1 
        ? await this.client.incr(key)
        : await this.client.incrBy(key, by);
      
      logger.debug('Cache INCR operation', {
        key,
        by,
        newValue: result
      });

      return result;
    } catch (error) {
      logger.error('Cache INCR error', error, { key, by });
      return null;
    }
  }

  // Operações em lote
  async mget(keys) {
    this.ensureConnected();
    
    try {
      const start = Date.now();
      const values = await this.client.mGet(keys);
      const duration = Date.now() - start;
      
      const parsed = values.map(value => value ? JSON.parse(value) : null);
      
      logger.debug('Cache MGET operation', {
        keyCount: keys.length,
        hitCount: parsed.filter(v => v !== null).length,
        duration: `${duration}ms`
      });

      return parsed;
    } catch (error) {
      logger.error('Cache MGET error', error, { keys });
      return keys.map(() => null);
    }
  }

  // Limpar cache por padrão
  async delPattern(pattern) {
    this.ensureConnected();
    
    try {
      const keys = await this.client.keys(pattern);
      
      if (keys.length > 0) {
        const result = await this.client.del(keys);
        
        logger.info('Cache pattern deletion', {
          pattern,
          keysFound: keys.length,
          keysDeleted: result
        });
        
        return result;
      }
      
      return 0;
    } catch (error) {
      logger.error('Cache pattern deletion error', error, { pattern });
      return 0;
    }
  }

  // Flush database
  async flush() {
    this.ensureConnected();
    
    try {
      await this.client.flushDb();
      logger.info('Cache database flushed');
      return true;
    } catch (error) {
      logger.error('Cache flush error', error);
      return false;
    }
  }

  // Obter estatísticas
  async getStats() {
    this.ensureConnected();
    
    try {
      const info = await this.client.info('memory');
      const keyspace = await this.client.info('keyspace');
      const stats = await this.client.info('stats');
      
      return {
        memory: info,
        keyspace: keyspace,
        stats: stats,
        connected: this.isConnected
      };
    } catch (error) {
      logger.error('Cache stats error', error);
      return {
        connected: false,
        error: error.message
      };
    }
  }

  // Health check
  async healthCheck() {
    try {
      const start = Date.now();
      const pong = await this.client.ping();
      const duration = Date.now() - start;
      
      return {
        status: 'healthy',
        response: pong,
        latency: `${duration}ms`,
        connected: this.isConnected
      };
    } catch (error) {
      logger.error('Cache health check failed', error);
      
      return {
        status: 'unhealthy',
        error: error.message,
        connected: false
      };
    }
  }

  // Fechar conexão
  async close() {
    if (this.client) {
      logger.info('Closing Redis connection...');
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis connection closed');
    }
  }
}

// Middleware para cache de rotas
const cacheMiddleware = (ttl = config.cache.ttl) => {
  return async (req, res, next) => {
    if (!config.cache.enabled) {
      return next();
    }

    // Gerar chave do cache baseada na rota e query params
    const cacheKey = `route:${req.method}:${req.originalUrl}`;
    
    try {
      const cache = new RedisCache();
      if (!cache.isConnected) {
        return next();
      }

      // Tentar obter do cache
      const cachedResponse = await cache.get(cacheKey);
      
      if (cachedResponse) {
        logger.debug('Cache hit for route', { 
          key: cacheKey,
          method: req.method,
          url: req.originalUrl
        });
        
        return res.json(cachedResponse);
      }

      // Interceptar resposta para cachear
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        // Cachear apenas respostas de sucesso
        if (res.statusCode === 200) {
          cache.set(cacheKey, data, ttl).catch(error => {
            logger.error('Failed to cache response', error, { key: cacheKey });
          });
        }
        
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', error);
      next();
    }
  };
};

module.exports = {
  RedisCache,
  cacheMiddleware
}; 