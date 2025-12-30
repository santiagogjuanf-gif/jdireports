// ================================================
// MIDDLEWARE DE MANEJO DE ERRORES
// JD CLEANING SERVICES
// ================================================

const { logError, logSystem } = require('./logger');

// ================================================
// TIPOS DE ERRORES PERSONALIZADOS
// ================================================

/**
 * Error de validación personalizado
 */
class ValidationError extends Error {
  constructor(message, field = null, value = null) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.field = field;
    this.value = value;
  }
}

/**
 * Error de autorización personalizado
 */
class AuthorizationError extends Error {
  constructor(message = 'Acceso denegado') {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
  }
}

/**
 * Error de autenticación personalizado
 */
class AuthenticationError extends Error {
  constructor(message = 'Credenciales inválidas') {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}

/**
 * Error de recurso no encontrado
 */
class NotFoundError extends Error {
  constructor(resource = 'Recurso') {
    super(`${resource} no encontrado`);
    this.name = 'NotFoundError';
    this.statusCode = 404;
    this.resource = resource;
  }
}

/**
 * Error de conflicto (ej. email ya existe)
 */
class ConflictError extends Error {
  constructor(message = 'Conflicto en los datos') {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
  }
}

/**
 * Error de límite excedido
 */
class LimitExceededError extends Error {
  constructor(limit, current, resource = 'elementos') {
    super(`Límite excedido: máximo ${limit} ${resource}, intentaste ${current}`);
    this.name = 'LimitExceededError';
    this.statusCode = 429;
    this.limit = limit;
    this.current = current;
    this.resource = resource;
  }
}

// ================================================
// MANEJADORES DE ERRORES ESPECÍFICOS
// ================================================

/**
 * Manejar errores de MySQL
 * @param {Error} error - Error de MySQL
 * @returns {object} Error formateado
 */
const handleMySQLError = (error) => {
  const response = {
    error: 'Error de base de datos',
    message: 'Error interno del servidor',
    statusCode: 500
  };
  
  switch (error.code) {
    case 'ER_DUP_ENTRY':
      response.statusCode = 409;
      response.error = 'Datos duplicados';
      
      // Detectar qué campo está duplicado
      if (error.message.includes('email')) {
        response.message = 'Este email ya está registrado';
        response.field = 'email';
      } else {
        response.message = 'Este registro ya existe';
      }
      break;
      
    case 'ER_NO_REFERENCED_ROW':
    case 'ER_NO_REFERENCED_ROW_2':
      response.statusCode = 400;
      response.error = 'Referencia inválida';
      response.message = 'Uno o más valores referenciados no existen';
      break;
      
    case 'ER_ROW_IS_REFERENCED':
    case 'ER_ROW_IS_REFERENCED_2':
      response.statusCode = 409;
      response.error = 'No se puede eliminar';
      response.message = 'Este registro está siendo utilizado y no puede ser eliminado';
      break;
      
    case 'ER_DATA_TOO_LONG':
      response.statusCode = 400;
      response.error = 'Datos muy largos';
      response.message = 'Uno o más campos exceden la longitud máxima permitida';
      break;
      
    case 'ER_BAD_NULL_ERROR':
      response.statusCode = 400;
      response.error = 'Campo requerido';
      response.message = 'Faltan campos obligatorios';
      break;
      
    case 'ER_ACCESS_DENIED_ERROR':
      response.statusCode = 500;
      response.error = 'Error de conexión';
      response.message = 'Error de acceso a la base de datos';
      break;
      
    case 'ECONNREFUSED':
      response.statusCode = 500;
      response.error = 'Base de datos no disponible';
      response.message = 'No se pudo conectar a la base de datos. Verifica que MySQL esté ejecutándose';
      break;
      
    default:
      response.message = process.env.NODE_ENV === 'development' 
        ? `MySQL Error: ${error.message}` 
        : 'Error interno del servidor';
  }
  
  return response;
};

/**
 * Manejar errores de validación de express-validator
 * @param {array} errors - Errores de validación
 * @returns {object} Error formateado
 */
const handleValidationErrors = (errors) => {
  const formattedErrors = errors.map(error => ({
    field: error.path || error.param,
    message: error.msg,
    value: error.value
  }));
  
  return {
    statusCode: 400,
    error: 'Errores de validación',
    message: 'Los datos proporcionados no son válidos',
    details: formattedErrors
  };
};

/**
 * Manejar errores de JWT
 * @param {Error} error - Error de JWT
 * @returns {object} Error formateado
 */
const handleJWTError = (error) => {
  const response = {
    statusCode: 401,
    error: 'Error de autenticación'
  };
  
  switch (error.name) {
    case 'JsonWebTokenError':
      response.message = 'Token inválido';
      break;
    case 'TokenExpiredError':
      response.message = 'Token expirado. Por favor inicia sesión nuevamente';
      break;
    case 'NotBeforeError':
      response.message = 'Token no válido aún';
      break;
    default:
      response.message = 'Error de token';
  }
  
  return response;
};

/**
 * Manejar errores de Multer (subida de archivos)
 * @param {Error} error - Error de Multer
 * @returns {object} Error formateado
 */
const handleMulterError = (error) => {
  const response = {
    statusCode: 400,
    error: 'Error de archivo'
  };
  
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      response.message = 'El archivo es demasiado grande. Tamaño máximo: 10MB';
      break;
    case 'LIMIT_FILE_COUNT':
      response.message = 'Demasiados archivos. Máximo permitido: 30 fotos por orden';
      break;
    case 'LIMIT_UNEXPECTED_FILE':
      response.message = 'Campo de archivo inesperado';
      break;
    case 'MISSING_FIELD_NAME':
      response.message = 'Falta el nombre del campo de archivo';
      break;
    default:
      response.message = 'Error al procesar el archivo';
  }
  
  return response;
};

// ================================================
// MIDDLEWARE PRINCIPAL DE MANEJO DE ERRORES
// ================================================

/**
 * Middleware principal para manejar todos los errores
 * @param {Error} err - Error object
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 * @param {NextFunction} next - Next function
 */
const errorHandler = (err, req, res, next) => {
  // Si ya se envió una respuesta, delegar al manejador de errores por defecto
  if (res.headersSent) {
    return next(err);
  }
  
  let errorResponse = {
    error: 'Error interno del servidor',
    message: 'Algo salió mal',
    statusCode: 500,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };
  
  // Registrar el error en logs
  logError(err, req, 'Error Handler');
  
  // Manejar diferentes tipos de errores
  if (err.name && err.name.includes('MySQL') || err.code) {
    // Errores de MySQL
    errorResponse = { ...errorResponse, ...handleMySQLError(err) };
  } 
  else if (err.name && ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(err.name)) {
    // Errores de JWT
    errorResponse = { ...errorResponse, ...handleJWTError(err) };
  }
  else if (err.name === 'MulterError') {
    // Errores de Multer (archivos)
    errorResponse = { ...errorResponse, ...handleMulterError(err) };
  }
  else if (err.array && typeof err.array === 'function') {
    // Errores de express-validator
    errorResponse = { ...errorResponse, ...handleValidationErrors(err.array()) };
  }
  else if (err.statusCode) {
    // Errores personalizados con statusCode
    errorResponse.statusCode = err.statusCode;
    errorResponse.error = err.name || 'Error';
    errorResponse.message = err.message;
    
    // Agregar información adicional si existe
    if (err.field) errorResponse.field = err.field;
    if (err.value) errorResponse.value = err.value;
    if (err.limit) errorResponse.limit = err.limit;
    if (err.current) errorResponse.current = err.current;
  }
  else {
    // Errores generales
    errorResponse.message = process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Error interno del servidor';
      
    // En desarrollo, incluir el stack trace
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = err.stack;
    }
  }
  
  // Remover información sensible en producción
  if (process.env.NODE_ENV === 'production') {
    delete errorResponse.stack;
    // No mostrar detalles internos de la base de datos
    if (errorResponse.statusCode === 500) {
      errorResponse.message = 'Error interno del servidor';
    }
  }
  
  // Enviar respuesta de error
  res.status(errorResponse.statusCode).json(errorResponse);
};

// ================================================
// MANEJADOR DE RUTAS NO ENCONTRADAS (404)
// ================================================

/**
 * Middleware para manejar rutas no encontradas
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 * @param {NextFunction} next - Next function
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError('Ruta');
  error.message = `La ruta ${req.originalUrl} no fue encontrada`;
  next(error);
};

// ================================================
// MANEJADORES DE ERRORES NO CAPTURADOS
// ================================================

/**
 * Manejar excepciones no capturadas
 */
const handleUncaughtException = () => {
  process.on('uncaughtException', (error) => {
    logError(error, null, 'Uncaught Exception');
    console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
    console.error(error);
    process.exit(1);
  });
};

/**
 * Manejar promesas rechazadas no capturadas
 */
const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (reason, promise) => {
    logError(new Error(`Unhandled Rejection: ${reason}`), null, 'Unhandled Rejection');
    console.error('💥 UNHANDLED REJECTION! Shutting down...');
    console.error('Promise:', promise);
    console.error('Reason:', reason);
    process.exit(1);
  });
};

// ================================================
// FUNCIONES DE UTILIDAD
// ================================================

/**
 * Crear error de validación
 * @param {string} message - Mensaje de error
 * @param {string} field - Campo que falló
 * @param {any} value - Valor que causó el error
 * @returns {ValidationError} Error de validación
 */
const createValidationError = (message, field, value) => {
  return new ValidationError(message, field, value);
};

/**
 * Crear error de autorización
 * @param {string} message - Mensaje personalizado
 * @returns {AuthorizationError} Error de autorización
 */
const createAuthorizationError = (message) => {
  return new AuthorizationError(message);
};

/**
 * Crear error de recurso no encontrado
 * @param {string} resource - Nombre del recurso
 * @returns {NotFoundError} Error de recurso no encontrado
 */
const createNotFoundError = (resource) => {
  return new NotFoundError(resource);
};

// ================================================
// INICIALIZACIÓN DE MANEJADORES GLOBALES
// ================================================
if (process.env.NODE_ENV === 'production') {
  handleUncaughtException();
  handleUnhandledRejection();
}

// ================================================
// EXPORTAR FUNCIONES Y CLASES
// ================================================
module.exports = {
  // Middleware principal
  errorHandler,
  notFoundHandler,
  
  // Clases de errores personalizados
  ValidationError,
  AuthorizationError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
  LimitExceededError,
  
  // Funciones de utilidad
  createValidationError,
  createAuthorizationError,
  createNotFoundError,
  
  // Manejadores específicos
  handleMySQLError,
  handleValidationErrors,
  handleJWTError,
  handleMulterError,
  
  // Configuración
  handleUncaughtException,
  handleUnhandledRejection
};