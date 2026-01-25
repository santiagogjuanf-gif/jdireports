-- ================================================
-- AGREGAR COLUMNAS FALTANTES A material_requests
-- ================================================

-- Agregar columna rejected_reason si no existe
ALTER TABLE `material_requests`
ADD COLUMN IF NOT EXISTS `rejected_reason` TEXT NULL
AFTER `approved_at`;

-- Agregar columna delivered_by si no existe
ALTER TABLE `material_requests`
ADD COLUMN IF NOT EXISTS `delivered_by` INT NULL
AFTER `rejected_reason`,
ADD FOREIGN KEY IF NOT EXISTS (`delivered_by`) REFERENCES `users`(`id`) ON DELETE SET NULL;

-- Agregar columna delivered_at si no existe
ALTER TABLE `material_requests`
ADD COLUMN IF NOT EXISTS `delivered_at` TIMESTAMP NULL
AFTER `delivered_by`;

-- Agregar índice para delivered_at
CREATE INDEX IF NOT EXISTS idx_delivered_at ON material_requests(delivered_at);
