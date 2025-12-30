// ================================================
// CHAT HANDLER - SOCKET.IO - JD CLEANING SERVICES
// ================================================

const { logActivity, logError } = require('../middleware/logger');
const { queryOne, query, insert } = require('../config/database');
const jwt = require('jsonwebtoken');

// ================================================
// ALMACENAMIENTO DE USUARIOS CONECTADOS
// ================================================

const connectedUsers = new Map();

// ================================================
// AUTENTICACIÓN DE SOCKET
// ================================================

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Token de autenticación requerido'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar que el usuario existe
    const user = await queryOne(`
      SELECT id, name, email, role, is_active
      FROM users WHERE id = ?
    `, [decoded.userId]);

    if (!user || !user.is_active) {
      return next(new Error('Usuario no válido o inactivo'));
    }

    // Agregar info del usuario al socket
    socket.userId = user.id;
    socket.userName = user.name;
    socket.userRole = user.role;
    socket.userEmail = user.email;

    next();
  } catch (error) {
    next(new Error('Token inválido o expirado'));
  }
};

// ================================================
// HELPER: OBTENER DESTINATARIOS DE MENSAJE
// ================================================

const getMessageRecipients = async (senderId, conversationId) => {
  try {
    // Obtener todos los participantes de la conversación excepto el remitente
    const result = await query(`
      SELECT cp.user_id, u.name, u.role
      FROM conversation_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.conversation_id = ?
        AND cp.user_id != ?
        AND u.is_active = 1
    `, [conversationId, senderId]);

    return result.rows || [];
  } catch (error) {
    console.error('❌ Error al obtener destinatarios:', error);
    return [];
  }
};

// ================================================
// HELPER: VERIFICAR ACCESO A CONVERSACIÓN
// ================================================

const hasAccessToConversation = async (userId, conversationId) => {
  const participant = await queryOne(`
    SELECT id FROM conversation_participants
    WHERE conversation_id = ? AND user_id = ?
  `, [conversationId, userId]);

  return !!participant;
};

// ================================================
// INICIALIZAR CHAT HANDLER
// ================================================

const initializeChatHandler = (io) => {
  // Middleware de autenticación
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const userId = socket.userId;
    const userName = socket.userName;

    console.log(`✅ Usuario conectado al chat: ${userName} (ID: ${userId})`);

    // Agregar a usuarios conectados
    connectedUsers.set(userId, {
      socketId: socket.id,
      name: userName,
      role: socket.userRole,
      connectedAt: new Date()
    });

    // Emitir lista de usuarios conectados a todos
    io.emit('users:online', {
      users: Array.from(connectedUsers.entries()).map(([id, data]) => ({
        id,
        name: data.name,
        role: data.role
      }))
    });

    // ================================================
    // UNIRSE A CONVERSACIÓN
    // ================================================
    socket.on('conversation:join', async (data) => {
      try {
        const { conversationId } = data;

        // Verificar acceso
        const hasAccess = await hasAccessToConversation(userId, conversationId);
        if (!hasAccess) {
          socket.emit('error', {
            event: 'conversation:join',
            message: 'No tienes acceso a esta conversación'
          });
          return;
        }

        // Unirse a la sala
        socket.join(`conversation:${conversationId}`);

        // Notificar al resto
        socket.to(`conversation:${conversationId}`).emit('user:joined', {
          userId,
          userName,
          conversationId
        });

        socket.emit('conversation:joined', {
          conversationId,
          success: true
        });

      } catch (error) {
        console.error('❌ Error en conversation:join:', error);
        socket.emit('error', {
          event: 'conversation:join',
          message: 'Error al unirse a la conversación'
        });
      }
    });

    // ================================================
    // SALIR DE CONVERSACIÓN
    // ================================================
    socket.on('conversation:leave', async (data) => {
      try {
        const { conversationId } = data;

        socket.leave(`conversation:${conversationId}`);

        socket.to(`conversation:${conversationId}`).emit('user:left', {
          userId,
          userName,
          conversationId
        });

      } catch (error) {
        console.error('❌ Error en conversation:leave:', error);
      }
    });

    // ================================================
    // ENVIAR MENSAJE
    // ================================================
    socket.on('message:send', async (data) => {
      try {
        const {
          conversationId,
          content,
          imageUrls = [],
          replyToMessageId = null
        } = data;

        // Validaciones
        if (!conversationId) {
          socket.emit('error', {
            event: 'message:send',
            message: 'conversationId es requerido'
          });
          return;
        }

        if (!content?.trim() && imageUrls.length === 0) {
          socket.emit('error', {
            event: 'message:send',
            message: 'El mensaje debe tener contenido o imágenes'
          });
          return;
        }

        if (imageUrls.length > 3) {
          socket.emit('error', {
            event: 'message:send',
            message: 'Máximo 3 imágenes por mensaje'
          });
          return;
        }

        // Verificar acceso
        const hasAccess = await hasAccessToConversation(userId, conversationId);
        if (!hasAccess) {
          socket.emit('error', {
            event: 'message:send',
            message: 'No tienes acceso a esta conversación'
          });
          return;
        }

        // Insertar mensaje en BD
        const messageData = {
          conversation_id: conversationId,
          sender_id: userId,
          content: content?.trim() || null,
          reply_to_message_id: replyToMessageId || null
        };

        const messageId = await insert('messages', messageData);

        // Insertar imágenes si hay
        if (imageUrls.length > 0) {
          for (const imageUrl of imageUrls) {
            await insert('message_images', {
              message_id: messageId,
              image_url: imageUrl
            });
          }
        }

        // Obtener mensaje completo con info del remitente
        const fullMessage = await queryOne(`
          SELECT
            m.id,
            m.conversation_id,
            m.sender_id,
            m.content,
            m.reply_to_message_id,
            m.created_at,
            m.is_read,
            sender.name as sender_name,
            sender.role as sender_role
          FROM messages m
          JOIN users sender ON m.sender_id = sender.id
          WHERE m.id = ?
        `, [messageId]);

        // Obtener imágenes del mensaje
        const images = await query(`
          SELECT id, image_url
          FROM message_images
          WHERE message_id = ?
          ORDER BY id ASC
        `, [messageId]);

        fullMessage.images = images.rows || [];

        // Emitir mensaje a todos en la conversación
        io.to(`conversation:${conversationId}`).emit('message:new', fullMessage);

        // Actualizar last_message_at de la conversación
        await query(`
          UPDATE conversations
          SET last_message_at = NOW()
          WHERE id = ?
        `, [conversationId]);

        // Enviar confirmación al remitente
        socket.emit('message:sent', {
          success: true,
          message: fullMessage
        });

      } catch (error) {
        console.error('❌ Error en message:send:', error);
        socket.emit('error', {
          event: 'message:send',
          message: 'Error al enviar mensaje'
        });
      }
    });

    // ================================================
    // ESCRIBIENDO (TYPING INDICATOR)
    // ================================================
    socket.on('typing:start', async (data) => {
      try {
        const { conversationId } = data;

        // Verificar acceso
        const hasAccess = await hasAccessToConversation(userId, conversationId);
        if (!hasAccess) return;

        // Emitir a otros en la conversación
        socket.to(`conversation:${conversationId}`).emit('user:typing', {
          userId,
          userName,
          conversationId
        });

      } catch (error) {
        console.error('❌ Error en typing:start:', error);
      }
    });

    socket.on('typing:stop', async (data) => {
      try {
        const { conversationId } = data;

        // Verificar acceso
        const hasAccess = await hasAccessToConversation(userId, conversationId);
        if (!hasAccess) return;

        // Emitir a otros en la conversación
        socket.to(`conversation:${conversationId}`).emit('user:stopped-typing', {
          userId,
          userName,
          conversationId
        });

      } catch (error) {
        console.error('❌ Error en typing:stop:', error);
      }
    });

    // ================================================
    // MARCAR MENSAJES COMO LEÍDOS
    // ================================================
    socket.on('messages:read', async (data) => {
      try {
        const { conversationId, messageIds } = data;

        if (!conversationId || !messageIds || messageIds.length === 0) {
          return;
        }

        // Verificar acceso
        const hasAccess = await hasAccessToConversation(userId, conversationId);
        if (!hasAccess) return;

        // Marcar como leído
        const placeholders = messageIds.map(() => '?').join(',');
        await query(`
          UPDATE messages
          SET is_read = 1, read_at = NOW()
          WHERE conversation_id = ?
            AND id IN (${placeholders})
            AND sender_id != ?
            AND is_read = 0
        `, [conversationId, ...messageIds, userId]);

        // Notificar a la conversación
        io.to(`conversation:${conversationId}`).emit('messages:read', {
          conversationId,
          messageIds,
          readBy: userId,
          readByName: userName
        });

      } catch (error) {
        console.error('❌ Error en messages:read:', error);
      }
    });

    // ================================================
    // DESCONEXIÓN
    // ================================================
    socket.on('disconnect', () => {
      console.log(`❌ Usuario desconectado: ${userName} (ID: ${userId})`);

      // Remover de usuarios conectados
      connectedUsers.delete(userId);

      // Emitir lista actualizada de usuarios conectados
      io.emit('users:online', {
        users: Array.from(connectedUsers.entries()).map(([id, data]) => ({
          id,
          name: data.name,
          role: data.role
        }))
      });
    });
  });

  return io;
};

// ================================================
// OBTENER USUARIOS CONECTADOS
// ================================================

const getConnectedUsers = () => {
  return Array.from(connectedUsers.entries()).map(([id, data]) => ({
    id,
    name: data.name,
    role: data.role,
    connectedAt: data.connectedAt
  }));
};

// ================================================
// EXPORTAR
// ================================================

module.exports = {
  initializeChatHandler,
  getConnectedUsers,
  authenticateSocket
};
