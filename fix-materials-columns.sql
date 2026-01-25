-- ================================================
-- AGREGAR COLUMNAS FALTANTES A material_requests
-- ================================================

-- Agregar columna rejected_reason
ALTER TABLE `material_requests`
ADD COLUMN `rejected_reason` TEXT NULL
AFTER `approved_at`;

-- Agregar columna delivered_by
ALTER TABLE `material_requests`
ADD COLUMN `delivered_by` INT NULL
AFTER `rejected_reason`,
ADD CONSTRAINT `fk_delivered_by` FOREIGN KEY (`delivered_by`) REFERENCES `users`(`id`) ON DELETE SET NULL;

-- Agregar columna delivered_at
ALTER TABLE `material_requests`
ADD COLUMN `delivered_at` TIMESTAMP NULL
AFTER `delivered_by`;

-- Agregar índice
CREATE INDEX idx_delivered_at ON material_requests(delivered_at);

SELECT 'Columnas agregadas exitosamente' AS resultado;
