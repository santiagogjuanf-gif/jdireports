// ================================================
// TRABAJADORES - FUNCIONALIDAD
// ================================================

const API_BASE_URL = 'http://localhost:3000/api';

let allWorkers = [];
let filteredWorkers = [];

// ================================================
// CARGAR TRABAJADORES
// ================================================

async function loadWorkers() {
    try {
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_BASE_URL}/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar trabajadores');
        }

        const data = await response.json();
        allWorkers = data.users || [];
        filteredWorkers = [...allWorkers];

        updateStats();
        displayWorkers(filteredWorkers);
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los trabajadores');
    }
}

// ================================================
// MOSTRAR TRABAJADORES EN TABLA
// ================================================

function displayWorkers(workers) {
    const tbody = document.getElementById('workersTableBody');

    if (workers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-users-slash"></i>
                    <p>No se encontraron trabajadores</p>
                </td>
            </tr>
        `;
        return;
    }

    const roleNames = {
        'admin': 'Administrador',
        'jefe': 'Jefe',
        'gerente': 'Gerente',
        'trabajador': 'Trabajador'
    };

    tbody.innerHTML = workers.map(worker => `
        <tr>
            <td>
                <span class="worker-name">${worker.name}</span>
            </td>
            <td>${worker.email}</td>
            <td>${worker.phone || '-'}</td>
            <td>
                <span class="worker-role-badge ${worker.role}">
                    ${roleNames[worker.role] || worker.role}
                </span>
            </td>
            <td>
                <span class="worker-status-badge ${worker.is_active ? 'active' : 'inactive'}">
                    <i class="fas fa-circle"></i>
                    ${worker.is_active ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <div class="worker-actions">
                    <button class="btn-icon view" onclick="viewWorker(${worker.id})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon edit" onclick="editWorker(${worker.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteWorker(${worker.id}, '${worker.name}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ================================================
// ACTUALIZAR ESTADÍSTICAS
// ================================================

function updateStats() {
    const total = allWorkers.length;
    const active = allWorkers.filter(w => w.is_active).length;
    const inactive = total - active;
    const admins = allWorkers.filter(w => w.role === 'admin' || w.role === 'jefe').length;

    document.getElementById('totalWorkers').textContent = total;
    document.getElementById('activeWorkers').textContent = active;
    document.getElementById('inactiveWorkers').textContent = inactive;
    document.getElementById('adminCount').textContent = admins;
}

// ================================================
// FILTROS Y BÚSQUEDA
// ================================================

document.getElementById('searchWorkers').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    applyFilters();
});

document.getElementById('filterRole').addEventListener('change', () => {
    applyFilters();
});

document.getElementById('filterStatus').addEventListener('change', () => {
    applyFilters();
});

function applyFilters() {
    const searchTerm = document.getElementById('searchWorkers').value.toLowerCase();
    const roleFilter = document.getElementById('filterRole').value;
    const statusFilter = document.getElementById('filterStatus').value;

    filteredWorkers = allWorkers.filter(worker => {
        // Filtro de búsqueda
        const matchesSearch = !searchTerm ||
            worker.name.toLowerCase().includes(searchTerm) ||
            worker.email.toLowerCase().includes(searchTerm) ||
            (worker.phone && worker.phone.toLowerCase().includes(searchTerm));

        // Filtro de rol
        const matchesRole = !roleFilter || worker.role === roleFilter;

        // Filtro de estado
        const matchesStatus = !statusFilter ||
            (statusFilter === '1' && worker.is_active) ||
            (statusFilter === '0' && !worker.is_active);

        return matchesSearch && matchesRole && matchesStatus;
    });

    displayWorkers(filteredWorkers);
}

// ================================================
// ACCIONES DE TRABAJADORES
// ================================================

function viewWorker(id) {
    const worker = allWorkers.find(w => w.id === id);
    if (!worker) return;

    const roleNames = {
        'admin': 'Administrador',
        'jefe': 'Jefe',
        'gerente': 'Gerente',
        'trabajador': 'Trabajador'
    };

    alert(`Detalles del Trabajador:

Nombre: ${worker.name}
Email: ${worker.email}
Teléfono: ${worker.phone || 'No especificado'}
Usuario: ${worker.username || 'No especificado'}
Rol: ${roleNames[worker.role] || worker.role}
Estado: ${worker.is_active ? 'Activo' : 'Inactivo'}
Idioma preferido: ${worker.preferred_language || 'es'}

Nota: La funcionalidad completa de vista de detalles estará disponible próximamente.`);
}

function editWorker(id) {
    // Por ahora redirigir al perfil
    // TODO: Crear página de edición de trabajador
    showNotification('Redirigiendo a edición de perfil...', 'info');
    setTimeout(() => {
        window.location.href = `/perfil?id=${id}`;
    }, 500);
}

async function deleteWorker(id, name) {
    if (!confirm(`¿Estás seguro de que deseas eliminar al trabajador "${name}"?\n\nEsta acción no se puede deshacer.`)) {
        return;
    }

    try {
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al eliminar trabajador');
        }

        showNotification(`Trabajador "${name}" eliminado exitosamente`, 'success');

        // Recargar trabajadores
        loadWorkers();
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Error al eliminar el trabajador');
    }
}

// ================================================
// NOTIFICACIONES
// ================================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#00A651' : type === 'error' ? '#F44336' : '#0099CC'};
        color: white;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        font-family: 'Poppins', sans-serif;
        animation: slideIn 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${message}
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function showError(message) {
    showNotification(message, 'error');
}

// ================================================
// INICIALIZACIÓN
// ================================================

document.addEventListener('DOMContentLoaded', () => {
    loadWorkers();
});

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
