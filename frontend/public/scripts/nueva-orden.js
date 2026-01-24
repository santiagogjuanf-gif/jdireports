// ================================================
// NUEVA ORDEN - FUNCIONALIDAD
// ================================================

const API_BASE_URL = 'http://localhost:3000/api';
let selectedAreas = [];

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
    const orderData = {
        order_type: 'regular',
        client_name: document.getElementById('client_name').value,
        client_phone: document.getElementById('client_phone').value || '',
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        scheduled_date: scheduledDateTime,
        notes: document.getElementById('notes').value || null
    };

    try {
        // Mostrar loading
        document.getElementById('loadingOverlay').classList.remove('hidden');

        // 1. Crear la orden
        const orderResponse = await fetch(`${API_BASE_URL}/orders/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(orderData)
        });

        const orderResult = await orderResponse.json();

        if (!orderResponse.ok) {
            throw new Error(orderResult.message || 'Error al crear la orden');
        }

        const orderId = orderResult.order.id;

        // 2. Asignar áreas a la orden
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
            console.warn('Error asignando áreas:', areasResult);
            showSuccess(`Orden creada (${orderResult.order.order_number}) pero hubo un problema asignando áreas`);
        } else {
            showSuccess(`Orden ${orderResult.order.order_number} creada exitosamente`);
        }

        // Esperar un momento y redirigir
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('loadingOverlay').classList.add('hidden');
        showError(error.message || 'Error al crear la orden');
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

document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // Cargar áreas
    cargarAreas();
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
