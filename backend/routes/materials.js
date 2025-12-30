// ================================================
// RUTAS DE MATERIALES E INVENTARIO - JD CLEANING SERVICES
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
  ConflictError,
  ForbiddenError
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

const createMaterialValidation = [
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
  body('unit')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Unidad debe tener entre 1 y 20 caracteres'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active debe ser verdadero o falso')
];

const createRequestValidation = [
  body('materials')
    .isArray({ min: 1 })
    .withMessage('Debe solicitar al menos un material'),
  body('materials.*.material_id')
    .isInt({ min: 1 })
    .withMessage('ID de material no válido'),
  body('materials.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Cantidad debe ser un número positivo'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Las notas no pueden exceder 500 caracteres')
];

// ================================================
// LISTAR TODOS LOS MATERIALES
// ================================================
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { language = 'es', active_only = 'true' } = req.query;

    // Validar idioma
    const validLanguages = ['es', 'en', 'fr'];
    const lang = validLanguages.includes(language) ? language : 'es';

    let sql = `
      SELECT
        id,
        name_es,
        name_en,
        name_fr,
        unit,
        is_active,
        created_at,
        updated_at
      FROM materials
    `;

    const params = [];

    if (active_only === 'true') {
      sql += ' WHERE is_active = 1';
    }

    sql += ' ORDER BY name_es ASC';

    const materialsResult = await query(sql, params);
    const materials = materialsResult.rows || [];

    // Transformar respuesta
    const transformedMaterials = materials.map(material => ({
      id: material.id,
      name: material[`name_${lang}`],
      name_es: material.name_es,
      name_en: material.name_en,
      name_fr: material.name_fr,
      unit: material.unit,
      is_active: material.is_active,
      created_at: material.created_at,
      updated_at: material.updated_at
    }));

    res.json({
      success: true,
      materials: transformedMaterials,
      total: transformedMaterials.length,
      language: lang
    });

  } catch (error) {
    logError(error, req, 'List Materials Route');
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al listar materiales'
    });
  }
});

// ================================================
// OBTENER MATERIAL POR ID
// ================================================
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const materialId = req.params.id;
    const { language = 'es' } = req.query;

    const validLanguages = ['es', 'en', 'fr'];
    const lang = validLanguages.includes(language) ? language : 'es';

    const material = await queryOne(`
      SELECT
        id,
        name_es,
        name_en,
        name_fr,
        unit,
        is_active,
        created_at,
        updated_at
      FROM materials
      WHERE id = ?
    `, [materialId]);

    if (!material) {
      throw new NotFoundError('Material no encontrado');
    }

    res.json({
      success: true,
      material: {
        ...material,
        name: material[`name_${lang}`]
      },
      language: lang
    });

  } catch (error) {
    logError(error, req, 'Get Material Route');

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        error: 'No encontrado',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al obtener material'
    });
  }
});

// ================================================
// CREAR NUEVO MATERIAL (Solo admin/jefe)
// ================================================
router.post('/', authenticateToken, requireRole(['admin', 'jefe']), createMaterialValidation, handleValidationErrors, async (req, res) => {
  try {
    const {
      name_es,
      name_en,
      name_fr,
      unit,
      is_active = true
    } = req.body;

    const userId = req.userId;

    const materialData = {
      name_es: name_es.trim(),
      name_en: name_en.trim(),
      name_fr: name_fr.trim(),
      unit: unit.trim(),
      is_active
    };

    const materialId = await insert('materials', materialData);

    await logActivity(
      userId,
      null,
      'material_created',
      `Material "${name_es}" creado por ${req.user.name}`,
      req
    );

    res.status(201).json({
      success: true,
      message: 'Material creado exitosamente',
      material: {
        id: materialId,
        ...materialData
      }
    });

  } catch (error) {
    logError(error, req, 'Create Material Route');
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al crear material'
    });
  }
});

// ================================================
// ACTUALIZAR MATERIAL (Solo admin/jefe)
// ================================================
router.put('/:id', authenticateToken, requireRole(['admin', 'jefe']), [
  body('name_es')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }),
  body('name_en')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }),
  body('name_fr')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }),
  body('unit')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 }),
  body('is_active')
    .optional()
    .isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const materialId = req.params.id;
    const userId = req.userId;
    const { name_es, name_en, name_fr, unit, is_active } = req.body;

    const material = await queryOne('SELECT id, name_es FROM materials WHERE id = ?', [materialId]);
    if (!material) {
      throw new NotFoundError('Material no encontrado');
    }

    const updates = {};
    if (name_es) updates.name_es = name_es.trim();
    if (name_en) updates.name_en = name_en.trim();
    if (name_fr) updates.name_fr = name_fr.trim();
    if (unit) updates.unit = unit.trim();
    if (is_active !== undefined) updates.is_active = is_active;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Debes proporcionar al menos un campo para actualizar'
      });
    }

    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), materialId];

    await query(
      `UPDATE materials SET ${setClause}, updated_at = NOW() WHERE id = ?`,
      values
    );

    await logActivity(
      userId,
      null,
      'material_updated',
      `Material "${material.name_es}" actualizado por ${req.user.name}`,
      req
    );

    res.json({
      success: true,
      message: 'Material actualizado exitosamente',
      material_id: materialId,
      updated: updates
    });

  } catch (error) {
    logError(error, req, 'Update Material Route');

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        error: 'No encontrado',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al actualizar material'
    });
  }
});

// ================================================
// ELIMINAR MATERIAL (Solo admin/jefe)
// ================================================
router.delete('/:id', authenticateToken, requireRole(['admin', 'jefe']), async (req, res) => {
  try {
    const materialId = req.params.id;
    const userId = req.userId;

    const material = await queryOne('SELECT id, name_es FROM materials WHERE id = ?', [materialId]);
    if (!material) {
      throw new NotFoundError('Material no encontrado');
    }

    // Verificar si hay solicitudes usando este material
    const requestsUsingMaterial = await queryOne(`
      SELECT COUNT(*) as count FROM material_request_items WHERE material_id = ?
    `, [materialId]);

    if (requestsUsingMaterial.count > 0) {
      throw new ConflictError(`No se puede eliminar el material porque está siendo usado en ${requestsUsingMaterial.count} solicitud(es)`);
    }

    await query('DELETE FROM materials WHERE id = ?', [materialId]);

    await logActivity(
      userId,
      null,
      'material_deleted',
      `Material "${material.name_es}" eliminado por ${req.user.name}`,
      req
    );

    res.json({
      success: true,
      message: 'Material eliminado exitosamente',
      material_id: materialId
    });

  } catch (error) {
    logError(error, req, 'Delete Material Route');

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
      message: 'Error al eliminar material'
    });
  }
});

// ================================================
// CREAR SOLICITUD DE MATERIALES
// ================================================
router.post('/requests', authenticateToken, createRequestValidation, handleValidationErrors, async (req, res) => {
  try {
    const { materials, notes } = req.body;
    const userId = req.userId;

    // Verificar que todos los materiales existen y están activos
    const materialIds = materials.map(m => m.material_id);
    const materialsResult = await query(`
      SELECT id, name_es FROM materials
      WHERE id IN (${materialIds.map(() => '?').join(',')})
      AND is_active = 1
    `, materialIds);

    if (materialsResult.rows.length !== materialIds.length) {
      throw new ValidationError('Uno o más materiales no son válidos o no están activos');
    }

    // Crear la solicitud
    const requestData = {
      requested_by: userId,
      notes: notes?.trim() || null,
      status: 'pending'
    };

    const requestId = await insert('material_requests', requestData);

    // Insertar los items de la solicitud
    for (const item of materials) {
      await insert('material_request_items', {
        request_id: requestId,
        material_id: item.material_id,
        quantity: item.quantity
      });
    }

    await logActivity(
      userId,
      null,
      'material_request_created',
      `Solicitud de materiales #${requestId} creada por ${req.user.name}`,
      req
    );

    res.status(201).json({
      success: true,
      message: 'Solicitud de materiales creada exitosamente',
      request: {
        id: requestId,
        ...requestData,
        items: materials
      }
    });

  } catch (error) {
    logError(error, req, 'Create Material Request Route');

    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: 'Error de validación',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al crear solicitud de materiales'
    });
  }
});

// ================================================
// LISTAR SOLICITUDES DE MATERIALES
// ================================================
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    const { status, language = 'es', page = 1, limit = 20 } = req.query;

    const validLanguages = ['es', 'en', 'fr'];
    const lang = validLanguages.includes(language) ? language : 'es';

    const conditions = [];
    const params = [];

    // Filtrar por rol
    if (userRole === 'trabajador') {
      conditions.push('mr.requested_by = ?');
      params.push(userId);
    } else if (userRole === 'gerente') {
      conditions.push('(mr.requested_by = ? OR mr.requested_by IN (SELECT id FROM users WHERE created_by = ?))');
      params.push(userId, userId);
    }

    // Filtrar por estado
    if (status) {
      conditions.push('mr.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0
      ? 'WHERE ' + conditions.join(' AND ')
      : '';

    const offset = (page - 1) * limit;

    const requestsResult = await query(`
      SELECT
        mr.id,
        mr.requested_by,
        mr.status,
        mr.notes,
        mr.requested_at,
        mr.approved_by,
        mr.approved_at,
        mr.delivered_at,
        requester.name as requester_name,
        approver.name as approver_name
      FROM material_requests mr
      JOIN users requester ON mr.requested_by = requester.id
      LEFT JOIN users approver ON mr.approved_by = approver.id
      ${whereClause}
      ORDER BY mr.requested_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    // Obtener items de cada solicitud
    const requests = await Promise.all(
      (requestsResult.rows || []).map(async (request) => {
        const itemsResult = await query(`
          SELECT
            mri.id,
            mri.material_id,
            mri.quantity,
            m.name_es,
            m.name_en,
            m.name_fr,
            m.unit
          FROM material_request_items mri
          JOIN materials m ON mri.material_id = m.id
          WHERE mri.request_id = ?
        `, [request.id]);

        const items = (itemsResult.rows || []).map(item => ({
          ...item,
          material_name: item[`name_${lang}`]
        }));

        return {
          ...request,
          items
        };
      })
    );

    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM material_requests mr
      ${whereClause}
    `, params);

    const total = countResult.rows[0]?.total || 0;

    res.json({
      success: true,
      requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      language: lang
    });

  } catch (error) {
    logError(error, req, 'List Material Requests Route');
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al listar solicitudes de materiales'
    });
  }
});

// ================================================
// OBTENER DETALLES DE UNA SOLICITUD
// ================================================
router.get('/requests/:id', authenticateToken, async (req, res) => {
  try {
    const requestId = req.params.id;
    const userId = req.userId;
    const userRole = req.userRole;
    const { language = 'es' } = req.query;

    const validLanguages = ['es', 'en', 'fr'];
    const lang = validLanguages.includes(language) ? language : 'es';

    const request = await queryOne(`
      SELECT
        mr.*,
        requester.name as requester_name,
        requester.email as requester_email,
        approver.name as approver_name
      FROM material_requests mr
      JOIN users requester ON mr.requested_by = requester.id
      LEFT JOIN users approver ON mr.approved_by = approver.id
      WHERE mr.id = ?
    `, [requestId]);

    if (!request) {
      throw new NotFoundError('Solicitud no encontrada');
    }

    // Verificar permisos
    if (userRole === 'trabajador' && request.requested_by !== userId) {
      throw new ForbiddenError('No tienes acceso a esta solicitud');
    } else if (userRole === 'gerente') {
      const hasAccess = await queryOne(`
        SELECT 1 FROM users WHERE id = ? AND (id = ? OR created_by = ?)
      `, [request.requested_by, userId, userId]);

      if (!hasAccess) {
        throw new ForbiddenError('No tienes acceso a esta solicitud');
      }
    }

    // Obtener items
    const itemsResult = await query(`
      SELECT
        mri.*,
        m.name_es,
        m.name_en,
        m.name_fr,
        m.unit
      FROM material_request_items mri
      JOIN materials m ON mri.material_id = m.id
      WHERE mri.request_id = ?
    `, [requestId]);

    const items = (itemsResult.rows || []).map(item => ({
      ...item,
      material_name: item[`name_${lang}`]
    }));

    res.json({
      success: true,
      request: {
        ...request,
        items
      },
      language: lang
    });

  } catch (error) {
    logError(error, req, 'Get Material Request Details Route');

    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      return res.status(error.statusCode || 404).json({
        error: error.name,
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al obtener detalles de la solicitud'
    });
  }
});

// ================================================
// APROBAR SOLICITUD (Admin/Jefe/Gerente)
// ================================================
router.post('/requests/:id/approve', authenticateToken, requireRole(['admin', 'jefe', 'gerente']), async (req, res) => {
  try {
    const requestId = req.params.id;
    const userId = req.userId;

    const request = await queryOne(`
      SELECT id, status, requested_by
      FROM material_requests WHERE id = ?
    `, [requestId]);

    if (!request) {
      throw new NotFoundError('Solicitud no encontrada');
    }

    if (request.status !== 'pending') {
      throw new ConflictError('Solo se pueden aprobar solicitudes pendientes');
    }

    await query(`
      UPDATE material_requests SET
        status = 'requested',
        approved_by = ?,
        approved_at = NOW()
      WHERE id = ?
    `, [userId, requestId]);

    await logActivity(
      userId,
      null,
      'material_request_approved',
      `Solicitud de materiales #${requestId} aprobada por ${req.user.name}`,
      req
    );

    res.json({
      success: true,
      message: 'Solicitud aprobada exitosamente',
      request_id: requestId
    });

  } catch (error) {
    logError(error, req, 'Approve Material Request Route');

    if (error instanceof NotFoundError || error instanceof ConflictError) {
      return res.status(error.statusCode || 404).json({
        error: error.name,
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al aprobar solicitud'
    });
  }
});

// ================================================
// MARCAR COMO ENTREGADA (Admin/Jefe/Gerente)
// ================================================
router.post('/requests/:id/deliver', authenticateToken, requireRole(['admin', 'jefe', 'gerente']), async (req, res) => {
  try {
    const requestId = req.params.id;
    const userId = req.userId;

    const request = await queryOne(`
      SELECT id, status FROM material_requests WHERE id = ?
    `, [requestId]);

    if (!request) {
      throw new NotFoundError('Solicitud no encontrada');
    }

    if (request.status !== 'requested' && request.status !== 'in_transit') {
      throw new ConflictError('Solo se pueden entregar solicitudes aprobadas o en tránsito');
    }

    await query(`
      UPDATE material_requests SET
        status = 'delivered',
        delivered_at = NOW()
      WHERE id = ?
    `, [requestId]);

    await logActivity(
      userId,
      null,
      'material_request_delivered',
      `Solicitud de materiales #${requestId} marcada como entregada por ${req.user.name}`,
      req
    );

    res.json({
      success: true,
      message: 'Solicitud marcada como entregada exitosamente',
      request_id: requestId
    });

  } catch (error) {
    logError(error, req, 'Deliver Material Request Route');

    if (error instanceof NotFoundError || error instanceof ConflictError) {
      return res.status(error.statusCode || 404).json({
        error: error.name,
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al marcar como entregada'
    });
  }
});

// ================================================
// CANCELAR SOLICITUD
// ================================================
router.post('/requests/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const requestId = req.params.id;
    const userId = req.userId;
    const userRole = req.userRole;
    const { reason } = req.body;

    const request = await queryOne(`
      SELECT id, status, requested_by FROM material_requests WHERE id = ?
    `, [requestId]);

    if (!request) {
      throw new NotFoundError('Solicitud no encontrada');
    }

    // Solo el solicitante o admin/jefe pueden cancelar
    if (userRole !== 'admin' && userRole !== 'jefe' && request.requested_by !== userId) {
      throw new ForbiddenError('No tienes permiso para cancelar esta solicitud');
    }

    if (request.status === 'delivered' || request.status === 'cancelled') {
      throw new ConflictError('No se puede cancelar una solicitud entregada o ya cancelada');
    }

    await query(`
      UPDATE material_requests SET
        status = 'cancelled',
        notes = CONCAT(COALESCE(notes, ''), '\n\nCANCELADA: ', ?)
      WHERE id = ?
    `, [reason || 'Sin razón especificada', requestId]);

    await logActivity(
      userId,
      null,
      'material_request_cancelled',
      `Solicitud de materiales #${requestId} cancelada por ${req.user.name}`,
      req
    );

    res.json({
      success: true,
      message: 'Solicitud cancelada exitosamente',
      request_id: requestId
    });

  } catch (error) {
    logError(error, req, 'Cancel Material Request Route');

    if (error instanceof NotFoundError || error instanceof ConflictError || error instanceof ForbiddenError) {
      return res.status(error.statusCode || 404).json({
        error: error.name,
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al cancelar solicitud'
    });
  }
});

module.exports = router;
