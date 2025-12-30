// ================================================
// SISTEMA DE LOGS PARA JD CLEANING SERVICES
// ================================================

const fs = require('fs');
const path = require('path');
const { insert } = require('../config/database');

// ================================================
// CONFIGURACIÓN DE LOGS
// ================================================

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Nombres de archivos de log
const LOG_FILES = {
  access: path.join(logsDir, 'access.log'),
  error: path.join(logsDir, 'error.log'),
  auth: path.join(logsDir, 'auth.log'),
  orders: path.join(logsDir, 'orders.log'),
  system: path.join(logsDir, 'system.log')
};

// ================================================
// UTILIDADES DE FORMATO
// ================================================

/**
 * Obtener timestamp formateado
 * @returns {string} Timestamp en formato ISO
 */
const getTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Obtener información del cliente
 * @param {Request} req - Request object
 * @returns {object} Información del cliente
 */
const getClientInfo = (req) => {
  return {
    ip: req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
        (req.connection.socket ? req.connection.socket.remoteAddress : null),
    userAgent: req.get('User-Agent') || 'Unknown',
    method: req.method,
    url: req.originalUrl || req.url,
    protocol: req.protocol,
    hostname: req.get('host')
  };
};

/**
 * Formatear mensaje de log
 * @param {string} level - Nivel del log
 * @param {string} message - Mensaje
 * @param {object} meta - Información adicional
 * @returns {string} Mensaje formateado
 */
const formatLogMessage = (level, message, meta = {}) => {
  const timestamp = getTimestamp();
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    ...meta
  };
  
  return JSON.stringify(logEntry) + '\n';
};

// ================================================
// FUNCIONES DE ESCRITURA DE LOGS
// ================================================

/**
 * Escribir log a archivo
 * @param {string} filename - Nombre del archivo
 * @param {string} level - Nivel del log
 * @param {string} message - Mensaje
 * @param {object} meta - Información adicional
 */
const writeLog = (filename, level, message, meta = {}) => {
  try {
    const logMessage = formatLogMessage(level, message, meta);
    fs.appendFileSync(filename, logMessage);
  } catch (error) {
    console.error('Error escribiendo log:', error);
  }
};

/**
 * Log de acceso HTTP
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 * @param {number} responseTime - Tiempo de respuesta en ms
 */
const logAccess = (req, res, responseTime) => {
  const clientInfo = getClientInfo(req);
  const meta = {
    ...clientInfo,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userId: req.userId || null,
    userRole: req.userRole || null
  };
  
  writeLog(LOG_FILES.access, 'info', 'HTTP Request', meta);
};

/**
 * Log de errores
 * @param {Error} error - Error object
 * @param {Request} req - Request object
 * @param {string} context - Contexto del error
 */
const logError = (error, req = null, context = 'Unknown') => {
  const meta = {
    context,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  };
  
  if (req) {
    meta.client = getClientInfo(req);
    meta.userId = req.userId || null;
    meta.userRole = req.userRole || null;
  }
  
  writeLog(LOG_FILES.error, 'error', `Error: ${error.message}`, meta);
  
  // También registrar en consola para desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.error(`🔥 [${getTimestamp()}] ${context}:`, error);
  }
};

/**
 * Log de autenticación
 * @param {string} action - Acción realizada
 * @param {string} email - Email del usuario
 * @param {boolean} success - Si fue exitoso
 * @param {Request} req - Request object
 * @param {string} reason - Razón en caso de fallo
 */
const logAuth = (action, email, success, req, reason = null) => {
  const clientInfo = getClientInfo(req);
  const meta = {
    ...clientInfo,
    email,
    success,
    action,
    reason
  };
  
  const message = `Auth ${action}: ${email} - ${success ? 'SUCCESS' : 'FAILED'}`;
  writeLog(LOG_FILES.auth, success ? 'info' : 'warn', message, meta);
};

/**
 * Log de órdenes
 * @param {string} action - Acción realizada
 * @param {number} orderId - ID de la orden
 * @param {number} userId - ID del usuario
 * @param {object} details - Detalles adicionales
 * @param {Request} req - Request object
 */
const logOrder = (action, orderId, userId, details = {}, req = null) => {
  const meta = {
    orderId,
    userId,
    action,
    details
  };
  
  if (req) {
    meta.client = getClientInfo(req);
  }
  
  const message = `Order ${action}: Order #${orderId} by User #${userId}`;
  writeLog(LOG_FILES.orders, 'info', message, meta);
};

/**
 * Log del sistema
 * @param {string} level - Nivel del log
 * @param {string} message - Mensaje
 * @param {object} meta - Información adicional
 */
const logSystem = (level, message, meta = {}) => {
  writeLog(LOG_FILES.system, level, message, meta);
  
  // También mostrar en consola los logs importantes
  if (['error', 'warn'].includes(level.toLowerCase())) {
    console.log(`🔔 [${getTimestamp()}] ${level.toUpperCase()}: ${message}`);
  }
};

// ================================================
// MIDDLEWARE DE LOGGING HTTP
// ================================================

/**
 * Middleware para logging de requests HTTP
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 * @param {NextFunction} next - Next function
 */
const logger = (req, res, next) => {
  const startTime = Date.now();
  
  // Interceptar el final de la respuesta
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    
    // Registrar el acceso
    logAccess(req, res, responseTime);
    
    // Llamar al método original
    originalEnd.apply(this, args);
  };
  
  next();
};

// ================================================
// LOGS EN BASE DE DATOS
// ================================================

/**
 * Registrar actividad en base de datos
 * @param {number} userId - ID del usuario (opcional)
 * @param {number} orderId - ID de la orden (opcional)
 * @param {string} action - Acción realizada
 * @param {string} description - Descripción detallada
 * @param {Request} req - Request object (opcional)
 */
const logActivity = async (userId, orderId, action, description, req = null) => {
  try {
    const activityData = {
      user_id: userId || null,
      order_id: orderId || null,
      action,
      description
    };
    
    if (req) {
      const clientInfo = getClientInfo(req);
      activityData.ip_address = clientInfo.ip;
      activityData.user_agent = clientInfo.userAgent;
    }
    
    await insert('activity_logs', activityData);
  } catch (error) {
    logError(error, req, 'Database Activity Log');
  }
};

// ================================================
// FUNCIONES DE MANTENIMIENTO
// ================================================

/**
 * Rotar logs antiguos
 * @param {number} days - Días a mantener
 */
const rotateLogs = (days = 30) => {
  try {
    const maxAge = days * 24 * 60 * 60 * 1000; // días a milisegundos
    const now = Date.now();
    
    Object.values(LOG_FILES).forEach(logFile => {
      if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile);
        const age = now - stats.mtime.getTime();
        
        if (age > maxAge) {
          // Crear backup con timestamp
          const timestamp = new Date(stats.mtime).toISOString().split('T')[0];
          const backupName = `${logFile}.${timestamp}`;
          
          fs.renameSync(logFile, backupName);
          logSystem('info', `Log rotated: ${path.basename(logFile)} -> ${path.basename(backupName)}`);
        }
      }
    });
  } catch (error) {
    logError(error, null, 'Log Rotation');
  }
};

/**
 * Limpiar logs muy antiguos
 * @param {number} days - Días después de los cuales eliminar
 */
const cleanOldLogs = (days = 90) => {
  try {
    const maxAge = days * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    // Buscar archivos de backup antiguos
    fs.readdirSync(logsDir).forEach(file => {
      if (file.includes('.log.')) { // Archivos de backup
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtime.getTime();
        
        if (age > maxAge) {
          fs.unlinkSync(filePath);
          logSystem('info', `Old log deleted: ${file}`);
        }
      }
    });
  } catch (error) {
    logError(error, null, 'Log Cleanup');
  }
};

/**
 * Obtener estadísticas de logs
 * @returns {object} Estadísticas de los archivos de log
 */
const getLogStats = () => {
  try {
    const stats = {};
    
    Object.entries(LOG_FILES).forEach(([name, filePath]) => {
      if (fs.existsSync(filePath)) {
        const fileStats = fs.statSync(filePath);
        stats[name] = {
          size: fileStats.size,
          sizeFormatted: formatBytes(fileStats.size),
          modified: fileStats.mtime,
          lines: countLines(filePath)
        };
      } else {
        stats[name] = {
          size: 0,
          sizeFormatted: '0 B',
          modified: null,
          lines: 0
        };
      }
    });
    
    return stats;
  } catch (error) {
    logError(error, null, 'Log Stats');
    return {};
  }
};

/**
 * Formatear bytes a formato legible
 * @param {number} bytes - Número de bytes
 * @returns {string} Tamaño formateado
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Contar líneas en un archivo
 * @param {string} filePath - Ruta del archivo
 * @returns {number} Número de líneas
 */
const countLines = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length - 1;
  } catch {
    return 0;
  }
};

// ================================================
// CONFIGURACIÓN AUTOMÁTICA DE MANTENIMIENTO
// ================================================

// Rotar logs diariamente a medianoche
const scheduleLogRotation = () => {
  setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      rotateLogs(30); // Mantener logs por 30 días
      cleanOldLogs(90); // Limpiar backups después de 90 días
      logSystem('info', 'Scheduled log maintenance completed');
    }
  }, 60000); // Verificar cada minuto
};

// ================================================
// INICIALIZACIÓN
// ================================================

// Crear archivos de log si no existen
Object.values(LOG_FILES).forEach(logFile => {
  if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, '');
  }
});

// Programar mantenimiento automático
if (process.env.NODE_ENV === 'production') {
  scheduleLogRotation();
}

// Log de inicio del sistema
logSystem('info', 'JD Cleaning Services - Sistema de logs inicializado', {
  nodeEnv: process.env.NODE_ENV || 'development',
  pid: process.pid,
  version: '1.0.0'
});

// ================================================
// EXPORTAR FUNCIONES
// ================================================
module.exports = {
  // Middleware principal
  logger,
  
  // Funciones de logging específicas
  logAccess,
  logError,
  logAuth,
  logOrder,
  logSystem,
  logActivity,
  
  // Funciones de mantenimiento
  rotateLogs,
  cleanOldLogs,
  getLogStats,
  
  // Utilidades
  getTimestamp,
  getClientInfo,
  formatLogMessage,
  
  // Constantes
  LOG_FILES
};