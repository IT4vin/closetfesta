const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { Database } = require('./config/database');
const runMigrations = require('./migrations');

// Importar rotas
const productsRoutes = require('./routes/products');
const categoriesRoutes = require('./routes/categories');
const authRoutes = require('./routes/auth');
const ordersRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🚀 Iniciando servidor Closet Festa...');

// Conectar ao banco de dados
Database.getInstance();

// Executar migrações
(async () => {
  try {
    await runMigrations();
  } catch (error) {
    console.error('❌ Erro ao executar migrações:', error);
    process.exit(1);
  }
})();

// Configurar middlewares de segurança
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por IP
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:8083',
    'http://localhost:8084',
    'http://localhost:8085',
    'http://localhost:8086',
    'http://localhost:8087',
    'http://localhost:8088',
    'http://localhost:8089',
    'http://localhost:8090',
    'http://localhost:8091',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true
}));

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined'));

// Servir imagens estáticas
app.use('/api/images', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: process.env.DB_TYPE || 'sqlite'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: process.env.DB_TYPE || 'sqlite'
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/orders', ordersRoutes);

// Catálogo público (para showcase)
app.get('/api/catalog/products', async (req, res) => {
  try {
    const Product = require('./models/Product');
    
    const filters = {
      includeCategory: true,
      includeImages: true,
      category_id: req.query.category_id,
      search: req.query.search,
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0
    };

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
    
    res.json({
      success: true,
      data: productsWithUrls,
      total: productsWithUrls.length
    });
    
  } catch (error) {
    console.error('Erro no catálogo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🖼️  Imagens: http://localhost:${PORT}/api/images`);
  console.log(`📁 Database: ${process.env.DB_TYPE || 'sqlite'}`);
  console.log(`📋 Rotas disponíveis:`);
  console.log(`   POST /api/auth/login`);
  console.log(`   POST /api/auth/register`);
  console.log(`   GET  /api/auth/me`);
  console.log(`   POST /api/auth/refresh`);
  console.log(`   GET  /api/products`);
  console.log(`   POST /api/products`);
  console.log(`   GET  /api/products/:id`);
  console.log(`   PUT  /api/products/:id`);
  console.log(`   DEL  /api/products/:id`);
  console.log(`   POST /api/products/:id/images`);
  console.log(`   GET  /api/categories`);
  console.log(`   POST /api/categories`);
  console.log(`   GET  /api/orders`);
  console.log(`   POST /api/orders`);
  console.log(`   GET  /api/orders/stats`);
  console.log(`   GET  /api/orders/:id`);
  console.log(`   PUT  /api/orders/:id`);
  console.log(`   PATCH /api/orders/:id/status`);
  console.log(`   POST /api/orders/check-availability`);
  console.log(`   GET  /api/catalog/products (para showcase)`);
});

module.exports = app;