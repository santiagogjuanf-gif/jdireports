// ================================================
// PERFIL DE USUARIO
// ================================================

const API_BASE_URL = 'http://localhost:3000/api';
let targetUserId = null; // ID del usuario que se está editando
let isEditingOtherUser = false;

document.addEventListener('DOMContentLoaded', async () => {
    await loadUserProfile();
    setupFormHandler();
});

async function loadUserProfile() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const token = localStorage.getItem('token');

        if (!currentUser.id || !token) {
            window.location.href = '/login';
            return;
        }

        // Verificar si hay un parámetro 'id' en la URL
        const urlParams = new URLSearchParams(window.location.search);
        const userIdParam = urlParams.get('id');

        if (userIdParam && userIdParam !== currentUser.id.toString()) {
            // Intentando editar otro usuario
            console.log('📝 [PERFIL] Cargando perfil de usuario ID:', userIdParam);

            // Verificar permisos - solo admin y jefe pueden editar otros perfiles
            if (!['admin', 'jefe'].includes(currentUser.role)) {
                showNotification('No tienes permisos para editar otros perfiles', 'error');
                setTimeout(() => window.location.href = '/trabajadores', 2000);
                return;
            }

            targetUserId = parseInt(userIdParam);
            isEditingOtherUser = true;

            // Cargar datos del usuario desde la API
            const response = await fetch(`${API_BASE_URL}/users/${targetUserId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('No se pudo cargar el usuario');
            }

            const data = await response.json();
            const user = data.user || data;

            // Rellenar formulario con datos del usuario
            document.getElementById('profileName').textContent = user.name || 'Usuario';
            document.getElementById('profileRole').textContent = getRoleName(user.role);
            document.getElementById('name').value = user.name || '';
            document.getElementById('email').value = user.email || '';
            document.getElementById('phone').value = user.phone || '';
            document.getElementById('username').value = user.username || '';

            console.log('✅ [PERFIL] Perfil de otro usuario cargado');
        } else {
            // Editar perfil propio
            targetUserId = currentUser.id;
            isEditingOtherUser = false;

            // Cargar datos del usuario logueado
            document.getElementById('profileName').textContent = currentUser.name || 'Usuario';
            document.getElementById('profileRole').textContent = getRoleName(currentUser.role);
            document.getElementById('name').value = currentUser.name || '';
            document.getElementById('email').value = currentUser.email || '';
            document.getElementById('phone').value = currentUser.phone || '';
            document.getElementById('username').value = currentUser.username || '';

            console.log('✅ [PERFIL] Perfil propio cargado');
        }

    } catch (error) {
        console.error('❌ [PERFIL] Error cargando perfil:', error);
        showNotification('Error al cargar el perfil', 'error');
        setTimeout(() => window.location.href = '/trabajadores', 2000);
    }
}

function getRoleName(role) {
    const roles = {
        'admin': 'Administrador',
        'jefe': 'Jefe',
        'gerente': 'Gerente',
        'trabajador': 'Trabajador'
    };
    return roles[role] || role;
}

function setupFormHandler() {
    const form = document.getElementById('profileForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (!token || !user.id) {
            showNotification('Sesión no válida', 'error');
            return;
        }

        // Preparar datos
        const updateData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim() || null
        };

        // Si hay contraseña nueva
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword) {
            if (newPassword !== confirmPassword) {
                showNotification('Las contraseñas no coinciden', 'error');
                return;
            }
            if (!currentPassword) {
                showNotification('Debes ingresar tu contraseña actual', 'error');
                return;
            }
            updateData.currentPassword = currentPassword;
            updateData.newPassword = newPassword;
        }

        try {
            console.log('💾 [PERFIL] Guardando perfil de usuario ID:', targetUserId);

            const response = await fetch(`${API_BASE_URL}/users/${targetUserId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (response.ok) {
                // Solo actualizar localStorage si estamos editando nuestro propio perfil
                if (!isEditingOtherUser) {
                    const updatedUser = { ...user, ...updateData };
                    delete updatedUser.currentPassword;
                    delete updatedUser.newPassword;
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }

                showNotification('Perfil actualizado exitosamente', 'success');

                // Limpiar campos de contraseña
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';

                console.log('✅ [PERFIL] Perfil actualizado');

                // Redirigir según el caso
                setTimeout(() => {
                    if (isEditingOtherUser) {
                        window.location.href = '/trabajadores';
                    } else {
                        location.reload();
                    }
                }, 1500);
            } else {
                showNotification(data.message || 'Error al actualizar el perfil', 'error');
            }
        } catch (error) {
            console.error('❌ [PERFIL] Error:', error);
            showNotification('Error de conexión', 'error');
        }
    });
}

function showNotification(message, type = 'info') {
    // Crear notificación temporal
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
