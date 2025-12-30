// ================================================
// RUTAS DE ÓRDENES DE LIMPIEZA - JD CLEANING SERVICES
// ================================================

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { 
  requireRole,
  canAccessOrder
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
const { query, queryOne, insert, update, transaction } = require('../config/database');

const router = express.Router();

// ================================================
// VALIDACIONES
// ================================================

const createOrderValidation = [
  body('address')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('La dirección debe tener entre 10 y 500 caracteres'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitud debe ser un número válido entre -90 y 90'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitud debe ser un número válido entre -180 y 180'),
  body('scheduled_date')
    .isISO8601()
    .withMessage('Fecha programada debe ser una fecha válida'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Las notas no pueden exceder 1000 caracteres'),
  body('assigned_workers')
    .isArray({ min: 1 })
    .withMessage('Debe asignar al menos un trabajador')
];

const orderIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de orden debe ser un número válido')
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
// LISTAR ÓRDENES
// ================================================
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      worker_id, 
      date_from, 
      date_to,
      search 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const userRole = req.userRole;
    const userId = req.userId;
    
    // Query simple para órdenes
    let baseQuery = `
      SELECT 
        o.id,
        o.address,
        o.latitude,
        o.longitude,
        o.scheduled_date,
        o.notes,
        o.status,
        o.created_at,
        creator.name as created_by_name
      FROM orders o
      LEFT JOIN users creator ON o.created_by = creator.id
    `;
    
    // Construir condiciones WHERE
    let whereConditions = [];
    let queryParams = [];
    
    // Filtros según el rol
    if (userRole === 'trabajador') {
      baseQuery += ` INNER JOIN order_assignments oa ON o.id = oa.order_id AND oa.is_active = true`;
      whereConditions.push('oa.user_id = ?');
      queryParams.push(userId);
    }
    
    // Filtro por estado
    if (status && ['pendiente', 'en_progreso', 'pausada', 'completada', 'cancelada'].includes(status)) {
      whereConditions.push('o.status = ?');
      queryParams.push(status);
    }
    
    // Filtro por trabajador específico (solo para supervisores)
    if (worker_id && ['admin', 'jefe', 'gerente'].includes(userRole)) {
      if (userRole !== 'trabajador') {
        baseQuery += ` INNER JOIN order_assignments oa2 ON o.id = oa2.order_id AND oa2.is_active = true`;
        whereConditions.push('oa2.user_id = ?');
        queryParams.push(parseInt(worker_id));
      }
    }
    
    // Filtro por rango de fechas
    if (date_from) {
      whereConditions.push('o.scheduled_date >= ?');
      queryParams.push(date_from);
    }
    
    if (date_to) {
      whereConditions.push('o.scheduled_date <= ?');
      queryParams.push(date_to);
    }
    
    // Búsqueda por dirección
    if (search) {
      whereConditions.push('o.address LIKE ?');
      queryParams.push(`%${search}%`);
    }
    
    // Agregar WHERE si hay condiciones
    if (whereConditions.length > 0) {
      baseQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    // Completar query
    const ordersQuery = baseQuery + ` ORDER BY o.scheduled_date DESC, o.created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), offset);
    
    // Query para contar total
    let countQuery = `SELECT COUNT(DISTINCT o.id) as total FROM orders o`;
    if (userRole === 'trabajador') {
      countQuery += ` INNER JOIN order_assignments oa ON o.id = oa.order_id AND oa.is_active = true`;
    }
    if (whereConditions.length > 0) {
      countQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    const countParams = queryParams.slice(0, -2);
    
    // Ejecutar ambas queries
    const ordersResult = await query(ordersQuery, queryParams);
    const countResult = await query(countQuery, countParams);
    
    const orders = ordersResult.rows;
    const total = countResult.rows[0].total;
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total_items: total,
          total_pages: totalPages,
          has_next_page: page < totalPages,
          has_prev_page: page > 1
        },
        filters_applied: {
          status: status || null,
          worker_id: worker_id || null,
          date_from: date_from || null,
          date_to: date_to || null,
          search: search || null
        }
      }
    });
    
  } catch (error) {
    logError(error, req, 'List Orders Route');
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al obtener la lista de órdenes'
    });
  }
});

// ================================================
// OBTENER ORDEN POR ID
// ================================================
router.get('/:id', orderIdValidation, handleValidationErrors, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const userId = req.userId;
    const userRole = req.userRole;
    
    // Verificar acceso a la orden
    const hasAccess = await canAccessOrder(userId, userRole, orderId);
    if (!hasAccess) {
      throw new AuthorizationError('No tienes permisos para ver esta orden');
    }
    
    // Obtener información de la orden
    const order = await queryOne(`
      SELECT 
        o.id,
        o.address,
        o.latitude,
        o.longitude,
        o.scheduled_date,
        o.notes,
        o.status,
        o.created_at,
        o.updated_at,
        creator.name as created_by_name
      FROM orders o
      LEFT JOIN users creator ON o.created_by = creator.id
      WHERE o.id = ?
    `, [orderId]);
    
    if (!order) {
      throw new NotFoundError('Orden');
    }
    
    // Obtener trabajadores asignados
    const assignedWorkersResult = await query(`
      SELECT 
        u.id,
        u.name,
        u.email
      FROM order_assignments oa
      INNER JOIN users u ON oa.user_id = u.id
      WHERE oa.order_id = ? AND oa.is_active = true
    `, [orderId]);
    
    res.json({
      success: true,
      data: {
        order: {
          ...order,
          assigned_workers: assignedWorkersResult.rows
        }
      }
    });
    
  } catch (error) {
    logError(error, req, 'Get Order Route');
    
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      return res.status(error.statusCode || 404).json({
        error: error.name,
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al obtener información de la orden'
    });
  }
});

// ================================================
// CREAR NUEVA ORDEN
// ================================================
router.post('/', createOrderValidation, handleValidationErrors, requireRole(['admin', 'jefe', 'gerente']), async (req, res) => {
  try {
    const { 
      address, 
      latitude, 
      longitude, 
      scheduled_date, 
      notes, 
      assigned_workers 
    } = req.body;
    
    const creatorId = req.userId;
    
    // Verificar que los trabajadores existen y están activos
    const workersQuery = `
      SELECT id, name FROM users 
      WHERE id IN (${assigned_workers.map(() => '?').join(',')}) 
      AND role = 'trabajador' AND is_active = true
    `;
    
    const workersResult = await query(workersQuery, assigned_workers);
    const foundWorkers = workersResult.rows;
    
    if (foundWorkers.length !== assigned_workers.length) {
      throw new ValidationError('Uno o más trabajadores no son válidos');
    }
    
    // Insertar orden
    const orderId = await insert('orders', {
      address: address.trim(),
      latitude: latitude || null,
      longitude: longitude || null,
      scheduled_date,
      notes: notes ? notes.trim() : null,
      status: 'pendiente',
      created_by: creatorId
    });
    
    // Crear asignaciones de trabajadores
    for (const workerId of assigned_workers) {
      await insert('order_assignments', {
        order_id: orderId,
        user_id: workerId,
        assigned_by: creatorId,
        is_active: true
      });
    }
    
    // Registrar actividad
    await logActivity(
      creatorId, 
      orderId, 
      'order_created', 
      `Orden #${orderId} creada por ${req.user.name}`,
      req
    );
    
    res.status(201).json({
      success: true,
      message: 'Orden creada exitosamente',
      data: {
        order_id: orderId,
        assigned_workers: foundWorkers.length
      }
    });
    
  } catch (error) {
    logError(error, req, 'Create Order Route');
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: error.name,
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al crear la orden'
    });
  }
});

// ================================================
// INICIAR TRABAJO (Para trabajadores)
// ================================================
router.post('/:id/start-work', orderIdValidation, handleValidationErrors, requireRole('trabajador'), async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const userId = req.userId;
    
    // Verificar acceso a la orden
    const hasAccess = await canAccessOrder(userId, 'trabajador', orderId);
    if (!hasAccess) {
      throw new AuthorizationError('No tienes acceso a esta orden');
    }
    
    // Verificar estado de la orden
    const order = await queryOne('SELECT id, status FROM orders WHERE id = ?', [orderId]);
    if (!order) {
      throw new NotFoundError('Orden');
    }
    
    if (!['pendiente', 'pausada'].includes(order.status)) {
      throw new ConflictError('Solo se puede iniciar trabajo en órdenes pendientes o pausadas');
    }
    
    // Verificar si ya hay una sesión activa
    const activeSession = await queryOne(
      'SELECT id FROM work_times WHERE order_id = ? AND user_id = ? AND is_active = true',
      [orderId, userId]
    );
    
    if (activeSession) {
      throw new ConflictError('Ya tienes una sesión de trabajo activa en esta orden');
    }
    
    // Crear nueva sesión de trabajo
    const workTimeId = await insert('work_times', {
      order_id: orderId,
      user_id: userId,
      start_time: new Date(),
      is_active: true
    });
    
    // Actualizar estado de la orden
    await update('orders', { status: 'en_progreso' }, { id: orderId });
    
    // Registrar actividad
    await logActivity(
      userId, 
      orderId, 
      'work_started', 
      `${req.user.name} inició trabajo en orden #${orderId}`,
      req
    );
    
    res.json({
      success: true,
      message: 'Trabajo iniciado exitosamente',
      data: {
        work_time_id: workTimeId,
        order_id: orderId,
        started_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logError(error, req, 'Start Work Route');
    
    if (error instanceof NotFoundError || error instanceof AuthorizationError || error instanceof ConflictError) {
      return res.status(error.statusCode).json({
        error: error.name,
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al iniciar trabajo'
    });
  }
});

// ================================================
// PAUSAR TRABAJO
// ================================================
router.post('/:id/pause-work', orderIdValidation, handleValidationErrors, requireRole('trabajador'), async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const userId = req.userId;
    
    // Verificar sesión activa
    const activeSession = await queryOne(
      'SELECT id FROM work_times WHERE order_id = ? AND user_id = ? AND is_active = true',
      [orderId, userId]
    );
    
    if (!activeSession) {
      throw new ConflictError('No tienes una sesión de trabajo activa en esta orden');
    }
    
    // Actualizar estado de la orden
    await update('orders', { status: 'pausada' }, { id: orderId });
    
    // Registrar actividad
    await logActivity(
      userId, 
      orderId, 
      'work_paused', 
      `${req.user.name} pausó trabajo en orden #${orderId}`,
      req
    );
    
    res.json({
      success: true,
      message: 'Trabajo pausado exitosamente',
      data: {
        order_id: orderId,
        paused_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logError(error, req, 'Pause Work Route');
    
    if (error instanceof ConflictError) {
      return res.status(error.statusCode).json({
        error: error.name,
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al pausar trabajo'
    });
  }
});

// ================================================
// FINALIZAR TRABAJO
// ================================================
router.post('/:id/complete-work', orderIdValidation, handleValidationErrors, requireRole('trabajador'), async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const userId = req.userId;
    const { notes } = req.body;
    
    // Verificar sesión activa
    const activeSession = await queryOne(
      'SELECT id FROM work_times WHERE order_id = ? AND user_id = ? AND is_active = true',
      [orderId, userId]
    );
    
    if (!activeSession) {
      throw new ConflictError('No tienes una sesión de trabajo activa en esta orden');
    }
    
    // Finalizar sesión de trabajo
    await update('work_times', {
      end_time: new Date(),
      is_active: false,
      notes: notes || null
    }, { id: activeSession.id });
    
    // Actualizar estado de la orden
    await update('orders', { status: 'completada', completed_at: new Date() }, { id: orderId });
    
    // Registrar actividad
    await logActivity(
      userId, 
      orderId, 
      'work_completed', 
      `${req.user.name} finalizó trabajo en orden #${orderId}`,
      req
    );
    
    res.json({
      success: true,
      message: 'Trabajo finalizado exitosamente',
      data: {
        order_id: orderId,
        completed_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logError(error, req, 'Complete Work Route');
    
    if (error instanceof ConflictError) {
      return res.status(error.statusCode).json({
        error: error.name,
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al finalizar trabajo'
    });
  }
});

module.exports = router;