require('dotenv').config();

const config = {
  // Configurações do servidor
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development',
    host: process.env.HOST || 'localhost',
    apiPrefix: '/api',
    cors: {
      origins: process.env.CORS_ORIGINS 
        ? process.env.CORS_ORIGINS.split(',')
        : [
            // URLs locais para desenvolvimento
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:8080',
            'http://localhost:8081',
            'http://localhost:8082',
            'http://localhost:8083',
            'http://localhost:8084',
            'http://localhost:8085',
            // URLs do Render para produção
            'https://closetfesta-frontend.onrender.com',
            'https://closetfesta.onrender.com',
            // URLs genéricas do Render
            'https://*.onrender.com'
          ],
      credentials: true
    }
  },

  // Configurações do banco de dados
  database: {
    type: process.env.DB_TYPE || 'sqlite',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'closet_festa',
    username: process.env.DB_USERNAME || '',
    password: process.env.DB_PASSWORD || '',
    path: process.env.DB_PATH || './data/closet_festa.db',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      max: parseInt(process.env.DB_POOL_MAX) || 10
    },
    logging: process.env.DB_LOGGING === 'true',
    ssl: process.env.DB_SSL === 'true'
  },

  // Configurações de autenticação
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'closet-festa-super-secret-key-2024',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
    saltRounds: parseInt(process.env.SALT_ROUNDS) || 12,
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    lockoutTime: parseInt(process.env.LOCKOUT_TIME) || 15 * 60 * 1000 // 15 minutes
  },

  // Configurações de upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: process.env.ALLOWED_MIME_TYPES
      ? process.env.ALLOWED_MIME_TYPES.split(',')
      : ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    tempDir: process.env.TEMP_DIR || './temp',
    imageQuality: parseInt(process.env.IMAGE_QUALITY) || 85,
    thumbnailSize: {
      width: parseInt(process.env.THUMBNAIL_WIDTH) || 300,
      height: parseInt(process.env.THUMBNAIL_HEIGHT) || 300
    }
  },

  // Configurações de rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    authMax: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 5, // Para endpoints de auth
    authWindowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW) || 15 * 60 * 1000
  },

  // Configurações de logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
    datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD',
    enableConsole: process.env.ENABLE_CONSOLE_LOG !== 'false'
  },

  // Configurações de email (para futuras implementações)
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@closetfesta.com'
  },

  // Configurações de cache Redis
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    host: process.env.CACHE_HOST || 'localhost',
    port: parseInt(process.env.CACHE_PORT) || 6379,
    password: process.env.CACHE_PASSWORD || '',
    database: parseInt(process.env.CACHE_DATABASE) || 0,
    ttl: parseInt(process.env.CACHE_TTL) || 3600, // 1 hour
    max: parseInt(process.env.CACHE_MAX) || 1000,
    tls: process.env.CACHE_TLS === 'true'
  },

  // Configurações de backup
  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Todo dia às 2h
    retention: parseInt(process.env.BACKUP_RETENTION) || 7, // 7 days
    path: process.env.BACKUP_PATH || './backups'
  },

  // Configurações de segurança
  security: {
    enableHelmet: process.env.ENABLE_HELMET !== 'false',
    enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
    enableHttps: process.env.ENABLE_HTTPS === 'true',
    httpsPort: parseInt(process.env.HTTPS_PORT) || 443,
    sslCert: process.env.SSL_CERT || '',
    sslKey: process.env.SSL_KEY || ''
  },

  // Configurações da aplicação
  app: {
    name: process.env.APP_NAME || 'Closet Festa',
    version: process.env.APP_VERSION || '1.0.0',
    description: process.env.APP_DESCRIPTION || 'Sistema de gerenciamento para loja de roupas',
    timezone: process.env.TZ || 'America/Sao_Paulo',
    currency: process.env.CURRENCY || 'BRL',
    locale: process.env.LOCALE || 'pt-BR'
  }
};

// Validar configurações críticas
const validateConfig = () => {
  const errors = [];

  if (!config.auth.jwtSecret || config.auth.jwtSecret.length < 32) {
    errors.push('JWT_SECRET deve ter pelo menos 32 caracteres');
  }

  if (config.database.type === 'postgresql' && !config.database.host) {
    errors.push('DB_HOST é obrigatório para PostgreSQL');
  }

  if (config.server.env === 'production' && config.logging.level === 'debug') {
    console.warn('⚠️ Log level "debug" não é recomendado em produção');
  }

  if (errors.length > 0) {
    throw new Error(`Erros de configuração:\n${errors.join('\n')}`);
  }
};

// Validar configuração na inicialização
validateConfig();

module.exports = config; 