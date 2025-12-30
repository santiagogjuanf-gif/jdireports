// ================================================
// SERVICIO DE NOTIFICACIONES
// JD CLEANING SERVICES
// ================================================

const { insert } = require('../config/database');
const { sendOrderAssignedEmail, sendOrderCompletedEmail, sendInventoryApprovedEmail } = require('./emailService');

/**
 * Crea una notificación en la base de datos
 * @param {number} userId - ID del usuario destinatario
 * @param {string} type - Tipo de notificación
 * @param {string} title - Título
 * @param {string} message - Mensaje
 * @param {number} orderId - ID de orden relacionada (opcional)
 * @param {object} relatedData - Datos adicionales (opcional)
 * @returns {Promise<number>} ID de la notificación creada
 */
const createNotification = async (userId, type, title, message, orderId = null, relatedData = null) => {
  try {
    const notificationData = {
      user_id: userId,
      type,
      title,
      message,
      order_id: orderId,
      related_data: relatedData ? JSON.stringify(relatedData) : null,
      is_read: false
    };

    const notificationId = await insert('notifications', notificationData);
    return notificationId;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Envía notificación de orden asignada
 */
const notifyOrderAssigned = async (io, userId, orderNumber, clientName, address, userEmail, userName) => {
  try {
    // Crear notificación en BD
    await createNotification(
      userId,
      'order_assigned',
      'New Order Assigned',
      `You have been assigned to order ${orderNumber} for ${clientName}`,
      null,
      { orderNumber, clientName, address }
    );

    // Enviar por Socket.IO en tiempo real
    if (io) {
      io.to(`user_${userId}`).emit('notification', {
        type: 'order_assigned',
        title: 'New Order Assigned',
        message: `Order ${orderNumber} assigned to you`,
        orderNumber
      });
    }

    // Enviar email
    await sendOrderAssignedEmail(userEmail, userName, orderNumber, clientName, address);

  } catch (error) {
    console.error('Error notifying order assigned:', error);
  }
};

/**
 * Envía notificación de orden completada
 */
const notifyOrderCompleted = async (io, userId, orderNumber, clientName, workerName, userEmail, userName) => {
  try {
    await createNotification(
      userId,
      'order_completed',
      'Order Completed',
      `Order ${orderNumber} for ${clientName} has been completed by ${workerName}`,
      null,
      { orderNumber, clientName, workerName }
    );

    if (io) {
      io.to(`user_${userId}`).emit('notification', {
        type: 'order_completed',
        title: 'Order Completed',
        message: `Order ${orderNumber} completed`,
        orderNumber
      });
    }

    await sendOrderCompletedEmail(userEmail, userName, orderNumber, clientName, workerName);

  } catch (error) {
    console.error('Error notifying order completed:', error);
  }
};

module.exports = {
  createNotification,
  notifyOrderAssigned,
  notifyOrderCompleted
};
