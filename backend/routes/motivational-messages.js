// ================================================
// RUTAS DE MENSAJES MOTIVACIONALES - JD CLEANING SERVICES
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

const createMessageValidation = [
  body('message_es')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Mensaje en español debe tener entre 5 y 500 caracteres'),
  body('message_en')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Mensaje en inglés debe tener entre 5 y 500 caracteres'),
  body('message_fr')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Mensaje en francés debe tener entre 5 y 500 caracteres'),
  body('category')
    .optional()
    .trim()
    .isIn(['motivacional', 'consejo', 'seguridad', 'calidad'])
    .withMessage('Categoría debe ser: motivacional, consejo, seguridad o calidad'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active debe ser verdadero o falso')
];

// ================================================
// LISTAR TODOS LOS MENSAJES
// ================================================
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { language = 'es', active_only = 'true', category } = req.query;

    // Validar idioma
    const validLanguages = ['es', 'en', 'fr'];
    const lang = validLanguages.includes(language) ? language : 'es';

    // Construir query
    let sql = `
      SELECT
        id,
        message_es,
        message_en,
        message_fr,
        category,
        is_active,
        created_at,
        updated_at
      FROM motivational_messages
    `;

    const conditions = [];
    const params = [];

    if (active_only === 'true') {
      conditions.push('is_active = 1');
    }

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY RAND()'; // Random order for variety

    const messagesResult = await query(sql, params);
    const messages = messagesResult.rows || [];

    // Transformar respuesta para incluir el mensaje en el idioma seleccionado
    const transformedMessages = messages.map(msg => ({
      id: msg.id,
      message: msg[`message_${lang}`], // Mensaje en el idioma seleccionado
      message_es: msg.message_es,
      message_en: msg.message_en,
      message_fr: msg.message_fr,
      category: msg.category,
      is_active: msg.is_active,
      created_at: msg.created_at,
      updated_at: msg.updated_at
    }));

    res.json({
      success: true,
      messages: transformedMessages,
      total: transformedMessages.length,
      language: lang
    });

  } catch (error) {
    logError(error, req, 'List Motivational Messages Route');
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al listar mensajes motivacionales'
    });
  }
});

// ================================================
// OBTENER MENSAJE ALEATORIO
// ================================================
router.get('/random', authenticateToken, async (req, res) => {
  try {
    const { language = 'es', category } = req.query;

    // Validar idioma
    const validLanguages = ['es', 'en', 'fr'];
    const lang = validLanguages.includes(language) ? language : 'es';

    let sql = `
      SELECT
        id,
        message_es,
        message_en,
        message_fr,
        category,
        is_active
      FROM motivational_messages
      WHERE is_active = 1
    `;

    const params = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    sql += ' ORDER BY RAND() LIMIT 1';

    const message = await queryOne(sql, params);

    if (!message) {
      return res.json({
        success: true,
        message: null,
        note: 'No hay mensajes motivacionales disponibles'
      });
    }

    res.json({
      success: true,
      message: {
        id: message.id,
        message: message[`message_${lang}`],
        category: message.category
      },
      language: lang
    });

  } catch (error) {
    logError(error, req, 'Get Random Motivational Message Route');
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al obtener mensaje motivacional'
    });
  }
});

// ================================================
// OBTENER MENSAJE POR ID
// ================================================
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const messageId = req.params.id;
    const { language = 'es' } = req.query;

    // Validar idioma
    const validLanguages = ['es', 'en', 'fr'];
    const lang = validLanguages.includes(language) ? language : 'es';

    const message = await queryOne(`
      SELECT
        id,
        message_es,
        message_en,
        message_fr,
        category,
        is_active,
        created_at,
        updated_at
      FROM motivational_messages
      WHERE id = ?
    `, [messageId]);

    if (!message) {
      throw new NotFoundError('Mensaje motivacional no encontrado');
    }

    res.json({
      success: true,
      message: {
        ...message,
        message: message[`message_${lang}`] // Mensaje en el idioma seleccionado
      },
      language: lang
    });

  } catch (error) {
    logError(error, req, 'Get Motivational Message Route');

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        error: 'No encontrado',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al obtener mensaje motivacional'
    });
  }
});

// ================================================
// CREAR NUEVO MENSAJE (Solo admin/jefe)
// ================================================
router.post('/', authenticateToken, requireRole(['admin', 'jefe']), createMessageValidation, handleValidationErrors, async (req, res) => {
  try {
    const {
      message_es,
      message_en,
      message_fr,
      category = 'motivacional',
      is_active = true
    } = req.body;

    const userId = req.userId;

    // Crear mensaje
    const messageData = {
      message_es: message_es.trim(),
      message_en: message_en.trim(),
      message_fr: message_fr.trim(),
      category,
      is_active
    };

    const messageId = await insert('motivational_messages', messageData);

    // Registrar actividad
    await logActivity(
      userId,
      null,
      'motivational_message_created',
      `Mensaje motivacional creado por ${req.user.name}`,
      req
    );

    res.status(201).json({
      success: true,
      message: 'Mensaje motivacional creado exitosamente',
      motivational_message: {
        id: messageId,
        ...messageData
      }
    });

  } catch (error) {
    logError(error, req, 'Create Motivational Message Route');
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al crear mensaje motivacional'
    });
  }
});

// ================================================
// ACTUALIZAR MENSAJE (Solo admin/jefe)
// ================================================
router.put('/:id', authenticateToken, requireRole(['admin', 'jefe']), [
  body('message_es')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Mensaje en español debe tener entre 5 y 500 caracteres'),
  body('message_en')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Mensaje en inglés debe tener entre 5 y 500 caracteres'),
  body('message_fr')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Mensaje en francés debe tener entre 5 y 500 caracteres'),
  body('category')
    .optional()
    .trim()
    .isIn(['motivacional', 'consejo', 'seguridad', 'calidad'])
    .withMessage('Categoría debe ser: motivacional, consejo, seguridad o calidad'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active debe ser verdadero o falso')
], handleValidationErrors, async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.userId;
    const {
      message_es,
      message_en,
      message_fr,
      category,
      is_active
    } = req.body;

    // Verificar que el mensaje existe
    const message = await queryOne(`
      SELECT id FROM motivational_messages WHERE id = ?
    `, [messageId]);

    if (!message) {
      throw new NotFoundError('Mensaje motivacional no encontrado');
    }

    // Construir objeto de actualización
    const updates = {};
    if (message_es) updates.message_es = message_es.trim();
    if (message_en) updates.message_en = message_en.trim();
    if (message_fr) updates.message_fr = message_fr.trim();
    if (category) updates.category = category;
    if (is_active !== undefined) updates.is_active = is_active;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Debes proporcionar al menos un campo para actualizar'
      });
    }

    // Actualizar mensaje
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), messageId];

    await query(
      `UPDATE motivational_messages SET ${setClause}, updated_at = NOW() WHERE id = ?`,
      values
    );

    // Registrar actividad
    await logActivity(
      userId,
      null,
      'motivational_message_updated',
      `Mensaje motivacional actualizado por ${req.user.name}`,
      req
    );

    res.json({
      success: true,
      message: 'Mensaje motivacional actualizado exitosamente',
      message_id: messageId,
      updated: updates
    });

  } catch (error) {
    logError(error, req, 'Update Motivational Message Route');

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        error: 'No encontrado',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al actualizar mensaje motivacional'
    });
  }
});

// ================================================
// ELIMINAR MENSAJE (Solo admin/jefe)
// ================================================
router.delete('/:id', authenticateToken, requireRole(['admin', 'jefe']), async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.userId;

    // Verificar que el mensaje existe
    const message = await queryOne(`
      SELECT id FROM motivational_messages WHERE id = ?
    `, [messageId]);

    if (!message) {
      throw new NotFoundError('Mensaje motivacional no encontrado');
    }

    // Eliminar mensaje
    await query('DELETE FROM motivational_messages WHERE id = ?', [messageId]);

    // Registrar actividad
    await logActivity(
      userId,
      null,
      'motivational_message_deleted',
      `Mensaje motivacional eliminado por ${req.user.name}`,
      req
    );

    res.json({
      success: true,
      message: 'Mensaje motivacional eliminado exitosamente',
      message_id: messageId
    });

  } catch (error) {
    logError(error, req, 'Delete Motivational Message Route');

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        error: 'No encontrado',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al eliminar mensaje motivacional'
    });
  }
});

module.exports = router;
