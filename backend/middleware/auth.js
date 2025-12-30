// ================================================
// MIDDLEWARE DE AUTENTICACIÓN Y AUTORIZACIÓN
// JD CLEANING SERVICES
// ================================================

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { queryOne } = require('../config/database');

// ================================================
// AUTENTICACIÓN JWT
// ================================================

/**
 * Middleware para verificar token JWT
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 * @param {NextFunction} next - Next function
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        error: 'Token de acceso requerido',
        message: 'Debes iniciar sesión para acceder a este recurso'
      });
    }
    
    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Obtener información completa del usuario
    const user = await queryOne(
      'SELECT id, name, email, role, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );
    
    if (!user) {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'El usuario asociado al token no existe'
      });
    }
    
    if (!user.is_active) {
      return res.status(401).json({
        error: 'Usuario desactivado',
        message: 'Tu cuenta ha sido desactivada. Contacta al administrador'
      });
    }
    
    // Agregar información del usuario al request
    req.user = user;
    req.userId = user.id;
    req.userRole = user.role;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'El token proporcionado no es válido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        message: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente'
      });
    }
    
    console.error('Error en autenticación:', error);
    return res.status(500).json({
      error: 'Error de autenticación',
      message: 'Error interno del servidor durante la autenticación'
    });
  }
};

// ================================================
// AUTORIZACIÓN POR ROLES
// ================================================

/**
 * Crear middleware para verificar roles específicos
 * @param {string|array} allowedRoles - Roles permitidos
 * @returns {Function} Middleware function
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.userRole;
    
    if (!userRole) {
      return res.status(401).json({
        error: 'Rol no identificado',
        message: 'No se pudo identificar tu rol de usuario'
      });
    }
    
    // Convertir a array si es string
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: `No tienes permisos para realizar esta acción. Rol requerido: ${roles.join(' o ')}`
      });
    }
    
    next();
  };
};

// ================================================
// ROLES ESPECÍFICOS (SHORTCUTS)
// ================================================

// Solo administradores
const requireAdmin = requireRole('admin');

// Administradores y jefes
const requireSupervisor = requireRole(['admin', 'jefe']);

// Administradores, jefes y gerentes
const requireManager = requireRole(['admin', 'jefe', 'gerente']);

// Todos los roles (usuario autenticado)
const requireAuth = authenticateToken;

// ================================================
// UTILIDADES DE AUTENTICACIÓN
// ================================================

/**
 * Generar token JWT
 * @param {object} user - Datos del usuario
 * @param {string} expiresIn - Tiempo de expiración
 * @returns {string} JWT token
 */
const generateToken = (user, expiresIn = process.env.JWT_EXPIRES_IN || '7d') => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Hash de contraseña
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<string>} Contraseña hasheada
 */
const hashPassword = async (password) => {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Verificar contraseña
 * @param {string} password - Contraseña en texto plano
 * @param {string} hashedPassword - Contraseña hasheada
 * @returns {Promise<boolean>} True si coinciden
 */
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Verificar si el usuario puede acceder a una orden específica
 * @param {number} userId - ID del usuario
 * @param {string} userRole - Rol del usuario
 * @param {number} orderId - ID de la orden
 * @returns {Promise<boolean>} True si puede acceder
 */
const canAccessOrder = async (userId, userRole, orderId) => {
  try {
    // Administradores, jefes y gerentes pueden ver todas las órdenes
    if (['admin', 'jefe', 'gerente'].includes(userRole)) {
      return true;
    }
    
    // Los trabajadores solo pueden ver órdenes asignadas a ellos
    if (userRole === 'trabajador') {
      const assignment = await queryOne(
        `SELECT id FROM order_assignments 
         WHERE order_id = ? AND user_id = ? AND is_active = true`,
        [orderId, userId]
      );
      return !!assignment;
    }
    
    return false;
  } catch (error) {
    console.error('Error verificando acceso a orden:', error);
    return false;
  }
};

/**
 * Middleware para verificar acceso a orden específica
 */
const requireOrderAccess = async (req, res, next) => {
  try {
    const orderId = req.params.id || req.params.orderId || req.body.orderId;
    
    if (!orderId) {
      return res.status(400).json({
        error: 'ID de orden requerido',
        message: 'No se proporcionó el ID de la orden'
      });
    }
    
    const hasAccess = await canAccessOrder(req.userId, req.userRole, orderId);
    
    if (!hasAccess) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permisos para acceder a esta orden'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error en verificación de acceso a orden:', error);
    return res.status(500).json({
      error: 'Error de autorización',
      message: 'Error interno durante la verificación de permisos'
    });
  }
};

/**
 * Verificar si un usuario puede modificar otros usuarios
 * @param {string} userRole - Rol del usuario actual
 * @param {string} targetRole - Rol del usuario objetivo
 * @returns {boolean} True si puede modificar
 */
const canModifyUser = (userRole, targetRole) => {
  // Administradores pueden modificar a cualquiera
  if (userRole === 'admin') {
    return true;
  }
  
  // Jefes pueden modificar gerentes y trabajadores
  if (userRole === 'jefe') {
    return ['gerente', 'trabajador'].includes(targetRole);
  }
  
  // Otros roles no pueden modificar usuarios
  return false;
};

/**
 * Middleware para verificar permisos de modificación de usuario
 */
const requireUserModifyPermission = async (req, res, next) => {
  try {
    const targetUserId = req.params.id || req.params.userId;
    
    if (!targetUserId) {
      return res.status(400).json({
        error: 'ID de usuario requerido'
      });
    }
    
    // Si está modificando su propio perfil, está permitido
    if (parseInt(targetUserId) === req.userId) {
      return next();
    }
    
    // Obtener rol del usuario objetivo
    const targetUser = await queryOne(
      'SELECT role FROM users WHERE id = ?',
      [targetUserId]
    );
    
    if (!targetUser) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }
    
    if (!canModifyUser(req.userRole, targetUser.role)) {
      return res.status(403).json({
        error: 'Permisos insuficientes',
        message: 'No tienes permisos para modificar este usuario'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error verificando permisos de usuario:', error);
    return res.status(500).json({
      error: 'Error de autorización'
    });
  }
};

// ================================================
// EXPORTAR FUNCIONES Y MIDDLEWARES
// ================================================
module.exports = {
  // Middlewares principales
  authenticateToken,
  requireRole,
  requireAdmin,
  requireSupervisor,
  requireManager,
  requireAuth,
  requireOrderAccess,
  requireUserModifyPermission,
  
  // Utilidades
  generateToken,
  hashPassword,
  verifyPassword,
  canAccessOrder,
  canModifyUser
};