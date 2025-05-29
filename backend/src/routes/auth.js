const express = require('express');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const { Database } = require('../config/database');
const AuthMiddleware = require('../middleware/auth');

const router = express.Router();

// Schemas de validação
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'user').default('user')
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email, password } = req.body;
    const db = Database.getInstance();

    // Buscar usuário
    const user = await db.query(
      'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL',
      [email]
    );

    if (user.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos'
      });
    }

    const userData = user[0];

    // Verificar senha
    const validPassword = await bcrypt.compare(password, userData.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos'
      });
    }

    // Gerar token
    const token = AuthMiddleware.generateToken(userData);

    // Atualizar último login
    await db.query(
      'UPDATE users SET last_login = ? WHERE id = ?',
      [new Date().toISOString(), userData.id]
    );

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        token,
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role
        }
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { name, email, password, role } = req.body;
    const db = Database.getInstance();

    // Verificar se email já existe
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email já está em uso'
      });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const userId = require('uuid').v4();
    await db.query(
      `INSERT INTO users (id, name, email, password, role, created_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, name, email, hashedPassword, role, new Date().toISOString()]
    );

    // Buscar usuário criado
    const newUser = await db.query(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [userId]
    );

    // Gerar token
    const token = AuthMiddleware.generateToken(newUser[0]);

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: {
        token,
        user: newUser[0]
      }
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/auth/me
router.get('/me', AuthMiddleware.verifyToken, async (req, res) => {
  try {
    const db = Database.getInstance();
    
    const user = await db.query(
      'SELECT id, name, email, role, created_at, last_login FROM users WHERE id = ?',
      [req.user.id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: user[0]
    });

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/auth/refresh
router.post('/refresh', AuthMiddleware.verifyToken, async (req, res) => {
  try {
    const db = Database.getInstance();
    
    const user = await db.query(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Gerar novo token
    const token = AuthMiddleware.generateToken(user[0]);

    res.json({
      success: true,
      message: 'Token renovado com sucesso',
      data: {
        token,
        user: user[0]
      }
    });

  } catch (error) {
    console.error('Erro ao renovar token:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router; 