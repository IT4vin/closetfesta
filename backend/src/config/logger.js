const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('./config');

// Criar diretório de logs se não existir
const logDir = path.dirname(config.logging.file);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Formato personalizado para logs
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Formato para console (mais legível)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Configurar transports
const transports = [];

// Transport para arquivo
transports.push(
  new winston.transports.File({
    filename: config.logging.file,
    level: config.logging.level,
    format: logFormat,
    maxsize: config.logging.maxSize,
    maxFiles: config.logging.maxFiles,
    tailable: true
  })
);

// Transport para arquivo de erros
transports.push(
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: logFormat,
    maxsize: config.logging.maxSize,
    maxFiles: config.logging.maxFiles,
    tailable: true
  })
);

// Transport para console (apenas em desenvolvimento)
if (config.logging.enableConsole && config.server.env !== 'production') {
  transports.push(
    new winston.transports.Console({
      level: config.logging.level,
      format: consoleFormat
    })
  );
}

// Criar logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
  // Não sair do processo em caso de exceção não tratada
  exitOnError: false
});

// Capturar exceções não tratadas
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(logDir, 'exceptions.log'),
    format: logFormat
  })
);

// Capturar rejeições de Promise não tratadas
logger.rejections.handle(
  new winston.transports.File({
    filename: path.join(logDir, 'rejections.log'),
    format: logFormat
  })
);

// Métodos auxiliares para logging estruturado
const createLogger = (module) => {
  const moduleName = module ? path.basename(module) : 'app';
  
  return {
    info: (message, meta = {}) => {
      logger.info(message, { module: moduleName, ...meta });
    },
    
    warn: (message, meta = {}) => {
      logger.warn(message, { module: moduleName, ...meta });
    },
    
    error: (message, error = null, meta = {}) => {
      const logData = { module: moduleName, ...meta };
      
      if (error) {
        if (error instanceof Error) {
          logData.error = {
            message: error.message,
            stack: error.stack,
            name: error.name
          };
        } else {
          logData.error = error;
        }
      }
      
      logger.error(message, logData);
    },
    
    debug: (message, meta = {}) => {
      logger.debug(message, { module: moduleName, ...meta });
    },
    
    // Log de requisições HTTP
    request: (req, res, duration) => {
      const logData = {
        module: moduleName,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        userId: req.user?.id || null
      };
      
      const level = res.statusCode >= 400 ? 'warn' : 'info';
      logger[level](`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`, logData);
    },
    
    // Log de autenticação
    auth: (action, userId, success, meta = {}) => {
      logger.info(`Auth: ${action}`, {
        module: moduleName,
        action,
        userId,
        success,
        ...meta
      });
    },
    
    // Log de database
    database: (query, duration, error = null) => {
      const logData = {
        module: moduleName,
        query: query.slice(0, 200), // Limitar tamanho da query
        duration: `${duration}ms`
      };
      
      if (error) {
        logger.error('Database query failed', { ...logData, error: error.message });
      } else {
        logger.debug('Database query executed', logData);
      }
    },
    
    // Log de sistema
    system: (event, data = {}) => {
      logger.info(`System: ${event}`, {
        module: moduleName,
        event,
        ...data
      });
    }
  };
};

// Middleware para Express
const createRequestLogger = () => {
  return (req, res, next) => {
    const start = Date.now();
    
    // Override do método end para capturar a duração
    const originalEnd = res.end;
    res.end = function(...args) {
      const duration = Date.now() - start;
      
      // Log da requisição
      const moduleLogger = createLogger('request');
      moduleLogger.request(req, res, duration);
      
      // Chamar o método original
      originalEnd.apply(res, args);
    };
    
    next();
  };
};

// Interceptar logs do Morgan para Winston
const morganStream = {
  write: (message) => {
    logger.info(message.trim(), { module: 'morgan' });
  }
};

module.exports = {
  logger,
  createLogger,
  createRequestLogger,
  morganStream
}; 