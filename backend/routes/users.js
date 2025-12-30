// ================================================
// RUTAS DE GESTIÓN DE USUARIOS - JD CLEANING SERVICES - CORREGIDO
// ================================================

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { 
  requireRole,
  requireSupervisor,
  requireUserModifyPermission,
  hashPassword,
  canModifyUser
} = require('../middleware/auth');
const { 
  logActivity, 
  logError 
} = require('../middleware/logger');
const { 
  ValidationError,
  NotFoundError,
  ConflictError,
  AuthorizationError
} = require('../middleware/errorHandler');
const { query, queryOne, insert, update } = require('../config/database');

const router = express.Router();

// ================================================
// VALIDACIONES
// ================================================

const createUserValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido')
    .isLength({ max: 100 })
    .withMessage('El email no puede exceder 100 caracteres'),
  body('password')
    .isLength({ min: 6, max: 50 })
    .withMessage('La contraseña debe tener entre 6 y 50 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  body('role')
    .isIn(['admin', 'jefe', 'gerente', 'trabajador'])
    .withMessage('Rol no válido')
];

const updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido')
    .isLength({ max: 100 })
    .withMessage('El email no puede exceder 100 caracteres'),
  body('role')
    .optional()
    .isIn(['admin', 'jefe', 'gerente', 'trabajador'])
    .withMessage('Rol no válido')
];

const userIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de usuario debe ser un número válido')
];

// ================================================
// FUNCIÓN PARA MANEJAR ERRORES DE VALIDACIÓN
// ================================================
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      error: 'Errores de validación',
      message: 'Los datos proporcionados no son válidos',
      details: errorMessages
    });
  }
  next();
};

// ================================================
// LISTAR TODOS LOS USUARIOS - SIMPLIFICADO
// ================================================
router.get('/', requireSupervisor, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;
    const offset = (page - 1) * limit;
    const userRole = req.userRole;
    
    // Construir query base simple
    let baseQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.is_active,
        u.created_at,
        creator.name as created_by_name,
        0 as total_orders_assigned,
        0 as orders_completed
      FROM users u
      LEFT JOIN users creator ON u.created_by = creator.id
    `;
    
    // Construir condiciones WHERE
    let whereConditions = [];
    let queryParams = [];
    
    // Filtro por rol
    if (role && ['admin', 'jefe', 'gerente', 'trabajador'].includes(role)) {
      whereConditions.push('u.role = ?');
      queryParams.push(role);
    }
    
    // Filtro por estado
    if (status === 'active') {
      whereConditions.push('u.is_active = 1');
    } else if (status === 'inactive') {
      whereConditions.push('u.is_active = 0');
    }
    
    // Búsqueda por nombre o email
    if (search) {
      whereConditions.push('(u.name LIKE ? OR u.email LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    // Los jefes no pueden ver administradores
    if (userRole === 'jefe') {
      whereConditions.push('u.role != ?');
      queryParams.push('admin');
    }
    
    // Agregar WHERE si hay condiciones
    if (whereConditions.length > 0) {
      baseQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    // Completar query
    const usersQuery = baseQuery + ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), offset);
    
    // Query para contar total
    let countQuery = `SELECT COUNT(*) as total FROM users u`;
    if (whereConditions.length > 0) {
      countQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    const countParams = queryParams.slice(0, -2); // Remover limit y offset
    
    // Ejecutar ambas queries
    const usersResult = await query(usersQuery, queryParams);
    const countResult = await query(countQuery, countParams);
    
    const users = usersResult.rows;
    const total = countResult.rows[0].total;
    const totalPages = Math.ceil(total / limit);
    
    // Registrar actividad
    await logActivity(
      req.userId, 
      null, 
      'users_listed', 
      `Usuario ${req.user.name} listó usuarios (página ${page})`,
      req
    );
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total_items: total,
          total_pages: totalPages,
          has_next_page: page < totalPages,
          has_prev_page: page > 1
        },
        filters_applied: {
          role: role || null,
          status: status || null,
          search: search || null
        }
      }
    });
    
  } catch (error) {
    logError(error, req, 'List Users Route');
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al obtener la lista de usuarios'
    });
  }
});

// ================================================
// OBTENER USUARIO POR ID
// ================================================
router.get('/:id', userIdValidation, handleValidationErrors, requireSupervisor, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const currentUserRole = req.userRole;
    
    // Obtener información básica del usuario
    const user = await queryOne(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.is_active,
        u.created_at,
        u.updated_at,
        creator.name as created_by_name
      FROM users u
      LEFT JOIN users creator ON u.created_by = creator.id
      WHERE u.id = ?
    `, [userId]);
    
    if (!user) {
      throw new NotFoundError('Usuario');
    }
    
    // Los jefes no pueden ver administradores
    if (currentUserRole === 'jefe' && user.role === 'admin') {
      throw new AuthorizationError('No tienes permisos para ver este usuario');
    }
    
    // Registrar actividad
    await logActivity(
      req.userId, 
      null, 
      'user_viewed', 
      `Usuario ${req.user.name} vio detalles de ${user.name}`,
      req
    );
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          created_at: user.created_at,
          updated_at: user.updated_at,
          created_by_name: user.created_by_name,
          stats: {
            total_orders_assigned: 0,
            orders_completed: 0,
            total_hours_worked: 0,
            completion_rate: 0
          }
        },
        recent_orders: []
      }
    });
    
  } catch (error) {
    logError(error, req, 'Get User Route');
    
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      return res.status(error.statusCode || 404).json({
        error: error.name,
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al obtener información del usuario'
    });
  }
});

// ================================================
// CREAR NUEVO USUARIO
// ================================================
router.post('/', createUserValidation, handleValidationErrors, requireSupervisor, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const creatorRole = req.userRole;
    const creatorId = req.userId;
    
    // Verificar que jefe no cree admins
    if (creatorRole === 'jefe' && role === 'admin') {
      throw new AuthorizationError('Los jefes no pueden crear administradores');
    }
    
    // Verificar si el email ya existe
    const existingUser = await queryOne(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()]
    );
    
    if (existingUser) {
      throw new ConflictError('Este email ya está registrado');
    }
    
    // Hash de la contraseña
    const hashedPassword = await hashPassword(password);
    
    // Insertar nuevo usuario
    const userData = {
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      created_by: creatorId,
      is_active: true
    };
    
    const newUserId = await insert('users', userData);
    
    // Registrar la actividad
    await logActivity(
      creatorId, 
      null, 
      'user_created', 
      `Usuario ${name} (${role}) creado por ${req.user.name}`,
      req
    );
    
    res.status(201).json({
      success: true,
      message: `Usuario ${name} creado exitosamente`,
      data: {
        user: {
          id: newUserId,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          is_active: userData.is_active,
          created_by_name: req.user.name
        }
      }
    });
    
  } catch (error) {
    logError(error, req, 'Create User Route');
    
    if (error instanceof ConflictError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        error: error.name,
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al crear el usuario'
    });
  }
});

// ================================================
// ACTUALIZAR USUARIO
// ================================================
router.put('/:id', userIdValidation, updateUserValidation, handleValidationErrors, requireUserModifyPermission, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { name, email, role } = req.body;
    const currentUserRole = req.userRole;
    const currentUserId = req.userId;
    
    // Obtener usuario actual
    const existingUser = await queryOne(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [userId]
    );
    
    if (!existingUser) {
      throw new NotFoundError('Usuario');
    }
    
    // Verificar permisos específicos
    if (!canModifyUser(currentUserRole, existingUser.role)) {
      throw new AuthorizationError('No tienes permisos para modificar este usuario');
    }
    
    // Si se está cambiando el rol, verificar permisos
    if (role && role !== existingUser.role) {
      if (currentUserRole === 'jefe' && (role === 'admin' || existingUser.role === 'admin')) {
        throw new AuthorizationError('Los jefes no pueden modificar administradores o crear nuevos administradores');
      }
    }
    
    // Verificar si el nuevo email ya existe (si se está cambiando)
    if (email && email.toLowerCase() !== existingUser.email) {
      const emailExists = await queryOne(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email.toLowerCase(), userId]
      );
      
      if (emailExists) {
        throw new ConflictError('Este email ya está en uso por otro usuario');
      }
    }
    
    // Construir objeto de actualización
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase();
    if (role) updateData.role = role;
    
    // Solo actualizar si hay cambios
    if (Object.keys(updateData).length === 0) {
      return res.json({
        success: true,
        message: 'No hay cambios para actualizar',
        data: { user: existingUser }
      });
    }
    
    // Actualizar usuario
    const affectedRows = await update('users', updateData, { id: userId });
    
    if (affectedRows === 0) {
      throw new Error('No se pudo actualizar el usuario');
    }
    
    // Obtener datos actualizados
    const updatedUser = await queryOne(
      'SELECT id, name, email, role, is_active, updated_at FROM users WHERE id = ?',
      [userId]
    );
    
    // Registrar actividad
    const changes = Object.keys(updateData).join(', ');
    await logActivity(
      currentUserId, 
      null, 
      'user_updated', 
      `Usuario ${existingUser.name} actualizado por ${req.user.name}. Campos: ${changes}`,
      req
    );
    
    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: {
        user: updatedUser
      }
    });
    
  } catch (error) {
    logError(error, req, 'Update User Route');
    
    if (error instanceof NotFoundError || error instanceof AuthorizationError || error instanceof ConflictError) {
      return res.status(error.statusCode).json({
        error: error.name,
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al actualizar el usuario'
    });
  }
});

// ================================================
// ACTIVAR/DESACTIVAR USUARIO
// ================================================
router.put('/:id/toggle-status', userIdValidation, handleValidationErrors, requireUserModifyPermission, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const currentUserId = req.userId;
    
    // No permitir que se desactive a sí mismo
    if (userId === currentUserId) {
      throw new AuthorizationError('No puedes desactivar tu propia cuenta');
    }
    
    // Obtener usuario actual
    const user = await queryOne(
      'SELECT id, name, email, role, is_active FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      throw new NotFoundError('Usuario');
    }
    
    // Verificar permisos
    if (!canModifyUser(req.userRole, user.role)) {
      throw new AuthorizationError('No tienes permisos para modificar este usuario');
    }
    
    // Cambiar estado
    const newStatus = !user.is_active;
    const affectedRows = await update(
      'users', 
      { is_active: newStatus }, 
      { id: userId }
    );
    
    if (affectedRows === 0) {
      throw new Error('No se pudo actualizar el estado del usuario');
    }
    
    // Registrar actividad
    const action = newStatus ? 'activado' : 'desactivado';
    await logActivity(
      currentUserId, 
      null, 
      'user_status_changed', 
      `Usuario ${user.name} ${action} por ${req.user.name}`,
      req
    );
    
    res.json({
      success: true,
      message: `Usuario ${action} exitosamente`,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          is_active: newStatus
        }
      }
    });
    
  } catch (error) {
    logError(error, req, 'Toggle User Status Route');
    
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        error: error.name,
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al cambiar el estado del usuario'
    });
  }
});

// ================================================
// OBTENER TRABAJADORES DISPONIBLES PARA ASIGNACIÓN
// ================================================
router.get('/workers/available', requireRole(['admin', 'jefe', 'gerente']), async (req, res) => {
  try {
    // Query simple para obtener trabajadores
    const workersResult = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.is_active
      FROM users u
      WHERE u.role = 'trabajador' AND u.is_active = 1
      ORDER BY u.name ASC
    `);
    
    const workers = workersResult.rows.map(worker => ({
      id: worker.id,
      name: worker.name,
      email: worker.email,
      current_assignments: 0,
      active_orders: 0,
      availability_status: 'disponible'
    }));
    
    res.json({
      success: true,
      data: {
        workers,
        total_workers: workers.length,
        available_workers: workers.length
      }
    });
    
  } catch (error) {
    logError(error, req, 'Get Available Workers Route');
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al obtener trabajadores disponibles'
    });
  }
});

module.exports = router;