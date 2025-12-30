// ================================================
// RATE LIMITER - JD CLEANING SERVICES
// ================================================

const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// ================================================
// RATE LIMITER GENERAL
// ================================================

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 requests por ventana
  message: {
    error: 'Demasiadas solicitudes',
    message: 'Has excedido el límite de solicitudes. Por favor intenta más tarde.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      error: 'Demasiadas solicitudes',
      message: 'Has excedido el límite de solicitudes. Por favor intenta más tarde.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// ================================================
// RATE LIMITER PARA AUTENTICACIÓN
// ================================================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Límite de 5 intentos de login
  skipSuccessfulRequests: true, // No contar requests exitosos
  message: {
    error: 'Demasiados intentos de autenticación',
    message: 'Has excedido el límite de intentos de inicio de sesión. Por favor intenta más tarde.',
    retryAfter: '15 minutos'
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Demasiados intentos',
      message: 'Has excedido el límite de intentos de inicio de sesión. Por favor espera 15 minutos.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// ================================================
// SPEED LIMITER (RALENTIZAR REQUESTS EXCESIVOS)
// ================================================

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutos
  delayAfter: 50, // Permitir 50 requests a velocidad completa
  delayMs: 500, // Agregar 500ms de delay por cada request después del límite
  maxDelayMs: 5000 // Máximo delay de 5 segundos
});

// ================================================
// RATE LIMITER PARA UPLOADS
// ================================================

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // Máximo 50 uploads por hora
  message: {
    error: 'Demasiadas cargas de archivos',
    message: 'Has excedido el límite de cargas de archivos. Por favor intenta más tarde.',
    retryAfter: '1 hora'
  }
});

// ================================================
// EXPORTAR
// ================================================

module.exports = generalLimiter;

module.exports.generalLimiter = generalLimiter;
module.exports.authLimiter = authLimiter;
module.exports.speedLimiter = speedLimiter;
module.exports.uploadLimiter = uploadLimiter;
