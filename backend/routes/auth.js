// ================================================
// RUTAS DE AUTENTICACIÓN - JD CLEANING SERVICES
// ================================================

const express = require('express');
const { body, validationResult } = require('express-validator');
const { 
  generateToken, 
  hashPassword, 
  verifyPassword,
  authenticateToken 
} = require('../middleware/auth');
const { 
  logAuth, 
  logActivity, 
  logError 
} = require('../middleware/logger');
const { 
  ValidationError,
  AuthenticationError,
  ConflictError 
} = require('../middleware/errorHandler');
const { queryOne, insert, query } = require('../config/database');

const router = express.Router();

// ================================================
// VALIDACIONES
// ================================================

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
];

const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('El nombre debe tener al menos 2 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  body('role')
    .optional()
    .isIn(['admin', 'jefe', 'gerente', 'trabajador'])
    .withMessage('Rol no válido')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('La contraseña actual es requerida'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La nueva contraseña debe contener al menos una mayúscula, una minúscula y un número')
];

// ================================================
// FUNCIÓN PARA MANEJAR ERRORES DE VALIDACIÓN
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
// RUTA DE LOGIN
// ================================================
router.post('/login', loginValidation, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Buscar usuario por email
    const user = await queryOne(
      'SELECT id, name, email, password, role, is_active FROM users WHERE email = ?',
      [email]
    );
    
    if (!user) {
      logAuth('login', email, false, req, 'Usuario no encontrado');
      throw new AuthenticationError('Credenciales inválidas');
    }
    
    // Verificar si el usuario está activo
    if (!user.is_active) {
      logAuth('login', email, false, req, 'Usuario inactivo');
      throw new AuthenticationError('Cuenta desactivada. Contacta al administrador');
    }
    
    // Verificar contraseña
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      logAuth('login', email, false, req, 'Contraseña incorrecta');
      throw new AuthenticationError('Credenciales inválidas');
    }
    
    // Generar token JWT
    const token = generateToken(user);
    
    // Registrar login exitoso
    logAuth('login', email, true, req);
    await logActivity(user.id, null, 'login', `Usuario ${user.name} inició sesión`, req);
    
    // Respuesta exitosa (sin incluir password)
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    res.json({
      success: true,
      message: `¡Bienvenido ${user.name}!`,
      user: userResponse,
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
    
  } catch (error) {
    logError(error, req, 'Login Route');
    
    if (error instanceof AuthenticationError) {
      return res.status(401).json({
        error: 'Error de autenticación',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Error interno',
      message: 'Error durante el proceso de login'
    });
  }
});

// ================================================
// RUTA DE REGISTRO (Solo admin y jefe pueden crear usuarios)
// ================================================
router.post('/register', authenticateToken, registerValidation, handleValidationErrors, async (req, res) => {
  try {
    const { name, email, password, role = 'trabajador' } = req.body;
    const creatorRole = req.userRole;
    const creatorId = req.userId;
    
    // Verificar permisos para crear usuarios
    if (!['admin', 'jefe'].includes(creatorRole)) {
      return res.status(403).json({
        error: 'Permisos insuficientes',
        message: 'Solo administradores y jefes pueden crear usuarios'
      });
    }
    
    // Verificar que jefe no cree admins
    if (creatorRole === 'jefe' && role === 'admin') {
      return res.status(403).json({
        error: 'Permisos insuficientes',
        message: 'Los jefes no pueden crear administradores'
      });
    }
    
    // Verificar si el email ya existe
    const existingUser = await queryOne(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUser) {
      throw new ConflictError('Este email ya está registrado');
    }
    
    // Hash de la contraseña
    const hashedPassword = await hashPassword(password);
    
    // Insertar nuevo usuario
    const userData = {
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      created_by: creatorId,
      is_active: true
    };
    
    const userId = await insert('users', userData);
    
    // Registrar la actividad
    await logActivity(
      creatorId, 
      null, 
      'user_created', 
      `Usuario ${name} (${role}) creado por ${req.user.name}`,
      req
    );
    
    logAuth('register', email, true, req);
    
    // Respuesta exitosa
    res.status(201).json({
      success: true,
      message: `Usuario ${name} creado exitosamente`,
      user: {
        id: userId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        is_active: userData.is_active
      }
    });
    
  } catch (error) {
    logError(error, req, 'Register Route');
    
    if (error instanceof ConflictError) {
      return res.status(409).json({
        error: 'Usuario duplicado',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Error interno',
      message: 'Error durante el proceso de registro'
    });
  }
});

// ================================================
// RUTA PARA VERIFICAR TOKEN
// ================================================
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      valid: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    logError(error, req, 'Verify Token Route');
    res.status(500).json({
      error: 'Error interno',
      message: 'Error verificando el token'
    });
  }
});

// ================================================
// RUTA PARA CAMBIAR CONTRASEÑA
// ================================================
router.put('/change-password', authenticateToken, changePasswordValidation, handleValidationErrors, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;
    
    // Obtener contraseña actual del usuario
    const user = await queryOne(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      throw new AuthenticationError('Usuario no encontrado');
    }
    
    // Verificar contraseña actual
    const isValidCurrentPassword = await verifyPassword(currentPassword, user.password);
    if (!isValidCurrentPassword) {
      throw new AuthenticationError('La contraseña actual es incorrecta');
    }
    
    // Hash de la nueva contraseña
    const hashedNewPassword = await hashPassword(newPassword);
    
    // Actualizar contraseña en la base de datos
    await query(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedNewPassword, userId]
    );
    
    // Registrar la actividad
    await logActivity(
      userId, 
      null, 
      'password_changed', 
      `Usuario ${req.user.name} cambió su contraseña`,
      req
    );
    
    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
    
  } catch (error) {
    logError(error, req, 'Change Password Route');
    
    if (error instanceof AuthenticationError) {
      return res.status(401).json({
        error: 'Error de autenticación',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al cambiar la contraseña'
    });
  }
});

// ================================================
// RUTA PARA LOGOUT (Opcional - para logging)
// ================================================
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const userName = req.user.name;
    
    // Registrar logout
    await logActivity(
      userId, 
      null, 
      'logout', 
      `Usuario ${userName} cerró sesión`,
      req
    );
    
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
    
  } catch (error) {
    logError(error, req, 'Logout Route');
    res.status(500).json({
      error: 'Error interno',
      message: 'Error durante el logout'
    });
  }
});

// ================================================
// RUTA PARA OBTENER INFORMACIÓN DEL PERFIL
// ================================================
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Obtener información completa del usuario
    const user = await queryOne(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.is_active,
        u.created_at,
        creator.name as created_by_name
      FROM users u
      LEFT JOIN users creator ON u.created_by = creator.id
      WHERE u.id = ?
    `, [userId]);
    
    if (!user) {
      throw new AuthenticationError('Usuario no encontrado');
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
        created_by_name: user.created_by_name
      }
    });
    
  } catch (error) {
    logError(error, req, 'Profile Route');
    res.status(500).json({
      error: 'Error interno',
      message: 'Error obteniendo información del perfil'
    });
  }
});

// ================================================
// RUTA PARA ESTADÍSTICAS DE USUARIOS (Solo admin/jefe)
// ================================================
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userRole = req.userRole;
    
    // Solo admin y jefe pueden ver estadísticas
    if (!['admin', 'jefe'].includes(userRole)) {
      return res.status(403).json({
        error: 'Permisos insuficientes',
        message: 'Solo administradores y jefes pueden ver estadísticas'
      });
    }
    
    
    // Obtener estadísticas de usuarios
const userStatsResult = await query(`
  SELECT 
    role,
    COUNT(*) as total,
    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
    SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive
  FROM users 
  GROUP BY role
`);

// Obtener total de logins hoy
const todayLoginsResult = await query(`
  SELECT COUNT(*) as logins_today
  FROM activity_logs 
  WHERE action = 'login' 
  AND DATE(created_at) = CURDATE()
`);
    
   res.json({
  success: true,
  stats: {
    users_by_role: userStatsResult.rows || [],
    logins_today: todayLoginsResult.rows[0]?.logins_today || 0
  }
});
    
  } catch (error) {
    logError(error, req, 'Auth Stats Route');
    res.status(500).json({
      error: 'Error interno',
      message: 'Error obteniendo estadísticas'
    });
  }
});
// ================================================
// RUTA DE DEBUG - TEMPORAL
// ================================================
router.post('/debug-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Buscar usuario
    const user = await queryOne(
      'SELECT id, name, email, password, role, is_active FROM users WHERE email = ?',
      [email]
    );
    
    console.log('🔍 Usuario encontrado:', user ? 'SÍ' : 'NO');
    if (user) {
      console.log('📧 Email en BD:', user.email);
      console.log('👤 Nombre:', user.name);
      console.log('🔑 Rol:', user.role);
      console.log('✅ Activo:', user.is_active);
      console.log('🔐 Password hash en BD:', user.password.substring(0, 10) + '...');
    }
    
    console.log('📧 Email enviado:', email);
    console.log('🔑 Password enviado:', password);
    
    res.json({
      userFound: !!user,
      userData: user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active
      } : null,
      receivedData: { email, password }
    });
    
  } catch (error) {
    console.log('❌ Error en debug:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;