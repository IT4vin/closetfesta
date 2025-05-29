const express = require('express');
const Joi = require('joi');
const Order = require('../models/Order');
const AuthMiddleware = require('../middleware/auth');

const router = express.Router();

// Schemas de validação
const orderSchema = Joi.object({
  customer_name: Joi.string().min(2).max(100).required(),
  customer_email: Joi.string().email().required(),
  customer_phone: Joi.string().min(10).max(20).required(),
  customer_address: Joi.string().max(500),
  order_type: Joi.string().valid('rental', 'sale').required(),
  rental_start_date: Joi.when('order_type', {
    is: 'rental',
    then: Joi.string().isoDate().required(),
    otherwise: Joi.optional()
  }),
  rental_end_date: Joi.when('order_type', {
    is: 'rental',
    then: Joi.string().isoDate().required(),
    otherwise: Joi.optional()
  }),
  discount: Joi.number().min(0).default(0),
  notes: Joi.string().max(1000),
  items: Joi.array().items(
    Joi.object({
      product_id: Joi.string().uuid().required(),
      quantity: Joi.number().integer().min(1).required(),
      size: Joi.string().max(20),
      unit_price: Joi.number().min(0).required()
    })
  ).min(1).required()
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid(
    'pending', 'confirmed', 'preparing', 
    'ready', 'delivered', 'returned', 'cancelled'
  ).required()
});

// GET /api/orders - Listar pedidos (Admin)
router.get('/', AuthMiddleware.verifyToken, AuthMiddleware.requireAdmin, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      order_type: req.query.order_type,
      customer_email: req.query.customer_email,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    const orders = await Order.findAll(filters);

    res.json({
      success: true,
      data: orders,
      total: orders.length
    });

  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/orders/stats - Estatísticas dos pedidos (Admin)
router.get('/stats', AuthMiddleware.verifyToken, AuthMiddleware.requireAdmin, async (req, res) => {
  try {
    const filters = {
      date_from: req.query.date_from,
      date_to: req.query.date_to
    };

    const stats = await Order.getStatistics(filters);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/orders/:id - Buscar pedido por ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/orders - Criar novo pedido
router.post('/', async (req, res) => {
  try {
    const { error } = orderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const orderData = req.body;

    // Verificar disponibilidade dos produtos
    const unavailableItems = await Order.checkProductAvailability(
      orderData.items,
      orderData.rental_start_date,
      orderData.rental_end_date
    );

    if (unavailableItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Alguns produtos não estão disponíveis',
        data: { unavailable_items: unavailableItems }
      });
    }

    // Criar pedido
    const order = new Order(orderData);
    order.calculateTotals();
    
    await order.save();

    res.status(201).json({
      success: true,
      message: 'Pedido criado com sucesso',
      data: order
    });

  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/orders/:id - Atualizar pedido (Admin)
router.put('/:id', AuthMiddleware.verifyToken, AuthMiddleware.requireAdmin, async (req, res) => {
  try {
    const { error } = orderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const existingOrder = await Order.findById(req.params.id);
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    // Atualizar dados do pedido
    Object.assign(existingOrder, req.body);
    existingOrder.calculateTotals();
    
    await existingOrder.save();

    res.json({
      success: true,
      message: 'Pedido atualizado com sucesso',
      data: existingOrder
    });

  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PATCH /api/orders/:id/status - Atualizar status do pedido
router.patch('/:id/status', AuthMiddleware.verifyToken, AuthMiddleware.requireAdmin, async (req, res) => {
  try {
    const { error } = updateStatusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    await order.updateStatus(req.body.status);

    res.json({
      success: true,
      message: 'Status do pedido atualizado com sucesso',
      data: order
    });

  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/orders/:id - Deletar pedido (Admin)
router.delete('/:id', AuthMiddleware.verifyToken, AuthMiddleware.requireAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    await order.delete();

    res.json({
      success: true,
      message: 'Pedido deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/orders/check-availability - Verificar disponibilidade
router.post('/check-availability', async (req, res) => {
  try {
    const schema = Joi.object({
      items: Joi.array().items(
        Joi.object({
          product_id: Joi.string().uuid().required(),
          quantity: Joi.number().integer().min(1).required()
        })
      ).min(1).required(),
      rental_start_date: Joi.string().isoDate(),
      rental_end_date: Joi.string().isoDate()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { items, rental_start_date, rental_end_date } = req.body;

    const unavailableItems = await Order.checkProductAvailability(
      items,
      rental_start_date,
      rental_end_date
    );

    res.json({
      success: true,
      data: {
        available: unavailableItems.length === 0,
        unavailable_items: unavailableItems
      }
    });

  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router; 