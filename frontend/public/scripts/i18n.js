// ================================================
// INTERNACIONALIZACIÓN (i18n)
// ================================================

const translations = {
    es: {
        // Header & Navigation
        'dashboard': 'Dashboard',
        'orders': 'Órdenes',
        'workers': 'Trabajadores',
        'materials': 'Materiales',
        'reports': 'Reportes',
        'profile': 'Mi Perfil',
        'settings': 'Configuración',
        'logout': 'Cerrar Sesión',
        'language': 'Idioma',
        'currentLanguage': 'Español',

        // Hero Section
        'heroTitle': 'Bienvenido al Sistema JDI',
        'heroSubtitle': 'Sistema de gestión de limpieza profesional',
        'newOrder': 'Nueva Orden',
        'viewCalendar': 'Ver Calendario',

        // Statistics
        'statActiveOrders': 'Órdenes Activas',
        'statCompletedOrders': 'Órdenes Completadas',
        'statPending': 'Pendientes',
        'statWorkers': 'Trabajadores',

        // Quick Actions
        'quickActions': 'Acciones Rápidas',
        'newWorker': 'Nuevo Trabajador',
        'requestMaterial': 'Solicitar Material',
        'generateReport': 'Generar Reporte',
        'manageInventory': 'Gestionar Inventario',

        // Workers Table
        'workersTitle': 'Trabajadores',
        'name': 'Nombre',
        'email': 'Email',
        'phone': 'Teléfono',
        'role': 'Rol',
        'status': 'Estado',
        'noWorkersRegistered': 'No hay usuarios registrados',

        // Roles
        'admin': 'Administrador',
        'jefe': 'Jefe',
        'gerente': 'Gerente',
        'trabajador': 'Trabajador',

        // Status
        'active': 'Activo',
        'inactive': 'Inactivo',

        // Notifications
        'notifications': 'Notificaciones',
        'noNotifications': 'No hay notificaciones',

        // Chat
        'chat': 'Chat de Soporte',
        'chatPlaceholder': 'Escribe tu mensaje...',

        // Messages
        'welcome': '¡Bienvenido!',
        'loading': 'Cargando...',
        'error': 'Error',
        'success': 'Éxito'
    },

    en: {
        // Header & Navigation
        'dashboard': 'Dashboard',
        'orders': 'Orders',
        'workers': 'Workers',
        'materials': 'Materials',
        'reports': 'Reports',
        'profile': 'My Profile',
        'settings': 'Settings',
        'logout': 'Logout',
        'language': 'Language',
        'currentLanguage': 'English',

        // Hero Section
        'heroTitle': 'Welcome to JDI System',
        'heroSubtitle': 'Professional cleaning management system',
        'newOrder': 'New Order',
        'viewCalendar': 'View Calendar',

        // Statistics
        'statActiveOrders': 'Active Orders',
        'statCompletedOrders': 'Completed Orders',
        'statPending': 'Pending',
        'statWorkers': 'Workers',

        // Quick Actions
        'quickActions': 'Quick Actions',
        'newWorker': 'New Worker',
        'requestMaterial': 'Request Material',
        'generateReport': 'Generate Report',
        'manageInventory': 'Manage Inventory',

        // Workers Table
        'workersTitle': 'Workers',
        'name': 'Name',
        'email': 'Email',
        'phone': 'Phone',
        'role': 'Role',
        'status': 'Status',
        'noWorkersRegistered': 'No workers registered',

        // Roles
        'admin': 'Administrator',
        'jefe': 'Chief',
        'gerente': 'Manager',
        'trabajador': 'Worker',

        // Status
        'active': 'Active',
        'inactive': 'Inactive',

        // Notifications
        'notifications': 'Notifications',
        'noNotifications': 'No notifications',

        // Chat
        'chat': 'Support Chat',
        'chatPlaceholder': 'Type your message...',

        // Messages
        'welcome': 'Welcome!',
        'loading': 'Loading...',
        'error': 'Error',
        'success': 'Success'
    },

    fr: {
        // Header & Navigation
        'dashboard': 'Tableau de bord',
        'orders': 'Commandes',
        'workers': 'Travailleurs',
        'materials': 'Matériaux',
        'reports': 'Rapports',
        'profile': 'Mon Profil',
        'settings': 'Paramètres',
        'logout': 'Déconnexion',
        'language': 'Langue',
        'currentLanguage': 'Français',

        // Hero Section
        'heroTitle': 'Bienvenue au système JDI',
        'heroSubtitle': 'Système de gestion de nettoyage professionnel',
        'newOrder': 'Nouvelle Commande',
        'viewCalendar': 'Voir le Calendrier',

        // Statistics
        'statActiveOrders': 'Commandes Actives',
        'statCompletedOrders': 'Commandes Terminées',
        'statPending': 'En Attente',
        'statWorkers': 'Travailleurs',

        // Quick Actions
        'quickActions': 'Actions Rapides',
        'newWorker': 'Nouveau Travailleur',
        'requestMaterial': 'Demander du Matériel',
        'generateReport': 'Générer un Rapport',
        'manageInventory': 'Gérer l\'Inventaire',

        // Workers Table
        'workersTitle': 'Travailleurs',
        'name': 'Nom',
        'email': 'Email',
        'phone': 'Téléphone',
        'role': 'Rôle',
        'status': 'Statut',
        'noWorkersRegistered': 'Aucun travailleur enregistré',

        // Roles
        'admin': 'Administrateur',
        'jefe': 'Chef',
        'gerente': 'Gestionnaire',
        'trabajador': 'Travailleur',

        // Status
        'active': 'Actif',
        'inactive': 'Inactif',

        // Notifications
        'notifications': 'Notifications',
        'noNotifications': 'Aucune notification',

        // Chat
        'chat': 'Chat de Support',
        'chatPlaceholder': 'Tapez votre message...',

        // Messages
        'welcome': 'Bienvenue!',
        'loading': 'Chargement...',
        'error': 'Erreur',
        'success': 'Succès'
    }
};

// Obtener idioma actual
function getCurrentLanguage() {
    return localStorage.getItem('language') || 'es';
}

// Obtener traducción
function t(key) {
    const lang = getCurrentLanguage();
    return translations[lang]?.[key] || translations['es'][key] || key;
}

// Aplicar traducciones a la página
function applyTranslations() {
    const lang = getCurrentLanguage();

    // Actualizar elementos con data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = t(key);

        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            if (element.hasAttribute('placeholder')) {
                element.placeholder = translation;
            } else {
                element.value = translation;
            }
        } else {
            element.textContent = translation;
        }
    });

    // Actualizar elementos con data-i18n-html (mantener HTML interno)
    document.querySelectorAll('[data-i18n-html]').forEach(element => {
        const key = element.getAttribute('data-i18n-html');
        element.innerHTML = t(key);
    });

    // Auto-traducir elementos comunes por texto (no requiere data-i18n)
    translateCommonElements();

    // Actualizar currentLanguage en el header
    const currentLangElement = document.getElementById('currentLanguage');
    if (currentLangElement) {
        currentLangElement.textContent = t('currentLanguage');
    }

    // Actualizar checks de idioma seleccionado
    document.querySelectorAll('.submenu-item i').forEach(check => check.classList.add('hidden'));
    const checkId = 'check' + lang.charAt(0).toUpperCase() + lang.slice(1);
    const checkElement = document.getElementById(checkId);
    if (checkElement) {
        checkElement.classList.remove('hidden');
    }
}

// Traducir elementos comunes sin data-i18n
function translateCommonElements() {
    // Mapeo de texto español a keys de traducción
    const textMappings = {
        'Mi Perfil': 'profile',
        'Configuración': 'settings',
        'Cerrar Sesión': 'logout',
        'Nueva Orden': 'newOrder',
        'Ver Calendario': 'viewCalendar',
        'Nuevo Trabajador': 'newWorker',
        'Solicitar Material': 'requestMaterial',
        'Generar Reporte': 'generateReport',
        'Acciones Rápidas': 'quickActions',
        'Trabajadores': 'workersTitle',
        'Nombre': 'name',
        'Email': 'email',
        'Teléfono': 'phone',
        'Rol': 'role',
        'Estado': 'status',
        'Notificaciones': 'notifications',
        'Chat de Soporte': 'chat',
        'Órdenes Activas': 'statActiveOrders',
        'Órdenes Completadas': 'statCompletedOrders',
        'Pendientes': 'statPending',
        'Administrador': 'admin',
        'Jefe': 'jefe',
        'Gerente': 'gerente',
        'Trabajador': 'trabajador',
        'Activo': 'active',
        'Inactivo': 'inactive'
    };

    // Traducir span y button con texto coincidente
    document.querySelectorAll('span:not([id]), button span, a span, th, h2, h3').forEach(element => {
        const text = element.textContent.trim();
        if (textMappings[text]) {
            element.textContent = t(textMappings[text]);
        }
    });

    // Traducir hero
    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle && heroSubtitle.textContent.includes('Administra tus órdenes')) {
        heroSubtitle.textContent = t('heroSubtitle');
    }

    // Traducir placeholders
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.placeholder = t('chatPlaceholder');
    }
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
});

// Exportar funciones
window.i18n = {
    t,
    getCurrentLanguage,
    applyTranslations,
    translations
};
