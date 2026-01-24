// ================================================
// AUTENTICACIÓN - JDI CLEANING SERVICES
// ================================================

const API_URL = 'http://localhost:3000/api';

// Verificar si el usuario está autenticado
function checkAuth() {
    console.log('🔍 [AUTH DEBUG] ========== INICIANDO VERIFICACIÓN DE AUTENTICACIÓN ==========');

    const token = localStorage.getItem('token');
    const currentPage = window.location.pathname;

    console.log('🔍 [AUTH DEBUG] Página actual:', currentPage);
    console.log('🔍 [AUTH DEBUG] Token existe:', !!token);
    if (token) {
        console.log('🔍 [AUTH DEBUG] Token:', token.substring(0, 30) + '...');
    }

    // Si estamos en login y ya hay token, redirigir al dashboard
    if (currentPage.includes('login') && token) {
        console.log('🔍 [AUTH DEBUG] Ya hay token en login, redirigiendo al dashboard...');
        window.location.href = '/';
        return;
    }

    // Si NO estamos en login y NO hay token, redirigir a login
    if (!currentPage.includes('login') && !token) {
        console.log('🔍 [AUTH DEBUG] No hay token, redirigiendo a login...');
        window.location.href = '/login';
        return;
    }

    // Si hay token, verificarlo con el servidor
    if (token && !currentPage.includes('login')) {
        console.log('🔍 [AUTH DEBUG] Hay token, verificando con servidor...');
        verifyToken(token);
    }

    console.log('🔍 [AUTH DEBUG] ========== FIN DE VERIFICACIÓN ==========');
}

// Verificar token con el servidor
async function verifyToken(token) {
    console.log('🔍 [AUTH DEBUG] Iniciando verificación de token...');
    console.log('🔍 [AUTH DEBUG] Token:', token.substring(0, 20) + '...');
    console.log('🔍 [AUTH DEBUG] URL:', `${API_URL}/auth/verify`);

    try {
        console.log('🔍 [AUTH DEBUG] Haciendo petición a /auth/verify...');

        const response = await fetch(`${API_URL}/auth/verify`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('🔍 [AUTH DEBUG] Respuesta recibida');
        console.log('🔍 [AUTH DEBUG] Status:', response.status);
        console.log('🔍 [AUTH DEBUG] Status Text:', response.statusText);

        if (!response.ok) {
            console.error('❌ [AUTH DEBUG] Token inválido o expirado');
            console.error('❌ [AUTH DEBUG] Status:', response.status);

            // Si es 401 (no autorizado), el token es inválido - cerrar sesión
            if (response.status === 401) {
                console.error('❌ [AUTH DEBUG] Token inválido (401), cerrando sesión...');
                logout();
                return;
            }

            // Para otros errores del servidor, registrar pero no cerrar sesión
            console.error('❌ [AUTH DEBUG] Error del servidor:', await response.text());
        } else {
            console.log('✅ [AUTH DEBUG] Token válido');
            // Token válido, cargar datos del usuario
            const data = await response.json();
            console.log('✅ [AUTH DEBUG] Datos del usuario:', data);
            loadUserData(data.user);
        }
    } catch (error) {
        console.error('❌ [AUTH DEBUG] Error de red verificando token:', error);
        console.error('❌ [AUTH DEBUG] El servidor podría estar reiniciándose o no disponible');

        // Si hay error de red (servidor no responde), intentar logout
        // Esto limpiará la sesión cuando el servidor se reinicie
        console.warn('⚠️ [AUTH DEBUG] No se pudo conectar con el servidor, limpiando sesión...');
        logout();
    }
}

// Cargar datos del usuario en la interfaz
function loadUserData(user) {
    const userName = user.name || user.username || 'Usuario';
    const userRole = user.role || 'usuario';

    // Mapeo de roles a español
    const roleNames = {
        'admin': 'Administrador',
        'jefe': 'Jefe',
        'gerente': 'Gerente',
        'trabajador': 'Trabajador'
    };
    const userRoleName = roleNames[userRole] || userRole;

    // Mapeo de roles a badges
    const roleBadges = {
        'admin': 'AD',
        'jefe': 'J',
        'gerente': 'G',
        'trabajador': 'T'
    };
    const roleBadge = roleBadges[userRole] || 'U';

    // Actualizar nombre en dropdown
    const dropdownUserName = document.getElementById('dropdownUserName');
    if (dropdownUserName) {
        dropdownUserName.textContent = userName;
    }

    // Actualizar rol en dropdown
    const dropdownUserRole = document.getElementById('dropdownUserRole');
    if (dropdownUserRole) {
        dropdownUserRole.textContent = userRoleName;
    }

    // Actualizar avatar principal
    const userAvatarImg = document.getElementById('userAvatarImg');
    if (userAvatarImg) {
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0099CC&color=fff`;
        userAvatarImg.src = avatarUrl;
    }

    // Actualizar avatar en dropdown
    const dropdownAvatarImg = document.getElementById('dropdownAvatarImg');
    if (dropdownAvatarImg) {
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0099CC&color=fff`;
        dropdownAvatarImg.src = avatarUrl;
    }

    // Actualizar badge de rol
    const userRoleBadge = document.getElementById('userRoleBadge');
    if (userRoleBadge) {
        userRoleBadge.textContent = roleBadge;
        // Remover todas las clases de rol previas
        userRoleBadge.classList.remove('admin', 'jefe', 'gerente', 'trabajador');
        // Agregar la clase del rol actual
        userRoleBadge.classList.add(userRole);
    }

    // Guardar usuario actualizado
    localStorage.setItem('user', JSON.stringify(user));
}

// Cerrar sesión
function logout() {
    console.log('🚪 [AUTH DEBUG] ========== CERRANDO SESIÓN ==========');
    console.log('🚪 [AUTH DEBUG] Stack trace:', new Error().stack);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('🚪 [AUTH DEBUG] Token y usuario eliminados de localStorage');
    console.log('🚪 [AUTH DEBUG] Redirigiendo a /login.html...');
    window.location.href = '/login';
}

// Obtener token para hacer requests
function getToken() {
    return localStorage.getItem('token');
}

// Obtener usuario actual
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Hacer request autenticado a la API
async function fetchAPI(endpoint, options = {}) {
    const token = getToken();
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, mergedOptions);
        
        // Si el token expiró o es inválido
        if (response.status === 401) {
            logout();
            return null;
        }

        return response;
    } catch (error) {
        console.error('Error en fetchAPI:', error);
        throw error;
    }
}

// Ejecutar verificación al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

// Exportar funciones para uso global
window.auth = {
    checkAuth,
    logout,
    getToken,
    getCurrentUser,
    fetchAPI
};
