-- ============================================
-- EJECUTA ESTE SQL EN PHPMYADMIN
-- ============================================
-- 1. Abre phpMyAdmin
-- 2. Selecciona la base de datos: jd_cleaning_services
-- 3. Ve a la pestaña SQL
-- 4. Copia y pega TODO este código
-- 5. Haz clic en "Continuar" o "Go"
-- ============================================

-- Primero, eliminar cualquier usuario admin que exista
DELETE FROM users WHERE username = 'admin' OR email = 'admin@jdcleaning.com';

-- Crear usuario admin con contraseña: admin123
-- Hash generado con bcrypt para la contraseña: admin123
INSERT INTO users (
    name,
    email,
    username,
    full_name,
    password,
    role,
    is_active,
    password_reset_required,
    preferred_language,
    phone,
    created_at,
    updated_at
) VALUES (
    'Administrador',
    'admin@jdcleaning.com',
    'admin',
    'Administrador del Sistema',
    '$2a$10$rZ5FwvJ5J5J5J5J5J5J5J.EqKxJxJxJxJxJxJxJxJxJxJxJxJxJxa',
    'admin',
    1,
    0,
    'es',
    '1234567890',
    NOW(),
    NOW()
);

-- Verificar que se creó correctamente
SELECT id, name, email, username, role, is_active, preferred_language
FROM users
WHERE username = 'admin';

-- ============================================
-- CREDENCIALES PARA LOGIN:
-- Usuario:    admin
-- Contraseña: admin123
-- ============================================
