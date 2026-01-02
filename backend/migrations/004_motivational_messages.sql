-- ================================================
-- MIGRACIÓN 004: MENSAJES MOTIVACIONALES CON EMOJIS
-- JD CLEANING SERVICES
-- ================================================
-- Inserta 27 mensajes motivacionales categorizados
-- con emojis y soporte multi-idioma (ES, EN, FR)
-- ================================================

USE jd_cleaning_services;

-- Mensajes de Motivación General (10 mensajes)
INSERT INTO motivational_messages (message_es, message_en, message_fr, emoji, is_active, is_default) VALUES
('✨ ¡Excelente trabajo! Tu dedicación marca la diferencia.', '✨ Excellent work! Your dedication makes a difference.', '✨ Excellent travail! Votre dévouement fait la différence.', '✨', 1, 1),
('💪 El esfuerzo de hoy es el éxito de mañana.', '💪 Today\'s effort is tomorrow\'s success.', '💪 L\'effort d\'aujourd\'hui est le succès de demain.', '💪', 1, 1),
('🌟 Cada espacio limpio es una obra maestra.', '🌟 Every clean space is a masterpiece.', '🌟 Chaque espace propre est un chef-d\'œuvre.', '🌟', 1, 1),
('🎯 La precisión y el cuidado son tu firma.', '🎯 Precision and care are your signature.', '🎯 La précision et le soin sont votre signature.', '🎯', 1, 1),
('😊 Cada espacio limpio es una sonrisa más.', '😊 Every clean space is one more smile.', '😊 Chaque espace propre est un sourire de plus.', '😊', 1, 1),
('🚀 Juntos llevamos la limpieza al siguiente nivel.', '🚀 Together we take cleaning to the next level.', '🚀 Ensemble, nous portons le nettoyage au niveau supérieur.', '🚀', 1, 1),
('🎉 Tu trabajo transforma espacios y vidas.', '🎉 Your work transforms spaces and lives.', '🎉 Votre travail transforme les espaces et les vies.', '🎉', 1, 1),
('💯 La calidad no es casualidad, es compromiso.', '💯 Quality is not by chance, it\'s commitment.', '💯 La qualité n\'est pas un hasard, c\'est un engagement.', '💯', 1, 1),
('🌈 Cada día es una oportunidad para brillar.', '🌈 Every day is an opportunity to shine.', '🌈 Chaque jour est une opportunité de briller.', '🌈', 1, 1),
('🔥 Tu pasión por el trabajo bien hecho inspira.', '🔥 Your passion for a job well done inspires.', '🔥 Votre passion pour un travail bien fait inspire.', '🔥', 1, 1),

-- Mensajes de Seguridad (5 mensajes)
('🦺 Recuerda usar tu equipo de protección.', '🦺 Remember to use your protective equipment.', '🦺 N\'oubliez pas d\'utiliser votre équipement de protection.', '🦺', 1, 1),
('⚠️ La seguridad primero, siempre.', '⚠️ Safety first, always.', '⚠️ La sécurité d\'abord, toujours.', '⚠️', 1, 1),
('🧤 Protege tus manos, son tus herramientas.', '🧤 Protect your hands, they are your tools.', '🧤 Protégez vos mains, elles sont vos outils.', '🧤', 1, 1),
('📋 Lee las etiquetas de los productos químicos.', '📋 Read the chemical product labels.', '📋 Lisez les étiquettes des produits chimiques.', '📋', 1, 1),
('⚡ Trabaja seguro, regresa a casa sano.', '⚡ Work safe, return home healthy.', '⚡ Travaillez en sécurité, rentrez chez vous en bonne santé.', '⚡', 1, 1),

-- Mensajes de Calidad (5 mensajes)
('⭐ Los detalles pequeños hacen la gran diferencia.', '⭐ Small details make the big difference.', '⭐ Les petits détails font la grande différence.', '⭐', 1, 1),
('🔍 Inspecciona cada rincón con atención.', '🔍 Inspect every corner with attention.', '🔍 Inspectez chaque coin avec attention.', '🔍', 1, 1),
('🏆 La excelencia es nuestro estándar.', '🏆 Excellence is our standard.', '🏆 L\'excellence est notre norme.', '🏆', 1, 1),
('💎 Entrega calidad superior en cada servicio.', '💎 Deliver superior quality in every service.', '💎 Offrez une qualité supérieure à chaque service.', '💎', 1, 1),
('✅ Verifica tu trabajo antes de finalizar.', '✅ Check your work before finishing.', '✅ Vérifiez votre travail avant de terminer.', '✅', 1, 1),

-- Mensajes de Trabajo en Equipo (4 mensajes)
('🤝 Juntos somos más fuertes.', '🤝 Together we are stronger.', '🤝 Ensemble, nous sommes plus forts.', '🤝', 1, 1),
('❤️ El trabajo en equipo hace el sueño realidad.', '❤️ Teamwork makes the dream work.', '❤️ Le travail d\'équipe réalise le rêve.', '❤️', 1, 1),
('💬 Comunícate, comparte, colabora.', '💬 Communicate, share, collaborate.', '💬 Communiquez, partagez, collaborez.', '💬', 1, 1),
('👥 Apoyémonos mutuamente.', '👥 Let\'s support each other.', '👥 Soutenons-nous mutuellement.', '👥', 1, 1),

-- Mensajes de Consejos Prácticos (3 mensajes)
('🛒 Verifica tu inventario antes de salir.', '🛒 Check your inventory before leaving.', '🛒 Vérifiez votre inventaire avant de partir.', '🛒', 1, 1),
('⬆️ Limpia de arriba hacia abajo.', '⬆️ Clean from top to bottom.', '⬆️ Nettoyez de haut en bas.', '⬆️', 1, 1),
('📸 Documenta tu trabajo con fotos de calidad.', '📸 Document your work with quality photos.', '📸 Documentez votre travail avec des photos de qualité.', '📸', 1, 1);

-- ================================================
-- MIGRACIÓN 004 COMPLETADA
-- Total: 27 mensajes motivacionales con emojis
-- Categorías: Motivación (10), Seguridad (5),
--             Calidad (5), Equipo (4), Consejos (3)
-- ================================================
