// ================================================
// SOLICITUDES DE MATERIALES - ADMIN/JEFE
// ================================================

const API_BASE_URL = 'http://localhost:3000/api';

let allRequests = [];
let currentFilter = 'all';

// ================================================
// CARGAR SOLICITUDES
// ================================================

async function loadRequests() {
    try {
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_BASE_URL}/materials/requests`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar solicitudes');
        }

        const data = await response.json();
        allRequests = data.requests || [];

        displayRequests();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar las solicitudes');
        document.getElementById('requestsList').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error al cargar las solicitudes</p>
            </div>
        `;
    }
}

// ================================================
// MOSTRAR SOLICITUDES
// ================================================

function displayRequests() {
    const container = document.getElementById('requestsList');

    let filteredRequests = allRequests;
    if (currentFilter !== 'all') {
        filteredRequests = allRequests.filter(r => r.status === currentFilter);
    }

    if (filteredRequests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No hay solicitudes ${currentFilter !== 'all' ? 'con este estado' : ''}</p>
            </div>
        `;
        return;
    }

    const statusNames = {
        'pending': 'Pendiente',
        'approved': 'Aprobada',
        'rejected': 'Rechazada',
        'delivered': 'Entregada'
    };

    container.innerHTML = filteredRequests.map(request => {
        const items = request.items || [];
        const canApprove = request.status === 'pending';
        const canDeliver = request.status === 'approved';

        return `
            <div class="request-card">
                <div class="request-header">
                    <div class="request-info">
                        <h3>
                            <i class="fas fa-file-alt"></i>
                            Solicitud #${request.id}
                        </h3>
                        <div class="request-meta">
                            <div class="request-meta-item">
                                <i class="fas fa-user"></i>
                                <span>${request.requester_name || 'Usuario'}</span>
                            </div>
                            <div class="request-meta-item">
                                <i class="fas fa-calendar"></i>
                                <span>${formatDate(request.requested_at)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="status-badge ${request.status}">
                        ${statusNames[request.status] || request.status}
                    </div>
                </div>

                <div class="request-items">
                    <strong><i class="fas fa-box"></i> Materiales solicitados:</strong>
                    ${items.map(item => `
                        <div class="request-item">
                            <span class="item-name">${item.material_name || item.name_es}</span>
                            <span class="item-quantity">${item.quantity_requested || item.quantity} ${item.unit || 'unidades'}</span>
                        </div>
                    `).join('')}
                </div>

                ${request.notes ? `
                    <div class="request-notes">
                        <strong><i class="fas fa-sticky-note"></i> Notas:</strong> ${request.notes}
                    </div>
                ` : ''}

                <div class="request-actions">
                    ${canApprove ? `
                        <button class="btn btn-approve" onclick="approveRequest(${request.id})">
                            <i class="fas fa-check"></i> Aprobar
                        </button>
                        <button class="btn btn-reject" onclick="rejectRequest(${request.id})">
                            <i class="fas fa-times"></i> Rechazar
                        </button>
                    ` : ''}
                    ${canDeliver ? `
                        <button class="btn btn-deliver" onclick="deliverRequest(${request.id})">
                            <i class="fas fa-truck"></i> Marcar como Entregada
                        </button>
                    ` : ''}
                    <button class="btn btn-view" onclick="viewRequestDetails(${request.id})">
                        <i class="fas fa-eye"></i> Ver Detalles
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ================================================
// ACCIONES DE SOLICITUDES
// ================================================

async function approveRequest(id) {
    if (!confirm('¿Estás seguro de que deseas aprobar esta solicitud?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_BASE_URL}/materials/requests/${id}/approve`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al aprobar solicitud');
        }

        showSuccess('Solicitud aprobada exitosamente');
        loadRequests();
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Error al aprobar la solicitud');
    }
}

async function rejectRequest(id) {
    const reason = prompt('Ingresa el motivo del rechazo (opcional):');
    if (reason === null) return; // Usuario canceló

    try {
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_BASE_URL}/materials/requests/${id}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason: reason || 'Sin motivo especificado' })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al rechazar solicitud');
        }

        showSuccess('Solicitud rechazada');
        loadRequests();
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Error al rechazar la solicitud');
    }
}

async function deliverRequest(id) {
    if (!confirm('¿Confirmas que los materiales han sido entregados?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_BASE_URL}/materials/requests/${id}/deliver`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al marcar como entregada');
        }

        showSuccess('Solicitud marcada como entregada');
        loadRequests();
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Error al marcar como entregada');
    }
}

function viewRequestDetails(id) {
    const request = allRequests.find(r => r.id === id);
    if (!request) return;

    const statusNames = {
        'pending': 'Pendiente',
        'approved': 'Aprobada',
        'rejected': 'Rechazada',
        'delivered': 'Entregada'
    };

    const items = (request.items || []).map(item =>
        `- ${item.material_name || item.name_es}: ${item.quantity_requested || item.quantity} ${item.unit || 'unidades'}`
    ).join('\n');

    alert(`Detalles de la Solicitud #${request.id}

Solicitante: ${request.requester_name || 'Usuario'}
Estado: ${statusNames[request.status]}
Fecha de solicitud: ${formatDate(request.requested_at)}
${request.approved_by ? `Aprobada por: ${request.approver_name}\nFecha de aprobación: ${formatDate(request.approved_at)}` : ''}
${request.delivered_at ? `Fecha de entrega: ${formatDate(request.delivered_at)}` : ''}

Materiales:
${items}

${request.notes ? `Notas: ${request.notes}` : ''}

Nota: La vista completa de detalles estará disponible próximamente.`);
}

// ================================================
// FILTROS
// ================================================

document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        // Remover active de todos
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));

        // Activar el clickeado
        this.classList.add('active');

        // Actualizar filtro
        currentFilter = this.dataset.status;

        // Mostrar solicitudes filtradas
        displayRequests();
    });
});

// ================================================
// UTILIDADES
// ================================================

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

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

// ================================================
// INICIALIZACIÓN
// ================================================

document.addEventListener('DOMContentLoaded', () => {
    // Verificar que el usuario sea admin o jefe
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!['admin', 'jefe', 'gerente'].includes(user.role)) {
        alert('No tienes permisos para ver esta página');
        window.location.href = '/';
        return;
    }

    loadRequests();
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
