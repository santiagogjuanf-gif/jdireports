// ================================================
// RUTAS DE REPORTES DIARIOS - JD CLEANING SERVICES
// (Para órdenes de tipo post-construcción)
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

const createDailyReportValidation = [
  body('report_date')
    .isISO8601()
    .withMessage('Fecha del reporte debe ser válida'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('La descripción debe tener entre 10 y 2000 caracteres'),
  body('signature_worker')
    .optional()
    .isString()
    .withMessage('Firma del trabajador debe ser una cadena base64')
];

// ================================================
// CREAR REPORTE DIARIO
// ================================================
router.post('/orders/:orderId/reports', authenticateToken, requireRole(['trabajador']), createDailyReportValidation, handleValidationErrors, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const workerId = req.userId;
    const { report_date, description, signature_worker } = req.body;

    // Verificar que la orden existe y es de tipo post-construcción
    const order = await queryOne(`
      SELECT id, order_number, order_type, status
      FROM orders
      WHERE id = ?
    `, [orderId]);

    if (!order) {
      throw new NotFoundError('Orden no encontrada');
    }

    if (order.order_type !== 'post_construction') {
      throw new ConflictError('Los reportes diarios solo están disponibles para órdenes de post-construcción');
    }

    // Verificar que el trabajador está asignado a esta orden
    const isAssigned = await queryOne(`
      SELECT id FROM order_assignments
      WHERE order_id = ? AND worker_id = ?
    `, [orderId, workerId]);

    if (!isAssigned) {
      throw new ForbiddenError('No estás asignado a esta orden');
    }

    // Verificar que la orden esté en progreso
    if (order.status !== 'in_progress') {
      throw new ConflictError('La orden debe estar en progreso para crear reportes diarios');
    }

    // Verificar que no exista ya un reporte para esta fecha
    const existingReport = await queryOne(`
      SELECT id FROM daily_reports
      WHERE order_id = ? AND DATE(report_date) = DATE(?)
    `, [orderId, report_date]);

    if (existingReport) {
      throw new ConflictError('Ya existe un reporte para esta fecha en esta orden');
    }

    // Crear el reporte diario
    const reportData = {
      order_id: orderId,
      report_date,
      description: description.trim(),
      signature_worker: signature_worker || null,
      created_by: workerId
    };

    const reportId = await insert('daily_reports', reportData);

    // Registrar actividad
    await logActivity(
      workerId,
      orderId,
      'daily_report_created',
      `Reporte diario creado para orden ${order.order_number} por ${req.user.name}`,
      req
    );

    res.status(201).json({
      success: true,
      message: 'Reporte diario creado exitosamente',
      report: {
        id: reportId,
        ...reportData
      }
    });

  } catch (error) {
    logError(error, req, 'Create Daily Report Route');

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
        error: 'Error de conflicto',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al crear el reporte diario'
    });
  }
});

// ================================================
// LISTAR REPORTES DIARIOS DE UNA ORDEN
// ================================================
router.get('/orders/:orderId/reports', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.userId;
    const userRole = req.userRole;

    // Verificar que la orden existe
    const order = await queryOne(`
      SELECT id, order_number, order_type
      FROM orders
      WHERE id = ?
    `, [orderId]);

    if (!order) {
      throw new NotFoundError('Orden no encontrada');
    }

    if (order.order_type !== 'post_construction') {
      throw new ConflictError('Los reportes diarios solo están disponibles para órdenes de post-construcción');
    }

    // Verificar permisos
    if (userRole === 'trabajador') {
      const isAssigned = await queryOne(`
        SELECT id FROM order_assignments
        WHERE order_id = ? AND worker_id = ?
      `, [orderId, userId]);

      if (!isAssigned) {
        throw new ForbiddenError('No tienes acceso a esta orden');
      }
    } else if (userRole === 'gerente') {
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

    // Obtener reportes diarios
    const reportsResult = await query(`
      SELECT
        dr.id,
        dr.report_date,
        dr.description,
        dr.signature_worker,
        dr.created_at,
        dr.updated_at,
        worker.name as created_by_name,
        worker.email as created_by_email,
        (SELECT COUNT(*) FROM order_photos op WHERE op.daily_report_id = dr.id) as photos_count
      FROM daily_reports dr
      JOIN users worker ON dr.created_by = worker.id
      WHERE dr.order_id = ?
      ORDER BY dr.report_date DESC
    `, [orderId]);

    res.json({
      success: true,
      reports: reportsResult.rows || [],
      total: reportsResult.rows?.length || 0
    });

  } catch (error) {
    logError(error, req, 'List Daily Reports Route');

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
        error: 'Error de conflicto',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al listar reportes diarios'
    });
  }
});

// ================================================
// OBTENER DETALLE DE UN REPORTE DIARIO
// ================================================
router.get('/reports/:reportId', authenticateToken, async (req, res) => {
  try {
    const reportId = req.params.reportId;
    const userId = req.userId;
    const userRole = req.userRole;

    // Obtener el reporte
    const report = await queryOne(`
      SELECT
        dr.*,
        worker.name as created_by_name,
        worker.email as created_by_email,
        o.order_number,
        o.order_type,
        o.client_name
      FROM daily_reports dr
      JOIN users worker ON dr.created_by = worker.id
      JOIN orders o ON dr.order_id = o.id
      WHERE dr.id = ?
    `, [reportId]);

    if (!report) {
      throw new NotFoundError('Reporte diario no encontrado');
    }

    // Verificar permisos
    if (userRole === 'trabajador') {
      const isAssigned = await queryOne(`
        SELECT id FROM order_assignments
        WHERE order_id = ? AND worker_id = ?
      `, [report.order_id, userId]);

      if (!isAssigned) {
        throw new ForbiddenError('No tienes acceso a este reporte');
      }
    } else if (userRole === 'gerente') {
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
      `, [report.order_id, userId, userId]);

      if (!hasAccess) {
        throw new ForbiddenError('No tienes acceso a este reporte');
      }
    }

    // Obtener fotos asociadas al reporte
    const photosResult = await query(`
      SELECT
        op.id,
        op.photo_url,
        op.thumbnail_url,
        op.caption,
        op.uploaded_at,
        uploader.name as uploaded_by_name
      FROM order_photos op
      JOIN users uploader ON op.uploaded_by = uploader.id
      WHERE op.daily_report_id = ?
      ORDER BY op.uploaded_at ASC
    `, [reportId]);

    res.json({
      success: true,
      report: {
        ...report,
        photos: photosResult.rows || []
      }
    });

  } catch (error) {
    logError(error, req, 'Get Daily Report Details Route');

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
      message: 'Error al obtener el reporte diario'
    });
  }
});

// ================================================
// ACTUALIZAR REPORTE DIARIO
// ================================================
router.put('/reports/:reportId', authenticateToken, requireRole(['trabajador']), [
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('La descripción debe tener entre 10 y 2000 caracteres'),
  body('signature_worker')
    .optional()
    .isString()
    .withMessage('Firma del trabajador debe ser una cadena base64')
], handleValidationErrors, async (req, res) => {
  try {
    const reportId = req.params.reportId;
    const workerId = req.userId;
    const { description, signature_worker } = req.body;

    // Obtener el reporte
    const report = await queryOne(`
      SELECT dr.*, o.status, o.order_number
      FROM daily_reports dr
      JOIN orders o ON dr.order_id = o.id
      WHERE dr.id = ?
    `, [reportId]);

    if (!report) {
      throw new NotFoundError('Reporte diario no encontrado');
    }

    // Verificar que el trabajador es quien creó el reporte
    if (report.created_by !== workerId) {
      throw new ForbiddenError('Solo puedes editar reportes que tú creaste');
    }

    // No se puede editar si la orden está completada o cancelada
    if (report.status === 'completed' || report.status === 'cancelled') {
      throw new ConflictError('No se puede editar un reporte de una orden completada o cancelada');
    }

    // Construir objeto de actualización
    const updates = {};
    if (description) updates.description = description.trim();
    if (signature_worker !== undefined) updates.signature_worker = signature_worker || null;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Debes proporcionar al menos un campo para actualizar'
      });
    }

    // Actualizar reporte
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), reportId];

    await query(
      `UPDATE daily_reports SET ${setClause}, updated_at = NOW() WHERE id = ?`,
      values
    );

    // Registrar actividad
    await logActivity(
      workerId,
      report.order_id,
      'daily_report_updated',
      `Reporte diario actualizado para orden ${report.order_number} por ${req.user.name}`,
      req
    );

    res.json({
      success: true,
      message: 'Reporte diario actualizado exitosamente',
      report_id: reportId,
      updated: updates
    });

  } catch (error) {
    logError(error, req, 'Update Daily Report Route');

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
        error: 'Error de conflicto',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al actualizar el reporte diario'
    });
  }
});

// ================================================
// ELIMINAR REPORTE DIARIO
// ================================================
router.delete('/reports/:reportId', authenticateToken, requireRole(['admin', 'jefe', 'gerente']), async (req, res) => {
  try {
    const reportId = req.params.reportId;
    const userId = req.userId;

    // Obtener el reporte
    const report = await queryOne(`
      SELECT dr.*, o.order_number, o.status
      FROM daily_reports dr
      JOIN orders o ON dr.order_id = o.id
      WHERE dr.id = ?
    `, [reportId]);

    if (!report) {
      throw new NotFoundError('Reporte diario no encontrado');
    }

    // No se puede eliminar si la orden está completada
    if (report.status === 'completed') {
      throw new ConflictError('No se puede eliminar un reporte de una orden completada');
    }

    // Eliminar fotos asociadas primero (por integridad referencial)
    await query('DELETE FROM order_photos WHERE daily_report_id = ?', [reportId]);

    // Eliminar el reporte
    await query('DELETE FROM daily_reports WHERE id = ?', [reportId]);

    // Registrar actividad
    await logActivity(
      userId,
      report.order_id,
      'daily_report_deleted',
      `Reporte diario eliminado de orden ${report.order_number} por ${req.user.name}`,
      req
    );

    res.json({
      success: true,
      message: 'Reporte diario eliminado exitosamente',
      report_id: reportId
    });

  } catch (error) {
    logError(error, req, 'Delete Daily Report Route');

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        error: 'No encontrado',
        message: error.message
      });
    }

    if (error instanceof ConflictError) {
      return res.status(400).json({
        error: 'Error de conflicto',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al eliminar el reporte diario'
    });
  }
});

module.exports = router;
