-- ================================================
-- INSERCIÓN DE MATERIALES INICIALES
-- JDI Cleaning Services
-- ================================================

-- Limpiar tabla si existe data previa (OPCIONAL - comentar si no quieres borrar)
-- DELETE FROM materials;

-- Materiales de limpieza básicos
INSERT INTO materials (name_es, name_en, name_fr, unit, is_active) VALUES
('Desinfectante multiusos', 'Multi-purpose disinfectant', 'Désinfectant multiusage', 'litro', 1),
('Cloro/Blanqueador', 'Bleach', 'Eau de javel', 'litro', 1),
('Detergente líquido', 'Liquid detergent', 'Détergent liquide', 'litro', 1),
('Limpiador de vidrios', 'Glass cleaner', 'Nettoyant pour vitres', 'litro', 1),
('Desengrasante', 'Degreaser', 'Dégraissant', 'litro', 1),
('Alcohol isopropílico 70%', 'Isopropyl alcohol 70%', 'Alcool isopropylique 70%', 'litro', 1),
('Ambientador en spray', 'Air freshener spray', 'Désodorisant en spray', 'unidad', 1),
('Jabón líquido para manos', 'Liquid hand soap', 'Savon liquide pour mains', 'litro', 1),
('Limpiador de pisos', 'Floor cleaner', 'Nettoyant pour sols', 'litro', 1),
('Pulidora de muebles', 'Furniture polish', 'Polish pour meubles', 'litro', 1);

-- Herramientas y equipos
INSERT INTO materials (name_es, name_en, name_fr, unit, is_active) VALUES
('Trapeador de microfibra', 'Microfiber mop', 'Vadrouille en microfibre', 'unidad', 1),
('Escoba', 'Broom', 'Balai', 'unidad', 1),
('Recogedor', 'Dustpan', 'Pelle à poussière', 'unidad', 1),
('Cubeta', 'Bucket', 'Seau', 'unidad', 1),
('Esponja multiusos', 'Multi-purpose sponge', 'Éponge multiusage', 'unidad', 1),
('Paño de microfibra', 'Microfiber cloth', 'Chiffon en microfibre', 'unidad', 1),
('Guantes de látex', 'Latex gloves', 'Gants en latex', 'par', 1),
('Cepillo de mano', 'Hand brush', 'Brosse à main', 'unidad', 1),
('Jalador de agua', 'Squeegee', 'Raclette', 'unidad', 1),
('Atomizador/Spray vacío', 'Empty spray bottle', 'Vaporisateur vide', 'unidad', 1);

-- Bolsas y contenedores
INSERT INTO materials (name_es, name_en, name_fr, unit, is_active) VALUES
('Bolsas de basura grandes', 'Large garbage bags', 'Grands sacs poubelle', 'rollo', 1),
('Bolsas de basura pequeñas', 'Small garbage bags', 'Petits sacs poubelle', 'rollo', 1),
('Bolsas de basura medianas', 'Medium garbage bags', 'Sacs poubelle moyens', 'rollo', 1);

-- Papel y dispensables
INSERT INTO materials (name_es, name_en, name_fr, unit, is_active) VALUES
('Papel higiénico', 'Toilet paper', 'Papier toilette', 'rollo', 1),
('Toallas de papel', 'Paper towels', 'Essuie-tout', 'rollo', 1),
('Pañuelos faciales', 'Facial tissues', 'Mouchoirs', 'caja', 1),
('Servilletas', 'Napkins', 'Serviettes', 'paquete', 1);

-- Productos especializados
INSERT INTO materials (name_es, name_en, name_fr, unit, is_active) VALUES
('Limpiador de baños', 'Bathroom cleaner', 'Nettoyant pour salle de bain', 'litro', 1),
('Removedor de sarro', 'Limescale remover', 'Détartrant', 'litro', 1),
('Limpiador de alfombras', 'Carpet cleaner', 'Nettoyant pour tapis', 'litro', 1),
('Cera para pisos', 'Floor wax', 'Cire pour sols', 'litro', 1),
('Removedor de manchas', 'Stain remover', 'Détachant', 'litro', 1);

-- Equipos de protección personal
INSERT INTO materials (name_es, name_en, name_fr, unit, is_active) VALUES
('Mascarilla desechable', 'Disposable face mask', 'Masque jetable', 'unidad', 1),
('Delantal impermeable', 'Waterproof apron', 'Tablier imperméable', 'unidad', 1),
('Gafas de protección', 'Safety goggles', 'Lunettes de protection', 'unidad', 1);

-- Mostrar materiales insertados
SELECT
    id,
    name_es,
    name_en,
    unit,
    is_active
FROM materials
ORDER BY id;

-- Verificar total
SELECT COUNT(*) as total_materiales FROM materials WHERE is_active = 1;
