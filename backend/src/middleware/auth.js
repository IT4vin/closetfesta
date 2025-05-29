const jwt = require('jsonwebtoken');
const { Database } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'closet-festa-super-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

class AuthMiddleware {
  // Gerar token JWT
  static generateToken(user) {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role || 'admin'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  // Verificar token JWT
  static verifyToken(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso requerido'
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
  }

  // Verificar se é admin
  static requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Permissão de administrador requerida.'
      });
    }
    next();
  }
}

module.exports = AuthMiddleware; 