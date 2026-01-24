-- ================================================
-- ACTUALIZAR NOMBRES EN INGLÉS DE MATERIALES
-- Los nombres estaban en español, ahora van en inglés
-- ================================================

UPDATE materials SET name_en = 'Multi-purpose disinfectant' WHERE name_es = 'Desinfectante multiusos';
UPDATE materials SET name_en = 'Bleach' WHERE name_es = 'Cloro/Blanqueador';
UPDATE materials SET name_en = 'Liquid detergent' WHERE name_es = 'Detergente líquido';
UPDATE materials SET name_en = 'Glass cleaner' WHERE name_es = 'Limpiador de vidrios';
UPDATE materials SET name_en = 'Degreaser' WHERE name_es = 'Desengrasante';
UPDATE materials SET name_en = 'Isopropyl alcohol 70%' WHERE name_es = 'Alcohol isopropílico 70%';
UPDATE materials SET name_en = 'Air freshener spray' WHERE name_es = 'Ambientador en spray';
UPDATE materials SET name_en = 'Liquid hand soap' WHERE name_es = 'Jabón líquido para manos';
UPDATE materials SET name_en = 'Floor cleaner' WHERE name_es = 'Limpiador de pisos';
UPDATE materials SET name_en = 'Furniture polish' WHERE name_es = 'Pulidora de muebles';

UPDATE materials SET name_en = 'Microfiber mop' WHERE name_es = 'Trapeador de microfibra';
UPDATE materials SET name_en = 'Broom' WHERE name_es = 'Escoba';
UPDATE materials SET name_en = 'Dustpan' WHERE name_es = 'Recogedor';
UPDATE materials SET name_en = 'Bucket' WHERE name_es = 'Cubeta';
UPDATE materials SET name_en = 'Multi-purpose sponge' WHERE name_es = 'Esponja multiusos';
UPDATE materials SET name_en = 'Microfiber cloth' WHERE name_es = 'Paño de microfibra';
UPDATE materials SET name_en = 'Latex gloves' WHERE name_es = 'Guantes de látex';
UPDATE materials SET name_en = 'Hand brush' WHERE name_es = 'Cepillo de mano';
UPDATE materials SET name_en = 'Squeegee' WHERE name_es = 'Jalador de agua';
UPDATE materials SET name_en = 'Empty spray bottle' WHERE name_es = 'Atomizador/Spray vacío';

UPDATE materials SET name_en = 'Large garbage bags' WHERE name_es = 'Bolsas de basura grandes';
UPDATE materials SET name_en = 'Small garbage bags' WHERE name_es = 'Bolsas de basura pequeñas';
UPDATE materials SET name_en = 'Medium garbage bags' WHERE name_es = 'Bolsas de basura medianas';

UPDATE materials SET name_en = 'Toilet paper' WHERE name_es = 'Papel higiénico';
UPDATE materials SET name_en = 'Paper towels' WHERE name_es = 'Toallas de papel';
UPDATE materials SET name_en = 'Facial tissues' WHERE name_es = 'Pañuelos faciales';
UPDATE materials SET name_en = 'Napkins' WHERE name_es = 'Servilletas';

UPDATE materials SET name_en = 'Bathroom cleaner' WHERE name_es = 'Limpiador de baños';
UPDATE materials SET name_en = 'Limescale remover' WHERE name_es = 'Removedor de sarro';
UPDATE materials SET name_en = 'Carpet cleaner' WHERE name_es = 'Limpiador de alfombras';
UPDATE materials SET name_en = 'Floor wax' WHERE name_es = 'Cera para pisos';
UPDATE materials SET name_en = 'Stain remover' WHERE name_es = 'Removedor de manchas';

UPDATE materials SET name_en = 'Disposable face mask' WHERE name_es = 'Mascarilla desechable';
UPDATE materials SET name_en = 'Waterproof apron' WHERE name_es = 'Delantal impermeable';
UPDATE materials SET name_en = 'Safety goggles' WHERE name_es = 'Gafas de protección';

-- Verificar cambios
SELECT id, name_es, name_en, name_fr FROM materials ORDER BY id;
