// ================================================
// NAVEGACIÓN SEGURA SIN EXPONER IDs EN URL
// ================================================

const SecureNav = {
  /**
   * Navega a una página con datos seguros sin exponerlos en la URL
   * @param {string} page - URL de la página destino
   * @param {object} data - Datos a pasar (ej: {id: 1, type: 'order'})
   * @param {string} key - Clave única para almacenar los datos
   */
  navigate: function(page, data, key = 'nav_data') {
    // Generar un token único para esta sesión
    const token = this.generateToken();

    // Guardar datos en sessionStorage con el token
    sessionStorage.setItem(`secure_${key}_${token}`, JSON.stringify(data));

    // Guardar el token actual
    sessionStorage.setItem('current_token', token);

    // Navegar a la página con el token (no con el ID real)
    window.location.href = `${page}?t=${token}`;
  },

  /**
   * Obtiene los datos seguros de la navegación anterior
   * @param {string} key - Clave usada al navegar
   * @returns {object|null} Datos guardados o null si no existen
   */
  getData: function(key = 'nav_data') {
    // Obtener token de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('t');

    if (!token) {
      return null;
    }

    // Recuperar datos del sessionStorage
    const dataKey = `secure_${key}_${token}`;
    const dataStr = sessionStorage.getItem(dataKey);

    if (!dataStr) {
      return null;
    }

    // Limpiar el sessionStorage después de usar
    sessionStorage.removeItem(dataKey);

    return JSON.parse(dataStr);
  },

  /**
   * Genera un token aleatorio único
   * @returns {string} Token único
   */
  generateToken: function() {
    return btoa(Date.now() + '_' + Math.random().toString(36).substring(2));
  },

  /**
   * Limpia la URL removiendo el token
   */
  cleanURL: function() {
    const url = new URL(window.location.href);
    url.searchParams.delete('t');
    window.history.replaceState({}, document.title, url.toString());
  }
};

// Hacer disponible globalmente
window.SecureNav = SecureNav;

console.log('✅ [SECURE-NAV] Sistema de navegación segura cargado');
