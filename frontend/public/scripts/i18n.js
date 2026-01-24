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
        'heroSubtitle': 'Administra tus órdenes de limpieza de manera eficiente y profesional',
        'newOrder': 'Nueva Orden',
        'viewCalendar': 'Ver Calendario',
        'welcome': 'Bienvenido',

        // Statistics
        'statActiveOrders': 'Órdenes Activas',
        'statCompletedOrders': 'Órdenes Completadas',
        'statCompleted': 'Completadas',
        'statPending': 'Pendientes',
        'statWorkers': 'Trabajadores',

        // Sections
        'recentOrders': 'Órdenes Recientes',
        'viewAll': 'Ver todas',
        'quickActions': 'Acciones Rápidas',
        'workersTitle': 'Trabajadores',

        // Actions
        'newWorker': 'Nuevo Trabajador',
        'requestMaterial': 'Solicitar Material',
        'generateReport': 'Generar Reporte',
        'manageInventory': 'Gestionar Inventario',

        // Actions Descriptions (Quick Actions subtitles)
        'newOrderDesc': 'Crear orden de limpieza',
        'newWorkerDesc': 'Registrar trabajador',
        'generateReportDesc': 'Descargar PDF',
        'requestMaterialDesc': 'Gestionar inventario',

        // Workers Table
        'name': 'Nombre',
        'email': 'Email',
        'phone': 'Teléfono',
        'role': 'Rol',
        'status': 'Estado',
        'noWorkersRegistered': 'No hay usuarios registrados',
        'loadingWorkers': 'Cargando trabajadores...',

        // Roles
        'admin': 'Administrador',
        'jefe': 'Jefe',
        'gerente': 'Gerente',
        'trabajador': 'Trabajador',

        // Status
        'active': 'Activo',
        'inactive': 'Inactivo',

        // Notifications & Chat
        'notifications': 'Notificaciones',
        'noNotifications': 'No hay notificaciones',
        'chat': 'Chat de Soporte',
        'chatPlaceholder': 'Escribe tu mensaje...',

        // Common
        'loading': 'Cargando...',
        'error': 'Error',
        'success': 'Éxito',
        'loadingOrders': 'Cargando órdenes...'
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
        'heroSubtitle': 'Manage your cleaning orders efficiently and professionally',
        'newOrder': 'New Order',
        'viewCalendar': 'View Calendar',
        'welcome': 'Welcome',

        // Statistics
        'statActiveOrders': 'Active Orders',
        'statCompletedOrders': 'Completed Orders',
        'statCompleted': 'Completed',
        'statPending': 'Pending',
        'statWorkers': 'Workers',

        // Sections
        'recentOrders': 'Recent Orders',
        'viewAll': 'View all',
        'quickActions': 'Quick Actions',
        'workersTitle': 'Workers',

        // Actions
        'newWorker': 'New Worker',
        'requestMaterial': 'Request Material',
        'generateReport': 'Generate Report',
        'manageInventory': 'Manage Inventory',

        // Actions Descriptions (Quick Actions subtitles)
        'newOrderDesc': 'Create cleaning order',
        'newWorkerDesc': 'Register worker',
        'generateReportDesc': 'Download PDF',
        'requestMaterialDesc': 'Manage inventory',

        // Workers Table
        'name': 'Name',
        'email': 'Email',
        'phone': 'Phone',
        'role': 'Role',
        'status': 'Status',
        'noWorkersRegistered': 'No workers registered',
        'loadingWorkers': 'Loading workers...',

        // Roles
        'admin': 'Administrator',
        'jefe': 'Chief',
        'gerente': 'Manager',
        'trabajador': 'Worker',

        // Status
        'active': 'Active',
        'inactive': 'Inactive',

        // Notifications & Chat
        'notifications': 'Notifications',
        'noNotifications': 'No notifications',
        'chat': 'Support Chat',
        'chatPlaceholder': 'Type your message...',

        // Common
        'loading': 'Loading...',
        'error': 'Error',
        'success': 'Success',
        'loadingOrders': 'Loading orders...'
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
        'heroSubtitle': 'Gérez vos commandes de nettoyage de manière efficace et professionnelle',
        'newOrder': 'Nouvelle Commande',
        'viewCalendar': 'Voir le Calendrier',
        'welcome': 'Bienvenue',

        // Statistics
        'statActiveOrders': 'Commandes Actives',
        'statCompletedOrders': 'Commandes Terminées',
        'statCompleted': 'Terminées',
        'statPending': 'En Attente',
        'statWorkers': 'Travailleurs',

        // Sections
        'recentOrders': 'Commandes Récentes',
        'viewAll': 'Voir tout',
        'quickActions': 'Actions Rapides',
        'workersTitle': 'Travailleurs',

        // Actions
        'newWorker': 'Nouveau Travailleur',
        'requestMaterial': 'Demander du Matériel',
        'generateReport': 'Générer un Rapport',
        'manageInventory': 'Gérer l\'Inventaire',

        // Actions Descriptions (Quick Actions subtitles)
        'newOrderDesc': 'Créer une commande de nettoyage',
        'newWorkerDesc': 'Enregistrer un travailleur',
        'generateReportDesc': 'Télécharger PDF',
        'requestMaterialDesc': 'Gérer l\'inventaire',

        // Workers Table
        'name': 'Nom',
        'email': 'Email',
        'phone': 'Téléphone',
        'role': 'Rôle',
        'status': 'Statut',
        'noWorkersRegistered': 'Aucun travailleur enregistré',
        'loadingWorkers': 'Chargement des travailleurs...',

        // Roles
        'admin': 'Administrateur',
        'jefe': 'Chef',
        'gerente': 'Gestionnaire',
        'trabajador': 'Travailleur',

        // Status
        'active': 'Actif',
        'inactive': 'Inactif',

        // Notifications & Chat
        'notifications': 'Notifications',
        'noNotifications': 'Aucune notification',
        'chat': 'Chat de Support',
        'chatPlaceholder': 'Tapez votre message...',

        // Common
        'loading': 'Chargement...',
        'error': 'Erreur',
        'success': 'Succès',
        'loadingOrders': 'Chargement des commandes...'
    }
};

console.log('🌍 [i18n] Sistema de traducción cargado correctamente');
console.log('📋 [i18n] Idiomas disponibles:', Object.keys(translations));

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
        'Completadas': 'statCompleted',
        'Pendientes': 'statPending',
        'Administrador': 'admin',
        'Jefe': 'jefe',
        'Gerente': 'gerente',
        'Trabajador': 'trabajador',
        'Activo': 'active',
        'Inactivo': 'inactive',
        'Ver todas': 'viewAll',
        'Órdenes Recientes': 'recentOrders',
        'Cargando órdenes...': 'loadingOrders',
        'Cargando trabajadores...': 'loadingWorkers',
        'Bienvenido': 'welcome',
        'Cargando...': 'loading'
    };

    // Traducir elementos de texto (span, p, th, h2, h3, button text)
    document.querySelectorAll('span:not([id]):not(.gradient-text), button span, a span, th, h2, h3, p.stat-label, p.section-title').forEach(element => {
        const text = element.textContent.trim();
        if (textMappings[text]) {
            element.textContent = t(textMappings[text]);
        }
    });

    // Traducir botones completos (sin hijos)
    document.querySelectorAll('button:not(:has(span))').forEach(button => {
        const text = button.textContent.trim();
        // Solo traducir el texto, mantener el icono
        const icon = button.querySelector('i');
        const textContent = text.replace(/\s*\n\s*/g, ' ').trim();

        Object.keys(textMappings).forEach(key => {
            if (textContent.includes(key)) {
                if (icon) {
                    button.innerHTML = `<i class="${icon.className}"></i> ${t(textMappings[key])}`;
                } else {
                    button.textContent = t(textMappings[key]);
                }
            }
        });
    });

    // Traducir hero section
    const heroTitle = document.querySelector('.hero-title .gradient-text');
    if (heroTitle && heroTitle.textContent.trim() === 'Bienvenido') {
        heroTitle.textContent = t('welcome');
    }

    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle) {
        const originalText = heroSubtitle.textContent.trim();
        if (originalText.includes('Administra tus órdenes') || originalText.includes('Manage your cleaning') || originalText.includes('Gérez vos commandes')) {
            heroSubtitle.textContent = t('heroSubtitle');
        }
    }

    // Traducir labels de navegación
    document.querySelectorAll('.nav-link span').forEach(span => {
        const text = span.textContent.trim();
        if (text === 'Órdenes') span.textContent = t('orders');
        else if (text === 'Trabajadores') span.textContent = t('workers');
        else if (text === 'Materiales') span.textContent = t('materials');
        else if (text === 'Reportes') span.textContent = t('reports');
        else if (text === 'Dashboard') span.textContent = t('dashboard');
    });

    // Traducir placeholders
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.placeholder = t('chatPlaceholder');
    }

    // Traducir encabezados de sección
    document.querySelectorAll('.section-title').forEach(title => {
        const text = title.textContent.trim().replace(/\s+/g, ' ');
        if (text.includes('Órdenes Recientes')) {
            const icon = title.querySelector('i');
            if (icon) {
                title.innerHTML = `<i class="${icon.className}"></i> ${t('recentOrders')}`;
            }
        } else if (text.includes('Trabajadores')) {
            const icon = title.querySelector('i');
            if (icon) {
                title.innerHTML = `<i class="${icon.className}"></i> ${t('workersTitle')}`;
            }
        } else if (text.includes('Acciones Rápidas')) {
            const icon = title.querySelector('i');
            if (icon) {
                title.innerHTML = `<i class="${icon.className}"></i> ${t('quickActions')}`;
            }
        }
    });
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
