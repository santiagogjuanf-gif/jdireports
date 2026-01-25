// ================================================
// THEME MANAGER - APLICACIÓN GLOBAL DEL TEMA
// ================================================
// Este script debe cargarse ANTES que cualquier otro para evitar flash

(function() {
  console.log('🎨 [THEME] Inicializando gestor de temas...');

  // Cargar configuración de tema
  function loadTheme() {
    try {
      // Intentar cargar desde appSettings primero
      const appSettings = JSON.parse(localStorage.getItem('appSettings') || '{}');
      let theme = appSettings.theme || localStorage.getItem('theme') || 'light';

      console.log('🎨 [THEME] Tema detectado:', theme);

      // Aplicar tema inmediatamente
      applyTheme(theme);
    } catch (error) {
      console.error('❌ [THEME] Error al cargar tema:', error);
      // Aplicar tema por defecto
      applyTheme('light');
    }
  }

  // Aplicar tema al documento
  function applyTheme(theme) {
    const html = document.documentElement;
    const body = document.body;

    // Remover clases previas
    html.classList.remove('dark-theme', 'light-theme');
    if (body) {
      body.classList.remove('dark-theme', 'light-theme');
    }

    if (theme === 'dark') {
      html.classList.add('dark-theme');
      if (body) {
        body.classList.add('dark-theme');
      }
      console.log('🌙 [THEME] Tema oscuro activado');
    } else if (theme === 'light') {
      html.classList.add('light-theme');
      if (body) {
        body.classList.add('light-theme');
      }
      console.log('☀️ [THEME] Tema claro activado');
    } else if (theme === 'auto') {
      // Detectar preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        html.classList.add('dark-theme');
        if (body) {
          body.classList.add('dark-theme');
        }
        console.log('🌙 [THEME] Tema automático: oscuro (según sistema)');
      } else {
        html.classList.add('light-theme');
        if (body) {
          body.classList.add('light-theme');
        }
        console.log('☀️ [THEME] Tema automático: claro (según sistema)');
      }
    }
  }

  // Cargar tema inmediatamente
  loadTheme();

  // Re-aplicar cuando el DOM esté listo (por si body no existía)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadTheme);
  }
})();
