// ================================================
// GENERADOR DE CONTRASEÑAS SEGURAS
// JD CLEANING SERVICES
// ================================================

/**
 * Genera una contraseña segura aleatoria
 * Requisitos:
 * - Mínimo 10 caracteres
 * - Al menos 1 mayúscula
 * - Al menos 1 minúscula
 * - Al menos 1 número
 * - Al menos 1 símbolo especial
 *
 * @param {number} length - Longitud de la contraseña (por defecto 12)
 * @returns {string} Contraseña generada
 */
const generateSecurePassword = (length = 12) => {
  // Asegurar mínimo 10 caracteres
  const finalLength = Math.max(length, 10);

  // Conjuntos de caracteres
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%&*+-=?';

  // Todos los caracteres combinados
  const allChars = lowercase + uppercase + numbers + symbols;

  let password = '';

  // Asegurar al menos 1 de cada tipo
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Completar el resto de la longitud
  for (let i = password.length; i < finalLength; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Mezclar los caracteres para que no sean predecibles
  password = password.split('').sort(() => Math.random() - 0.5).join('');

  return password;
};

/**
 * Valida si una contraseña cumple con los requisitos de seguridad
 * @param {string} password - Contraseña a validar
 * @returns {Object} Resultado de validación con detalles
 */
const validatePassword = (password) => {
  const minLength = 6;
  const errors = [];

  if (!password || password.length < minLength) {
    errors.push(`La contraseña debe tener al menos ${minLength} caracteres`);
  }

  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }

  if (!/\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  // No requerir símbolos especiales para ser más flexible
  // pero sí validar que si tiene, sean válidos

  return {
    valid: errors.length === 0,
    errors: errors,
    strength: calculatePasswordStrength(password)
  };
};

/**
 * Calcula la fortaleza de una contraseña
 * @param {string} password - Contraseña a evaluar
 * @returns {string} Nivel de fortaleza: weak, medium, strong, very_strong
 */
const calculatePasswordStrength = (password) => {
  if (!password) return 'weak';

  let strength = 0;

  // Longitud
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (password.length >= 16) strength++;

  // Complejidad
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;

  // Variedad
  const uniqueChars = new Set(password.split('')).size;
  if (uniqueChars >= password.length * 0.7) strength++;

  // Clasificar
  if (strength <= 2) return 'weak';
  if (strength <= 4) return 'medium';
  if (strength <= 6) return 'strong';
  return 'very_strong';
};

/**
 * Genera múltiples contraseñas para que el usuario elija
 * @param {number} count - Cantidad de contraseñas a generar
 * @param {number} length - Longitud de cada contraseña
 * @returns {Array<string>} Array de contraseñas
 */
const generateMultiplePasswords = (count = 5, length = 12) => {
  const passwords = [];
  for (let i = 0; i < count; i++) {
    passwords.push(generateSecurePassword(length));
  }
  return passwords;
};

module.exports = {
  generateSecurePassword,
  validatePassword,
  calculatePasswordStrength,
  generateMultiplePasswords
};
