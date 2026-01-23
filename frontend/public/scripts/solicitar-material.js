// ================================================
// SOLICITAR MATERIAL - FUNCIONALIDAD
// ================================================

const API_BASE_URL = 'http://localhost:3000/api';
let allMaterials = [];
let cart = {}; // { materialId: { material: {...}, quantity: number } }

// ================================================
// CARGAR MATERIALES
// ================================================

async function cargarMateriales() {
    try {
        const response = await fetch(`${API_BASE_URL}/materials`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar materiales');
        }

        const data = await response.json();
        // El endpoint puede devolver materials.materials o materials.data dependiendo de implementación
        allMaterials = data.materials || data.data || data || [];

        mostrarMateriales(allMaterials);

    } catch (error) {
        console.error('Error cargando materiales:', error);
        showError('No se pudieron cargar los materiales');
    }
}

function mostrarMateriales(materials) {
    const grid = document.getElementById('materialsGrid');
    grid.innerHTML = '';

    if (materials.length === 0) {
        grid.innerHTML = '<div class="cart-empty">No se encontraron materiales</div>';
        return;
    }

    materials.forEach(material => {
        const card = createMaterialCard(material);
        grid.appendChild(card);
    });
}

function createMaterialCard(material) {
    const div = document.createElement('div');
    div.className = 'material-card';
    div.dataset.materialId = material.id;

    // Determinar si el stock está bajo
    const stockClass = material.current_stock <= material.min_stock ? 'low' : '';

    // Obtener nombre de unidad en español
    const unitNames = {
        'unit': 'Unidad',
        'liter': 'Litro',
        'kg': 'Kilogramo',
        'box': 'Caja',
        'pack': 'Paquete'
    };
    const unitName = unitNames[material.unit] || material.unit;

    // Verificar si ya está en el carrito
    const inCart = cart[material.id];
    const currentQuantity = inCart ? inCart.quantity : 0;

    div.innerHTML = `
        <div class="material-header">
            <div class="material-name">${material.name}</div>
            <div class="material-unit">${unitName}</div>
        </div>
        ${material.description ? `<div class="material-description">${material.description}</div>` : ''}
        <div class="material-stock">
            <div class="stock-item">
                <span class="stock-label">Stock Actual</span>
                <span class="stock-value ${stockClass}">${material.current_stock || 0}</span>
            </div>
            <div class="stock-item">
                <span class="stock-label">Stock Mínimo</span>
                <span class="stock-value">${material.min_stock || 0}</span>
            </div>
        </div>
        <div class="quantity-selector">
            <button class="quantity-btn" data-action="decrease" ${currentQuantity === 0 ? 'disabled' : ''}>
                <i class="fas fa-minus"></i>
            </button>
            <input type="number"
                   class="quantity-input"
                   value="${currentQuantity}"
                   min="0"
                   max="999"
                   data-material-id="${material.id}">
            <button class="quantity-btn" data-action="increase">
                <i class="fas fa-plus"></i>
            </button>
        </div>
    `;

    // Event listeners para los botones
    const decreaseBtn = div.querySelector('[data-action="decrease"]');
    const increaseBtn = div.querySelector('[data-action="increase"]');
    const quantityInput = div.querySelector('.quantity-input');

    decreaseBtn.addEventListener('click', () => {
        const currentVal = parseInt(quantityInput.value) || 0;
        if (currentVal > 0) {
            quantityInput.value = currentVal - 1;
            updateCart(material, currentVal - 1);
        }
    });

    increaseBtn.addEventListener('click', () => {
        const currentVal = parseInt(quantityInput.value) || 0;
        quantityInput.value = currentVal + 1;
        updateCart(material, currentVal + 1);
    });

    quantityInput.addEventListener('change', (e) => {
        let value = parseInt(e.target.value) || 0;
        if (value < 0) value = 0;
        if (value > 999) value = 999;
        e.target.value = value;
        updateCart(material, value);
    });

    // Actualizar estado de la tarjeta si está en el carrito
    if (inCart) {
        div.classList.add('selected');
    }

    return div;
}

// ================================================
// GESTIÓN DEL CARRITO
// ================================================

function updateCart(material, quantity) {
    if (quantity === 0) {
        // Remover del carrito
        delete cart[material.id];
    } else {
        // Agregar o actualizar en el carrito
        cart[material.id] = {
            material: material,
            quantity: quantity
        };
    }

    // Actualizar UI
    updateCartDisplay();
    updateMaterialCardState(material.id);
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const submitBtn = document.getElementById('submitBtn');

    const itemCount = Object.keys(cart).length;
    cartCount.textContent = itemCount;

    if (itemCount === 0) {
        cartItems.innerHTML = '<div class="cart-empty">No ha seleccionado ningún material aún</div>';
        clearCartBtn.classList.add('hidden');
        submitBtn.disabled = true;
        return;
    }

    clearCartBtn.classList.remove('hidden');
    submitBtn.disabled = false;

    // Mostrar items del carrito
    cartItems.innerHTML = '';
    for (const [materialId, item] of Object.entries(cart)) {
        const cartItem = createCartItem(item);
        cartItems.appendChild(cartItem);
    }
}

function createCartItem(item) {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
        <div class="cart-item-info">
            <span class="cart-item-name">${item.material.name}</span>
            <span class="cart-item-quantity">${item.quantity} ${getUnitName(item.material.unit)}</span>
        </div>
        <button class="remove-item" data-material-id="${item.material.id}">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Event listener para remover
    div.querySelector('.remove-item').addEventListener('click', () => {
        removeFromCart(item.material.id);
    });

    return div;
}

function getUnitName(unit) {
    const unitNames = {
        'unit': 'unidad(es)',
        'liter': 'litro(s)',
        'kg': 'kg',
        'box': 'caja(s)',
        'pack': 'paquete(s)'
    };
    return unitNames[unit] || unit;
}

function removeFromCart(materialId) {
    delete cart[materialId];
    updateCartDisplay();
    updateMaterialCardState(materialId);

    // También actualizar el input de cantidad en la tarjeta
    const card = document.querySelector(`[data-material-id="${materialId}"]`);
    if (card) {
        const input = card.querySelector('.quantity-input');
        if (input) {
            input.value = 0;
        }
    }
}

function updateMaterialCardState(materialId) {
    const card = document.querySelector(`.material-card[data-material-id="${materialId}"]`);
    if (!card) return;

    const inCart = cart[materialId];
    const decreaseBtn = card.querySelector('[data-action="decrease"]');

    if (inCart) {
        card.classList.add('selected');
        decreaseBtn.disabled = false;
    } else {
        card.classList.remove('selected');
        decreaseBtn.disabled = true;
    }
}

// Vaciar carrito
document.getElementById('clearCartBtn').addEventListener('click', () => {
    if (confirm('¿Está seguro de vaciar el carrito?')) {
        cart = {};
        updateCartDisplay();

        // Resetear todos los inputs
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.value = 0;
        });

        // Remover clase selected de todas las tarjetas
        document.querySelectorAll('.material-card').forEach(card => {
            card.classList.remove('selected');
        });
    }
});

// ================================================
// BÚSQUEDA
// ================================================

document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();

    if (!searchTerm) {
        mostrarMateriales(allMaterials);
        return;
    }

    const filtered = allMaterials.filter(material => {
        return material.name.toLowerCase().includes(searchTerm) ||
               (material.description && material.description.toLowerCase().includes(searchTerm));
    });

    mostrarMateriales(filtered);
});

// ================================================
// ENVIAR SOLICITUD
// ================================================

document.getElementById('submitBtn').addEventListener('click', async () => {
    if (Object.keys(cart).length === 0) {
        showError('Debe seleccionar al menos un material');
        return;
    }

    // Preparar datos para el API
    const materials = Object.values(cart).map(item => ({
        material_id: item.material.id,
        quantity: item.quantity
    }));

    const notes = document.getElementById('notes').value.trim();

    const requestData = {
        materials: materials,
        notes: notes || null
    };

    try {
        // Mostrar loading
        document.getElementById('loadingOverlay').classList.remove('hidden');
        document.getElementById('submitBtn').disabled = true;

        const response = await fetch(`${API_BASE_URL}/materials/requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(requestData)
        });

        const result = await response.json();

        // Ocultar loading
        document.getElementById('loadingOverlay').classList.add('hidden');
        document.getElementById('submitBtn').disabled = false;

        if (!response.ok) {
            // Manejar errores específicos
            if (result.details && Array.isArray(result.details)) {
                const errors = result.details.map(d => d.message).join(', ');
                throw new Error(errors);
            }
            throw new Error(result.message || 'Error al crear la solicitud');
        }

        // Mostrar éxito
        showSuccess(`Solicitud creada exitosamente (ID: ${result.request?.id || result.data?.id || ''})`);

        // Esperar un momento y redirigir
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('loadingOverlay').classList.add('hidden');
        document.getElementById('submitBtn').disabled = false;
        showError(error.message || 'Error al crear la solicitud');
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
        max-width: 400px;
    `;
    notification.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
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
// INICIALIZACIÓN
// ================================================

document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // Cargar materiales
    cargarMateriales();
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
