// ================================================
// EDITAR ORDEN - FUNCIONALIDAD
// ================================================

const API_BASE_URL = 'http://localhost:3000/api';
let selectedAreas = [];
let orderId = null;
let orderData = null;

// ================================================
// OBTENER ID DE LA ORDEN DESDE NAVEGACIÓN SEGURA
// ================================================

function getOrderIdFromURL() {
    // Intentar primero obtener de navegación segura
    const secureData = window.SecureNav ? window.SecureNav.getData('order') : null;

    if (secureData && secureData.id) {
        console.log('🔒 [EDITAR-ORDEN] ID obtenido de forma segura');
        // Limpiar la URL después de obtener los datos
        if (window.SecureNav) {
            window.SecureNav.cleanURL();
        }
        return secureData.id;
    }

    // Fallback: leer de URL (para compatibilidad con código antiguo)
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (id) {
        console.warn('⚠️ [EDITAR-ORDEN] ID obtenido de URL (método inseguro)');
    }

    return id;
}

// ================================================
// CARGAR DATOS DE LA ORDEN EXISTENTE
// ================================================

async function cargarOrdenExistente() {
    orderId = getOrderIdFromURL();

    if (!orderId) {
        showError('No se especificó el ID de la orden');
        setTimeout(() => window.location.href = '/calendario', 2000);
        return;
    }

    try {
        console.log('📋 [EDITAR-ORDEN] Cargando orden ID:', orderId);

        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar la orden');
        }

        const data = await response.json();
        orderData = data.order;

        console.log('📦 [EDITAR-ORDEN] Datos de orden:', orderData);

        // Rellenar formulario con datos existentes
        rellenarFormulario(orderData);

    } catch (error) {
        console.error('❌ [EDITAR-ORDEN] Error:', error);
        showError('No se pudo cargar la orden');
        setTimeout(() => window.location.href = '/calendario', 2000);
    }
}

// ================================================
// RELLENAR FORMULARIO CON DATOS EXISTENTES
// ================================================

function rellenarFormulario(order) {
    console.log('📝 [EDITAR-ORDEN] Rellenando formulario...');

    try {
        // Datos del cliente
        const clientName = document.getElementById('client_name');
        if (clientName) clientName.value = order.client_name || '';

        const clientPhone = document.getElementById('client_phone');
        if (clientPhone) clientPhone.value = order.client_phone || '';

        const clientEmail = document.getElementById('client_email');
        if (clientEmail) clientEmail.value = order.client_email || '';

        // Dirección y ciudad
        const address = document.getElementById('address');
        if (address) address.value = order.address || '';

        const city = document.getElementById('city');
        if (city) city.value = order.city || '';

        // Fecha y hora
        if (order.scheduled_date) {
            const dateTime = order.scheduled_date.split(' ');
            const schedDate = document.getElementById('scheduled_date');
            if (schedDate) schedDate.value = dateTime[0];

            if (dateTime[1]) {
                const schedTime = document.getElementById('scheduled_time');
                if (schedTime) schedTime.value = dateTime[1].substring(0, 5);
            }
        }

        // Trabajador responsable
        if (order.responsible_worker_id) {
            const responsibleWorker = document.getElementById('responsible_worker_id');
            if (responsibleWorker) {
                responsibleWorker.value = order.responsible_worker_id;
            }
        }

        // Precio (si existe el campo)
        if (order.total_price) {
            const totalPrice = document.getElementById('total_price');
            if (totalPrice) totalPrice.value = order.total_price;
        }

        // Notas
        if (order.notes) {
            const notes = document.getElementById('notes');
            if (notes) notes.value = order.notes;
        }

        // Marcar áreas seleccionadas (se hace después de cargar las áreas)
        if (order.areas && Array.isArray(order.areas)) {
            selectedAreas = order.areas.map(area => area.id);
            console.log('📍 [EDITAR-ORDEN] Áreas seleccionadas:', selectedAreas);
        }

        console.log('✅ [EDITAR-ORDEN] Formulario rellenado exitosamente');
    } catch (error) {
        console.error('❌ [EDITAR-ORDEN] Error rellenando formulario:', error);
        showError('Error al cargar los datos de la orden');
    }
}

// ================================================
// CARGAR TRABAJADORES DISPONIBLES
// ================================================

async function cargarTrabajadores() {
    try {
        console.log('👥 [EDITAR-ORDEN] Cargando trabajadores...');
        const response = await fetch(`${API_BASE_URL}/users?role=trabajador&status=active`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        console.log('📡 [EDITAR-ORDEN] Respuesta trabajadores status:', response.status);

        if (!response.ok) {
            console.warn('⚠️ [EDITAR-ORDEN] No se pudieron cargar los trabajadores');
            return;
        }

        const data = await response.json();
        console.log('📦 [EDITAR-ORDEN] Datos de trabajadores:', data);

        const select = document.getElementById('responsible_worker_id');

        if (!select) {
            console.error('❌ [EDITAR-ORDEN] No se encontró el select responsible_worker_id');
            return;
        }

        // ARREGLADO: Backend devuelve data.data.users, no data.users
        const workers = data.data?.users || data.users || [];
        console.log(`👤 [EDITAR-ORDEN] ${workers.length} trabajadores encontrados`);

        if (workers && workers.length > 0) {
            workers.forEach(worker => {
                const option = document.createElement('option');
                option.value = worker.id;
                option.textContent = `${worker.name} ${worker.email ? '(' + worker.email + ')' : ''}`;
                select.appendChild(option);
                console.log(`  ✓ Agregado: ${worker.name} (ID: ${worker.id})`);
            });
            console.log('✅ [EDITAR-ORDEN] Trabajadores cargados en select');
        } else {
            console.warn('⚠️ [EDITAR-ORDEN] No hay trabajadores activos');
        }

    } catch (error) {
        console.error('❌ [EDITAR-ORDEN] Error cargando trabajadores:', error);
        console.error('❌ [EDITAR-ORDEN] Stack:', error.stack);
    }
}

// ================================================
// CARGAR ÁREAS DE LIMPIEZA
// ================================================

async function cargarAreas() {
    try {
        const response = await fetch(`${API_BASE_URL}/areas`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar áreas');
        }

        const data = await response.json();
        mostrarAreas(data.areas || []);

    } catch (error) {
        console.error('Error cargando áreas:', error);
        showError('No se pudieron cargar las áreas de limpieza');
    }
}

function mostrarAreas(areas) {
    const grid = document.getElementById('areasGrid');
    grid.innerHTML = '';

    areas.forEach(area => {
        const div = document.createElement('div');
        div.className = 'area-checkbox';
        div.innerHTML = `
            <input type="checkbox" id="area-${area.id}" value="${area.id}">
            <label for="area-${area.id}" style="cursor: pointer; margin: 0;">
                ${area.name_es}
            </label>
        `;

        const checkbox = div.querySelector('input');
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                div.classList.add('selected');
                selectedAreas.push(area.id);
            } else {
                div.classList.remove('selected');
                selectedAreas = selectedAreas.filter(id => id !== area.id);
            }
        });

        grid.appendChild(div);
    });
}

// ================================================
// ENVIAR FORMULARIO
// ================================================

document.getElementById('nuevaOrdenForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validar áreas seleccionadas
    if (selectedAreas.length === 0) {
        showError('Debe seleccionar al menos un área de limpieza');
        return;
    }

    // Combinar fecha y hora
    const date = document.getElementById('scheduled_date').value;
    const time = document.getElementById('scheduled_time').value;
    const scheduledDateTime = `${date} ${time}:00`;

    // Obtener datos del formulario
    const responsible_worker_id = document.getElementById('responsible_worker_id').value;

    const orderData = {
        order_type: 'regular',
        client_name: document.getElementById('client_name').value,
        client_phone: document.getElementById('client_phone').value || '',
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        scheduled_date: scheduledDateTime,
        notes: document.getElementById('notes').value || null
    };

    // Agregar trabajador responsable si fue seleccionado
    if (responsible_worker_id) {
        orderData.responsible_worker_id = parseInt(responsible_worker_id);
    }

    try {
        // Mostrar loading
        document.getElementById('loadingOverlay').classList.remove('hidden');

        console.log('📝 [EDITAR-ORDEN] Actualizando orden ID:', orderId);
        console.log('📦 [EDITAR-ORDEN] Datos a enviar:', orderData);

        // 1. Actualizar la orden (PUT en lugar de POST)
        const orderResponse = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(orderData)
        });

        const orderResult = await orderResponse.json();

        if (!orderResponse.ok) {
            throw new Error(orderResult.message || 'Error al actualizar la orden');
        }

        console.log('✅ [EDITAR-ORDEN] Orden actualizada');

        // 2. Actualizar áreas de la orden
        const areasResponse = await fetch(`${API_BASE_URL}/cleaning-areas/orders/${orderId}/areas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ area_ids: selectedAreas })
        });

        // Ocultar loading
        document.getElementById('loadingOverlay').classList.add('hidden');

        if (!areasResponse.ok) {
            const areasResult = await areasResponse.json();
            console.warn('⚠️ [EDITAR-ORDEN] Error asignando áreas:', areasResult);
            showSuccess(`Orden actualizada pero hubo un problema asignando áreas`);
        } else {
            showSuccess(`Orden actualizada exitosamente`);
            console.log('✅ [EDITAR-ORDEN] Áreas actualizadas');
        }

        // Esperar un momento y redirigir al calendario
        setTimeout(() => {
            window.location.href = '/calendario';
        }, 2000);

    } catch (error) {
        console.error('❌ [EDITAR-ORDEN] Error:', error);
        document.getElementById('loadingOverlay').classList.add('hidden');
        showError(error.message || 'Error al actualizar la orden');
    }
});

// ================================================
// FUNCIONES DE UI
// ================================================

function showError(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        font-family: 'Poppins', sans-serif;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `;
    notification.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function showSuccess(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #51cf66 0%, #40c057 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        font-family: 'Poppins', sans-serif;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `;
    notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ================================================
// VALIDACIONES
// ================================================

// Establecer fecha mínima como hoy
const dateInput = document.getElementById('scheduled_date');
const today = new Date().toISOString().split('T')[0];
dateInput.min = today;
dateInput.value = today;

// Establecer hora por defecto
const timeInput = document.getElementById('scheduled_time');
timeInput.value = '09:00';

// ================================================
// INICIALIZACIÓN
// ================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 [EDITAR-ORDEN] Inicializando...');

    // Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Cargar orden existente primero
    await cargarOrdenExistente();

    // Luego cargar áreas y trabajadores
    await cargarAreas();
    await cargarTrabajadores();

    // Marcar áreas que ya estaban seleccionadas
    if (selectedAreas.length > 0) {
        selectedAreas.forEach(areaId => {
            const checkbox = document.getElementById(`area-${areaId}`);
            if (checkbox) {
                checkbox.checked = true;
                checkbox.parentElement.classList.add('selected');
                console.log(`  ✓ Área ${areaId} marcada`);
            }
        });
    }

    console.log('✅ [EDITAR-ORDEN] Inicialización completada');
});

// Agregar animaciones CSS si no existen
if (!document.querySelector('#customAnimations')) {
    const style = document.createElement('style');
    style.id = 'customAnimations';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOutRight {
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
