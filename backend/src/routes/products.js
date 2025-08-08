const express = require('express');
const Joi = require('joi');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { upload, processImages, deleteImages } = require('../middleware/upload');

const router = express.Router();

// Validação de dados
const productSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().allow('').max(1000),
  price: Joi.number().positive().required(),
  quantity: Joi.number().integer().min(0).required(),
  category_id: Joi.string().uuid().required(),
  sizes: Joi.string().default('único'),
  featured: Joi.boolean().default(false)
});

const updateProductSchema = productSchema.fork(['name', 'price', 'quantity', 'category_id'], (schema) => schema.optional());

// GET /api/products - Listar produtos
router.get('/', async (req, res) => {
  try {
    const {
      category_id,
      featured,
      in_stock,
      include_deleted,
      search,
      limit,
      offset = 0
    } = req.query;

    const options = {
      includeDeleted: include_deleted === 'true',
      includeCategory: true,
      includeImages: true,
      categoryId: category_id || null,
      featured: featured !== undefined ? featured === 'true' : null,
      inStock: in_stock === 'true',
      limit: limit ? parseInt(limit) : null,
      offset: parseInt(offset)
    };

    let products;

    if (search) {
      products = await Product.search(search, options);
    } else {
      products = await Product.findAll(options);
    }

    // Adicionar URLs completas para as imagens
    const baseUrl = `${req.protocol}://${req.get('host')}/api/images`;
    
    products = products.map(product => {
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
      data: products,
      total: products.length
    });

  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/products/:id - Buscar produto por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id, {
      includeCategory: true,
      includeImages: true
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }

    // Adicionar URLs completas para as imagens
    const baseUrl = `${req.protocol}://${req.get('host')}/api/images`;
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

    res.json({
      success: true,
      data: productJson
    });

  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/products - Criar produto
router.post('/', async (req, res) => {
  try {
    console.log('📦 Recebendo dados para criar produto:', req.body);
    
    // Validar dados
    const { error, value } = productSchema.validate(req.body);
    if (error) {
      console.log('❌ Validação falhou:', error.details);
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.details.map(detail => detail.message),
        received_data: req.body
      });
    }

    // Verificar se a categoria existe
    const category = await Category.findById(value.category_id);
    if (!category) {
      // Listar categorias disponíveis para debug
      const availableCategories = await Category.findAll();
      return res.status(400).json({
        success: false,
        message: 'Categoria não encontrada',
        debug: {
          requested_category_id: value.category_id,
          available_categories: availableCategories.map(cat => ({
            id: cat.id,
            name: cat.name
          }))
        }
      });
    }

    // Criar produto
    const product = new Product(value);
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Produto criado com sucesso',
      data: product.toJSON()
    });

  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PUT /api/products/:id - Atualizar produto
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validar dados
    const { error, value } = updateProductSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Buscar produto
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }

    // Verificar categoria se fornecida
    if (value.category_id) {
      const category = await Category.findById(value.category_id);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Categoria não encontrada'
        });
      }
    }

    // Atualizar campos
    Object.assign(product, value);
    await product.save();

    res.json({
      success: true,
      message: 'Produto atualizado com sucesso',
      data: product.toJSON()
    });

  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// DELETE /api/products/:id - Deletar produto
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { hard_delete } = req.query;

    const product = await Product.findById(id, { includeImages: true });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }

    // Se for hard delete, remover imagens fisicamente
    if (hard_delete === 'true') {
      if (product.images && product.images.length > 0) {
        const imagePaths = product.images.map(img => img.file_path);
        await deleteImages(imagePaths);
      }
    }

    await product.delete(hard_delete !== 'true');

    res.json({
      success: true,
      message: hard_delete === 'true' 
        ? 'Produto deletado permanentemente' 
        : 'Produto removido do catálogo'
    });

  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/products/:id/images - Upload de imagens
router.post('/:id/images', 
  upload.array('images', 10), 
  processImages, 
  async (req, res) => {
    try {
      const { id } = req.params;

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produto não encontrado'
        });
      }

      if (!req.processedFiles || req.processedFiles.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nenhuma imagem foi enviada'
        });
      }

      const addedImages = [];

      for (const processedFile of req.processedFiles) {
        const imageId = await product.addImage({
          file_name: processedFile.original.file_name,
          file_path: processedFile.original.file_path,
          file_size: processedFile.original.file_size,
          mime_type: processedFile.original.mime_type,
          display_order: addedImages.length
        });

        addedImages.push({
          id: imageId,
          ...processedFile.original,
          url: `${req.protocol}://${req.get('host')}/api/images/${processedFile.original.file_path}`,
          thumbnail_url: `${req.protocol}://${req.get('host')}/api/images/${processedFile.thumbnail.file_path}`
        });
      }

      res.json({
        success: true,
        message: `${addedImages.length} imagem(ns) adicionada(s) com sucesso`,
        data: addedImages
      });

    } catch (error) {
      console.error('Erro ao fazer upload de imagens:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
);

// DELETE /api/products/:id/images/:imageId - Remover imagem
router.delete('/:id/images/:imageId', async (req, res) => {
  try {
    const { id, imageId } = req.params;

    const product = await Product.findById(id, { includeImages: true });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }

    // Encontrar a imagem
    const image = product.images?.find(img => img.id === imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Imagem não encontrada'
      });
    }

    // Remover do banco
    await product.removeImage(imageId);

    // Remover arquivos físicos
    await deleteImages(image.file_path);

    res.json({
      success: true,
      message: 'Imagem removida com sucesso'
    });

  } catch (error) {
    console.error('Erro ao remover imagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

module.exports = router; 