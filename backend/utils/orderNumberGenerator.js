// ================================================
// GENERADOR DE NÚMEROS DE ORDEN
// JD CLEANING SERVICES
// ================================================

const { query } = require('../config/database');

/**
 * Genera el siguiente número de orden para el año actual
 * Formato: JDI-YYYY-NNNN
 * Ejemplo: JDI-2025-0001, JDI-2025-0002, etc.
 *
 * @returns {Promise<string>} Número de orden generado
 */
const generateOrderNumber = async () => {
  try {
    const currentYear = new Date().getFullYear();

    // Obtener el último número de orden del año actual
    const result = await query(`
      SELECT order_number
      FROM orders
      WHERE order_number LIKE ?
      ORDER BY order_number DESC
      LIMIT 1
    `, [`JDI-${currentYear}-%`]);

    let nextNumber = 1;

    if (result.rows && result.rows.length > 0) {
      // Extraer el número del último order_number
      const lastOrderNumber = result.rows[0].order_number;
      const match = lastOrderNumber.match(/JDI-\d{4}-(\d{4})/);

      if (match) {
        const lastNumber = parseInt(match[1], 10);
        nextNumber = lastNumber + 1;
      }
    }

    // Formatear el número con ceros a la izquierda (4 dígitos)
    const formattedNumber = String(nextNumber).padStart(4, '0');

    // Generar el número completo
    const orderNumber = `JDI-${currentYear}-${formattedNumber}`;

    return orderNumber;

  } catch (error) {
    console.error('Error generando número de orden:', error);
    throw error;
  }
};

/**
 * Valida el formato de un número de orden
 * @param {string} orderNumber - Número de orden a validar
 * @returns {boolean} true si es válido, false si no
 */
const validateOrderNumber = (orderNumber) => {
  const pattern = /^JDI-\d{4}-\d{4}$/;
  return pattern.test(orderNumber);
};

/**
 * Extrae el año y número secuencial de un order_number
 * @param {string} orderNumber - Número de orden
 * @returns {Object} Objeto con año y número
 */
const parseOrderNumber = (orderNumber) => {
  const match = orderNumber.match(/^JDI-(\d{4})-(\d{4})$/);

  if (!match) {
    return null;
  }

  return {
    year: parseInt(match[1], 10),
    sequentialNumber: parseInt(match[2], 10),
    formatted: orderNumber
  };
};

/**
 * Verifica si un número de orden ya existe
 * @param {string} orderNumber - Número de orden a verificar
 * @returns {Promise<boolean>} true si existe, false si no
 */
const orderNumberExists = async (orderNumber) => {
  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM orders WHERE order_number = ?',
      [orderNumber]
    );
    return result.rows[0].count > 0;
  } catch (error) {
    console.error('Error verificando número de orden:', error);
    throw error;
  }
};

/**
 * Genera un número de orden único (con retry en caso de colisión)
 * @param {number} maxRetries - Máximo de intentos
 * @returns {Promise<string>} Número de orden único
 */
const generateUniqueOrderNumber = async (maxRetries = 5) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const orderNumber = await generateOrderNumber();
    const exists = await orderNumberExists(orderNumber);

    if (!exists) {
      return orderNumber;
    }

    // Si existe, esperar un momento antes de reintentar
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  throw new Error('No se pudo generar un número de orden único después de múltiples intentos');
};

module.exports = {
  generateOrderNumber,
  validateOrderNumber,
  parseOrderNumber,
  orderNumberExists,
  generateUniqueOrderNumber
};
