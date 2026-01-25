// ================================================
// CONFIGURACIÓN DEL SISTEMA
// ================================================

const DEFAULT_SETTINGS = {
    language: 'es',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24',
    theme: 'light',
    fontSize: 'medium',
    animations: true,
    emailNewOrders: true,
    emailCompletedOrders: true,
    emailMaterials: true,
    pushNotifications: true,
    notificationSounds: false,
    autoLogout: '0',
    showOnlineStatus: true
};

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    setupSectionNavigation();
    setupEventListeners();
});

// Cargar configuración guardada
function loadSettings() {
    const savedSettings = JSON.parse(localStorage.getItem('appSettings') || '{}');
    const settings = { ...DEFAULT_SETTINGS, ...savedSettings };

    // General
    document.getElementById('languageSelect').value = settings.language;
    document.getElementById('dateFormat').value = settings.dateFormat;
    document.getElementById('timeFormat').value = settings.timeFormat;

    // Apariencia
    document.getElementById('themeSelect').value = settings.theme;
    document.getElementById('fontSize').value = settings.fontSize;
    document.getElementById('animationsToggle').checked = settings.animations;

    // Notificaciones - Email
    document.getElementById('emailNewOrders').checked = settings.emailNewOrders;
    document.getElementById('emailCompletedOrders').checked = settings.emailCompletedOrders;
    document.getElementById('emailMaterials').checked = settings.emailMaterials;

    // Notificaciones - Push
    document.getElementById('pushNotifications').checked = settings.pushNotifications;
    document.getElementById('notificationSounds').checked = settings.notificationSounds;

    // Seguridad
    document.getElementById('autoLogout').value = settings.autoLogout;
    document.getElementById('showOnlineStatus').checked = settings.showOnlineStatus;

    // Aplicar tema actual
    applyTheme(settings.theme);
    applyFontSize(settings.fontSize);
}

// Configurar navegación entre secciones
function setupSectionNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const sections = document.querySelectorAll('.settings-section');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // Remover clase active de todos los links y secciones
            sidebarLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            // Agregar clase active al link clickeado
            link.classList.add('active');

            // Mostrar la sección correspondiente
            const sectionId = link.dataset.section + '-section';
            const section = document.getElementById(sectionId);
            if (section) {
                section.classList.add('active');
            }
        });
    });
}

// Configurar event listeners
function setupEventListeners() {
    // Botón guardar
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);

    // Botón restablecer
    document.getElementById('resetSettingsBtn').addEventListener('click', resetSettings);

    // Botón exportar datos
    document.getElementById('exportDataBtn').addEventListener('click', exportData);

    // Botón limpiar caché
    document.getElementById('clearCacheBtn').addEventListener('click', clearCache);

    // Cambio de tema en tiempo real
    document.getElementById('themeSelect').addEventListener('change', (e) => {
        applyTheme(e.target.value);
    });

    // Cambio de tamaño de fuente en tiempo real
    document.getElementById('fontSize').addEventListener('change', (e) => {
        applyFontSize(e.target.value);
    });

    // Cambio de idioma
    document.getElementById('languageSelect').addEventListener('change', (e) => {
        showNotification('El idioma se aplicará al guardar la configuración', 'info');
    });
}

// Guardar configuración
function saveSettings() {
    const settings = {
        language: document.getElementById('languageSelect').value,
        dateFormat: document.getElementById('dateFormat').value,
        timeFormat: document.getElementById('timeFormat').value,
        theme: document.getElementById('themeSelect').value,
        fontSize: document.getElementById('fontSize').value,
        animations: document.getElementById('animationsToggle').checked,
        emailNewOrders: document.getElementById('emailNewOrders').checked,
        emailCompletedOrders: document.getElementById('emailCompletedOrders').checked,
        emailMaterials: document.getElementById('emailMaterials').checked,
        pushNotifications: document.getElementById('pushNotifications').checked,
        notificationSounds: document.getElementById('notificationSounds').checked,
        autoLogout: document.getElementById('autoLogout').value,
        showOnlineStatus: document.getElementById('showOnlineStatus').checked
    };

    // Guardar en localStorage
    localStorage.setItem('appSettings', JSON.stringify(settings));

    // También guardar idioma en la clave que usa el sistema
    localStorage.setItem('language', settings.language);

    // Guardar tema para compatibilidad
    localStorage.setItem('theme', settings.theme);

    showNotification('Configuración guardada exitosamente', 'success');

    console.log('💾 [CONFIGURACION] Configuración guardada:', settings);

    // Si cambió el idioma, recargar la página después de 1.5 segundos
    const currentLang = localStorage.getItem('language');
    if (settings.language !== currentLang) {
        setTimeout(() => {
            location.reload();
        }, 1500);
    }
}

// Restablecer configuración a valores predeterminados
function resetSettings() {
    if (!confirm('¿Estás seguro de que deseas restablecer la configuración a los valores predeterminados?')) {
        return;
    }

    localStorage.setItem('appSettings', JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem('language', DEFAULT_SETTINGS.language);

    showNotification('Configuración restablecida. Recargando página...', 'success');

    setTimeout(() => {
        location.reload();
    }, 1500);
}

// Aplicar tema
function applyTheme(theme) {
    const body = document.body;

    if (theme === 'dark') {
        body.classList.add('dark-theme');
        showNotification('Tema oscuro activado (vista previa)', 'info');
    } else if (theme === 'light') {
        body.classList.remove('dark-theme');
    } else if (theme === 'auto') {
        // Detectar preferencia del sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            body.classList.add('dark-theme');
        } else {
            body.classList.remove('dark-theme');
        }
        showNotification('Tema automático activado según preferencias del sistema', 'info');
    }
}

// Aplicar tamaño de fuente
function applyFontSize(size) {
    const body = document.body;

    // Remover clases previas
    body.classList.remove('font-small', 'font-medium', 'font-large');

    // Agregar nueva clase
    if (size === 'small') {
        body.classList.add('font-small');
    } else if (size === 'large') {
        body.classList.add('font-large');
    } else {
        body.classList.add('font-medium');
    }
}

// Exportar datos
function exportData() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');

        const exportData = {
            user: {
                name: user.name,
                email: user.email,
                role: user.role
            },
            settings: settings,
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `jdi-config-${Date.now()}.json`;
        link.click();

        URL.revokeObjectURL(url);

        showNotification('Datos exportados exitosamente', 'success');
    } catch (error) {
        console.error('Error exportando datos:', error);
        showNotification('Error al exportar datos', 'error');
    }
}

// Limpiar caché
function clearCache() {
    if (!confirm('¿Estás seguro de que deseas limpiar el caché? Esto puede mejorar el rendimiento pero requerirá recargar algunos datos.')) {
        return;
    }

    try {
        // Limpiar caché del navegador si está disponible
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    caches.delete(name);
                });
            });
        }

        showNotification('Caché limpiado exitosamente', 'success');
    } catch (error) {
        console.error('Error limpiando caché:', error);
        showNotification('Error al limpiar caché', 'error');
    }
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#00A651' : type === 'error' ? '#F44336' : '#0099CC'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        font-family: 'Poppins', sans-serif;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
