const express = require('express');
const Joi = require('joi');
const Category = require('../models/Category');

const router = express.Router();

// Validação de dados
const categorySchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().allow('').max(500)
});

const updateCategorySchema = categorySchema.fork(['name'], (schema) => schema.optional());

// GET /api/categories - Listar categorias
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;

    let categories;

    if (search) {
      categories = await Category.search(search);
    } else {
      categories = await Category.findAll();
    }

    res.json({
      success: true,
      data: categories.map(category => category.toJSON()),
      total: categories.length
    });

  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/categories/:id - Buscar categoria por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }

    res.json({
      success: true,
      data: category.toJSON()
    });

  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/categories/:id/products - Buscar produtos de uma categoria
router.get('/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      featured,
      in_stock,
      limit,
      offset = 0
    } = req.query;
    
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }

    const options = {
      featured: featured !== undefined ? featured === 'true' : null,
      inStock: in_stock === 'true',
      limit: limit ? parseInt(limit) : null,
      offset: parseInt(offset)
    };

    const products = await category.getProducts(options);

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
      data: {
        category: category.toJSON(),
        products: productsWithUrls
      },
      total: products.length
    });

  } catch (error) {
    console.error('Erro ao buscar produtos da categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/categories - Criar categoria
router.post('/', async (req, res) => {
  try {
    // Validar dados
    const { error, value } = categorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Verificar se já existe uma categoria com o mesmo nome
    const existingCategory = await Category.findByName(value.name);
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma categoria com este nome'
      });
    }

    // Criar categoria
    const category = new Category(value);
    await category.save();

    res.status(201).json({
      success: true,
      message: 'Categoria criada com sucesso',
      data: category.toJSON()
    });

  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PUT /api/categories/:id - Atualizar categoria
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validar dados
    const { error, value } = updateCategorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Buscar categoria
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }

    // Verificar se o novo nome já existe (se fornecido)
    if (value.name && value.name !== category.name) {
      const existingCategory = await Category.findByName(value.name);
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Já existe uma categoria com este nome'
        });
      }
    }

    // Atualizar campos
    Object.assign(category, value);
    await category.save();

    res.json({
      success: true,
      message: 'Categoria atualizada com sucesso',
      data: category.toJSON()
    });

  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// DELETE /api/categories/:id - Deletar categoria
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }

    await category.delete();

    res.json({
      success: true,
      message: 'Categoria deletada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    
    // Se for erro de constraint (produtos associados)
    if (error.message.includes('produto(s) associado(s)')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

module.exports = router; 