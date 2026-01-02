-- ================================================
-- MIGRACIÓN 003: ÁREAS DE LIMPIEZA ADICIONALES
-- JD CLEANING SERVICES
-- ================================================
-- Inserta 20 áreas de limpieza detalladas
-- con soporte multi-idioma (ES, EN, FR)
-- ================================================

USE jd_cleaning_services;

-- Áreas de Cocina
INSERT INTO cleaning_areas (name_key, name_es, name_en, name_fr, is_active, display_order) VALUES
('full_kitchen', 'Cocina completa', 'Full kitchen', 'Cuisine complète', 1, 16),
('refrigerator', 'Refrigerador', 'Refrigerator', 'Réfrigérateur', 1, 17),
('oven_stove', 'Horno y estufa', 'Oven and stove', 'Four et cuisinière', 1, 18),
('microwave', 'Microondas', 'Microwave', 'Micro-ondes', 1, 19),
('dishwasher', 'Lavavajillas', 'Dishwasher', 'Lave-vaisselle', 1, 20),
('kitchen_cabinets', 'Gabinetes de cocina', 'Kitchen cabinets', 'Armoires de cuisine', 1, 21),
('kitchen_countertops', 'Mesones de cocina', 'Kitchen countertops', 'Comptoirs de cuisine', 1, 22),

-- Áreas de Baño
('shower_tub', 'Ducha/Tina', 'Shower/Tub', 'Douche/Baignoire', 1, 23),
('toilet', 'Sanitario', 'Toilet', 'Toilette', 1, 24),
('sink_vanity', 'Lavabo y tocador', 'Sink and vanity', 'Lavabo et meuble', 1, 25),
('bathroom_mirror', 'Espejo del baño', 'Bathroom mirror', 'Miroir de salle de bain', 1, 26),

-- Áreas Generales
('baseboards', 'Zócalos', 'Baseboards', 'Plinthes', 1, 27),
('light_fixtures', 'Lámparas', 'Light fixtures', 'Luminaires', 1, 28),
('ceiling_fans', 'Ventiladores de techo', 'Ceiling fans', 'Ventilateurs de plafond', 1, 29),
('door_frames', 'Marcos de puertas', 'Door frames', 'Cadres de portes', 1, 30),

-- Áreas Especiales
('entry_area', 'Área de entrada', 'Entry area', 'Zone d entrée', 1, 31),
('common_areas', 'Áreas comunes', 'Common areas', 'Zones communes', 1, 32),
('storage_room', 'Cuarto de almacenamiento', 'Storage room', 'Salle de stockage', 1, 33),
('utility_room', 'Cuarto de servicio', 'Utility room', 'Buanderie', 1, 34),
('outdoor_area', 'Área exterior', 'Outdoor area', 'Zone extérieure', 1, 35);

-- ================================================
-- MIGRACIÓN 003 COMPLETADA
-- ================================================
