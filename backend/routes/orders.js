// ================================================
// RUTAS DE ÓRDENES - JD CLEANING SERVICES
// ================================================

const express = require('express');
const { body, validationResult, query: queryValidator } = require('express-validator');
const {
  authenticateToken,
  requireRole
} = require('../middleware/auth');
const {
  logActivity,
  logError
} = require('../middleware/logger');
const {
  ValidationError,
  NotFoundError,
  ConflictError,
  ForbiddenError
} = require('../middleware/errorHandler');
const { queryOne, insert, query, update: dbUpdate } = require('../config/database');
const { generateOrderNumber } = require('../utils/orderNumberGenerator');
const { notifyOrderAssigned, notifyOrderStatusChanged } = require('../utils/notificationService');

const router = express.Router();

// ================================================
// VALIDACIONES
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

const createOrderValidation = [
  body('order_type')
    .isIn(['regular', 'post_construction'])
    .withMessage('Tipo de orden debe ser: regular o post_construction'),
  body('client_name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Nombre del cliente debe tener al menos 2 caracteres'),
  body('client_email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email del cliente no es válido'),
  body('client_phone')
    .trim()
    .matches(/^[+\d\s()-]+$/)
    .withMessage('Teléfono del cliente no es válido'),
  body('address')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Dirección debe tener al menos 5 caracteres'),
  body('city')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Ciudad debe tener al menos 2 caracteres'),
  body('scheduled_date')
    .isISO8601()
    .withMessage('Fecha programada debe ser válida'),
  body('notes')
    .optional()
    .trim()
];

const assignWorkersValidation = [
  body('worker_ids')
    .isArray({ min: 1 })
    .withMessage('Debe asignar al menos un trabajador'),
  body('worker_ids.*')
    .isInt({ min: 1 })
    .withMessage('ID de trabajador no válido'),
  body('responsible_worker_id')
    .isInt({ min: 1 })
    .withMessage('Debe especificar un trabajador responsable')
];

const startWorkValidation = [
  body('gps_start_latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitud GPS no válida'),
  body('gps_start_longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitud GPS no válida')
];

const completeOrderValidation = [
  body('gps_end_latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitud GPS no válida'),
  body('gps_end_longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitud GPS no válida'),
  body('signature_worker')
    .optional()
    .isString()
    .withMessage('Firma del trabajador debe ser una cadena base64'),
  body('signature_client')
    .optional()
    .isString()
    .withMessage('Firma del cliente debe ser una cadena base64')
];

// ================================================
// CREAR NUEVA ORDEN
// ================================================
router.post('/create', authenticateToken, requireRole(['admin', 'jefe', 'gerente']), createOrderValidation, handleValidationErrors, async (req, res) => {
  try {
    const {
      order_type,
      client_name,
      client_email,
      client_phone,
      address,
      city,
      scheduled_date,
      notes
    } = req.body;

    const creatorId = req.userId;
    const creatorRole = req.userRole;

    // Generar número de orden único
    const orderNumber = await generateOrderNumber();

    // Crear la orden
    const orderData = {
      order_number: orderNumber,
      order_type,
      client_name: client_name.trim(),
      client_email: client_email?.toLowerCase() || null,
      client_phone: client_phone.trim(),
      address: address.trim(),
      city: city?.trim() || null,
      scheduled_date,
      notes: notes?.trim() || null,
      status: 'pending',
      created_by: creatorId
    };

    const orderId = await insert('orders', orderData);

    // Registrar actividad
    await logActivity(
      creatorId,
      orderId,
      'order_created',
      `Orden ${orderNumber} creada por ${req.user.name} - Cliente: ${client_name}`,
      req
    );

    res.status(201).json({
      success: true,
      message: `Orden ${orderNumber} creada exitosamente`,
      order: {
        id: orderId,
        order_number: orderNumber,
        order_type,
        status: 'pending',
        ...orderData
      }
    });

  } catch (error) {
    logError(error, req, 'Create Order Route');
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al crear la orden'
    });
  }
});

// ================================================
// LISTAR ÓRDENES CON FILTROS
// ================================================
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    const {
      status,
      order_type,
      worker_id,
      start_date,
      end_date,
      search,
      page = 1,
      limit = 20
    } = req.query;

    // Construir condiciones WHERE
    const conditions = [];
    const params = [];

    // Filtrar por rol
    if (userRole === 'trabajador') {
      // Trabajadores solo ven sus órdenes asignadas
      conditions.push(`
        EXISTS (
          SELECT 1 FROM order_assignments oa
          WHERE oa.order_id = o.id AND oa.worker_id = ?
        )
      `);
      params.push(userId);
    } else if (userRole === 'gerente') {
      // Gerentes ven órdenes que crearon o que están asignadas a sus trabajadores
      conditions.push(`
        (o.created_by = ? OR EXISTS (
          SELECT 1 FROM order_assignments oa
          JOIN users u ON oa.worker_id = u.id
          WHERE oa.order_id = o.id AND u.created_by = ?
        ))
      `);
      params.push(userId, userId);
    }
    // admin y jefe ven todas las órdenes

    // Filtrar por estado
    if (status) {
      conditions.push('o.status = ?');
      params.push(status);
    }

    // Filtrar por tipo de orden
    if (order_type) {
      conditions.push('o.order_type = ?');
      params.push(order_type);
    }

    // Filtrar por trabajador específico
    if (worker_id) {
      conditions.push(`
        EXISTS (
          SELECT 1 FROM order_assignments oa
          WHERE oa.order_id = o.id AND oa.worker_id = ?
        )
      `);
      params.push(worker_id);
    }

    // Filtrar por rango de fechas
    if (start_date) {
      conditions.push('DATE(o.scheduled_date) >= ?');
      params.push(start_date);
    }
    if (end_date) {
      conditions.push('DATE(o.scheduled_date) <= ?');
      params.push(end_date);
    }

    // Búsqueda por texto
    if (search) {
      conditions.push(`
        (o.order_number LIKE ? OR
         o.client_name LIKE ? OR
         o.address LIKE ?)
      `);
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = conditions.length > 0
      ? 'WHERE ' + conditions.join(' AND ')
      : '';

    // Calcular offset para paginación
    const offset = (page - 1) * limit;

    // Obtener órdenes
    const ordersResult = await query(`
      SELECT
        o.id,
        o.order_number,
        o.order_type,
        o.client_name,
        o.client_email,
        o.client_phone,
        o.address,
        o.city,
        o.scheduled_date,
        o.status,
        o.work_started_at,
        o.work_completed_at,
        o.created_at,
        creator.name as created_by_name,
        responsible.name as responsible_worker_name,
        (SELECT COUNT(*) FROM order_assignments oa WHERE oa.order_id = o.id) as workers_count,
        (SELECT COUNT(*) FROM order_photos op WHERE op.order_id = o.id) as photos_count
      FROM orders o
      LEFT JOIN users creator ON o.created_by = creator.id
      LEFT JOIN users responsible ON o.responsible_worker_id = responsible.id
      ${whereClause}
      ORDER BY o.scheduled_date DESC, o.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    // Contar total de órdenes
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM orders o
      ${whereClause}
    `, params);

    const total = countResult.rows[0]?.total || 0;

    res.json({
      success: true,
      orders: ordersResult.rows || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logError(error, req, 'List Orders Route');
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al listar órdenes'
    });
  }
});

// ================================================
// OBTENER DETALLE DE UNA ORDEN
// ================================================
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.userId;
    const userRole = req.userRole;

    // Obtener orden con toda la información
    const order = await queryOne(`
      SELECT
        o.*,
        creator.name as created_by_name,
        responsible.name as responsible_worker_name,
        responsible.email as responsible_worker_email,
        responsible.phone as responsible_worker_phone
      FROM orders o
      LEFT JOIN users creator ON o.created_by = creator.id
      LEFT JOIN users responsible ON o.responsible_worker_id = responsible.id
      WHERE o.id = ?
    `, [orderId]);

    if (!order) {
      throw new NotFoundError('Orden no encontrada');
    }

    // Verificar permisos
    if (userRole === 'trabajador') {
      // Verificar que el trabajador está asignado a esta orden
      const isAssigned = await queryOne(`
        SELECT id FROM order_assignments WHERE order_id = ? AND worker_id = ?
      `, [orderId, userId]);

      if (!isAssigned) {
        throw new ForbiddenError('No tienes acceso a esta orden');
      }
    } else if (userRole === 'gerente') {
      // Verificar que el gerente creó la orden o tiene trabajadores asignados
      const hasAccess = await queryOne(`
        SELECT 1 FROM orders o
        WHERE o.id = ? AND (
          o.created_by = ? OR
          EXISTS (
            SELECT 1 FROM order_assignments oa
            JOIN users u ON oa.worker_id = u.id
            WHERE oa.order_id = o.id AND u.created_by = ?
          )
        )
      `, [orderId, userId, userId]);

      if (!hasAccess) {
        throw new ForbiddenError('No tienes acceso a esta orden');
      }
    }

    // Obtener trabajadores asignados
    const workersResult = await query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        oa.assigned_at,
        oa.is_responsible
      FROM order_assignments oa
      JOIN users u ON oa.worker_id = u.id
      WHERE oa.order_id = ?
      ORDER BY oa.is_responsible DESC, u.name ASC
    `, [orderId]);

    // Obtener áreas asignadas (solo para órdenes regulares)
    let areas = [];
    if (order.order_type === 'regular') {
      const areasResult = await query(`
        SELECT
          oa.id,
          ca.id as area_id,
          ca.name_es,
          ca.name_en,
          ca.name_fr,
          oa.is_completed,
          oa.completed_at,
          completed_by.name as completed_by_name
        FROM order_areas oa
        JOIN cleaning_areas ca ON oa.area_id = ca.id
        LEFT JOIN users completed_by ON oa.completed_by = completed_by.id
        WHERE oa.order_id = ?
        ORDER BY ca.display_order ASC
      `, [orderId]);
      areas = areasResult.rows || [];
    }

    // Obtener reportes diarios (solo para post-construcción)
    let dailyReports = [];
    if (order.order_type === 'post_construction') {
      const reportsResult = await query(`
        SELECT
          dr.id,
          dr.report_date,
          dr.description,
          dr.signature_worker,
          dr.created_at,
          worker.name as created_by_name,
          (SELECT COUNT(*) FROM order_photos op WHERE op.daily_report_id = dr.id) as photos_count
        FROM daily_reports dr
        JOIN users worker ON dr.created_by = worker.id
        WHERE dr.order_id = ?
        ORDER BY dr.report_date DESC
      `, [orderId]);
      dailyReports = reportsResult.rows || [];
    }

    // Obtener fotos
    const photosResult = await query(`
      SELECT
        op.id,
        op.photo_url,
        op.thumbnail_url,
        op.caption,
        op.uploaded_at,
        op.daily_report_id,
        uploader.name as uploaded_by_name
      FROM order_photos op
      JOIN users uploader ON op.uploaded_by = uploader.id
      WHERE op.order_id = ?
      ORDER BY op.uploaded_at DESC
    `, [orderId]);

    res.json({
      success: true,
      order: {
        ...order,
        workers: workersResult.rows || [],
        areas,
        daily_reports: dailyReports,
        photos: photosResult.rows || []
      }
    });

  } catch (error) {
    logError(error, req, 'Get Order Details Route');

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        error: 'No encontrado',
        message: error.message
      });
    }

    if (error instanceof ForbiddenError) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al obtener detalles de la orden'
    });
  }
});

// ================================================
// ASIGNAR TRABAJADORES A UNA ORDEN
// ================================================
router.post('/:id/assign', authenticateToken, requireRole(['admin', 'jefe', 'gerente']), assignWorkersValidation, handleValidationErrors, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { worker_ids, responsible_worker_id } = req.body;
    const assignedBy = req.userId;

    // Verificar que la orden existe
    const order = await queryOne('SELECT id, order_number, client_name, address, status FROM orders WHERE id = ?', [orderId]);
    if (!order) {
      throw new NotFoundError('Orden no encontrada');
    }

    // Verificar que la orden no esté completada
    if (order.status === 'completed' || order.status === 'cancelled') {
      throw new ConflictError('No se pueden asignar trabajadores a una orden completada o cancelada');
    }

    // Verificar que el trabajador responsable esté en la lista de trabajadores
    if (!worker_ids.includes(responsible_worker_id)) {
      throw new ValidationError('El trabajador responsable debe estar en la lista de trabajadores asignados');
    }

    // Verificar que todos los trabajadores existen y tienen el rol correcto
    const workersResult = await query(`
      SELECT id, name, email FROM users
      WHERE id IN (${worker_ids.map(() => '?').join(',')})
      AND role = 'trabajador'
      AND is_active = 1
    `, worker_ids);

    if (workersResult.rows.length !== worker_ids.length) {
      throw new ValidationError('Uno o más trabajadores no son válidos o no están activos');
    }

    // Eliminar asignaciones anteriores
    await query('DELETE FROM order_assignments WHERE order_id = ?', [orderId]);

    // Insertar nuevas asignaciones
    for (const workerId of worker_ids) {
      await insert('order_assignments', {
        order_id: orderId,
        worker_id: workerId,
        assigned_by: assignedBy,
        is_responsible: workerId === responsible_worker_id
      });
    }

    // Actualizar el trabajador responsable en la orden
    await query(
      'UPDATE orders SET responsible_worker_id = ?, status = ?, updated_at = NOW() WHERE id = ?',
      [responsible_worker_id, 'assigned', orderId]
    );

    // Registrar actividad
    await logActivity(
      assignedBy,
      orderId,
      'workers_assigned',
      `${worker_ids.length} trabajador(es) asignado(s) a orden ${order.order_number}`,
      req
    );

    // Enviar notificaciones a los trabajadores
    for (const worker of workersResult.rows) {
      // Notificar solo si no es el que está asignando (para evitar auto-notificación)
      if (worker.id !== assignedBy) {
        await notifyOrderAssigned(
          req.app.get('io'), // Socket.IO instance
          worker.id,
          order.order_number,
          order.client_name,
          order.address,
          worker.email,
          worker.name
        );
      }
    }

    res.json({
      success: true,
      message: `${worker_ids.length} trabajador(es) asignado(s) exitosamente`,
      order_id: orderId,
      workers_assigned: worker_ids.length
    });

  } catch (error) {
    logError(error, req, 'Assign Workers Route');

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        error: 'No encontrado',
        message: error.message
      });
    }

    if (error instanceof ConflictError || error instanceof ValidationError) {
      return res.status(400).json({
        error: 'Error de validación',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al asignar trabajadores'
    });
  }
});

// ================================================
// INICIAR TRABAJO EN UNA ORDEN
// ================================================
router.post('/:id/start', authenticateToken, requireRole(['trabajador']), startWorkValidation, handleValidationErrors, async (req, res) => {
  try {
    const orderId = req.params.id;
    const workerId = req.userId;
    const { gps_start_latitude, gps_start_longitude } = req.body;

    // Verificar que la orden existe
    const order = await queryOne(`
      SELECT id, order_number, status, responsible_worker_id
      FROM orders WHERE id = ?
    `, [orderId]);

    if (!order) {
      throw new NotFoundError('Orden no encontrada');
    }

    // Verificar que el trabajador está asignado
    const isAssigned = await queryOne(`
      SELECT id FROM order_assignments WHERE order_id = ? AND worker_id = ?
    `, [orderId, workerId]);

    if (!isAssigned) {
      throw new ForbiddenError('No estás asignado a esta orden');
    }

    // Verificar que la orden esté en estado 'assigned'
    if (order.status !== 'assigned') {
      throw new ConflictError('La orden debe estar en estado "asignada" para iniciar trabajo');
    }

    // Actualizar orden a 'in_progress'
    await query(`
      UPDATE orders SET
        status = 'in_progress',
        work_started_at = NOW(),
        gps_start_latitude = ?,
        gps_start_longitude = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [gps_start_latitude, gps_start_longitude, orderId]);

    // Registrar actividad
    await logActivity(
      workerId,
      orderId,
      'work_started',
      `Trabajo iniciado en orden ${order.order_number} por ${req.user.name}`,
      req
    );

    res.json({
      success: true,
      message: 'Trabajo iniciado exitosamente',
      order_id: orderId,
      started_at: new Date()
    });

  } catch (error) {
    logError(error, req, 'Start Work Route');

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        error: 'No encontrado',
        message: error.message
      });
    }

    if (error instanceof ForbiddenError) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: error.message
      });
    }

    if (error instanceof ConflictError) {
      return res.status(400).json({
        error: 'Error de estado',
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
// COMPLETAR ORDEN
// ================================================
router.post('/:id/complete', authenticateToken, requireRole(['trabajador']), completeOrderValidation, handleValidationErrors, async (req, res) => {
  try {
    const orderId = req.params.id;
    const workerId = req.userId;
    const {
      gps_end_latitude,
      gps_end_longitude,
      signature_worker,
      signature_client
    } = req.body;

    // Verificar que la orden existe
    const order = await queryOne(`
      SELECT
        id, order_number, status, order_type,
        responsible_worker_id
      FROM orders WHERE id = ?
    `, [orderId]);

    if (!order) {
      throw new NotFoundError('Orden no encontrada');
    }

    // Verificar que el trabajador es el responsable
    if (order.responsible_worker_id !== workerId) {
      throw new ForbiddenError('Solo el trabajador responsable puede completar la orden');
    }

    // Verificar que la orden esté en progreso
    if (order.status !== 'in_progress') {
      throw new ConflictError('La orden debe estar en progreso para completarla');
    }

    // Para órdenes regulares, verificar que todas las áreas estén completadas
    if (order.order_type === 'regular') {
      const incompleteAreas = await queryOne(`
        SELECT COUNT(*) as count
        FROM order_areas
        WHERE order_id = ? AND is_completed = 0
      `, [orderId]);

      if (incompleteAreas.count > 0) {
        throw new ConflictError('Todas las áreas deben estar completadas antes de finalizar la orden');
      }
    }

    // Actualizar orden
    await query(`
      UPDATE orders SET
        status = 'completed',
        work_completed_at = NOW(),
        gps_end_latitude = ?,
        gps_end_longitude = ?,
        signature_worker = ?,
        signature_client = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [
      gps_end_latitude || null,
      gps_end_longitude || null,
      signature_worker || null,
      signature_client || null,
      orderId
    ]);

    // Registrar actividad
    await logActivity(
      workerId,
      orderId,
      'order_completed',
      `Orden ${order.order_number} completada por ${req.user.name}`,
      req
    );

    // TODO: Generar PDF automáticamente aquí

    res.json({
      success: true,
      message: 'Orden completada exitosamente',
      order_id: orderId,
      completed_at: new Date()
    });

  } catch (error) {
    logError(error, req, 'Complete Order Route');

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        error: 'No encontrado',
        message: error.message
      });
    }

    if (error instanceof ForbiddenError) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: error.message
      });
    }

    if (error instanceof ConflictError) {
      return res.status(400).json({
        error: 'Error de estado',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al completar orden'
    });
  }
});

// ================================================
// MARCAR ÁREA COMO COMPLETADA (Solo órdenes regulares)
// ================================================
router.post('/:id/areas/:areaId/complete', authenticateToken, requireRole(['trabajador']), async (req, res) => {
  try {
    const orderId = req.params.id;
    const areaId = req.params.areaId;
    const workerId = req.userId;

    // Verificar que la orden existe y es de tipo regular
    const order = await queryOne(`
      SELECT id, order_number, status, order_type
      FROM orders WHERE id = ?
    `, [orderId]);

    if (!order) {
      throw new NotFoundError('Orden no encontrada');
    }

    if (order.order_type !== 'regular') {
      throw new ConflictError('Solo las órdenes regulares tienen áreas');
    }

    // Verificar que el trabajador está asignado
    const isAssigned = await queryOne(`
      SELECT id FROM order_assignments WHERE order_id = ? AND worker_id = ?
    `, [orderId, workerId]);

    if (!isAssigned) {
      throw new ForbiddenError('No estás asignado a esta orden');
    }

    // Verificar que la orden esté en progreso
    if (order.status !== 'in_progress') {
      throw new ConflictError('La orden debe estar en progreso');
    }

    // Verificar que el área existe para esta orden
    const orderArea = await queryOne(`
      SELECT id, is_completed FROM order_areas WHERE id = ? AND order_id = ?
    `, [areaId, orderId]);

    if (!orderArea) {
      throw new NotFoundError('Área no encontrada en esta orden');
    }

    if (orderArea.is_completed) {
      throw new ConflictError('Esta área ya está completada');
    }

    // Marcar área como completada
    await query(`
      UPDATE order_areas SET
        is_completed = 1,
        completed_at = NOW(),
        completed_by = ?
      WHERE id = ?
    `, [workerId, areaId]);

    // Registrar actividad
    await logActivity(
      workerId,
      orderId,
      'area_completed',
      `Área completada en orden ${order.order_number} por ${req.user.name}`,
      req
    );

    res.json({
      success: true,
      message: 'Área completada exitosamente',
      area_id: areaId
    });

  } catch (error) {
    logError(error, req, 'Complete Area Route');

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        error: 'No encontrado',
        message: error.message
      });
    }

    if (error instanceof ForbiddenError) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: error.message
      });
    }

    if (error instanceof ConflictError) {
      return res.status(400).json({
        error: 'Error de estado',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al completar área'
    });
  }
});

// ================================================
// CANCELAR ORDEN
// ================================================
router.post('/:id/cancel', authenticateToken, requireRole(['admin', 'jefe', 'gerente']), async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.userId;
    const { reason } = req.body;

    // Verificar que la orden existe
    const order = await queryOne(`
      SELECT id, order_number, status FROM orders WHERE id = ?
    `, [orderId]);

    if (!order) {
      throw new NotFoundError('Orden no encontrada');
    }

    // No se puede cancelar una orden ya completada
    if (order.status === 'completed') {
      throw new ConflictError('No se puede cancelar una orden completada');
    }

    if (order.status === 'cancelled') {
      throw new ConflictError('La orden ya está cancelada');
    }

    // Actualizar orden
    await query(`
      UPDATE orders SET
        status = 'cancelled',
        notes = CONCAT(COALESCE(notes, ''), '\n\nCANCELADA: ', ?),
        updated_at = NOW()
      WHERE id = ?
    `, [reason || 'Sin razón especificada', orderId]);

    // Registrar actividad
    await logActivity(
      userId,
      orderId,
      'order_cancelled',
      `Orden ${order.order_number} cancelada por ${req.user.name}. Razón: ${reason || 'Sin razón'}`,
      req
    );

    res.json({
      success: true,
      message: 'Orden cancelada exitosamente',
      order_id: orderId
    });

  } catch (error) {
    logError(error, req, 'Cancel Order Route');

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        error: 'No encontrado',
        message: error.message
      });
    }

    if (error instanceof ConflictError) {
      return res.status(400).json({
        error: 'Error de estado',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al cancelar orden'
    });
  }
});

// ================================================
// ACTUALIZAR INFORMACIÓN DE LA ORDEN
// ================================================
router.put('/:id', authenticateToken, requireRole(['admin', 'jefe', 'gerente']), async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.userId;
    const {
      client_name,
      client_email,
      client_phone,
      address,
      city,
      scheduled_date,
      notes
    } = req.body;

    // Verificar que la orden existe
    const order = await queryOne(`
      SELECT id, order_number, status FROM orders WHERE id = ?
    `, [orderId]);

    if (!order) {
      throw new NotFoundError('Orden no encontrada');
    }

    // No se puede editar una orden completada o cancelada
    if (order.status === 'completed' || order.status === 'cancelled') {
      throw new ConflictError('No se puede editar una orden completada o cancelada');
    }

    // Construir objeto de actualización
    const updates = {};
    if (client_name) updates.client_name = client_name.trim();
    if (client_email !== undefined) updates.client_email = client_email?.toLowerCase() || null;
    if (client_phone) updates.client_phone = client_phone.trim();
    if (address) updates.address = address.trim();
    if (city !== undefined) updates.city = city?.trim() || null;
    if (scheduled_date) updates.scheduled_date = scheduled_date;
    if (notes !== undefined) updates.notes = notes?.trim() || null;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Debes proporcionar al menos un campo para actualizar'
      });
    }

    // Actualizar orden
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), orderId];

    await query(
      `UPDATE orders SET ${setClause}, updated_at = NOW() WHERE id = ?`,
      values
    );

    // Registrar actividad
    await logActivity(
      userId,
      orderId,
      'order_updated',
      `Orden ${order.order_number} actualizada por ${req.user.name}`,
      req
    );

    res.json({
      success: true,
      message: 'Orden actualizada exitosamente',
      order_id: orderId,
      updated: updates
    });

  } catch (error) {
    logError(error, req, 'Update Order Route');

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        error: 'No encontrado',
        message: error.message
      });
    }

    if (error instanceof ConflictError) {
      return res.status(400).json({
        error: 'Error de estado',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al actualizar orden'
    });
  }
});

module.exports = router;
