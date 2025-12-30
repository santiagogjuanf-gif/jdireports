// ================================================
// RUTAS MEJORADAS DE USUARIOS
// JD CLEANING SERVICES
// ================================================

const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { hashPassword } = require('../middleware/auth');
const { query, queryOne, insert, update: dbUpdate } = require('../config/database');
const { generateUniqueUsername, validateUsername } = require('../utils/usernameGenerator');
const { generateSecurePassword, validatePassword } = require('../utils/passwordGenerator');
const { sendWelcomeEmail } = require('../utils/emailService');
const { logActivity } = require('../middleware/logger');

const router = express.Router();

// ================================================
// CREAR USUARIO CON SISTEMA MEJORADO
// ================================================
router.post('/create',
  authenticateToken,
  requireRole(['admin', 'jefe']),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('role').isIn(['admin', 'jefe', 'gerente', 'trabajador']).withMessage('Invalid role'),
    body('phone').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, role, phone } = req.body;
      const creatorRole = req.userRole;
      const creatorId = req.userId;

      // Validar permisos
      if (creatorRole === 'jefe' && role === 'admin') {
        return res.status(403).json({ error: 'Jefes cannot create admins' });
      }

      // Verificar email único
      const existingUser = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
      if (existingUser) {
        return res.status(409).json({ error: 'Email already exists' });
      }

      // Generar username único
      const usernameResult = await generateUniqueUsername(name);

      // Generar contraseña segura
      const temporaryPassword = generateSecurePassword();
      const hashedPassword = await hashPassword(temporaryPassword);

      // Crear usuario
      const userData = {
        name,
        email,
        username: usernameResult.username,
        password: hashedPassword,
        role,
        phone: phone || null,
        password_reset_required: true,
        created_by: creatorId,
        is_active: true
      };

      const userId = await insert('users', userData);

      // Si es gerente, crear permisos por defecto
      if (role === 'gerente') {
        await insert('manager_permissions', {
          user_id: userId,
          can_create_orders: false,
          can_edit_orders: false,
          can_delete_orders: false,
          can_cancel_orders: false,
          can_assign_workers: false,
          can_reassign_workers: false,
          can_generate_pdf: false,
          can_view_inventory: false,
          can_approve_inventory: false,
          can_configure_system: false
        });
      }

      // Crear preferencias de notificaciones
      await insert('notification_settings', {
        user_id: userId
      });

      // Enviar email con credenciales
      await sendWelcomeEmail(email, name, usernameResult.username, temporaryPassword);

      // Log actividad
      await logActivity(creatorId, null, 'user_created', `Created user ${name} (${role})`);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: {
          id: userId,
          name,
          email,
          username: usernameResult.username,
          role,
          temporaryPassword, // Solo para mostrar, no guardar
          suggestions: usernameResult.suggestions
        }
      });

    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ================================================
// VERIFICAR DISPONIBILIDAD DE USERNAME
// ================================================
router.post('/check-username',
  authenticateToken,
  body('username').trim().notEmpty(),
  async (req, res) => {
    try {
      const { username } = req.body;

      // Validar formato
      const validation = validateUsername(username);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      // Verificar disponibilidad
      const existing = await queryOne('SELECT id FROM users WHERE username = ?', [username]);

      res.json({
        available: !existing,
        username
      });

    } catch (error) {
      console.error('Error checking username:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ================================================
// GENERAR SUGERENCIAS DE USERNAME
// ================================================
router.post('/generate-username',
  authenticateToken,
  body('name').trim().notEmpty(),
  async (req, res) => {
    try {
      const { name } = req.body;

      const result = await generateUniqueUsername(name);

      res.json(result);

    } catch (error) {
      console.error('Error generating username:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

module.exports = router;
