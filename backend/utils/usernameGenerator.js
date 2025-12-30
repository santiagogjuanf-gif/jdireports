// ================================================
// GENERADOR DE USERNAMES
// JD CLEANING SERVICES
// ================================================

const { query } = require('../config/database');

/**
 * Normaliza texto removiendo acentos y caracteres especiales
 * @param {string} text - Texto a normalizar
 * @returns {string} Texto normalizado
 */
const normalizeText = (text) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]/g, ''); // Solo letras y números
};

/**
 * Genera username base desde el nombre completo
 * Formato: primera letra del nombre + primer apellido
 * Ejemplo: "Juan Carlos Pérez García" → "jperez"
 *
 * @param {string} fullName - Nombre completo
 * @returns {string} Username base
 */
const generateBaseUsername = (fullName) => {
  const parts = fullName.trim().split(' ').filter(p => p.length > 0);

  if (parts.length === 0) {
    throw new Error('Nombre inválido');
  }

  // Si solo tiene un nombre, usar ese
  if (parts.length === 1) {
    return normalizeText(parts[0]);
  }

  // Primera letra del primer nombre
  const firstInitial = normalizeText(parts[0].charAt(0));

  // Primer apellido (asumiendo que el apellido empieza en el índice 1 o 2)
  // Si tiene 2 partes: "Juan Pérez" → "jperez"
  // Si tiene 3 partes: "Juan Carlos Pérez" → "jperez" (Carlos es segundo nombre)
  // Si tiene 4+ partes: "Juan Carlos Pérez García" → "jperez"

  let lastNameIndex = 1;
  // Si tiene 3+ partes y el segundo parece ser segundo nombre (común en español)
  if (parts.length >= 3) {
    // Heurística: si el segundo nombre es corto, probablemente sea parte del nombre
    // Usar el índice correcto para el apellido
    lastNameIndex = Math.floor(parts.length / 2);
  }

  const lastName = normalizeText(parts[lastNameIndex]);

  return `${firstInitial}${lastName}`;
};

/**
 * Genera sugerencias de username alternativas
 * @param {string} fullName - Nombre completo
 * @param {string} baseUsername - Username base
 * @returns {Array<string>} Array de sugerencias
 */
const generateUsernameSuggestions = (fullName, baseUsername) => {
  const parts = fullName.trim().split(' ').filter(p => p.length > 0);
  const suggestions = [];

  // Sugerencia 1: base + número aleatorio
  suggestions.push(`${baseUsername}${Math.floor(Math.random() * 99) + 1}`);

  // Sugerencia 2: primera letra + último apellido
  if (parts.length >= 3) {
    const firstInitial = normalizeText(parts[0].charAt(0));
    const lastPart = normalizeText(parts[parts.length - 1]);
    suggestions.push(`${firstInitial}${lastPart}`);
  }

  // Sugerencia 3: iniciales + primer apellido
  if (parts.length >= 2) {
    const initials = parts.slice(0, -1).map(p => normalizeText(p.charAt(0))).join('');
    const lastName = normalizeText(parts[parts.length - 1]);
    suggestions.push(`${initials}${lastName}`);
  }

  // Sugerencia 4: nombre completo sin espacios
  if (parts.length >= 2) {
    const firstName = normalizeText(parts[0]);
    const lastName = normalizeText(parts[parts.length - 1]);
    suggestions.push(`${firstName}${lastName}`);
  }

  // Sugerencia 5: base + número secuencial
  suggestions.push(`${baseUsername}1`);
  suggestions.push(`${baseUsername}2`);

  // Remover duplicados
  return [...new Set(suggestions)];
};

/**
 * Verifica si un username ya existe en la base de datos
 * @param {string} username - Username a verificar
 * @returns {Promise<boolean>} true si existe, false si no
 */
const usernameExists = async (username) => {
  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM users WHERE username = ?',
      [username]
    );
    return result.rows[0].count > 0;
  } catch (error) {
    console.error('Error verificando username:', error);
    throw error;
  }
};

/**
 * Genera un username único para un usuario
 * @param {string} fullName - Nombre completo del usuario
 * @returns {Promise<Object>} Objeto con username y sugerencias
 */
const generateUniqueUsername = async (fullName) => {
  try {
    // Generar username base
    const baseUsername = generateBaseUsername(fullName);

    // Verificar si está disponible
    const exists = await usernameExists(baseUsername);

    if (!exists) {
      // Username base está disponible
      return {
        username: baseUsername,
        suggestions: generateUsernameSuggestions(fullName, baseUsername),
        available: true
      };
    }

    // Username base no está disponible, generar sugerencias
    const suggestions = generateUsernameSuggestions(fullName, baseUsername);

    // Buscar la primera sugerencia disponible
    for (const suggestion of suggestions) {
      const suggestionExists = await usernameExists(suggestion);
      if (!suggestionExists) {
        return {
          username: suggestion,
          suggestions: suggestions.filter(s => s !== suggestion),
          available: true,
          wasModified: true,
          originalAttempt: baseUsername
        };
      }
    }

    // Si todas las sugerencias están tomadas, generar con número incremental
    let counter = 1;
    let finalUsername = `${baseUsername}${counter}`;

    while (await usernameExists(finalUsername)) {
      counter++;
      finalUsername = `${baseUsername}${counter}`;

      // Prevenir loop infinito
      if (counter > 999) {
        throw new Error('No se pudo generar un username único');
      }
    }

    return {
      username: finalUsername,
      suggestions: suggestions,
      available: true,
      wasModified: true,
      originalAttempt: baseUsername
    };

  } catch (error) {
    console.error('Error generando username:', error);
    throw error;
  }
};

/**
 * Valida formato de username
 * @param {string} username - Username a validar
 * @returns {Object} Resultado de validación
 */
const validateUsername = (username) => {
  const minLength = 3;
  const maxLength = 50;
  const validPattern = /^[a-z0-9_]+$/;

  if (!username || username.length < minLength) {
    return {
      valid: false,
      error: `El username debe tener al menos ${minLength} caracteres`
    };
  }

  if (username.length > maxLength) {
    return {
      valid: false,
      error: `El username no puede exceder ${maxLength} caracteres`
    };
  }

  if (!validPattern.test(username)) {
    return {
      valid: false,
      error: 'El username solo puede contener letras minúsculas, números y guiones bajos'
    };
  }

  return { valid: true };
};

module.exports = {
  normalizeText,
  generateBaseUsername,
  generateUsernameSuggestions,
  usernameExists,
  generateUniqueUsername,
  validateUsername
};
