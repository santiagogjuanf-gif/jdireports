// ================================================
// RUTAS DE FOTOS - JD CLEANING SERVICES
// ================================================

const express = require('express');
const multer = require('multer');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logActivity, logError } = require('../middleware/logger');
const {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  ValidationError
} = require('../middleware/errorHandler');
const { queryOne, insert, query } = require('../config/database');
const {
  processAndSavePhoto,
  deleteImage,
  validateImageFormat,
  validateImageSize,
  initializeDirectories
} = require('../utils/imageProcessor');

const router = express.Router();

// ================================================
// CONFIGURACIÓN DE MULTER
// ================================================

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (validateImageFormat(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de imagen no válido. Solo se permiten JPG, PNG y WEBP'));
    }
  }
});

// Inicializar directorios al cargar el módulo
initializeDirectories().catch(console.error);

// ================================================
// SUBIR FOTO A UNA ORDEN
// ================================================
router.post('/orders/:orderId/photos', authenticateToken, requireRole(['trabajador']), upload.single('photo'), async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const workerId = req.userId;
    const { caption, daily_report_id } = req.body;

    if (!req.file) {
      throw new ValidationError('No se proporcionó ninguna imagen');
    }

    // Verificar que la orden existe
    const order = await queryOne(`
      SELECT id, order_number, order_type, status
      FROM orders WHERE id = ?
    `, [orderId]);

    if (!order) {
      throw new NotFoundError('Orden no encontrada');
    }

    // Verificar que el trabajador está asignado
    const isAssigned = await queryOne(`
      SELECT id FROM order_assignments
      WHERE order_id = ? AND worker_id = ?
    `, [orderId, workerId]);

    if (!isAssigned) {
      throw new ForbiddenError('No estás asignado a esta orden');
    }

    // Verificar que la orden esté en progreso
    if (order.status !== 'in_progress') {
      throw new ConflictError('Solo se pueden subir fotos a órdenes en progreso');
    }

    // Verificar límite de fotos según tipo de orden
    const photoCount = await queryOne(`
      SELECT COUNT(*) as count FROM order_photos
      WHERE order_id = ? ${daily_report_id ? 'AND daily_report_id = ?' : ''}
    `, daily_report_id ? [orderId, daily_report_id] : [orderId]);

    const maxPhotos = order.order_type === 'regular' ? 15 : 50;

    if (photoCount.count >= maxPhotos) {
      throw new ConflictError(`Se ha alcanzado el límite de ${maxPhotos} fotos para este ${order.order_type === 'regular' ? 'orden' : 'reporte diario'}`);
    }

    // Validar tamaño
    if (!validateImageSize(req.file.size)) {
      throw new ValidationError('La imagen excede el tamaño máximo permitido de 10MB');
    }

    // Procesar y guardar la imagen
    const { filename, photoUrl, thumbnailUrl } = await processAndSavePhoto(
      req.file.buffer,
      req.file.originalname,
      {
        addWatermark: true // Siempre agregar marca de agua
      }
    );

    // Guardar en base de datos
    const photoData = {
      order_id: orderId,
      daily_report_id: daily_report_id || null,
      photo_url: photoUrl,
      thumbnail_url: thumbnailUrl,
      caption: caption?.trim() || null,
      uploaded_by: workerId
    };

    const photoId = await insert('order_photos', photoData);

    // Registrar actividad
    await logActivity(
      workerId,
      orderId,
      'photo_uploaded',
      `Foto subida a orden ${order.order_number} por ${req.user.name}`,
      req
    );

    res.status(201).json({
      success: true,
      message: 'Foto subida exitosamente',
      photo: {
        id: photoId,
        ...photoData,
        filename
      }
    });

  } catch (error) {
    logError(error, req, 'Upload Photo Route');

    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: 'Error de validación',
        message: error.message
      });
    }

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
      return res.status(409).json({
        error: 'Conflicto',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al subir la foto'
    });
  }
});

// ================================================
// LISTAR FOTOS DE UNA ORDEN
// ================================================
router.get('/orders/:orderId/photos', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.userId;
    const userRole = req.userRole;
    const { daily_report_id } = req.query;

    // Verificar que la orden existe
    const order = await queryOne('SELECT id, order_number FROM orders WHERE id = ?', [orderId]);
    if (!order) {
      throw new NotFoundError('Orden no encontrada');
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

    // Construir query
    let sql = `
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
    `;

    const params = [orderId];

    if (daily_report_id) {
      sql += ' AND op.daily_report_id = ?';
      params.push(daily_report_id);
    }

    sql += ' ORDER BY op.uploaded_at DESC';

    const photosResult = await query(sql, params);

    res.json({
      success: true,
      photos: photosResult.rows || [],
      total: photosResult.rows?.length || 0
    });

  } catch (error) {
    logError(error, req, 'List Photos Route');

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
      message: 'Error al listar fotos'
    });
  }
});

// ================================================
// OBTENER DETALLES DE UNA FOTO
// ================================================
router.get('/photos/:photoId', authenticateToken, async (req, res) => {
  try {
    const photoId = req.params.photoId;
    const userId = req.userId;
    const userRole = req.userRole;

    const photo = await queryOne(`
      SELECT
        op.*,
        uploader.name as uploaded_by_name,
        o.order_number,
        o.client_name
      FROM order_photos op
      JOIN users uploader ON op.uploaded_by = uploader.id
      JOIN orders o ON op.order_id = o.id
      WHERE op.id = ?
    `, [photoId]);

    if (!photo) {
      throw new NotFoundError('Foto no encontrada');
    }

    // Verificar permisos
    if (userRole === 'trabajador') {
      const isAssigned = await queryOne(`
        SELECT id FROM order_assignments
        WHERE order_id = ? AND worker_id = ?
      `, [photo.order_id, userId]);

      if (!isAssigned) {
        throw new ForbiddenError('No tienes acceso a esta foto');
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
      `, [photo.order_id, userId, userId]);

      if (!hasAccess) {
        throw new ForbiddenError('No tienes acceso a esta foto');
      }
    }

    res.json({
      success: true,
      photo
    });

  } catch (error) {
    logError(error, req, 'Get Photo Details Route');

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
      message: 'Error al obtener detalles de la foto'
    });
  }
});

// ================================================
// ACTUALIZAR CAPTION DE UNA FOTO
// ================================================
router.put('/photos/:photoId/caption', authenticateToken, requireRole(['trabajador']), async (req, res) => {
  try {
    const photoId = req.params.photoId;
    const workerId = req.userId;
    const { caption } = req.body;

    const photo = await queryOne(`
      SELECT op.*, o.status, o.order_number
      FROM order_photos op
      JOIN orders o ON op.order_id = o.id
      WHERE op.id = ?
    `, [photoId]);

    if (!photo) {
      throw new NotFoundError('Foto no encontrada');
    }

    // Solo el que subió la foto puede cambiar el caption
    if (photo.uploaded_by !== workerId) {
      throw new ForbiddenError('Solo puedes editar fotos que tú subiste');
    }

    // No se puede editar si la orden está completada
    if (photo.status === 'completed' || photo.status === 'cancelled') {
      throw new ConflictError('No se puede editar fotos de órdenes completadas o canceladas');
    }

    await query(
      'UPDATE order_photos SET caption = ? WHERE id = ?',
      [caption?.trim() || null, photoId]
    );

    await logActivity(
      workerId,
      photo.order_id,
      'photo_caption_updated',
      `Caption de foto actualizado en orden ${photo.order_number}`,
      req
    );

    res.json({
      success: true,
      message: 'Caption actualizado exitosamente',
      photo_id: photoId
    });

  } catch (error) {
    logError(error, req, 'Update Photo Caption Route');

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
      return res.status(409).json({
        error: 'Conflicto',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al actualizar caption'
    });
  }
});

// ================================================
// ELIMINAR FOTO
// ================================================
router.delete('/photos/:photoId', authenticateToken, async (req, res) => {
  try {
    const photoId = req.params.photoId;
    const userId = req.userId;
    const userRole = req.userRole;

    const photo = await queryOne(`
      SELECT op.*, o.status, o.order_number
      FROM order_photos op
      JOIN orders o ON op.order_id = o.id
      WHERE op.id = ?
    `, [photoId]);

    if (!photo) {
      throw new NotFoundError('Foto no encontrada');
    }

    // Solo admin, jefe o el que subió la foto pueden eliminar
    if (!['admin', 'jefe'].includes(userRole) && photo.uploaded_by !== userId) {
      throw new ForbiddenError('No tienes permiso para eliminar esta foto');
    }

    // No se puede eliminar si la orden está completada
    if (photo.status === 'completed') {
      throw new ConflictError('No se pueden eliminar fotos de órdenes completadas');
    }

    // Extraer nombre de archivo de la URL
    const filename = photo.photo_url.split('/').pop();

    // Eliminar archivos físicos
    await deleteImage(filename);

    // Eliminar de base de datos
    await query('DELETE FROM order_photos WHERE id = ?', [photoId]);

    await logActivity(
      userId,
      photo.order_id,
      'photo_deleted',
      `Foto eliminada de orden ${photo.order_number} por ${req.user.name}`,
      req
    );

    res.json({
      success: true,
      message: 'Foto eliminada exitosamente',
      photo_id: photoId
    });

  } catch (error) {
    logError(error, req, 'Delete Photo Route');

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
      return res.status(409).json({
        error: 'Conflicto',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al eliminar foto'
    });
  }
});

module.exports = router;
