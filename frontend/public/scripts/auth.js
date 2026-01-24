// ================================================
// AUTENTICACIÓN - JDI CLEANING SERVICES
// ================================================

const API_URL = 'http://localhost:3000/api';

// Verificar si el usuario está autenticado
function checkAuth() {
    const token = localStorage.getItem('token');
    const currentPage = window.location.pathname;

    // Si estamos en login y ya hay token, redirigir al dashboard
    if (currentPage.includes('login') && token) {
        window.location.href = '/';
        return;
    }

    // Si NO estamos en login y NO hay token, redirigir a login
    if (!currentPage.includes('login') && !token) {
        window.location.href = '/login';
        return;
    }

    // Si hay token, verificarlo con el servidor
    if (token && !currentPage.includes('login')) {
        verifyToken(token);
    }
}

// Verificar token con el servidor
async function verifyToken(token) {
    try {
        const response = await fetch(`${API_URL}/auth/verify`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            // Si es 401 (no autorizado), el token es inválido - cerrar sesión
            if (response.status === 401) {
                logout();
                return;
            }

            // Para otros errores del servidor, registrar pero no cerrar sesión
            console.error('Error del servidor:', response.status);
        } else {
            // Token válido, cargar datos del usuario
            const data = await response.json();
            loadUserData(data.user);
        }
    } catch (error) {
        console.error('Error de red verificando token:', error);
        // Si hay error de red (servidor no responde), limpiar sesión
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
