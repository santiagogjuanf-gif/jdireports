// ================================================
// CALENDARIO - FUNCIONALIDAD
// ================================================

const API_BASE_URL = 'http://localhost:3000/api';
let allOrders = [];

// ================================================
// CARGAR ÓRDENES
// ================================================

async function cargarOrdenes(params = {}) {
    try {
        const queryParams = new URLSearchParams();
        if (params.status) queryParams.append('status', params.status);
        if (params.start_date) queryParams.append('start_date', params.start_date);
        if (params.end_date) queryParams.append('end_date', params.end_date);
        queryParams.append('limit', '100'); // Cargar más órdenes

        const response = await fetch(`${API_BASE_URL}/orders?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar órdenes');
        }

        const data = await response.json();
        allOrders = data.orders || [];
        mostrarOrdenes(allOrders);

    } catch (error) {
        console.error('Error cargando órdenes:', error);
        const container = document.getElementById('ordersContainer');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar las órdenes</p>
            </div>
        `;
    }
}

// ================================================
// MOSTRAR ÓRDENES AGRUPADAS POR FECHA
// ================================================

function mostrarOrdenes(orders) {
    const container = document.getElementById('ordersContainer');

    if (orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <p>No hay órdenes programadas para los filtros seleccionados</p>
            </div>
        `;
        return;
    }

    // Agrupar por fecha
    const ordersByDate = {};
    orders.forEach(order => {
        const date = order.scheduled_date.split(' ')[0]; // YYYY-MM-DD
        if (!ordersByDate[date]) {
            ordersByDate[date] = [];
        }
        ordersByDate[date].push(order);
    });

    // Ordenar fechas
    const sortedDates = Object.keys(ordersByDate).sort((a, b) => new Date(a) - new Date(b));

    // Crear HTML
    const timeline = document.createElement('div');
    timeline.className = 'orders-timeline';

    sortedDates.forEach(date => {
        const dateGroup = createDateGroup(date, ordersByDate[date]);
        timeline.appendChild(dateGroup);
    });

    container.innerHTML = '';
    container.appendChild(timeline);
}

function createDateGroup(date, orders) {
    const div = document.createElement('div');
    div.className = 'date-group';

    // Formatear fecha
    const dateObj = new Date(date + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    div.innerHTML = `
        <div class="date-header">
            <span>${formattedDate}</span>
            <span class="date-count">${orders.length} orden(es)</span>
        </div>
        <div class="orders-list" id="orders-${date}"></div>
    `;

    const ordersList = div.querySelector('.orders-list');
    orders.forEach(order => {
        const orderCard = createOrderCard(order);
        ordersList.appendChild(orderCard);
    });

    return div;
}

function createOrderCard(order) {
    const div = document.createElement('div');
    div.className = `order-card ${order.status}`;

    // Usar traducciones para los estados
    const statusText = t(order.status);

    const time = order.scheduled_date.split(' ')[1] || '';
    const timeFormatted = time ? time.substring(0, 5) : '';

    div.innerHTML = `
        <div class="order-header">
            <div class="order-number">
                <i class="fas fa-hashtag" style="font-size: 0.9rem; opacity: 0.6;"></i>
                ID: ${order.id} - #${order.order_number}
            </div>
            <div class="order-status status-${order.status}">${statusText}</div>
        </div>
        <div class="order-info">
            <div class="info-item">
                <i class="fas fa-clock"></i>
                <span>${timeFormatted || 'Sin hora'}</span>
            </div>
            <div class="info-item">
                <i class="fas fa-user"></i>
                <span>${order.client_name}</span>
            </div>
            <div class="info-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>${order.address}</span>
            </div>
            ${order.responsible_worker_name ? `
                <div class="info-item">
                    <i class="fas fa-user-check"></i>
                    <span>${order.responsible_worker_name}</span>
                </div>
            ` : ''}
            ${order.workers_count > 0 ? `
                <div class="info-item">
                    <i class="fas fa-users"></i>
                    <span>${order.workers_count} trabajador(es)</span>
                </div>
            ` : ''}
        </div>
        <div class="order-actions">
            <button class="btn-action btn-view" onclick="viewOrder(${order.id}); event.stopPropagation();">
                <i class="fas fa-eye"></i>
                ${t('viewBtn')}
            </button>
            <button class="btn-action btn-edit" onclick="editOrder(${order.id}); event.stopPropagation();">
                <i class="fas fa-edit"></i>
                ${t('editBtn')}
            </button>
            <button class="btn-action btn-delete" onclick="deleteOrder(${order.id}, '${order.order_number}'); event.stopPropagation();">
                <i class="fas fa-trash"></i>
                ${t('deleteBtn')}
            </button>
        </div>
    `;

    return div;
}

// ================================================
// FILTROS
// ================================================

document.getElementById('filterStatus').addEventListener('change', aplicarFiltros);
document.getElementById('filterStartDate').addEventListener('change', aplicarFiltros);
document.getElementById('filterEndDate').addEventListener('change', aplicarFiltros);

function aplicarFiltros() {
    const params = {};

    const status = document.getElementById('filterStatus').value;
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;

    if (status) params.status = status;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    cargarOrdenes(params);
}

// ================================================
// CRUD OPERATIONS
// ================================================

// Ver detalles del reporte
async function viewOrder(orderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar detalles de la orden');
        }

        const data = await response.json();
        const order = data.order;

        // Usar traducciones para el estado
        const statusText = t(order.status);

        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div class="detail-group">
                <div class="detail-label">
                    <i class="fas fa-hashtag"></i>
                    ID del Reporte
                </div>
                <div class="detail-value">${order.id}</div>
            </div>

            <div class="detail-group">
                <div class="detail-label">
                    <i class="fas fa-file-alt"></i>
                    Número de Orden
                </div>
                <div class="detail-value">#${order.order_number}</div>
            </div>

            <div class="detail-group">
                <div class="detail-label">
                    <i class="fas fa-user"></i>
                    Cliente
                </div>
                <div class="detail-value">${order.client_name}</div>
            </div>

            <div class="detail-group">
                <div class="detail-label">
                    <i class="fas fa-map-marker-alt"></i>
                    Dirección
                </div>
                <div class="detail-value">${order.address}</div>
            </div>

            <div class="detail-group">
                <div class="detail-label">
                    <i class="fas fa-calendar-alt"></i>
                    Fecha Programada
                </div>
                <div class="detail-value">${new Date(order.scheduled_date).toLocaleString('es-ES')}</div>
            </div>

            <div class="detail-group">
                <div class="detail-label">
                    <i class="fas fa-clock"></i>
                    Hora
                </div>
                <div class="detail-value">${order.scheduled_date.split(' ')[1] ? order.scheduled_date.split(' ')[1].substring(0, 5) : 'Sin hora'}</div>
            </div>

            <div class="detail-group">
                <div class="detail-label">
                    <i class="fas fa-info-circle"></i>
                    Estado
                </div>
                <div class="detail-value">
                    <span class="order-status status-${order.status}">${statusText}</span>
                </div>
            </div>

            ${order.responsible_worker_name ? `
                <div class="detail-group">
                    <div class="detail-label">
                        <i class="fas fa-user-check"></i>
                        Responsable
                    </div>
                    <div class="detail-value">${order.responsible_worker_name}</div>
                </div>
            ` : ''}

            ${order.workers_count > 0 ? `
                <div class="detail-group">
                    <div class="detail-label">
                        <i class="fas fa-users"></i>
                        Trabajadores Asignados
                    </div>
                    <div class="detail-value">${order.workers_count} trabajador(es)</div>
                </div>
            ` : ''}

            ${order.notes ? `
                <div class="detail-group">
                    <div class="detail-label">
                        <i class="fas fa-sticky-note"></i>
                        Notas
                    </div>
                    <div class="detail-value">${order.notes}</div>
                </div>
            ` : ''}

            ${order.total_price ? `
                <div class="detail-group">
                    <div class="detail-label">
                        <i class="fas fa-dollar-sign"></i>
                        Precio Total
                    </div>
                    <div class="detail-value">$${parseFloat(order.total_price).toFixed(2)}</div>
                </div>
            ` : ''}

            <div class="detail-group">
                <div class="detail-label">
                    <i class="fas fa-calendar-plus"></i>
                    Creada el
                </div>
                <div class="detail-value">${new Date(order.created_at).toLocaleString('es-ES')}</div>
            </div>
        `;

        // Mostrar modal
        document.getElementById('detailsModal').classList.add('show');

    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los detalles de la orden');
    }
}

// Modificar reporte
function editOrder(orderId) {
    // Redirigir a página de edición (si existe) o mostrar formulario
    const editUrl = `/editar-orden?id=${orderId}`;
    window.location.href = editUrl;
}

// Eliminar reporte
async function deleteOrder(orderId, orderNumber) {
    if (!confirm(`¿Estás seguro de que deseas eliminar la orden #${orderNumber}?\n\nEsta acción no se puede deshacer.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al eliminar la orden');
        }

        // Mostrar notificación de éxito
        showNotification('Orden eliminada exitosamente', 'success');

        // Recargar órdenes
        aplicarFiltros();

    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message || 'Error al eliminar la orden', 'error');
    }
}

// Cerrar modal
function closeModal() {
    document.getElementById('detailsModal').classList.remove('show');
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', (e) => {
    const modal = document.getElementById('detailsModal');
    if (e.target === modal) {
        closeModal();
    }
});

// Mostrar notificaciones
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

// Agregar animaciones si no existen
if (!document.querySelector('#notificationAnimations')) {
    const style = document.createElement('style');
    style.id = 'notificationAnimations';
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
}

// ================================================
// INICIALIZACIÓN
// ================================================

document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Aplicar traducciones
    console.log('📄 [CALENDARIO] Aplicando traducciones...');
    if (typeof applyTranslations === 'function') {
        applyTranslations();
    }

    // Establecer fecha de inicio (hoy)
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('filterStartDate').value = today;

    // Establecer fecha de fin (30 días después)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    document.getElementById('filterEndDate').value = futureDate.toISOString().split('T')[0];

    // Cargar órdenes
    aplicarFiltros();
});
