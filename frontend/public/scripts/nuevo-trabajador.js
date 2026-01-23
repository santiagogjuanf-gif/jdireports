// ================================================
// NUEVO TRABAJADOR - FUNCIONALIDAD
// ================================================

const API_BASE_URL = 'http://localhost:3000/api';

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
    const formData = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
        role: 'trabajador' // Siempre crear como trabajador
    };

    // Campos opcionales
    const fullName = document.getElementById('full_name').value.trim();
    const username = document.getElementById('username').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const language = document.getElementById('preferred_language').value;

    // Solo agregar si tienen valor (el backend los agregará via otro endpoint o UPDATE)
    // Por ahora solo usamos los campos que el POST /users acepta directamente

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

        // Si hay campos opcionales, actualizarlos (requiere otro endpoint PUT)
        if (fullName || username || phone || language !== 'es') {
            const userId = result.data.user.id;
            const updateData = {};

            if (fullName) updateData.full_name = fullName;
            if (username) updateData.username = username;
            if (phone) updateData.phone = phone;
            if (language !== 'es') updateData.preferred_language = language;

            try {
                await fetch(`${API_BASE_URL}/users/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(updateData)
                });
            } catch (updateError) {
                console.warn('Error actualizando campos opcionales:', updateError);
                // No fallar si esto falla, el usuario ya fue creado
            }
        }

        // Mostrar éxito
        showSuccess(`Trabajador ${result.data.user.name} creado exitosamente`);

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
        window.location.href = '/login.html';
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
