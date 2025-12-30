// ================================================
// RUTAS DE TUTORIALES - JD CLEANING SERVICES
// ================================================

const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  authenticateToken,
  requireRole
} = require('../middleware/auth');
const {
  logActivity,
  logError
} = require('../middleware/logger');
const {
  ValidationError,
  NotFoundError,
  ConflictError
} = require('../middleware/errorHandler');
const { queryOne, insert, query } = require('../config/database');

const router = express.Router();

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

const createTutorialValidation = [
  body('title_es')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Título en español debe tener entre 5 y 200 caracteres'),
  body('title_en')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Título en inglés debe tener entre 5 y 200 caracteres'),
  body('title_fr')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Título en francés debe tener entre 5 y 200 caracteres'),
  body('content_es')
    .trim()
    .isLength({ min: 20 })
    .withMessage('Contenido en español debe tener al menos 20 caracteres'),
  body('content_en')
    .trim()
    .isLength({ min: 20 })
    .withMessage('Contenido en inglés debe tener al menos 20 caracteres'),
  body('content_fr')
    .trim()
    .isLength({ min: 20 })
    .withMessage('Contenido en francés debe tener al menos 20 caracteres'),
  body('target_role')
    .optional()
    .isIn(['all', 'trabajador', 'gerente', 'jefe', 'admin'])
    .withMessage('Rol objetivo debe ser: all, trabajador, gerente, jefe o admin'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Categoría no puede exceder 50 caracteres'),
  body('display_order')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Orden de visualización debe ser un número positivo'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active debe ser verdadero o falso')
];

// ================================================
// LISTAR TODOS LOS TUTORIALES
// ================================================
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    const { language = 'es', active_only = 'true', category } = req.query;

    // Validar idioma
    const validLanguages = ['es', 'en', 'fr'];
    const lang = validLanguages.includes(language) ? language : 'es';

    // Construir query
    let sql = `
      SELECT
        id,
        title_es,
        title_en,
        title_fr,
        content_es,
        content_en,
        content_fr,
        target_role,
        category,
        display_order,
        is_active,
        created_at,
        updated_at
      FROM tutorials
    `;

    const conditions = [];
    const params = [];

    if (active_only === 'true') {
      conditions.push('is_active = 1');
    }

    // Filtrar por rol del usuario (mostrar solo tutoriales para su rol o 'all')
    conditions.push('(target_role = ? OR target_role = ?)');
    params.push(userRole, 'all');

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY display_order ASC, created_at DESC';

    const tutorialsResult = await query(sql, params);
    const tutorials = tutorialsResult.rows || [];

    // Transformar respuesta para incluir el contenido en el idioma seleccionado
    const transformedTutorials = tutorials.map(tutorial => ({
      id: tutorial.id,
      title: tutorial[`title_${lang}`],
      content: tutorial[`content_${lang}`],
      title_es: tutorial.title_es,
      title_en: tutorial.title_en,
      title_fr: tutorial.title_fr,
      content_es: tutorial.content_es,
      content_en: tutorial.content_en,
      content_fr: tutorial.content_fr,
      target_role: tutorial.target_role,
      category: tutorial.category,
      display_order: tutorial.display_order,
      is_active: tutorial.is_active,
      created_at: tutorial.created_at,
      updated_at: tutorial.updated_at
    }));

    res.json({
      success: true,
      tutorials: transformedTutorials,
      total: transformedTutorials.length,
      language: lang
    });

  } catch (error) {
    logError(error, req, 'List Tutorials Route');
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al listar tutoriales'
    });
  }
});

// ================================================
// OBTENER TUTORIAL POR ID
// ================================================
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const tutorialId = req.params.id;
    const userId = req.userId;
    const userRole = req.userRole;
    const { language = 'es' } = req.query;

    // Validar idioma
    const validLanguages = ['es', 'en', 'fr'];
    const lang = validLanguages.includes(language) ? language : 'es';

    const tutorial = await queryOne(`
      SELECT
        id,
        title_es,
        title_en,
        title_fr,
        content_es,
        content_en,
        content_fr,
        target_role,
        category,
        display_order,
        is_active,
        created_at,
        updated_at
      FROM tutorials
      WHERE id = ?
    `, [tutorialId]);

    if (!tutorial) {
      throw new NotFoundError('Tutorial no encontrado');
    }

    // Verificar si el usuario tiene acceso a este tutorial
    if (tutorial.target_role !== 'all' && tutorial.target_role !== userRole && !['admin', 'jefe'].includes(userRole)) {
      throw new ForbiddenError('No tienes acceso a este tutorial');
    }

    res.json({
      success: true,
      tutorial: {
        ...tutorial,
        title: tutorial[`title_${lang}`],
        content: tutorial[`content_${lang}`]
      },
      language: lang
    });

  } catch (error) {
    logError(error, req, 'Get Tutorial Route');

    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      return res.status(error.statusCode || 404).json({
        error: error.name,
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al obtener tutorial'
    });
  }
});

// ================================================
// CREAR NUEVO TUTORIAL (Solo admin/jefe)
// ================================================
router.post('/', authenticateToken, requireRole(['admin', 'jefe']), createTutorialValidation, handleValidationErrors, async (req, res) => {
  try {
    const {
      title_es,
      title_en,
      title_fr,
      content_es,
      content_en,
      content_fr,
      target_role = 'all',
      category,
      display_order,
      is_active = true
    } = req.body;

    const userId = req.userId;

    // Si no se proporciona display_order, usar el siguiente disponible
    let order = display_order;
    if (!order) {
      const maxOrderResult = await queryOne(`
        SELECT MAX(display_order) as max_order FROM tutorials
      `);
      order = (maxOrderResult?.max_order || 0) + 1;
    }

    // Crear tutorial
    const tutorialData = {
      title_es: title_es.trim(),
      title_en: title_en.trim(),
      title_fr: title_fr.trim(),
      content_es: content_es.trim(),
      content_en: content_en.trim(),
      content_fr: content_fr.trim(),
      target_role,
      category: category?.trim() || null,
      display_order: order,
      is_active
    };

    const tutorialId = await insert('tutorials', tutorialData);

    // Registrar actividad
    await logActivity(
      userId,
      null,
      'tutorial_created',
      `Tutorial "${title_es}" creado por ${req.user.name}`,
      req
    );

    res.status(201).json({
      success: true,
      message: 'Tutorial creado exitosamente',
      tutorial: {
        id: tutorialId,
        ...tutorialData
      }
    });

  } catch (error) {
    logError(error, req, 'Create Tutorial Route');
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al crear tutorial'
    });
  }
});

// ================================================
// ACTUALIZAR TUTORIAL (Solo admin/jefe)
// ================================================
router.put('/:id', authenticateToken, requireRole(['admin', 'jefe']), [
  body('title_es')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Título en español debe tener entre 5 y 200 caracteres'),
  body('title_en')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Título en inglés debe tener entre 5 y 200 caracteres'),
  body('title_fr')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Título en francés debe tener entre 5 y 200 caracteres'),
  body('content_es')
    .optional()
    .trim()
    .isLength({ min: 20 })
    .withMessage('Contenido en español debe tener al menos 20 caracteres'),
  body('content_en')
    .optional()
    .trim()
    .isLength({ min: 20 })
    .withMessage('Contenido en inglés debe tener al menos 20 caracteres'),
  body('content_fr')
    .optional()
    .trim()
    .isLength({ min: 20 })
    .withMessage('Contenido en francés debe tener al menos 20 caracteres'),
  body('target_role')
    .optional()
    .isIn(['all', 'trabajador', 'gerente', 'jefe', 'admin'])
    .withMessage('Rol objetivo debe ser: all, trabajador, gerente, jefe o admin'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Categoría no puede exceder 50 caracteres'),
  body('display_order')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Orden de visualización debe ser un número positivo'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active debe ser verdadero o falso')
], handleValidationErrors, async (req, res) => {
  try {
    const tutorialId = req.params.id;
    const userId = req.userId;
    const {
      title_es,
      title_en,
      title_fr,
      content_es,
      content_en,
      content_fr,
      target_role,
      category,
      display_order,
      is_active
    } = req.body;

    // Verificar que el tutorial existe
    const tutorial = await queryOne(`
      SELECT id, title_es FROM tutorials WHERE id = ?
    `, [tutorialId]);

    if (!tutorial) {
      throw new NotFoundError('Tutorial no encontrado');
    }

    // Construir objeto de actualización
    const updates = {};
    if (title_es) updates.title_es = title_es.trim();
    if (title_en) updates.title_en = title_en.trim();
    if (title_fr) updates.title_fr = title_fr.trim();
    if (content_es) updates.content_es = content_es.trim();
    if (content_en) updates.content_en = content_en.trim();
    if (content_fr) updates.content_fr = content_fr.trim();
    if (target_role) updates.target_role = target_role;
    if (category !== undefined) updates.category = category?.trim() || null;
    if (display_order) updates.display_order = display_order;
    if (is_active !== undefined) updates.is_active = is_active;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Debes proporcionar al menos un campo para actualizar'
      });
    }

    // Actualizar tutorial
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), tutorialId];

    await query(
      `UPDATE tutorials SET ${setClause}, updated_at = NOW() WHERE id = ?`,
      values
    );

    // Registrar actividad
    await logActivity(
      userId,
      null,
      'tutorial_updated',
      `Tutorial "${tutorial.title_es}" actualizado por ${req.user.name}`,
      req
    );

    res.json({
      success: true,
      message: 'Tutorial actualizado exitosamente',
      tutorial_id: tutorialId,
      updated: updates
    });

  } catch (error) {
    logError(error, req, 'Update Tutorial Route');

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        error: 'No encontrado',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al actualizar tutorial'
    });
  }
});

// ================================================
// ELIMINAR TUTORIAL (Solo admin/jefe)
// ================================================
router.delete('/:id', authenticateToken, requireRole(['admin', 'jefe']), async (req, res) => {
  try {
    const tutorialId = req.params.id;
    const userId = req.userId;

    // Verificar que el tutorial existe
    const tutorial = await queryOne(`
      SELECT id, title_es FROM tutorials WHERE id = ?
    `, [tutorialId]);

    if (!tutorial) {
      throw new NotFoundError('Tutorial no encontrado');
    }

    // Eliminar tutorial
    await query('DELETE FROM tutorials WHERE id = ?', [tutorialId]);

    // Registrar actividad
    await logActivity(
      userId,
      null,
      'tutorial_deleted',
      `Tutorial "${tutorial.title_es}" eliminado por ${req.user.name}`,
      req
    );

    res.json({
      success: true,
      message: 'Tutorial eliminado exitosamente',
      tutorial_id: tutorialId
    });

  } catch (error) {
    logError(error, req, 'Delete Tutorial Route');

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        error: 'No encontrado',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al eliminar tutorial'
    });
  }
});

module.exports = router;
