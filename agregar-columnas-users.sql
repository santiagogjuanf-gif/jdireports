-- ================================================
-- AGREGAR COLUMNAS FALTANTES A LA TABLA USERS
-- Ejecutar en phpMyAdmin o con: mysql -u root jd_cleaning_services < este_archivo.sql
-- ================================================

USE jd_cleaning_services;

-- Agregar full_name
ALTER TABLE users
ADD COLUMN IF NOT EXISTS full_name VARCHAR(100) AFTER username;

-- Agregar password_reset_required
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN DEFAULT FALSE AFTER password;

-- Agregar password_changed_at
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP NULL AFTER password_reset_required;

-- Agregar last_password_reset_by
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_password_reset_by INT NULL AFTER password_changed_at;

-- Agregar preferred_language
ALTER TABLE users
ADD COLUMN IF NOT EXISTS preferred_language ENUM('es', 'en', 'fr') DEFAULT 'es' AFTER last_password_reset_by;

-- Agregar phone
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) AFTER preferred_language;

-- Agregar created_by
ALTER TABLE users
ADD COLUMN IF NOT EXISTS created_by INT NULL AFTER created_at;

-- Agregar updated_at si no existe
ALTER TABLE users
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Verificar columnas
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_DEFAULT,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'jd_cleaning_services'
  AND TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION;
