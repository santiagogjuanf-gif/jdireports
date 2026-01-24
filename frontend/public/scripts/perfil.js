// ================================================
// PERFIL DE USUARIO
// ================================================

const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', async () => {
    await loadUserProfile();
    setupFormHandler();
});

async function loadUserProfile() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const token = localStorage.getItem('token');

        if (!user.id || !token) {
            window.location.href = '/login';
            return;
        }

        // Cargar datos del usuario
        document.getElementById('profileName').textContent = user.name || 'Usuario';
        document.getElementById('profileRole').textContent = getRoleName(user.role);
        document.getElementById('name').value = user.name || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('phone').value = user.phone || '';
        document.getElementById('username').value = user.username || '';

    } catch (error) {
        console.error('Error cargando perfil:', error);
        showNotification('Error al cargar el perfil', 'error');
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
            const response = await fetch(`${API_BASE_URL}/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (response.ok) {
                // Actualizar localStorage
                const updatedUser = { ...user, ...updateData };
                delete updatedUser.currentPassword;
                delete updatedUser.newPassword;
                localStorage.setItem('user', JSON.stringify(updatedUser));

                showNotification('Perfil actualizado exitosamente', 'success');

                // Limpiar campos de contraseña
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';

                // Recargar después de 1.5 segundos
                setTimeout(() => {
                    location.reload();
                }, 1500);
            } else {
                showNotification(data.message || 'Error al actualizar el perfil', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
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
