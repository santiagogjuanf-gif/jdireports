// ================================================
// VERSIÓN DE AUTH.JS CON LOGGING SUPER DETALLADO
// PARA DIAGNÓSTICO DE PROBLEMAS DE LOGIN
// ================================================
// INSTRUCCIONES:
// 1. Renombra backend/routes/auth.js a auth-original.js
// 2. Renombra este archivo a auth.js
// 3. Reinicia el servidor
// 4. Intenta hacer login y revisa la consola del servidor
// 5. Cuando termines el diagnóstico, restaura el archivo original
// ================================================

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryOne, queryAll, execute } = require('../config/database');
const { logAuth, logActivity } = require('../middleware/logger');

console.log('\n⚠️  ⚠️  ⚠️  MODO DEBUG ACTIVADO ⚠️  ⚠️  ⚠️\n');
console.log('Este archivo muestra información sensible en consola.');
console.log('NO uses esto en producción.\n');

// Helper para logging detallado
function debugLog(step, data) {
  console.log('\n════════════════════════════════════════');
  console.log(`🔍 DEBUG - ${step}`);
  console.log('════════════════════════════════════════');
  console.log(JSON.stringify(data, null, 2));
  console.log('════════════════════════════════════════\n');
}

// Verificar contraseña
async function verifyPassword(plainPassword, hashedPassword) {
  debugLog('VERIFICACIÓN DE CONTRASEÑA', {
    plainPasswordLength: plainPassword.length,
    hashedPasswordLength: hashedPassword.length,
    hashedPasswordStart: hashedPassword.substring(0, 10) + '...',
    plainPassword: '***OCULTO***'
  });

  try {
    const result = await bcrypt.compare(plainPassword, hashedPassword);
    debugLog('RESULTADO DE BCRYPT.COMPARE', {
      result: result ? '✅ COINCIDE' : '❌ NO COINCIDE'
    });
    return result;
  } catch (error) {
    debugLog('ERROR EN BCRYPT.COMPARE', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Generar token JWT
function generateToken(user) {
  debugLog('GENERANDO TOKEN JWT', {
    userId: user.id,
    username: user.username,
    role: user.role,
    jwtSecretConfigured: !!process.env.JWT_SECRET
  });

  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });

  debugLog('TOKEN JWT GENERADO', {
    tokenLength: token.length,
    tokenStart: token.substring(0, 20) + '...',
    expiresIn: '7 days'
  });

  return token;
}

// Errores personalizados
class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}

class ValidationError extends Error {
  constructor(errors) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.errors = errors;
  }
}

// Validaciones
const loginValidation = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('Email o username es requerido'),
  body('password')
    .trim()
    .notEmpty()
    .withMessage('La contraseña es requerida')
];

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  debugLog('VALIDACIÓN DE REQUEST', {
    body: req.body,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']
    }
  });

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    debugLog('ERRORES DE VALIDACIÓN', {
      errors: errors.array()
    });
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// ================================================
// RUTA DE LOGIN CON DEBUG
// ================================================
router.post('/login', loginValidation, handleValidationErrors, async (req, res) => {
  try {
    debugLog('INICIO DE LOGIN', {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    const { identifier, password } = req.body;

    debugLog('CREDENCIALES RECIBIDAS', {
      identifier: identifier,
      passwordLength: password.length,
      password: '***OCULTO***'
    });

    // Buscar usuario por email o username
    debugLog('BUSCANDO USUARIO EN DB', {
      identifier: identifier,
      query: 'SELECT ... FROM users WHERE email = ? OR username = ?'
    });

    const user = await queryOne(`
      SELECT
        id, name, email, username, password, role, is_active,
        password_reset_required, preferred_language, phone
      FROM users
      WHERE email = ? OR username = ?
    `, [identifier, identifier]);

    if (!user) {
      debugLog('USUARIO NO ENCONTRADO', {
        identifier: identifier,
        message: 'No existe usuario con ese email o username'
      });
      logAuth('login', identifier, false, req, 'Usuario no encontrado');
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    debugLog('USUARIO ENCONTRADO', {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      password_reset_required: user.password_reset_required,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0
    });

    // Verificar si el usuario está activo
    if (!user.is_active) {
      debugLog('USUARIO INACTIVO', {
        userId: user.id,
        username: user.username
      });
      logAuth('login', identifier, false, req, 'Usuario inactivo');
      return res.status(401).json({
        success: false,
        message: 'Cuenta desactivada. Contacta al administrador'
      });
    }

    // Verificar contraseña
    debugLog('VERIFICANDO CONTRASEÑA', {
      userId: user.id,
      username: user.username
    });

    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      debugLog('CONTRASEÑA INCORRECTA', {
        userId: user.id,
        username: user.username,
        message: 'La contraseña proporcionada no coincide con el hash'
      });
      logAuth('login', identifier, false, req, 'Contraseña incorrecta');
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    debugLog('CONTRASEÑA CORRECTA', {
      userId: user.id,
      username: user.username
    });

    // Generar token JWT
    const token = generateToken(user);

    // Registrar login exitoso
    logAuth('login', identifier, true, req);
    await logActivity(user.id, null, 'login', `Usuario ${user.name} inició sesión`, req);

    // Respuesta exitosa (sin incluir password)
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      preferredLanguage: user.preferred_language,
      phone: user.phone,
      passwordResetRequired: user.password_reset_required
    };

    debugLog('LOGIN EXITOSO', {
      userId: user.id,
      username: user.username,
      tokenGenerated: true
    });

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: userResponse
    });

  } catch (error) {
    debugLog('ERROR EN LOGIN', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    console.error('Error en login:', error);

    if (error instanceof AuthenticationError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
