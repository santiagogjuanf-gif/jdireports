// ================================================
// RUTAS DE CHAT - JD CLEANING SERVICES
// ================================================

const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
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
  validateImageFormat,
  validateImageSize
} = require('../utils/imageProcessor');

const router = express.Router();

// ================================================
// CONFIGURACIÓN DE MULTER PARA IMÁGENES DE CHAT
// ================================================

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB para chat
  },
  fileFilter: (req, file, cb) => {
    if (validateImageFormat(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de imagen no válido. Solo JPG, PNG y WEBP'));
    }
  }
});

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

// ================================================
// CREAR O OBTENER CONVERSACIÓN
// ================================================
router.post('/conversations', authenticateToken, [
  body('participantIds')
    .isArray({ min: 1 })
    .withMessage('participantIds debe ser un array con al menos 1 usuario'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Título no puede exceder 200 caracteres'),
  body('isGroup')
    .optional()
    .isBoolean()
    .withMessage('isGroup debe ser verdadero o falso')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.userId;
    const { participantIds, title, isGroup = false } = req.body;

    // Agregar al creador como participante si no está
    const allParticipants = [...new Set([userId, ...participantIds])];

    // Validar que los usuarios existen
    const placeholders = allParticipants.map(() => '?').join(',');
    const usersResult = await query(`
      SELECT id, name FROM users
      WHERE id IN (${placeholders}) AND is_active = 1
    `, allParticipants);

    if (usersResult.rows.length !== allParticipants.length) {
      throw new ValidationError('Uno o más usuarios no existen o están inactivos');
    }

    // Si no es grupo y hay solo 2 participantes, verificar si ya existe conversación
    if (!isGroup && allParticipants.length === 2) {
      const existingConversation = await queryOne(`
        SELECT c.id, c.title, c.is_group, c.created_at, c.last_message_at
        FROM conversations c
        WHERE c.is_group = 0
          AND (
            SELECT COUNT(*)
            FROM conversation_participants cp
            WHERE cp.conversation_id = c.id
              AND cp.user_id IN (?, ?)
          ) = 2
          AND (
            SELECT COUNT(*)
            FROM conversation_participants cp2
            WHERE cp2.conversation_id = c.id
          ) = 2
        LIMIT 1
      `, allParticipants);

      if (existingConversation) {
        // Obtener participantes
        const participants = await query(`
          SELECT
            cp.user_id,
            u.name,
            u.role
          FROM conversation_participants cp
          JOIN users u ON cp.user_id = u.id
          WHERE cp.conversation_id = ?
        `, [existingConversation.id]);

        return res.json({
          success: true,
          conversation: {
            ...existingConversation,
            participants: participants.rows || []
          },
          isExisting: true
        });
      }
    }

    // Crear nueva conversación
    const conversationData = {
      title: title?.trim() || null,
      is_group: isGroup,
      created_by: userId
    };

    const conversationId = await insert('conversations', conversationData);

    // Agregar participantes
    for (const participantId of allParticipants) {
      await insert('conversation_participants', {
        conversation_id: conversationId,
        user_id: participantId
      });
    }

    // Obtener conversación completa
    const newConversation = await queryOne(`
      SELECT
        id,
        title,
        is_group,
        created_by,
        created_at,
        last_message_at
      FROM conversations
      WHERE id = ?
    `, [conversationId]);

    // Obtener participantes
    const participants = await query(`
      SELECT
        cp.user_id,
        u.name,
        u.role
      FROM conversation_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.conversation_id = ?
    `, [conversationId]);

    newConversation.participants = participants.rows || [];

    // Registrar actividad
    await logActivity(
      userId,
      null,
      'conversation_created',
      `Conversación ${isGroup ? 'grupal' : 'directa'} creada por ${req.user.name}`,
      req
    );

    res.status(201).json({
      success: true,
      conversation: newConversation,
      isExisting: false
    });

  } catch (error) {
    logError(error, req, 'Create Conversation Route');

    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: 'Error de validación',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al crear conversación'
    });
  }
});

// ================================================
// LISTAR CONVERSACIONES DEL USUARIO
// ================================================
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const conversationsResult = await query(`
      SELECT
        c.id,
        c.title,
        c.is_group,
        c.created_by,
        c.created_at,
        c.last_message_at,
        (
          SELECT COUNT(*)
          FROM messages m
          WHERE m.conversation_id = c.id
            AND m.sender_id != ?
            AND m.is_read = 0
        ) as unread_count,
        (
          SELECT m2.content
          FROM messages m2
          WHERE m2.conversation_id = c.id
          ORDER BY m2.created_at DESC
          LIMIT 1
        ) as last_message_content,
        (
          SELECT m3.created_at
          FROM messages m3
          WHERE m3.conversation_id = c.id
          ORDER BY m3.created_at DESC
          LIMIT 1
        ) as last_message_time
      FROM conversations c
      WHERE EXISTS (
        SELECT 1
        FROM conversation_participants cp
        WHERE cp.conversation_id = c.id AND cp.user_id = ?
      )
      ORDER BY c.last_message_at DESC, c.created_at DESC
    `, [userId, userId]);

    const conversations = conversationsResult.rows || [];

    // Obtener participantes para cada conversación
    for (const conversation of conversations) {
      const participants = await query(`
        SELECT
          cp.user_id,
          u.name,
          u.role
        FROM conversation_participants cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.conversation_id = ?
      `, [conversation.id]);

      conversation.participants = participants.rows || [];
    }

    res.json({
      success: true,
      conversations,
      total: conversations.length
    });

  } catch (error) {
    logError(error, req, 'List Conversations Route');
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al listar conversaciones'
    });
  }
});

// ================================================
// OBTENER DETALLES DE CONVERSACIÓN
// ================================================
router.get('/conversations/:conversationId', authenticateToken, async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    const userId = req.userId;

    // Verificar que el usuario es participante
    const isParticipant = await queryOne(`
      SELECT id FROM conversation_participants
      WHERE conversation_id = ? AND user_id = ?
    `, [conversationId, userId]);

    if (!isParticipant) {
      throw new ForbiddenError('No tienes acceso a esta conversación');
    }

    // Obtener conversación
    const conversation = await queryOne(`
      SELECT
        id,
        title,
        is_group,
        created_by,
        created_at,
        last_message_at
      FROM conversations
      WHERE id = ?
    `, [conversationId]);

    if (!conversation) {
      throw new NotFoundError('Conversación no encontrada');
    }

    // Obtener participantes
    const participants = await query(`
      SELECT
        cp.user_id,
        cp.joined_at,
        u.name,
        u.email,
        u.role
      FROM conversation_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.conversation_id = ?
      ORDER BY u.name ASC
    `, [conversationId]);

    conversation.participants = participants.rows || [];

    res.json({
      success: true,
      conversation
    });

  } catch (error) {
    logError(error, req, 'Get Conversation Route');

    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      return res.status(error.statusCode || 404).json({
        error: error.name,
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al obtener conversación'
    });
  }
});

// ================================================
// OBTENER MENSAJES DE UNA CONVERSACIÓN
// ================================================
router.get('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    const userId = req.userId;
    const { limit = 50, offset = 0 } = req.query;

    // Verificar acceso
    const isParticipant = await queryOne(`
      SELECT id FROM conversation_participants
      WHERE conversation_id = ? AND user_id = ?
    `, [conversationId, userId]);

    if (!isParticipant) {
      throw new ForbiddenError('No tienes acceso a esta conversación');
    }

    // Obtener mensajes
    const messagesResult = await query(`
      SELECT
        m.id,
        m.conversation_id,
        m.sender_id,
        m.content,
        m.reply_to_message_id,
        m.is_read,
        m.read_at,
        m.created_at,
        sender.name as sender_name,
        sender.role as sender_role
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `, [conversationId, parseInt(limit), parseInt(offset)]);

    const messages = messagesResult.rows || [];

    // Obtener imágenes para cada mensaje
    for (const message of messages) {
      const images = await query(`
        SELECT id, image_url, uploaded_at
        FROM message_images
        WHERE message_id = ?
        ORDER BY id ASC
      `, [message.id]);

      message.images = images.rows || [];
    }

    // Obtener total de mensajes
    const totalResult = await queryOne(`
      SELECT COUNT(*) as total
      FROM messages
      WHERE conversation_id = ?
    `, [conversationId]);

    res.json({
      success: true,
      messages: messages.reverse(), // Ordenar de más antiguo a más nuevo
      total: totalResult.total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    logError(error, req, 'Get Messages Route');

    if (error instanceof ForbiddenError) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al obtener mensajes'
    });
  }
});

// ================================================
// SUBIR IMAGEN PARA CHAT
// ================================================
router.post('/images', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const userId = req.userId;

    if (!req.file) {
      throw new ValidationError('No se proporcionó ninguna imagen');
    }

    // Validar tamaño
    if (!validateImageSize(req.file.size, 5)) {
      throw new ValidationError('La imagen excede el tamaño máximo permitido de 5MB');
    }

    // Procesar y guardar imagen (sin marca de agua para chat)
    const { filename, photoUrl, thumbnailUrl } = await processAndSavePhoto(
      req.file.buffer,
      req.file.originalname,
      {
        addWatermark: false, // No watermark para imágenes de chat
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 85
      }
    );

    res.status(201).json({
      success: true,
      message: 'Imagen subida exitosamente',
      image: {
        filename,
        url: photoUrl,
        thumbnail: thumbnailUrl
      }
    });

  } catch (error) {
    logError(error, req, 'Upload Chat Image Route');

    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: 'Error de validación',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al subir imagen'
    });
  }
});

// ================================================
// AGREGAR PARTICIPANTE A CONVERSACIÓN GRUPAL
// ================================================
router.post('/conversations/:conversationId/participants', authenticateToken, [
  body('userId')
    .isInt()
    .withMessage('userId debe ser un número entero válido')
], handleValidationErrors, async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    const requesterId = req.userId;
    const { userId: newParticipantId } = req.body;

    // Obtener conversación
    const conversation = await queryOne(`
      SELECT id, is_group, created_by
      FROM conversations
      WHERE id = ?
    `, [conversationId]);

    if (!conversation) {
      throw new NotFoundError('Conversación no encontrada');
    }

    if (!conversation.is_group) {
      throw new ConflictError('Solo se pueden agregar participantes a conversaciones grupales');
    }

    // Verificar que el solicitante es participante
    const isParticipant = await queryOne(`
      SELECT id FROM conversation_participants
      WHERE conversation_id = ? AND user_id = ?
    `, [conversationId, requesterId]);

    if (!isParticipant) {
      throw new ForbiddenError('No tienes acceso a esta conversación');
    }

    // Verificar que el nuevo participante existe
    const newUser = await queryOne(`
      SELECT id, name FROM users
      WHERE id = ? AND is_active = 1
    `, [newParticipantId]);

    if (!newUser) {
      throw new NotFoundError('Usuario no encontrado o inactivo');
    }

    // Verificar que no está ya en la conversación
    const alreadyParticipant = await queryOne(`
      SELECT id FROM conversation_participants
      WHERE conversation_id = ? AND user_id = ?
    `, [conversationId, newParticipantId]);

    if (alreadyParticipant) {
      throw new ConflictError('El usuario ya es participante de esta conversación');
    }

    // Agregar participante
    await insert('conversation_participants', {
      conversation_id: conversationId,
      user_id: newParticipantId
    });

    // Registrar actividad
    await logActivity(
      requesterId,
      null,
      'participant_added',
      `${req.user.name} agregó a ${newUser.name} a la conversación`,
      req
    );

    res.status(201).json({
      success: true,
      message: 'Participante agregado exitosamente',
      participant: {
        user_id: newParticipantId,
        name: newUser.name
      }
    });

  } catch (error) {
    logError(error, req, 'Add Participant Route');

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
      message: 'Error al agregar participante'
    });
  }
});

// ================================================
// SALIR DE CONVERSACIÓN
// ================================================
router.delete('/conversations/:conversationId/leave', authenticateToken, async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    const userId = req.userId;

    // Verificar que es participante
    const isParticipant = await queryOne(`
      SELECT id FROM conversation_participants
      WHERE conversation_id = ? AND user_id = ?
    `, [conversationId, userId]);

    if (!isParticipant) {
      throw new NotFoundError('No eres participante de esta conversación');
    }

    // Eliminar participación
    await query(`
      DELETE FROM conversation_participants
      WHERE conversation_id = ? AND user_id = ?
    `, [conversationId, userId]);

    // Verificar si quedan participantes
    const remainingParticipants = await queryOne(`
      SELECT COUNT(*) as count
      FROM conversation_participants
      WHERE conversation_id = ?
    `, [conversationId]);

    // Si no quedan participantes, eliminar la conversación
    if (remainingParticipants.count === 0) {
      await query('DELETE FROM conversations WHERE id = ?', [conversationId]);
    }

    await logActivity(
      userId,
      null,
      'conversation_left',
      `${req.user.name} salió de la conversación`,
      req
    );

    res.json({
      success: true,
      message: 'Has salido de la conversación exitosamente'
    });

  } catch (error) {
    logError(error, req, 'Leave Conversation Route');

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        error: 'No encontrado',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al salir de la conversación'
    });
  }
});

module.exports = router;
