-- ================================================
-- CORRECCIÓN DE TABLA MATERIALS
-- Actualizar estructura para soportar multiidioma
-- ================================================

-- Paso 1: Agregar nuevas columnas multiidioma
ALTER TABLE materials
ADD COLUMN name_es VARCHAR(100) NULL AFTER id,
ADD COLUMN name_en VARCHAR(100) NULL AFTER name_es,
ADD COLUMN name_fr VARCHAR(100) NULL AFTER name_en;

-- Paso 2: Migrar datos existentes de 'name' a 'name_es'
UPDATE materials SET
  name_es = name,
  name_en = name,
  name_fr = name
WHERE name_es IS NULL;

-- Paso 3: Hacer las columnas multiidioma obligatorias
ALTER TABLE materials
MODIFY COLUMN name_es VARCHAR(100) NOT NULL,
MODIFY COLUMN name_en VARCHAR(100) NOT NULL,
MODIFY COLUMN name_fr VARCHAR(100) NOT NULL;

-- Paso 4: Eliminar la columna 'name' antigua
ALTER TABLE materials DROP COLUMN name;

-- Paso 5: Cambiar el tipo de columna 'unit' de ENUM a VARCHAR
ALTER TABLE materials
MODIFY COLUMN unit VARCHAR(20) NOT NULL;

-- Paso 6: Eliminar columnas innecesarias (si existen)
-- Solo si quieres simplificar la tabla
-- ALTER TABLE materials DROP COLUMN description;
-- ALTER TABLE materials DROP COLUMN current_stock;
-- ALTER TABLE materials DROP COLUMN min_stock;

-- Verificar la nueva estructura
DESCRIBE materials;

-- Mostrar datos existentes
SELECT id, name_es, name_en, name_fr, unit, is_active FROM materials LIMIT 10;
