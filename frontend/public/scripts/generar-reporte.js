// ================================================
// GENERAR REPORTE - JDI CLEANING SERVICES
// ================================================

const API_BASE_URL = 'http://localhost:3000/api';

let selectedReportType = null;
let reportData = null;

// ================================================
// ELEMENTOS DEL DOM
// ================================================

const reportTypeCards = document.querySelectorAll('.report-type-card');
const filtersSection = document.getElementById('filtersSection');
const reportPreviewSection = document.getElementById('reportPreviewSection');
const statisticsSection = document.getElementById('statisticsSection');
const statusFilterGroup = document.getElementById('statusFilterGroup');
const generateReportBtn = document.getElementById('generateReportBtn');
const exportCSVBtn = document.getElementById('exportCSVBtn');
const printReportBtn = document.getElementById('printReportBtn');
const reportContent = document.getElementById('reportContent');
const loadingOverlay = document.getElementById('loadingOverlay');

// ================================================
// VERIFICAR AUTENTICACIÓN
// ================================================

function verificarAutenticacion() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Debes iniciar sesión para acceder a esta página');
        window.location.href = '/login';
        return false;
    }
    return true;
}

// ================================================
// SELECCIONAR TIPO DE REPORTE
// ================================================

reportTypeCards.forEach(card => {
    card.addEventListener('click', function() {
        // Remover selección anterior
        reportTypeCards.forEach(c => c.classList.remove('selected'));

        // Agregar selección actual
        this.classList.add('selected');

        // Guardar tipo seleccionado
        selectedReportType = this.dataset.type;

        // Mostrar filtros
        filtersSection.style.display = 'block';

        // Mostrar/ocultar filtro de estado según el tipo
        if (selectedReportType === 'orders') {
            statusFilterGroup.style.display = 'block';
        } else {
            statusFilterGroup.style.display = 'none';
        }

        // Ocultar secciones anteriores
        reportPreviewSection.style.display = 'none';
        statisticsSection.style.display = 'none';

        console.log('📊 Tipo de reporte seleccionado:', selectedReportType);
    });
});

// ================================================
// GENERAR REPORTE
// ================================================

generateReportBtn.addEventListener('click', async function() {
    if (!selectedReportType) {
        alert('Por favor selecciona un tipo de reporte');
        return;
    }

    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const status = document.getElementById('statusFilter').value;

    console.log('🔄 Generando reporte:', { tipo: selectedReportType, startDate, endDate, status });

    loadingOverlay.classList.remove('hidden');

    try {
        switch (selectedReportType) {
            case 'orders':
                await generarReporteOrdenes(startDate, endDate, status);
                break;
            case 'workers':
                await generarReporteTrabajadores(startDate, endDate);
                break;
            case 'materials':
                await generarReporteMateriales();
                break;
            case 'summary':
                await generarReporteResumen(startDate, endDate);
                break;
        }

        reportPreviewSection.style.display = 'block';
        statisticsSection.style.display = 'block';

        // Scroll suave hacia el reporte
        reportPreviewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (error) {
        console.error('❌ Error al generar reporte:', error);
        alert('Error al generar el reporte. Por favor intenta nuevamente.');
    } finally {
        loadingOverlay.classList.add('hidden');
    }
});

// ================================================
// REPORTE DE ÓRDENES
// ================================================

async function generarReporteOrdenes(startDate, endDate, status) {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    if (status) queryParams.append('status', status);

    const response = await fetch(`${API_BASE_URL}/orders?${queryParams}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });

    if (!response.ok) {
        throw new Error('Error al obtener órdenes');
    }

    const data = await response.json();
    reportData = data.orders || [];

    console.log('✅ Órdenes obtenidas:', reportData.length);

    mostrarReporteOrdenes(reportData, startDate, endDate, status);
    calcularEstadisticasOrdenes(reportData);
}

function mostrarReporteOrdenes(orders, startDate, endDate, status) {
    const statusText = status ? translateStatus(status) : 'Todos';
    const dateRange = startDate && endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : 'Todo el período';

    let html = `
        <div class="report-header">
            <h1>Reporte de Órdenes</h1>
            <p class="report-subtitle">JDI Cleaning Services</p>
        </div>

        <div class="report-meta">
            <div class="report-meta-item">
                <label>Período:</label>
                <span>${dateRange}</span>
            </div>
            <div class="report-meta-item">
                <label>Estado:</label>
                <span>${statusText}</span>
            </div>
            <div class="report-meta-item">
                <label>Total de Órdenes:</label>
                <span>${orders.length}</span>
            </div>
            <div class="report-meta-item">
                <label>Fecha de Generación:</label>
                <span>${formatDateTime(new Date())}</span>
            </div>
        </div>
    `;

    if (orders.length === 0) {
        html += `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>No hay órdenes</h3>
                <p>No se encontraron órdenes para los filtros seleccionados</p>
            </div>
        `;
    } else {
        html += `
            <div class="report-table">
                <table>
                    <thead>
                        <tr>
                            <th>Orden #</th>
                            <th>Cliente</th>
                            <th>Dirección</th>
                            <th>Ciudad</th>
                            <th>Fecha Programada</th>
                            <th>Estado</th>
                            <th>Tipo</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        orders.forEach(order => {
            html += `
                <tr>
                    <td><strong>${order.order_number}</strong></td>
                    <td>${order.client_name}</td>
                    <td>${order.address}</td>
                    <td>${order.city || 'N/A'}</td>
                    <td>${formatDateTime(order.scheduled_date)}</td>
                    <td><span class="status-badge ${order.status}">${translateStatus(order.status)}</span></td>
                    <td>${translateOrderType(order.order_type)}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
    }

    reportContent.innerHTML = html;
}

function calcularEstadisticasOrdenes(orders) {
    const total = orders.length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;

    document.getElementById('statTotalOrders').textContent = total;
    document.getElementById('statCompletedOrders').textContent = completed;
    document.getElementById('statPendingOrders').textContent = pending;
    document.getElementById('statCompletionRate').textContent = `${completionRate}%`;
}

// ================================================
// REPORTE DE TRABAJADORES
// ================================================

async function generarReporteTrabajadores(startDate, endDate) {
    const response = await fetch(`${API_BASE_URL}/users?role=trabajador`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });

    if (!response.ok) {
        throw new Error('Error al obtener trabajadores');
    }

    const data = await response.json();
    const workers = data.users || data.data || [];

    // Obtener órdenes para contar asignaciones
    const ordersResponse = await fetch(`${API_BASE_URL}/orders`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });

    const ordersData = await ordersResponse.json();
    const orders = ordersData.orders || [];

    reportData = workers;

    console.log('✅ Trabajadores obtenidos:', workers.length);

    mostrarReporteTrabajadores(workers, orders, startDate, endDate);
    calcularEstadisticasTrabajadores(workers, orders);
}

function mostrarReporteTrabajadores(workers, orders, startDate, endDate) {
    const dateRange = startDate && endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : 'Todo el período';

    let html = `
        <div class="report-header">
            <h1>Reporte de Trabajadores</h1>
            <p class="report-subtitle">JDI Cleaning Services</p>
        </div>

        <div class="report-meta">
            <div class="report-meta-item">
                <label>Período:</label>
                <span>${dateRange}</span>
            </div>
            <div class="report-meta-item">
                <label>Total de Trabajadores:</label>
                <span>${workers.length}</span>
            </div>
            <div class="report-meta-item">
                <label>Fecha de Generación:</label>
                <span>${formatDateTime(new Date())}</span>
            </div>
        </div>
    `;

    if (workers.length === 0) {
        html += `
            <div class="empty-state">
                <i class="fas fa-users-slash"></i>
                <h3>No hay trabajadores</h3>
                <p>No se encontraron trabajadores registrados</p>
            </div>
        `;
    } else {
        html += `
            <div class="report-table">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Teléfono</th>
                            <th>Estado</th>
                            <th>Fecha de Registro</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        workers.forEach(worker => {
            html += `
                <tr>
                    <td><strong>${worker.id}</strong></td>
                    <td>${worker.name}</td>
                    <td>${worker.email}</td>
                    <td>${worker.phone || 'N/A'}</td>
                    <td><span class="status-badge ${worker.status || 'active'}">${worker.status === 'active' ? 'Activo' : 'Inactivo'}</span></td>
                    <td>${formatDateTime(worker.created_at)}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
    }

    reportContent.innerHTML = html;
}

function calcularEstadisticasTrabajadores(workers, orders) {
    const total = workers.length;
    const active = workers.filter(w => w.status === 'active' || !w.status).length;

    document.getElementById('statTotalOrders').textContent = total;
    document.getElementById('statCompletedOrders').textContent = active;
    document.getElementById('statPendingOrders').textContent = total - active;
    document.getElementById('statCompletionRate').textContent = total > 0 ? `${((active / total) * 100).toFixed(1)}%` : '0%';

    // Actualizar etiquetas
    document.querySelector('#statTotalOrders').parentElement.querySelector('.stat-label').textContent = 'Total Trabajadores';
    document.querySelector('#statCompletedOrders').parentElement.querySelector('.stat-label').textContent = 'Trabajadores Activos';
    document.querySelector('#statPendingOrders').parentElement.querySelector('.stat-label').textContent = 'Trabajadores Inactivos';
    document.querySelector('#statCompletionRate').parentElement.querySelector('.stat-label').textContent = 'Tasa de Actividad';
}

// ================================================
// REPORTE DE MATERIALES
// ================================================

async function generarReporteMateriales() {
    const response = await fetch(`${API_BASE_URL}/materials`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });

    if (!response.ok) {
        throw new Error('Error al obtener materiales');
    }

    const data = await response.json();
    const materials = data.materials || data.data || [];

    reportData = materials;

    console.log('✅ Materiales obtenidos:', materials.length);

    mostrarReporteMateriales(materials);
    calcularEstadisticasMateriales(materials);
}

function mostrarReporteMateriales(materials) {
    let html = `
        <div class="report-header">
            <h1>Reporte de Materiales</h1>
            <p class="report-subtitle">JDI Cleaning Services</p>
        </div>

        <div class="report-meta">
            <div class="report-meta-item">
                <label>Total de Materiales:</label>
                <span>${materials.length}</span>
            </div>
            <div class="report-meta-item">
                <label>Fecha de Generación:</label>
                <span>${formatDateTime(new Date())}</span>
            </div>
        </div>
    `;

    if (materials.length === 0) {
        html += `
            <div class="empty-state">
                <i class="fas fa-boxes"></i>
                <h3>No hay materiales</h3>
                <p>No se encontraron materiales en el inventario</p>
            </div>
        `;
    } else {
        html += `
            <div class="report-table">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Descripción</th>
                            <th>Unidad</th>
                            <th>Stock Actual</th>
                            <th>Stock Mínimo</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        materials.forEach(material => {
            const stockStatus = material.current_stock <= material.minimum_stock ? 'cancelled' : 'completed';
            const stockText = material.current_stock <= material.minimum_stock ? 'Stock Bajo' : 'Stock OK';

            html += `
                <tr>
                    <td><strong>${material.id}</strong></td>
                    <td>${material.name}</td>
                    <td>${material.description || 'N/A'}</td>
                    <td>${translateUnit(material.unit)}</td>
                    <td>${material.current_stock}</td>
                    <td>${material.minimum_stock}</td>
                    <td><span class="status-badge ${stockStatus}">${stockText}</span></td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
    }

    reportContent.innerHTML = html;
}

function calcularEstadisticasMateriales(materials) {
    const total = materials.length;
    const lowStock = materials.filter(m => m.current_stock <= m.minimum_stock).length;
    const okStock = total - lowStock;
    const stockRate = total > 0 ? ((okStock / total) * 100).toFixed(1) : 0;

    document.getElementById('statTotalOrders').textContent = total;
    document.getElementById('statCompletedOrders').textContent = okStock;
    document.getElementById('statPendingOrders').textContent = lowStock;
    document.getElementById('statCompletionRate').textContent = `${stockRate}%`;

    // Actualizar etiquetas
    document.querySelector('#statTotalOrders').parentElement.querySelector('.stat-label').textContent = 'Total Materiales';
    document.querySelector('#statCompletedOrders').parentElement.querySelector('.stat-label').textContent = 'Con Stock Suficiente';
    document.querySelector('#statPendingOrders').parentElement.querySelector('.stat-label').textContent = 'Stock Bajo';
    document.querySelector('#statCompletionRate').parentElement.querySelector('.stat-label').textContent = 'Tasa de Disponibilidad';
}

// ================================================
// REPORTE RESUMEN
// ================================================

async function generarReporteResumen(startDate, endDate) {
    // Obtener todas las órdenes
    const ordersResponse = await fetch(`${API_BASE_URL}/orders`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    const ordersData = await ordersResponse.json();
    const orders = ordersData.orders || [];

    // Obtener trabajadores
    const workersResponse = await fetch(`${API_BASE_URL}/users?role=trabajador`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    const workersData = await workersResponse.json();
    const workers = workersData.users || workersData.data || [];

    // Obtener materiales
    const materialsResponse = await fetch(`${API_BASE_URL}/materials`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    const materialsData = await materialsResponse.json();
    const materials = materialsData.materials || materialsData.data || [];

    console.log('✅ Resumen obtenido - Órdenes:', orders.length, 'Trabajadores:', workers.length, 'Materiales:', materials.length);

    mostrarReporteResumen(orders, workers, materials, startDate, endDate);
    calcularEstadisticasResumen(orders, workers, materials);
}

function mostrarReporteResumen(orders, workers, materials, startDate, endDate) {
    const dateRange = startDate && endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : 'Todo el período';

    const ordersCompleted = orders.filter(o => o.status === 'completed').length;
    const ordersPending = orders.filter(o => o.status === 'pending').length;
    const ordersInProgress = orders.filter(o => o.status === 'in_progress').length;
    const materialsLowStock = materials.filter(m => m.current_stock <= m.minimum_stock).length;

    let html = `
        <div class="report-header">
            <h1>Reporte Resumen</h1>
            <p class="report-subtitle">JDI Cleaning Services - Dashboard Ejecutivo</p>
        </div>

        <div class="report-meta">
            <div class="report-meta-item">
                <label>Período:</label>
                <span>${dateRange}</span>
            </div>
            <div class="report-meta-item">
                <label>Fecha de Generación:</label>
                <span>${formatDateTime(new Date())}</span>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
            <div style="background: white; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #0099CC;">
                <h3 style="color: #0099CC; margin-bottom: 1rem;"><i class="fas fa-clipboard-list"></i> Órdenes</h3>
                <div style="display: grid; gap: 0.5rem;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Total:</span>
                        <strong>${orders.length}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Completadas:</span>
                        <strong style="color: #00A651;">${ordersCompleted}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>En Progreso:</span>
                        <strong style="color: #0099CC;">${ordersInProgress}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Pendientes:</span>
                        <strong style="color: #FFA500;">${ordersPending}</strong>
                    </div>
                </div>
            </div>

            <div style="background: white; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #00A651;">
                <h3 style="color: #00A651; margin-bottom: 1rem;"><i class="fas fa-users"></i> Trabajadores</h3>
                <div style="display: grid; gap: 0.5rem;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Total:</span>
                        <strong>${workers.length}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Activos:</span>
                        <strong style="color: #00A651;">${workers.filter(w => w.status === 'active' || !w.status).length}</strong>
                    </div>
                </div>
            </div>

            <div style="background: white; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #9B59B6;">
                <h3 style="color: #9B59B6; margin-bottom: 1rem;"><i class="fas fa-boxes"></i> Materiales</h3>
                <div style="display: grid; gap: 0.5rem;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Total:</span>
                        <strong>${materials.length}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Stock Bajo:</span>
                        <strong style="color: #DC3545;">${materialsLowStock}</strong>
                    </div>
                </div>
            </div>
        </div>
    `;

    reportContent.innerHTML = html;
}

function calcularEstadisticasResumen(orders, workers, materials) {
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const completionRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0;

    document.getElementById('statTotalOrders').textContent = totalOrders;
    document.getElementById('statCompletedOrders').textContent = completedOrders;
    document.getElementById('statPendingOrders').textContent = pendingOrders;
    document.getElementById('statCompletionRate').textContent = `${completionRate}%`;

    // Restaurar etiquetas originales
    document.querySelector('#statTotalOrders').parentElement.querySelector('.stat-label').textContent = 'Total de Órdenes';
    document.querySelector('#statCompletedOrders').parentElement.querySelector('.stat-label').textContent = 'Órdenes Completadas';
    document.querySelector('#statPendingOrders').parentElement.querySelector('.stat-label').textContent = 'Órdenes Pendientes';
    document.querySelector('#statCompletionRate').parentElement.querySelector('.stat-label').textContent = 'Tasa de Completado';
}

// ================================================
// EXPORTAR CSV
// ================================================

exportCSVBtn.addEventListener('click', function() {
    if (!reportData) {
        alert('Primero genera un reporte');
        return;
    }

    console.log('📄 Exportando a CSV...');

    let csv = '';
    let filename = `reporte_${selectedReportType}_${new Date().toISOString().split('T')[0]}.csv`;

    switch (selectedReportType) {
        case 'orders':
            csv = convertirOrdenesACSV(reportData);
            break;
        case 'workers':
            csv = convertirTrabajadoresACSV(reportData);
            break;
        case 'materials':
            csv = convertirMaterialesACSV(reportData);
            break;
        case 'summary':
            alert('El reporte resumen no se puede exportar a CSV. Por favor selecciona otro tipo de reporte.');
            return;
    }

    descargarCSV(csv, filename);
});

function convertirOrdenesACSV(orders) {
    let csv = 'Orden #,Cliente,Dirección,Ciudad,Fecha Programada,Estado,Tipo\n';

    orders.forEach(order => {
        csv += `"${order.order_number}","${order.client_name}","${order.address}","${order.city || 'N/A'}","${formatDateTime(order.scheduled_date)}","${translateStatus(order.status)}","${translateOrderType(order.order_type)}"\n`;
    });

    return csv;
}

function convertirTrabajadoresACSV(workers) {
    let csv = 'ID,Nombre,Email,Teléfono,Estado,Fecha de Registro\n';

    workers.forEach(worker => {
        csv += `${worker.id},"${worker.name}","${worker.email}","${worker.phone || 'N/A'}","${worker.status === 'active' ? 'Activo' : 'Inactivo'}","${formatDateTime(worker.created_at)}"\n`;
    });

    return csv;
}

function convertirMaterialesACSV(materials) {
    let csv = 'ID,Nombre,Descripción,Unidad,Stock Actual,Stock Mínimo,Estado\n';

    materials.forEach(material => {
        const stockText = material.current_stock <= material.minimum_stock ? 'Stock Bajo' : 'Stock OK';
        csv += `${material.id},"${material.name}","${material.description || 'N/A'}","${translateUnit(material.unit)}",${material.current_stock},${material.minimum_stock},"${stockText}"\n`;
    });

    return csv;
}

function descargarCSV(csv, filename) {
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('✅ CSV descargado:', filename);
}

// ================================================
// IMPRIMIR REPORTE
// ================================================

printReportBtn.addEventListener('click', function() {
    console.log('🖨️ Imprimiendo reporte...');
    window.print();
});

// ================================================
// FUNCIONES AUXILIARES
// ================================================

function translateStatus(status) {
    const translations = {
        'pending': 'Pendiente',
        'assigned': 'Asignado',
        'in_progress': 'En Progreso',
        'completed': 'Completado',
        'cancelled': 'Cancelado',
        'active': 'Activo',
        'inactive': 'Inactivo'
    };
    return translations[status] || status;
}

function translateOrderType(type) {
    const translations = {
        'regular': 'Regular',
        'post_construction': 'Post-Construcción'
    };
    return translations[type] || type;
}

function translateUnit(unit) {
    const translations = {
        'unit': 'Unidad',
        'liter': 'Litro',
        'kg': 'Kilogramo',
        'box': 'Caja',
        'pack': 'Paquete'
    };
    return translations[unit] || unit;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('es-ES', options);
}

// ================================================
// INICIALIZAR
// ================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 [GENERAR REPORTE] Página cargada');

    if (!verificarAutenticacion()) {
        return;
    }

    // Establecer fecha por defecto (último mes)
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    document.getElementById('startDate').value = lastMonth.toISOString().split('T')[0];
    document.getElementById('endDate').value = today.toISOString().split('T')[0];

    console.log('✅ Sistema de reportes inicializado');
});
