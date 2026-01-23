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

    const statusText = {
        'pending': 'Pendiente',
        'assigned': 'Asignada',
        'in_progress': 'En Progreso',
        'completed': 'Completada',
        'cancelled': 'Cancelada'
    };

    const time = order.scheduled_date.split(' ')[1] || '';
    const timeFormatted = time ? time.substring(0, 5) : '';

    div.innerHTML = `
        <div class="order-header">
            <div class="order-number">#${order.order_number}</div>
            <div class="order-status status-${order.status}">${statusText[order.status] || order.status}</div>
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
    `;

    div.addEventListener('click', () => {
        // Opcional: abrir detalle de orden
        console.log('Ver orden:', order.id);
    });

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
// INICIALIZACIÓN
// ================================================

document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
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
