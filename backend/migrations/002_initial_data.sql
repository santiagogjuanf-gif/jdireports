-- ================================================
-- JDI REPORTS - DATOS INICIALES
-- Script de Inserción de Datos
-- ================================================
-- Fecha: 2025-01-15
-- Descripción: Datos iniciales del sistema:
--   - Áreas de limpieza (3 idiomas)
--   - Materiales (3 idiomas)
--   - Mensajes motivacionales (3 idiomas)
--   - Tutoriales básicos (3 idiomas)
--   - Configuración de empresa
-- ================================================

USE jd_cleaning_services;

-- ================================================
-- 1. ÁREAS DE LIMPIEZA (CLEANING_AREAS)
-- ================================================

INSERT INTO `cleaning_areas` (`name_key`, `name_es`, `name_en`, `name_fr`, `is_active`, `display_order`) VALUES
('bathroom', 'Baño', 'Bathroom', 'Salle de bain', TRUE, 1),
('kitchen', 'Cocina', 'Kitchen', 'Cuisine', TRUE, 2),
('bedroom', 'Recámara', 'Bedroom', 'Chambre', TRUE, 3),
('living_room', 'Sala', 'Living Room', 'Salon', TRUE, 4),
('dining_room', 'Comedor', 'Dining Room', 'Salle à manger', TRUE, 5),
('windows', 'Ventanas', 'Windows', 'Fenêtres', TRUE, 6),
('stairs', 'Escaleras', 'Stairs', 'Escaliers', TRUE, 7),
('garage', 'Garaje', 'Garage', 'Garage', TRUE, 8),
('basement', 'Sótano', 'Basement', 'Sous-sol', TRUE, 9),
('balcony', 'Balcón', 'Balcony', 'Balcon', TRUE, 10),
('laundry_room', 'Lavandería', 'Laundry Room', 'Buanderie', TRUE, 11),
('patio', 'Patio', 'Patio', 'Terrasse', TRUE, 12),
('office', 'Oficina', 'Office', 'Bureau', TRUE, 13),
('hallway', 'Pasillo', 'Hallway', 'Couloir', TRUE, 14),
('closet', 'Closet', 'Closet', 'Placard', TRUE, 15);

-- ================================================
-- 2. MATERIALES DE LIMPIEZA (MATERIALS)
-- ================================================

INSERT INTO `materials` (`name_es`, `name_en`, `name_fr`, `category`, `is_active`, `display_order`) VALUES
-- Productos de Limpieza
('Windex', 'Windex', 'Windex', 'cleaning', TRUE, 1),
('Limpiador neutral', 'Neutral cleaner', 'Nettoyant neutre', 'cleaning', TRUE, 2),
('Desinfectante', 'Disinfectant', 'Désinfectant', 'cleaning', TRUE, 3),
('Ácido para tazas', 'Bowl cleaner', 'Nettoyant pour cuvette', 'cleaning', TRUE, 4),
('Limpiador de pisos', 'Floor cleaner', 'Nettoyant pour sols', 'cleaning', TRUE, 5),
('Desengrasante', 'Degreaser', 'Dégraissant', 'cleaning', TRUE, 6),
('Limpiador multiusos', 'All-purpose cleaner', 'Nettoyant multi-usages', 'cleaning', TRUE, 7),
('Pulidor de muebles', 'Furniture polish', 'Polish à meubles', 'cleaning', TRUE, 8),

-- Herramientas
('Escobón', 'Broom', 'Balai', 'tools', TRUE, 10),
('Escoba', 'Small broom', 'Petit balai', 'tools', TRUE, 11),
('Trapeador', 'Mop', 'Vadrouille', 'tools', TRUE, 12),
('Recogedor', 'Dustpan', 'Pelle à poussière', 'tools', TRUE, 13),
('Cubeta', 'Bucket', 'Seau', 'tools', TRUE, 14),
('Atomizador', 'Spray bottle', 'Vaporisateur', 'tools', TRUE, 15),
('Esponja', 'Sponge', 'Éponge', 'tools', TRUE, 16),
('Paño de microfibra', 'Microfiber cloth', 'Chiffon microfibre', 'tools', TRUE, 17),
('Cepillo para taza', 'Toilet brush', 'Brosse de toilette', 'tools', TRUE, 18),
('Jalador de agua (Squeegee)', 'Squeegee', 'Raclette', 'tools', TRUE, 19),
('Guantes de limpieza', 'Cleaning gloves', 'Gants de nettoyage', 'tools', TRUE, 20),

-- Consumibles
('Bolsas de basura', 'Garbage bags', 'Sacs poubelle', 'supplies', TRUE, 30),
('Papel toalla', 'Paper towels', 'Essuie-tout', 'supplies', TRUE, 31),
('Toallitas desinfectantes', 'Disinfectant wipes', 'Lingettes désinfectantes', 'supplies', TRUE, 32);

-- ================================================
-- 3. MENSAJES MOTIVACIONALES (15 POR DEFECTO)
-- ================================================

INSERT INTO `motivational_messages` (`message_es`, `message_en`, `message_fr`, `emoji`, `is_active`, `is_default`) VALUES
('¡La excelencia es un hábito, no un acto!', 'Excellence is a habit, not an act!', 'L\'excellence est une habitude, pas un acte!', '💪', TRUE, TRUE),
('Cada espacio limpio es una obra de arte.', 'Every clean space is a work of art.', 'Chaque espace propre est une œuvre d\'art.', '🎨', TRUE, TRUE),
('Tu trabajo hace la diferencia todos los días.', 'Your work makes a difference every day.', 'Votre travail fait la différence chaque jour.', '⭐', TRUE, TRUE),
('La calidad nunca es un accidente.', 'Quality is never an accident.', 'La qualité n\'est jamais un hasard.', '✨', TRUE, TRUE),
('Juntos creamos espacios extraordinarios.', 'Together we create extraordinary spaces.', 'Ensemble, nous créons des espaces extraordinaires.', '🤝', TRUE, TRUE),
('Cada detalle cuenta, cada esfuerzo importa.', 'Every detail counts, every effort matters.', 'Chaque détail compte, chaque effort compte.', '🔍', TRUE, TRUE),
('El orgullo está en el trabajo bien hecho.', 'Pride is in a job well done.', 'La fierté réside dans un travail bien fait.', '🏆', TRUE, TRUE),
('Limpieza es salud, limpieza es bienestar.', 'Cleanliness is health, cleanliness is wellness.', 'La propreté c\'est la santé, la propreté c\'est le bien-être.', '🌟', TRUE, TRUE),
('Tu dedicación inspira confianza.', 'Your dedication inspires confidence.', 'Votre dévouement inspire confiance.', '💎', TRUE, TRUE),
('Transformamos espacios, mejoramos vidas.', 'We transform spaces, we improve lives.', 'Nous transformons les espaces, nous améliorons les vies.', '🏡', TRUE, TRUE),
('La perfección está en los pequeños detalles.', 'Perfection is in the small details.', 'La perfection est dans les petits détails.', '✅', TRUE, TRUE),
('Cada día es una oportunidad para brillar.', 'Every day is an opportunity to shine.', 'Chaque jour est une opportunité de briller.', '☀️', TRUE, TRUE),
('El trabajo en equipo hace el sueño realidad.', 'Teamwork makes the dream work.', 'Le travail d\'équipe réalise le rêve.', '👥', TRUE, TRUE),
('Limpieza profesional, resultados excepcionales.', 'Professional cleaning, exceptional results.', 'Nettoyage professionnel, résultats exceptionnels.', '🚀', TRUE, TRUE),
('Tu esfuerzo es el motor de nuestra empresa.', 'Your effort is the engine of our company.', 'Votre effort est le moteur de notre entreprise.', '⚡', TRUE, TRUE);

-- ================================================
-- 4. TUTORIALES BÁSICOS
-- ================================================

-- Tutorial 1: Cómo ver mis órdenes (Trabajador)
INSERT INTO `tutorials` (
  `title_es`, `title_en`, `title_fr`,
  `content_es`, `content_en`, `content_fr`,
  `target_role`, `display_order`, `is_active`, `is_default`
) VALUES (
  'Cómo ver mis órdenes asignadas',
  'How to view my assigned orders',
  'Comment voir mes commandes assignées',

  '📍 PASO 1: Acceder al Dashboard\nDesde la página principal, verás todas tus órdenes asignadas.\n\n📍 PASO 2: Identificar el estado\nCada orden tiene un color:\n🟢 Verde = Pendiente (listo para iniciar)\n🔵 Azul = En progreso (ya iniciada)\n🟡 Amarillo = Pausada (puedes reanudar)\n\n📍 PASO 3: Ver detalles\nHaz clic en cualquier orden para ver:\n• Dirección del cliente\n• Áreas a limpiar\n• Notas especiales\n• Chat con supervisor\n\n⚠️ IMPORTANTE:\n• Solo ves las órdenes asignadas a ti\n• Las órdenes urgentes aparecen primero en rojo 🔴',

  '📍 STEP 1: Access Dashboard\nFrom the main page, you will see all your assigned orders.\n\n📍 STEP 2: Identify status\nEach order has a color:\n🟢 Green = Pending (ready to start)\n🔵 Blue = In progress (already started)\n🟡 Yellow = Paused (can resume)\n\n📍 STEP 3: View details\nClick any order to see:\n• Client address\n• Areas to clean\n• Special notes\n• Chat with supervisor\n\n⚠️ IMPORTANT:\n• You only see orders assigned to you\n• Urgent orders appear first in red 🔴',

  '📍 ÉTAPE 1: Accéder au tableau de bord\nDepuis la page principale, vous verrez toutes vos commandes assignées.\n\n📍 ÉTAPE 2: Identifier le statut\nChaque commande a une couleur:\n🟢 Vert = En attente (prêt à commencer)\n🔵 Bleu = En cours (déjà commencé)\n🟡 Jaune = En pause (peut reprendre)\n\n📍 ÉTAPE 3: Voir les détails\nCliquez sur une commande pour voir:\n• Adresse du client\n• Zones à nettoyer\n• Notes spéciales\n• Chat avec superviseur\n\n⚠️ IMPORTANT:\n• Vous ne voyez que les commandes qui vous sont assignées\n• Les commandes urgentes apparaissent en premier en rouge 🔴',

  'worker', 1, TRUE, TRUE
);

-- Tutorial 2: Cómo iniciar una orden (Trabajador)
INSERT INTO `tutorials` (
  `title_es`, `title_en`, `title_fr`,
  `content_es`, `content_en`, `content_fr`,
  `target_role`, `display_order`, `is_active`, `is_default`
) VALUES (
  'Cómo iniciar una orden de trabajo',
  'How to start a work order',
  'Comment démarrer une commande',

  '📍 PASO 1: Abrir la orden\nHaz clic en la orden que vas a iniciar.\n\n📍 PASO 2: Activar GPS\n⚠️ IMPORTANTE: El GPS debe estar activo.\nSi no está activo, el botón estará bloqueado.\n\n📍 PASO 3: Presionar "Iniciar Trabajo"\nEl sistema registrará:\n• Hora de inicio\n• Tu ubicación GPS\n\n📍 PASO 4: Comenzar a trabajar\nAhora puedes:\n• Marcar áreas como completadas\n• Subir fotos de cada área\n• Usar el chat si necesitas ayuda\n• Pausar si es necesario\n\n⚠️ RECUERDA:\n• El GPS es obligatorio\n• Cada área necesita al menos 1 foto\n• Mínimo 10 fotos en total',

  '📍 STEP 1: Open the order\nClick on the order you will start.\n\n📍 STEP 2: Enable GPS\n⚠️ IMPORTANT: GPS must be active.\nIf not active, button will be blocked.\n\n📍 STEP 3: Press "Start Work"\nThe system will record:\n• Start time\n• Your GPS location\n\n📍 STEP 4: Begin working\nNow you can:\n• Mark areas as completed\n• Upload photos of each area\n• Use chat if you need help\n• Pause if necessary\n\n⚠️ REMEMBER:\n• GPS is mandatory\n• Each area needs at least 1 photo\n• Minimum 10 photos total',

  '📍 ÉTAPE 1: Ouvrir la commande\nCliquez sur la commande que vous allez commencer.\n\n📍 ÉTAPE 2: Activer le GPS\n⚠️ IMPORTANT: Le GPS doit être actif.\nSi pas actif, le bouton sera bloqué.\n\n📍 ÉTAPE 3: Appuyer sur "Démarrer le travail"\nLe système enregistrera:\n• Heure de début\n• Votre position GPS\n\n📍 ÉTAPE 4: Commencer à travailler\nMaintenant vous pouvez:\n• Marquer les zones comme terminées\n• Télécharger des photos de chaque zone\n• Utiliser le chat si besoin d\'aide\n• Mettre en pause si nécessaire\n\n⚠️ RAPPEL:\n• Le GPS est obligatoire\n• Chaque zone nécessite au moins 1 photo\n• Minimum 10 photos au total',

  'worker', 2, TRUE, TRUE
);

-- Tutorial 3: Cómo subir fotos (Trabajador)
INSERT INTO `tutorials` (
  `title_es`, `title_en`, `title_fr`,
  `content_es`, `content_en`, `content_fr`,
  `target_role`, `display_order`, `is_active`, `is_default`
) VALUES (
  'Cómo subir fotos de las áreas',
  'How to upload area photos',
  'Comment télécharger des photos',

  '📍 PASO 1: Seleccionar el área\nEn la lista de áreas, haz clic en el área que limpiaste.\nEjemplo: "Baño 1"\n\n📍 PASO 2: Tomar fotos\n📷 Presiona "Subir Fotos"\nPuedes:\n• Tomar foto con la cámara\n• Seleccionar de la galería\n\n📍 PASO 3: Agregar descripción (opcional)\nPuedes escribir detalles:\n"Limpieza profunda, desinfección completa"\n\n📍 PASO 4: Confirmar\n✅ Presiona "Guardar"\n\n⚠️ LÍMITES:\n• Máximo 4 fotos por área\n• Máximo 30 fotos en total (regular)\n• Máximo 10 MB por foto\n• Formatos: JPG, PNG, WEBP\n\n💡 CONSEJO:\n• Toma fotos claras y bien iluminadas\n• Muestra el antes y después\n• El sistema agrega marca de agua automáticamente',

  '📍 STEP 1: Select the area\nIn the area list, click on the area you cleaned.\nExample: "Bathroom 1"\n\n📍 STEP 2: Take photos\n📷 Press "Upload Photos"\nYou can:\n• Take photo with camera\n• Select from gallery\n\n📍 STEP 3: Add description (optional)\nYou can write details:\n"Deep cleaning, complete disinfection"\n\n📍 STEP 4: Confirm\n✅ Press "Save"\n\n⚠️ LIMITS:\n• Maximum 4 photos per area\n• Maximum 30 photos total (regular)\n• Maximum 10 MB per photo\n• Formats: JPG, PNG, WEBP\n\n💡 TIP:\n• Take clear and well-lit photos\n• Show before and after\n• System adds watermark automatically',

  '📍 ÉTAPE 1: Sélectionner la zone\nDans la liste des zones, cliquez sur la zone nettoyée.\nExemple: "Salle de bain 1"\n\n📍 ÉTAPE 2: Prendre des photos\n📷 Appuyez sur "Télécharger des photos"\nVous pouvez:\n• Prendre une photo avec l\'appareil\n• Sélectionner de la galerie\n\n📍 ÉTAPE 3: Ajouter une description (facultatif)\nVous pouvez écrire des détails:\n"Nettoyage en profondeur, désinfection complète"\n\n📍 ÉTAPE 4: Confirmer\n✅ Appuyez sur "Enregistrer"\n\n⚠️ LIMITES:\n• Maximum 4 photos par zone\n• Maximum 30 photos au total (régulier)\n• Maximum 10 MB par photo\n• Formats: JPG, PNG, WEBP\n\n💡 CONSEIL:\n• Prenez des photos claires et bien éclairées\n• Montrez avant et après\n• Le système ajoute un filigrane automatiquement',

  'worker', 3, TRUE, TRUE
);

-- Tutorial 4: Cómo crear reporte diario post-construcción (Trabajador)
INSERT INTO `tutorials` (
  `title_es`, `title_en`, `title_fr`,
  `content_es`, `content_en`, `content_fr`,
  `target_role`, `display_order`, `is_active`, `is_default`
) VALUES (
  'Cómo crear reporte diario (Post-Construcción)',
  'How to create daily report (Post-Construction)',
  'Comment créer un rapport quotidien (Post-Construction)',

  '📍 PASO 1: Abrir la orden\nDesde tu dashboard, haz clic en la orden de post-construcción asignada.\n\n📍 PASO 2: Ir a "Reportes Diarios"\nBusca la pestaña "Reportes Diarios" y haz clic en:\n[+ Agregar Reporte de Hoy]\n\n📍 PASO 3: Escribir descripción\n✏️ Describe brevemente lo que hiciste hoy.\nEjemplo:\n"Limpiamos pisos 1 y 2, quitamos escombros, lavamos ventanas del piso 1"\n\n📍 PASO 4: Subir fotos\n📷 Presiona "Subir Fotos" y selecciona hasta 50 fotos del día.\n\n📍 PASO 5: Guardar\n✅ Presiona "Guardar Reporte"\n\n⚠️ IMPORTANTE:\n• La descripción es obligatoria\n• Máximo 50 fotos por reporte\n• Puedes hacer varios reportes al día\n• Sin límite de días\n\n💡 CONSEJO:\n• Sé específico en la descripción\n• Incluye qué áreas trabajaste\n• Menciona cualquier problema encontrado',

  '📍 STEP 1: Open the order\nFrom your dashboard, click on the assigned post-construction order.\n\n📍 STEP 2: Go to "Daily Reports"\nFind the "Daily Reports" tab and click:\n[+ Add Today\'s Report]\n\n📍 STEP 3: Write description\n✏️ Briefly describe what you did today.\nExample:\n"Cleaned floors 1 and 2, removed debris, washed floor 1 windows"\n\n📍 STEP 4: Upload photos\n📷 Press "Upload Photos" and select up to 50 photos from the day.\n\n📍 STEP 5: Save\n✅ Press "Save Report"\n\n⚠️ IMPORTANT:\n• Description is mandatory\n• Maximum 50 photos per report\n• You can make several reports per day\n• No day limit\n\n💡 TIP:\n• Be specific in description\n• Include which areas you worked\n• Mention any problems found',

  '📍 ÉTAPE 1: Ouvrir la commande\nDepuis votre tableau de bord, cliquez sur la commande post-construction assignée.\n\n📍 ÉTAPE 2: Aller à "Rapports quotidiens"\nTrouvez l\'onglet "Rapports quotidiens" et cliquez:\n[+ Ajouter le rapport d\'aujourd\'hui]\n\n📍 ÉTAPE 3: Écrire la description\n✏️ Décrivez brièvement ce que vous avez fait aujourd\'hui.\nExemple:\n"Nettoyé les étages 1 et 2, enlevé les débris, lavé les fenêtres de l\'étage 1"\n\n📍 ÉTAPE 4: Télécharger des photos\n📷 Appuyez sur "Télécharger des photos" et sélectionnez jusqu\'à 50 photos de la journée.\n\n📍 ÉTAPE 5: Enregistrer\n✅ Appuyez sur "Enregistrer le rapport"\n\n⚠️ IMPORTANT:\n• La description est obligatoire\n• Maximum 50 photos par rapport\n• Vous pouvez faire plusieurs rapports par jour\n• Pas de limite de jours\n\n💡 CONSEIL:\n• Soyez précis dans la description\n• Indiquez les zones travaillées\n• Mentionnez tout problème rencontré',

  'worker', 4, TRUE, TRUE
);

-- Tutorial 5: Cómo crear una orden (Supervisor/Jefe)
INSERT INTO `tutorials` (
  `title_es`, `title_en`, `title_fr`,
  `content_es`, `content_en`, `content_fr`,
  `target_role`, `display_order`, `is_active`, `is_default`
) VALUES (
  'Cómo crear una orden de trabajo',
  'How to create a work order',
  'Comment créer une commande de travail',

  '📍 PASO 1: Ir a Órdenes\nHaz clic en el menú "Órdenes" en la barra superior.\n\n📍 PASO 2: Crear Nueva Orden\nPresiona el botón "+ Nueva Orden" en la esquina superior derecha.\n\n📍 PASO 3: Seleccionar Tipo\nElige el tipo de limpieza:\n○ Regular (Casa, Apartamento, Oficina)\n○ Post-Construcción\n\n📍 PASO 4: Llenar información del cliente\n• Nombre del cliente\n• Teléfono\n• Email\n• Dirección completa\n• Tipo de propiedad\n\n📍 PASO 5A: Si es Regular\n✅ Selecciona áreas del checklist:\n   ☑️ Baños (2)\n   ☑️ Cocina (1)\n   ☑️ Recámaras (3)\n\n📍 PASO 5B: Si es Post-Construcción\n✏️ Escribe descripción del proyecto\n☐ Marca si tiene duración específica\n\n📍 PASO 6: Asignar trabajadores\nSelecciona trabajadores y marca el responsable ⭐\n\n📍 PASO 7: Configurar detalles\n• Fecha programada\n• Prioridad (Baja/Media/Alta)\n• Notas adicionales\n\n📍 PASO 8: Crear\n✅ Presiona "Crear Orden"\n\n⚠️ Se enviará notificación a los trabajadores',

  '📍 STEP 1: Go to Orders\nClick "Orders" menu in top bar.\n\n📍 STEP 2: Create New Order\nPress "+ New Order" button in top right corner.\n\n📍 STEP 3: Select Type\nChoose cleaning type:\n○ Regular (House, Apartment, Office)\n○ Post-Construction\n\n📍 STEP 4: Fill client information\n• Client name\n• Phone\n• Email\n• Complete address\n• Property type\n\n📍 STEP 5A: If Regular\n✅ Select areas from checklist:\n   ☑️ Bathrooms (2)\n   ☑️ Kitchen (1)\n   ☑️ Bedrooms (3)\n\n📍 STEP 5B: If Post-Construction\n✏️ Write project description\n☐ Mark if has specific duration\n\n📍 STEP 6: Assign workers\nSelect workers and mark responsible ⭐\n\n📍 STEP 7: Configure details\n• Scheduled date\n• Priority (Low/Medium/High)\n• Additional notes\n\n📍 STEP 8: Create\n✅ Press "Create Order"\n\n⚠️ Notification will be sent to workers',

  '📍 ÉTAPE 1: Aller aux Commandes\nCliquez sur le menu "Commandes" dans la barre supérieure.\n\n📍 ÉTAPE 2: Créer nouvelle commande\nAppuyez sur le bouton "+ Nouvelle commande" en haut à droite.\n\n📍 ÉTAPE 3: Sélectionner le type\nChoisissez le type de nettoyage:\n○ Régulier (Maison, Appartement, Bureau)\n○ Post-Construction\n\n📍 ÉTAPE 4: Remplir les informations client\n• Nom du client\n• Téléphone\n• Email\n• Adresse complète\n• Type de propriété\n\n📍 ÉTAPE 5A: Si Régulier\n✅ Sélectionnez les zones de la liste:\n   ☑️ Salles de bain (2)\n   ☑️ Cuisine (1)\n   ☑️ Chambres (3)\n\n📍 ÉTAPE 5B: Si Post-Construction\n✏️ Écrivez la description du projet\n☐ Marquez si a une durée spécifique\n\n📍 ÉTAPE 6: Assigner des travailleurs\nSélectionnez travailleurs et marquez le responsable ⭐\n\n📍 ÉTAPE 7: Configurer les détails\n• Date programmée\n• Priorité (Basse/Moyenne/Haute)\n• Notes additionnelles\n\n📍 ÉTAPE 8: Créer\n✅ Appuyez sur "Créer commande"\n\n⚠️ Notification sera envoyée aux travailleurs',

  'manager', 5, TRUE, TRUE
);

-- ================================================
-- 5. CONFIGURACIÓN INICIAL DE LA EMPRESA
-- ================================================

INSERT INTO `company_settings` (
  `company_name`, `manager_name`, `phone`, `email`, `address`, `website`
) VALUES (
  'JD Cleaning Services',
  NULL,
  '+1 XXX XXX XXXX',
  'jdireports@gmail.com',
  NULL,
  'www.jdcleaningservices.com'
);

-- ================================================
-- 6. ACTUALIZAR SYSTEM_SETTINGS
-- ================================================

-- Actualizar configuraciones existentes
UPDATE `system_settings` SET `setting_value` = '50' WHERE `setting_key` = 'max_photos_per_order';
UPDATE `system_settings` SET `setting_value` = '1920' WHERE `setting_key` = 'image_max_width';
UPDATE `system_settings` SET `setting_value` = '90' WHERE `setting_key` = 'image_quality';
UPDATE `system_settings` SET `setting_value` = 'en' WHERE `setting_key` = 'default_language';

-- Agregar nuevas configuraciones
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`) VALUES
('max_photos_per_area', '4', 'Máximo número de fotos por área (limpieza regular)'),
('max_photos_per_daily_report', '50', 'Máximo número de fotos por reporte diario (post-construcción)'),
('min_photos_regular', '10', 'Mínimo de fotos para finalizar limpieza regular'),
('min_photos_post_construction', '10', 'Mínimo de fotos para finalizar post-construcción'),
('smtp_host', 'smtp.gmail.com', 'Servidor SMTP para envío de emails'),
('smtp_port', '587', 'Puerto SMTP'),
('smtp_user', 'jdireports@gmail.com', 'Usuario SMTP'),
('smtp_from_name', 'JDI Reports', 'Nombre del remitente de emails'),
('backup_enabled', 'true', 'Activar respaldos automáticos'),
('backup_frequency', 'monthly', 'Frecuencia de respaldos: daily, weekly, monthly'),
('backup_retention_days', '180', 'Días de retención de respaldos (6 meses)'),
('gps_required', 'true', 'GPS obligatorio para iniciar órdenes'),
('chat_image_max_size', '5', 'Tamaño máximo de imágenes en chat (MB)'),
('chat_max_images_per_message', '3', 'Máximo de imágenes por mensaje de chat')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

-- ================================================
-- DATOS INICIALES COMPLETADOS
-- ================================================
-- Total insertado:
-- - 15 Áreas de limpieza
-- - 23 Materiales
-- - 15 Mensajes motivacionales
-- - 5 Tutoriales básicos
-- - 1 Configuración de empresa
-- - 14 Configuraciones del sistema
-- ================================================
