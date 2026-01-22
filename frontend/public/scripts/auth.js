// ================================================
// AUTENTICACIÓN - JDI CLEANING SERVICES
// ================================================

const API_URL = 'http://localhost:3000/api';

// Verificar si el usuario está autenticado
function checkAuth() {
    const token = localStorage.getItem('token');
    const currentPage = window.location.pathname;

    // Si estamos en login.html y ya hay token, redirigir al dashboard
    if (currentPage.includes('login.html') && token) {
        window.location.href = '/';
        return;
    }

    // Si NO estamos en login.html y NO hay token, redirigir a login
    if (!currentPage.includes('login.html') && !token) {
        window.location.href = '/login.html';
        return;
    }

    // Si hay token, verificarlo con el servidor
    if (token && !currentPage.includes('login.html')) {
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
            // Token inválido, cerrar sesión
            logout();
        } else {
            // Token válido, cargar datos del usuario
            const data = await response.json();
            loadUserData(data.user);
        }
    } catch (error) {
        console.error('Error verificando token:', error);
    }
}

// Cargar datos del usuario en la interfaz
function loadUserData(user) {
    // Si hay un elemento para mostrar el nombre del usuario
    const userNameElement = document.querySelector('.user-name');
    if (userNameElement) {
        userNameElement.textContent = user.full_name || user.name || user.username;
    }

    // Guardar usuario actualizado
    localStorage.setItem('user', JSON.stringify(user));
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
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
