// ================================================
// NUEVO TRABAJADOR - FUNCIONALIDAD
// ================================================

const API_BASE_URL = 'http://localhost:3000/api';

// ================================================
// AUTO-GENERAR USERNAME
// ================================================

const nameInput = document.getElementById('name');
const apellidoInput = document.getElementById('apellido');
const usernameInput = document.getElementById('username');

function generateUsername() {
    const nombre = nameInput.value.trim();
    const apellido = apellidoInput.value.trim();

    if (nombre && apellido) {
        // Primera letra del nombre + Apellido en camelCase
        // Ejemplo: Juan Santiago -> JSantiago
        const primeraLetra = nombre.charAt(0).toUpperCase();
        const apellidoCapitalizado = apellido.charAt(0).toUpperCase() + apellido.slice(1).toLowerCase();
        const username = primeraLetra + apellidoCapitalizado;
        usernameInput.value = username;
    } else {
        usernameInput.value = '';
    }
}

nameInput.addEventListener('input', generateUsername);
apellidoInput.addEventListener('input', generateUsername);

// ================================================
// VALIDACIÓN DE CONTRASEÑA EN TIEMPO REAL
// ================================================

const passwordInput = document.getElementById('password');
const passwordConfirm = document.getElementById('password_confirm');
const submitBtn = document.getElementById('submitBtn');

// Requisitos de contraseña
const requirements = {
    length: { regex: /.{6,}/, element: 'req-length' },
    uppercase: { regex: /[A-Z]/, element: 'req-uppercase' },
    lowercase: { regex: /[a-z]/, element: 'req-lowercase' },
    number: { regex: /\d/, element: 'req-number' }
};

passwordInput.addEventListener('input', (e) => {
    const password = e.target.value;
    let allValid = true;

    // Verificar cada requisito
    for (const [key, req] of Object.entries(requirements)) {
        const element = document.getElementById(req.element);
        if (req.regex.test(password)) {
            element.classList.remove('invalid');
            element.classList.add('valid');
        } else {
            element.classList.remove('valid');
            element.classList.add('invalid');
            allValid = false;
        }
    }

    // Verificar coincidencia de contraseñas
    checkPasswordMatch();
});

passwordConfirm.addEventListener('input', checkPasswordMatch);

function checkPasswordMatch() {
    const password = passwordInput.value;
    const confirm = passwordConfirm.value;
    const matchElement = document.getElementById('passwordMatch');

    if (!confirm) {
        matchElement.textContent = '';
        matchElement.style.color = '';
        return;
    }

    if (password === confirm) {
        matchElement.textContent = '✓ Las contraseñas coinciden';
        matchElement.style.color = '#51cf66';
    } else {
        matchElement.textContent = '✗ Las contraseñas no coinciden';
        matchElement.style.color = '#ff6b6b';
    }
}

// ================================================
// VALIDAR FORMULARIO COMPLETO
// ================================================

function validateForm() {
    const password = passwordInput.value;
    const confirm = passwordConfirm.value;

    // Verificar todos los requisitos
    for (const [key, req] of Object.entries(requirements)) {
        if (!req.regex.test(password)) {
            return { valid: false, message: 'La contraseña no cumple con todos los requisitos' };
        }
    }

    // Verificar coincidencia
    if (password !== confirm) {
        return { valid: false, message: 'Las contraseñas no coinciden' };
    }

    // Verificar email
    const email = document.getElementById('email').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, message: 'El email no es válido' };
    }

    // Verificar nombre
    const name = document.getElementById('name').value.trim();
    if (name.length < 2) {
        return { valid: false, message: 'El nombre debe tener al menos 2 caracteres' };
    }

    // Verificar apellido
    const apellido = document.getElementById('apellido').value.trim();
    if (apellido.length < 2) {
        return { valid: false, message: 'El apellido debe tener al menos 2 caracteres' };
    }

    return { valid: true };
}

// ================================================
// ENVIAR FORMULARIO
// ================================================

document.getElementById('nuevoTrabajadorForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validar formulario
    const validation = validateForm();
    if (!validation.valid) {
        showError(validation.message);
        return;
    }

    // Obtener datos del formulario
    const nombre = document.getElementById('name').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const username = document.getElementById('username').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const language = document.getElementById('preferred_language').value;

    // El campo "name" en la API debe ser el nombre completo
    const fullName = `${nombre} ${apellido}`;

    const formData = {
        name: fullName,
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
        role: document.getElementById('role').value,
        username: username,
        phone: phone || null,
        preferred_language: language
    };

    try {
        // Mostrar loading
        document.getElementById('loadingOverlay').classList.remove('hidden');
        submitBtn.disabled = true;

        // Crear trabajador
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        // Ocultar loading
        document.getElementById('loadingOverlay').classList.add('hidden');
        submitBtn.disabled = false;

        if (!response.ok) {
            // Manejar errores específicos
            if (result.details && Array.isArray(result.details)) {
                const errors = result.details.map(d => d.message).join(', ');
                throw new Error(errors);
            }
            throw new Error(result.message || 'Error al crear el trabajador');
        }

        // Mostrar éxito
        showSuccess(`Trabajador ${fullName} creado exitosamente`);

        // Esperar un momento y redirigir
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('loadingOverlay').classList.add('hidden');
        submitBtn.disabled = false;
        showError(error.message || 'Error al crear el trabajador');
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
        window.location.href = '/login';
        return;
    }
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

// ================================================
// SELECTOR DE ROL Y PERMISOS
// ================================================

const roleSelect = document.getElementById('role');
const roleInfo = document.getElementById('roleInfo');
const rolePermissions = document.getElementById('rolePermissions');

const rolesPermissions = {
    'trabajador': {
        description: 'Acceso básico para ejecutar trabajos',
        permissions: [
            'Ver órdenes asignadas',
            'Iniciar y completar trabajos',
            'Subir fotos de antes/después',
            'Crear reportes diarios (post-construcción)',
            'Solicitar materiales',
            'Ver mensajes y tutoriales'
        ]
    },
    'gerente': {
        description: 'Gestiona trabajadores y órdenes',
        permissions: [
            'Todas las funciones de trabajador',
            'Crear y editar órdenes',
            'Asignar trabajadores a órdenes',
            'Ver reportes de trabajadores',
            'Aprobar solicitudes de materiales',
            'Gestionar inventario'
        ]
    },
    'jefe': {
        description: 'Supervisor con acceso a crear usuarios',
        permissions: [
            'Todas las funciones de gerente',
            'Crear trabajadores y gerentes',
            'Ver todos los reportes',
            'Cancelar órdenes',
            'Gestionar áreas de limpieza',
            'Acceso a estadísticas'
        ]
    },
    'admin': {
        description: 'Acceso total al sistema',
        permissions: [
            'Todas las funciones del sistema',
            'Crear cualquier tipo de usuario',
            'Modificar configuración del sistema',
            'Acceso a logs y actividad',
            'Gestionar mensajes motivacionales',
            'Administrar base de datos'
        ]
    }
};

roleSelect.addEventListener('change', (e) => {
    const selectedRole = e.target.value;

    if (!selectedRole || !rolesPermissions[selectedRole]) {
        roleInfo.style.display = 'none';
        return;
    }

    const roleData = rolesPermissions[selectedRole];

    // Actualizar descripción
    document.getElementById('roleDescription').textContent = roleData.description;

    // Mostrar permisos
    rolePermissions.innerHTML = roleData.permissions.map(permission =>
        `<li><i class="fas fa-check" style="color: #00A651; margin-right: 0.5rem;"></i>${permission}</li>`
    ).join('');

    roleInfo.style.display = 'block';
});

// Trigger inicial si ya hay un valor seleccionado
if (roleSelect.value) {
    roleSelect.dispatchEvent(new Event('change'));
}
