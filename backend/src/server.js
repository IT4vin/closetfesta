const express = require('express');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Configurações e logging
const config = require('./config/config');
const { createLogger, createRequestLogger, morganStream } = require('./config/logger');
const logger = createLogger(__filename);

// Database e migrações
const { Database } = require('./config/database');
const runMigrations = require('./migrations');

// Cache Redis (opcional)
let redisCache = null;
let cacheMiddleware = null;
if (config.cache.enabled) {
  try {
    const { RedisCache, cacheMiddleware: redisCacheMiddleware } = require('./config/cache-redis');
    redisCache = new RedisCache();
    cacheMiddleware = redisCacheMiddleware;
    logger.info('Redis cache enabled');
  } catch (error) {
    logger.warn('Redis cache disabled - Redis not available', error.message);
  }
}

// Importar rotas
const productsRoutes = require('./routes/products');
const categoriesRoutes = require('./routes/categories');
const authRoutes = require('./routes/auth');
const ordersRoutes = require('./routes/orders');

// Criar aplicação Express
const app = express();

// Configuração de timezone
process.env.TZ = config.app.timezone;

logger.system('Starting Closet Festa Backend Server', {
  version: config.app.version,
  environment: config.server.env,
  port: config.server.port,
  timezone: config.app.timezone
});

// Inicializar banco de dados
const initializeDatabase = async () => {
  try {
    logger.info('Initializing database connection...');
    Database.getInstance();
    
    logger.info('Running database migrations...');
    await runMigrations();
    
    // Verificar se há categorias no banco
    const database = Database.getInstance();
    const categories = await database.query('SELECT COUNT(*) as count FROM product_categories WHERE deleted_at IS NULL');
    
    if (categories[0].count === 0) {
      logger.warn('No categories found, database might need seeding');
      logger.info('Consider running: npm run seed');
    } else {
      logger.info(`Found ${categories[0].count} categories in database`);
    }
    
    logger.system('Database initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database', error);
    
    // Em produção, tentar continuar mesmo com erro de banco
    if (process.env.NODE_ENV === 'production') {
      logger.warn('Continuing server startup despite database error (production mode)');
    } else {
      process.exit(1);
    }
  }
};

// Inicializar banco
initializeDatabase();

// Criar diretórios necessários
const createDirectories = () => {
  const dirs = [
    config.upload.uploadDir,
    config.upload.tempDir,
    path.join(config.upload.uploadDir, 'products'),
    path.join(config.upload.uploadDir, 'products', 'thumbnails'),
    path.dirname(config.logging.file)
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.debug(`Created directory: ${dir}`);
    }
  });
};

createDirectories();

// Middlewares de segurança
if (config.security.enableHelmet) {
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:", "*"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        fontSrc: ["'self'", "data:"]
      }
    }
  }));
}

// Compressão
if (config.security.enableCompression) {
  app.use(compression());
}

// Rate limiting para API
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente em alguns minutos.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl
    });
    res.status(429).json({
      success: false,
      message: 'Muitas requisições. Tente novamente em alguns minutos.'
    });
  }
});

// Rate limiting específico para autenticação
const authLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMax,
  message: {
    success: false,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    retryAfter: Math.ceil(config.rateLimit.authWindowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl
    });
    res.status(429).json({
      success: false,
      message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
    });
  }
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// CORS
app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Verificar se a origin está na lista permitida
    const isAllowed = config.server.cors.origins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        // Converter wildcard para regex
        const regex = new RegExp(allowedOrigin.replace(/\*/g, '.*'));
        return regex.test(origin);
      }
      return allowedOrigin === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin, allowedOrigins: config.server.cors.origins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: config.server.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Parsing do body
app.use(express.json({ 
  limit: config.upload.maxFileSize,
  verify: (req, res, buf) => {
    // Verificar tamanho do payload
    if (buf.length > config.upload.maxFileSize) {
      const error = new Error('Payload muito grande');
      error.status = 413;
      throw error;
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: config.upload.maxFileSize 
}));

// Logging de requisições
app.use(createRequestLogger());

// Trust proxy para obter IP real
app.set('trust proxy', 1);

// Servir arquivos estáticos (imagens)
app.use('/api/images', express.static(config.upload.uploadDir, {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  cacheControl: true
}));

// Health check endpoints
app.get('/health', async (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: config.app.version,
    environment: config.server.env,
    database: config.database.type,
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  };

  // Adicionar status do cache Redis se disponível
  if (redisCache) {
    try {
      const cacheHealth = await redisCache.healthCheck();
      healthData.cache = cacheHealth;
    } catch (error) {
      healthData.cache = { status: 'error', error: error.message };
    }
  }
  
  logger.debug('Health check requested', { endpoint: '/health' });
  res.json(healthData);
});

app.get('/api/health', async (req, res) => {
  try {
    const database = Database.getInstance();
    
    // Verificar categorias
    const categories = await database.query('SELECT COUNT(*) as count FROM product_categories WHERE deleted_at IS NULL');
    const products = await database.query('SELECT COUNT(*) as count FROM products WHERE deleted_at IS NULL');
    
    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: config.app.version,
      environment: config.server.env,
      database: {
        type: config.database.type,
        categories_count: categories[0].count,
        products_count: products[0].count,
        path: config.database.path
      },
      cors_origins: config.server.cors.origins
    };
    
    logger.debug('API health check requested', { endpoint: '/api/health' });
    res.json(healthData);
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(500).json({
      status: 'ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: config.app.name,
    version: config.app.version,
    description: config.app.description,
    environment: config.server.env,
    timezone: config.app.timezone,
    currency: config.app.currency,
    locale: config.app.locale,
    features: {
      authentication: true,
      fileUpload: true,
      rateLimit: true,
      logging: true,
      compression: config.security.enableCompression,
      helmet: config.security.enableHelmet,
      cache: config.cache.enabled && redisCache !== null
    }
  });
});

// Debug endpoint para verificar estado do sistema
app.get('/api/debug', async (req, res) => {
  try {
    const database = Database.getInstance();
    
    // Buscar categorias
    const categories = await database.query('SELECT * FROM product_categories WHERE deleted_at IS NULL LIMIT 10');
    const products = await database.query('SELECT * FROM products WHERE deleted_at IS NULL LIMIT 5');
    
    res.json({
      success: true,
      debug_info: {
        environment: config.server.env,
        database_type: config.database.type,
        database_path: config.database.path,
        cors_origins: config.server.cors.origins,
        categories: {
          count: categories.length,
          list: categories.map(cat => ({ id: cat.id, name: cat.name }))
        },
        products: {
          count: products.length,
          list: products.map(prod => ({ id: prod.id, name: prod.name, category_id: prod.category_id }))
        },
        server_info: {
          port: config.server.port,
          host: config.server.host,
          uptime: process.uptime()
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter informações de debug',
      error: error.message
    });
  }
});

// Cache management endpoints (apenas para admins)
app.delete('/api/cache', async (req, res) => {
  if (!redisCache) {
    return res.status(404).json({
      success: false,
      message: 'Cache não está habilitado'
    });
  }

  try {
    const pattern = req.query.pattern || '*';
    const deletedCount = await redisCache.delPattern(pattern);
    
    logger.info('Cache cleared', { pattern, deletedCount });
    
    res.json({
      success: true,
      message: 'Cache limpo com sucesso',
      deletedKeys: deletedCount
    });
  } catch (error) {
    logger.error('Error clearing cache', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao limpar cache'
    });
  }
});

app.get('/api/cache/stats', async (req, res) => {
  if (!redisCache) {
    return res.status(404).json({
      success: false,
      message: 'Cache não está habilitado'
    });
  }

  try {
    const stats = await redisCache.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting cache stats', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas do cache'
    });
  }
});

// Cache middleware para rotas GET (se Redis estiver disponível)
if (cacheMiddleware) {
  app.use('/api/products', (req, res, next) => {
    if (req.method === 'GET') {
      return cacheMiddleware(300)(req, res, next); // Cache por 5 minutos
    }
    next();
  });
  
  app.use('/api/categories', (req, res, next) => {
    if (req.method === 'GET') {
      return cacheMiddleware(600)(req, res, next); // Cache por 10 minutos
    }
    next();
  });

  app.use('/api/catalog', (req, res, next) => {
    if (req.method === 'GET') {
      return cacheMiddleware(900)(req, res, next); // Cache por 15 minutos
    }
    next();
  });
}

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/orders', ordersRoutes);

// Catálogo público para showcase
app.get('/api/catalog/products', async (req, res) => {
  try {
    const Product = require('./models/Product');
    
    const filters = {
      includeCategory: true,
      includeImages: true,
      category_id: req.query.category_id,
      search: req.query.search,
      limit: Math.min(parseInt(req.query.limit) || 20, 100), // Máximo 100
      offset: parseInt(req.query.offset) || 0
    };

    logger.debug('Catalog request', { filters });

    const products = await Product.findAll(filters);
    
    // Adicionar URLs completas para as imagens
    const baseUrl = `${req.protocol}://${req.get('host')}/api/images`;
    
    const productsWithUrls = products.map(product => {
      const productJson = product.toJSON();
      if (productJson.images) {
        productJson.images = productJson.images.map(img => ({
          ...img,
          url: `${baseUrl}/${img.file_path}`,
          thumbnail_url: img.file_path.includes('thumbnails/') 
            ? `${baseUrl}/${img.file_path}` 
            : `${baseUrl}/${img.file_path.replace('products/', 'products/thumbnails/').replace('.webp', '-thumb.webp')}`
        }));
      }
      return productJson;
    });
    
    logger.info('Catalog products retrieved', { 
      count: productsWithUrls.length,
      filters 
    });
    
    res.json({
      success: true,
      data: productsWithUrls,
      total: productsWithUrls.length,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        hasMore: productsWithUrls.length === filters.limit
      }
    });
    
  } catch (error) {
    logger.error('Error retrieving catalog products', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  logger.error('Unhandled error', error, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Erro de payload muito grande
  if (error.status === 413) {
    return res.status(413).json({
      success: false,
      message: 'Arquivo muito grande',
      maxSize: `${Math.round(config.upload.maxFileSize / 1024 / 1024)}MB`
    });
  }

  // Erro de JSON malformado
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'JSON inválido'
    });
  }

  // Erro genérico
  res.status(error.status || 500).json({
    success: false,
    message: config.server.env === 'production' 
      ? 'Erro interno do servidor' 
      : error.message,
    ...(config.server.env !== 'production' && { stack: error.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  logger.warn('Route not found', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado',
    availableEndpoints: [
      'GET /health',
      'GET /api/health',
      'GET /api/info',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/auth/me',
      'POST /api/auth/refresh',
      'GET /api/products',
      'POST /api/products',
      'GET /api/products/:id',
      'PUT /api/products/:id',
      'DELETE /api/products/:id',
      'POST /api/products/:id/images',
      'GET /api/categories',
      'POST /api/categories',
      'GET /api/orders',
      'POST /api/orders',
      'GET /api/catalog/products'
    ]
  });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.system(`Received ${signal}, starting graceful shutdown...`);
  
  const server = app.listen(config.server.port, () => {
    logger.system('Server closed, exiting process');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forcing server close after timeout');
    server.close(() => {
      process.exit(1);
    });
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Iniciar servidor
const server = app.listen(config.server.port, config.server.host, () => {
  logger.system('Server started successfully', {
    port: config.server.port,
    host: config.server.host,
    environment: config.server.env,
    baseUrl: `http://${config.server.host}:${config.server.port}`,
    apiUrl: `http://${config.server.host}:${config.server.port}/api`,
    healthUrl: `http://${config.server.host}:${config.server.port}/health`,
    imagesUrl: `http://${config.server.host}:${config.server.port}/api/images`,
    catalogUrl: `http://${config.server.host}:${config.server.port}/api/catalog/products`
  });

  logger.info('Available API endpoints:', {
    auth: [
      'POST /api/auth/login',
      'POST /api/auth/register', 
      'GET /api/auth/me',
      'POST /api/auth/refresh'
    ],
    products: [
      'GET /api/products',
      'POST /api/products',
      'GET /api/products/:id',
      'PUT /api/products/:id',
      'DELETE /api/products/:id',
      'POST /api/products/:id/images'
    ],
    categories: [
      'GET /api/categories',
      'POST /api/categories',
      'GET /api/categories/:id',
      'PUT /api/categories/:id',
      'DELETE /api/categories/:id'
    ],
    orders: [
      'GET /api/orders',
      'POST /api/orders',
      'GET /api/orders/stats',
      'GET /api/orders/:id',
      'PUT /api/orders/:id',
      'PATCH /api/orders/:id/status'
    ],
    public: [
      'GET /api/catalog/products'
    ]
  });
});

// Configurar timeout do servidor
server.timeout = 30000; // 30 segundos

module.exports = app;