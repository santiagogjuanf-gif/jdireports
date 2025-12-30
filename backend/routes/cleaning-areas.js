// ================================================
// RUTAS DE ÁREAS DE LIMPIEZA - JD CLEANING SERVICES
// ================================================

const express = require('express');
const { body, validationResult } = require('express-validator');
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
  ConflictError
} = require('../middleware/errorHandler');
const { queryOne, insert, query } = require('../config/database');

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

const createAreaValidation = [
  body('name_key')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-z_]+$/)
    .withMessage('La clave del nombre debe ser minúsculas y guiones bajos'),
  body('name_es')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre en español debe tener entre 2 y 100 caracteres'),
  body('name_en')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre en inglés debe tener entre 2 y 100 caracteres'),
  body('name_fr')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre en francés debe tener entre 2 y 100 caracteres'),
  body('display_order')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Orden de visualización debe ser un número positivo'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active debe ser verdadero o falso')
];

// ================================================
// LISTAR TODAS LAS ÁREAS
// ================================================
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { language = 'es', active_only = 'true' } = req.query;

    // Validar idioma
    const validLanguages = ['es', 'en', 'fr'];
    const lang = validLanguages.includes(language) ? language : 'es';

    // Construir query
    let sql = `
      SELECT
        id,
        name_key,
        name_es,
        name_en,
        name_fr,
        is_active,
        display_order,
        created_at,
        updated_at
      FROM cleaning_areas
    `;

    const params = [];

    if (active_only === 'true') {
      sql += ' WHERE is_active = 1';
    }

    sql += ' ORDER BY display_order ASC, name_es ASC';

    const areasResult = await query(sql, params);
    const areas = areasResult.rows || [];

    // Transformar respuesta para incluir el nombre en el idioma seleccionado
    const transformedAreas = areas.map(area => ({
      id: area.id,
      name_key: area.name_key,
      name: area[`name_${lang}`], // Nombre en el idioma seleccionado
      name_es: area.name_es,
      name_en: area.name_en,
      name_fr: area.name_fr,
      is_active: area.is_active,
      display_order: area.display_order,
      created_at: area.created_at,
      updated_at: area.updated_at
    }));

    res.json({
      success: true,
      areas: transformedAreas,
      total: transformedAreas.length,
      language: lang
    });

  } catch (error) {
    logError(error, req, 'List Cleaning Areas Route');
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al listar áreas de limpieza'
    });
  }
});

// ================================================
// OBTENER ÁREA POR ID
// ================================================
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const areaId = req.params.id;
    const { language = 'es' } = req.query;

    // Validar idioma
    const validLanguages = ['es', 'en', 'fr'];
    const lang = validLanguages.includes(language) ? language : 'es';

    const area = await queryOne(`
      SELECT
        id,
        name_key,
        name_es,
        name_en,
        name_fr,
        is_active,
        display_order,
        created_at,
        updated_at
      FROM cleaning_areas
      WHERE id = ?
    `, [areaId]);

    if (!area) {
      throw new NotFoundError('Área de limpieza no encontrada');
    }

    res.json({
      success: true,
      area: {
        ...area,
        name: area[`name_${lang}`] // Nombre en el idioma seleccionado
      },
      language: lang
    });

  } catch (error) {
    logError(error, req, 'Get Cleaning Area Route');

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        error: 'No encontrado',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al obtener área de limpieza'
    });
  }
});

// ================================================
// CREAR NUEVA ÁREA (Solo admin/jefe)
// ================================================
router.post('/', authenticateToken, requireRole(['admin', 'jefe']), createAreaValidation, handleValidationErrors, async (req, res) => {
  try {
    const {
      name_key,
      name_es,
      name_en,
      name_fr,
      display_order,
      is_active = true
    } = req.body;

    const userId = req.userId;

    // Verificar que no exista un área con la misma clave
    const existingArea = await queryOne(`
      SELECT id FROM cleaning_areas WHERE name_key = ?
    `, [name_key]);

    if (existingArea) {
      throw new ConflictError('Ya existe un área con esta clave');
    }

    // Si no se proporciona display_order, usar el siguiente disponible
    let order = display_order;
    if (!order) {
      const maxOrderResult = await queryOne(`
        SELECT MAX(display_order) as max_order FROM cleaning_areas
      `);
      order = (maxOrderResult?.max_order || 0) + 1;
    }

    // Crear área
    const areaData = {
      name_key: name_key.trim().toLowerCase(),
      name_es: name_es.trim(),
      name_en: name_en.trim(),
      name_fr: name_fr.trim(),
      display_order: order,
      is_active
    };

    const areaId = await insert('cleaning_areas', areaData);

    // Registrar actividad
    await logActivity(
      userId,
      null,
      'cleaning_area_created',
      `Área de limpieza "${name_es}" creada por ${req.user.name}`,
      req
    );

    res.status(201).json({
      success: true,
      message: 'Área de limpieza creada exitosamente',
      area: {
        id: areaId,
        ...areaData
      }
    });

  } catch (error) {
    logError(error, req, 'Create Cleaning Area Route');

    if (error instanceof ConflictError) {
      return res.status(409).json({
        error: 'Conflicto',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al crear área de limpieza'
    });
  }
});

// ================================================
// ACTUALIZAR ÁREA (Solo admin/jefe)
// ================================================
router.put('/:id', authenticateToken, requireRole(['admin', 'jefe']), [
  body('name_es')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre en español debe tener entre 2 y 100 caracteres'),
  body('name_en')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre en inglés debe tener entre 2 y 100 caracteres'),
  body('name_fr')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre en francés debe tener entre 2 y 100 caracteres'),
  body('display_order')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Orden de visualización debe ser un número positivo'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active debe ser verdadero o falso')
], handleValidationErrors, async (req, res) => {
  try {
    const areaId = req.params.id;
    const userId = req.userId;
    const {
      name_es,
      name_en,
      name_fr,
      display_order,
      is_active
    } = req.body;

    // Verificar que el área existe
    const area = await queryOne(`
      SELECT id, name_es FROM cleaning_areas WHERE id = ?
    `, [areaId]);

    if (!area) {
      throw new NotFoundError('Área de limpieza no encontrada');
    }

    // Construir objeto de actualización
    const updates = {};
    if (name_es) updates.name_es = name_es.trim();
    if (name_en) updates.name_en = name_en.trim();
    if (name_fr) updates.name_fr = name_fr.trim();
    if (display_order) updates.display_order = display_order;
    if (is_active !== undefined) updates.is_active = is_active;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Debes proporcionar al menos un campo para actualizar'
      });
    }

    // Actualizar área
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), areaId];

    await query(
      `UPDATE cleaning_areas SET ${setClause}, updated_at = NOW() WHERE id = ?`,
      values
    );

    // Registrar actividad
    await logActivity(
      userId,
      null,
      'cleaning_area_updated',
      `Área de limpieza "${area.name_es}" actualizada por ${req.user.name}`,
      req
    );

    res.json({
      success: true,
      message: 'Área de limpieza actualizada exitosamente',
      area_id: areaId,
      updated: updates
    });

  } catch (error) {
    logError(error, req, 'Update Cleaning Area Route');

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        error: 'No encontrado',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al actualizar área de limpieza'
    });
  }
});

// ================================================
// ELIMINAR ÁREA (Solo admin/jefe)
// ================================================
router.delete('/:id', authenticateToken, requireRole(['admin', 'jefe']), async (req, res) => {
  try {
    const areaId = req.params.id;
    const userId = req.userId;

    // Verificar que el área existe
    const area = await queryOne(`
      SELECT id, name_es FROM cleaning_areas WHERE id = ?
    `, [areaId]);

    if (!area) {
      throw new NotFoundError('Área de limpieza no encontrada');
    }

    // Verificar si hay órdenes usando esta área
    const ordersUsingArea = await queryOne(`
      SELECT COUNT(*) as count FROM order_areas WHERE area_id = ?
    `, [areaId]);

    if (ordersUsingArea.count > 0) {
      throw new ConflictError(`No se puede eliminar el área porque está siendo usada en ${ordersUsingArea.count} orden(es)`);
    }

    // Eliminar área
    await query('DELETE FROM cleaning_areas WHERE id = ?', [areaId]);

    // Registrar actividad
    await logActivity(
      userId,
      null,
      'cleaning_area_deleted',
      `Área de limpieza "${area.name_es}" eliminada por ${req.user.name}`,
      req
    );

    res.json({
      success: true,
      message: 'Área de limpieza eliminada exitosamente',
      area_id: areaId
    });

  } catch (error) {
    logError(error, req, 'Delete Cleaning Area Route');

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        error: 'No encontrado',
        message: error.message
      });
    }

    if (error instanceof ConflictError) {
      return res.status(409).json({
        error: 'Conflicto',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al eliminar área de limpieza'
    });
  }
});

// ================================================
// ASIGNAR ÁREAS A UNA ORDEN
// ================================================
router.post('/orders/:orderId/areas', authenticateToken, requireRole(['admin', 'jefe', 'gerente']), [
  body('area_ids')
    .isArray({ min: 1 })
    .withMessage('Debe proporcionar al menos un área'),
  body('area_ids.*')
    .isInt({ min: 1 })
    .withMessage('ID de área no válido')
], handleValidationErrors, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { area_ids } = req.body;
    const userId = req.userId;

    // Verificar que la orden existe y es de tipo regular
    const order = await queryOne(`
      SELECT id, order_number, order_type, status
      FROM orders
      WHERE id = ?
    `, [orderId]);

    if (!order) {
      throw new NotFoundError('Orden no encontrada');
    }

    if (order.order_type !== 'regular') {
      throw new ConflictError('Las áreas solo pueden asignarse a órdenes regulares');
    }

    if (order.status !== 'pending' && order.status !== 'assigned') {
      throw new ConflictError('Solo se pueden asignar áreas a órdenes pendientes o asignadas');
    }

    // Verificar que todas las áreas existen y están activas
    const areasResult = await query(`
      SELECT id, name_es FROM cleaning_areas
      WHERE id IN (${area_ids.map(() => '?').join(',')})
      AND is_active = 1
    `, area_ids);

    if (areasResult.rows.length !== area_ids.length) {
      throw new ValidationError('Una o más áreas no son válidas o no están activas');
    }

    // Eliminar áreas anteriores
    await query('DELETE FROM order_areas WHERE order_id = ?', [orderId]);

    // Asignar nuevas áreas
    for (const areaId of area_ids) {
      await insert('order_areas', {
        order_id: orderId,
        area_id: areaId,
        is_completed: false
      });
    }

    // Registrar actividad
    await logActivity(
      userId,
      orderId,
      'order_areas_assigned',
      `${area_ids.length} área(s) asignada(s) a orden ${order.order_number}`,
      req
    );

    res.json({
      success: true,
      message: `${area_ids.length} área(s) asignada(s) exitosamente`,
      order_id: orderId,
      areas_assigned: area_ids.length
    });

  } catch (error) {
    logError(error, req, 'Assign Areas to Order Route');

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
      message: 'Error al asignar áreas'
    });
  }
});

module.exports = router;
