-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 10-09-2025 a las 09:14:22
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `jd_cleaning_services`
--

DELIMITER $$
--
-- Procedimientos
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `CompleteOrder` (IN `p_order_id` INT, IN `p_user_id` INT)   BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Actualizar el estado de la orden
    UPDATE orders 
    SET status = 'completada', completed_at = NOW()
    WHERE id = p_order_id;
    
    -- Cerrar todas las sesiones de trabajo activas
    UPDATE work_times 
    SET end_time = NOW(), is_active = false
    WHERE order_id = p_order_id AND is_active = true;
    
    -- Registrar en el log de actividades
    INSERT INTO activity_logs (user_id, order_id, action, description)
    VALUES (p_user_id, p_order_id, 'orden_completada', 'Orden marcada como completada');
    
    COMMIT;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `order_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `user_id`, `order_id`, `action`, `description`, `ip_address`, `user_agent`, `created_at`) VALUES
(1, 4, NULL, 'login', 'Usuario Administrador inició sesión', '::ffff:127.0.0.1', 'got (https://github.com/sindresorhus/got)', '2025-09-09 10:28:26'),
(2, 4, NULL, 'users_listed', 'Usuario Administrador listó usuarios (página 1)', '::ffff:127.0.0.1', 'Thunder Client (https://www.thunderclient.com)', '2025-09-09 10:49:24'),
(3, 4, NULL, 'user_created', 'Usuario Juan Pérez (trabajador) creado por Administrador', '::ffff:127.0.0.1', 'Thunder Client (https://www.thunderclient.com)', '2025-09-09 10:51:11'),
(4, 4, NULL, 'users_listed', 'Usuario Administrador listó usuarios (página 1)', '::ffff:127.0.0.1', 'Thunder Client (https://www.thunderclient.com)', '2025-09-09 10:58:52'),
(5, 4, 1, 'order_created', 'Orden #1 creada por Administrador', '::ffff:127.0.0.1', 'Thunder Client (https://www.thunderclient.com)', '2025-09-09 11:11:21'),
(6, 4, NULL, 'login', 'Usuario Administrador inició sesión', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-09-10 06:11:07');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `type` enum('nueva_orden','orden_completada','orden_cancelada','orden_reasignada','sistema') NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `is_email_sent` tinyint(1) DEFAULT 0,
  `email_sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `address` text NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `scheduled_date` date NOT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('pendiente','en_progreso','pausada','completada','cancelada') DEFAULT 'pendiente',
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL,
  `canceled_at` timestamp NULL DEFAULT NULL,
  `canceled_reason` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `orders`
--

INSERT INTO `orders` (`id`, `address`, `latitude`, `longitude`, `scheduled_date`, `notes`, `status`, `created_by`, `created_at`, `updated_at`, `completed_at`, `canceled_at`, `canceled_reason`) VALUES
(1, 'Calle Principal 123, Ciudad', NULL, NULL, '2025-09-12', 'Limpieza general de oficina', 'pendiente', 4, '2025-09-09 11:11:21', '2025-09-09 11:11:21', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `order_assignments`
--

CREATE TABLE `order_assignments` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `assigned_by` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `order_assignments`
--

INSERT INTO `order_assignments` (`id`, `order_id`, `user_id`, `assigned_at`, `assigned_by`, `is_active`) VALUES
(1, 1, 5, '2025-09-09 11:11:21', 4, 1);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `order_details`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `order_details` (
`id` int(11)
,`address` text
,`scheduled_date` date
,`status` enum('pendiente','en_progreso','pausada','completada','cancelada')
,`notes` text
,`created_at` timestamp
,`created_by_name` varchar(100)
,`assigned_workers` mediumtext
,`total_photos` bigint(21)
,`total_signatures` bigint(21)
,`total_minutes_worked` decimal(43,0)
);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `order_notes`
--

CREATE TABLE `order_notes` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `note_type` enum('trabajador','supervisor','sistema') DEFAULT 'trabajador',
  `content` text NOT NULL,
  `is_important` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `order_photos`
--

CREATE TABLE `order_photos` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int(11) NOT NULL,
  `mime_type` varchar(50) DEFAULT 'image/jpeg',
  `width` int(11) DEFAULT NULL,
  `height` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `signatures`
--

CREATE TABLE `signatures` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `signature_type` enum('trabajador','cliente') NOT NULL,
  `signature_data` longtext NOT NULL,
  `signer_name` varchar(100) NOT NULL,
  `signed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `description` text DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `system_settings`
--

INSERT INTO `system_settings` (`id`, `setting_key`, `setting_value`, `description`, `updated_by`, `updated_at`) VALUES
(1, 'company_name', 'JD Cleaning Services', 'Nombre de la empresa', NULL, '2025-09-09 08:36:05'),
(2, 'max_photos_per_order', '30', 'Máximo número de fotos por orden', NULL, '2025-09-09 08:36:05'),
(3, 'image_max_width', '1080', 'Ancho máximo de las imágenes en píxeles', NULL, '2025-09-09 08:36:05'),
(4, 'image_quality', '85', 'Calidad de compresión de imágenes (1-100)', NULL, '2025-09-09 08:36:05'),
(5, 'email_notifications', 'true', 'Activar notificaciones por email', NULL, '2025-09-09 08:36:05'),
(6, 'push_notifications', 'true', 'Activar notificaciones push', NULL, '2025-09-09 08:36:05'),
(7, 'default_language', 'es', 'Idioma por defecto del sistema', NULL, '2025-09-09 08:36:05'),
(8, 'timezone', 'America/Mexico_City', 'Zona horaria del sistema', NULL, '2025-09-09 08:36:05');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','jefe','gerente','trabajador') NOT NULL DEFAULT 'trabajador',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `is_active`, `created_at`, `updated_at`, `created_by`) VALUES
(4, 'Administrador', 'admin@jdcleaningservices.com', '$2a$12$4Kx0Xq3YAx9Lnvebd5FcAu4WAfHBkRxpiBSFDwGw4.e5gv9yUUtOW', 'admin', 1, '2025-09-09 10:23:07', '2025-09-09 10:27:38', NULL),
(5, 'Juan Pérez', 'juan.perez@jdcleaningservices.com', '$2a$12$tfqLQUdjTtNIv4kSd.BR0eGhsCfYQNMrKicG0j/e6BDn9ZnbFn4QG', 'trabajador', 1, '2025-09-09 10:51:11', '2025-09-09 10:51:11', 4);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `worker_stats`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `worker_stats` (
`id` int(11)
,`name` varchar(100)
,`email` varchar(100)
,`total_orders_assigned` bigint(21)
,`orders_completed` bigint(21)
,`total_minutes_worked` decimal(43,0)
,`total_photos_uploaded` bigint(21)
);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `work_pauses`
--

CREATE TABLE `work_pauses` (
  `id` int(11) NOT NULL,
  `work_time_id` int(11) NOT NULL,
  `pause_start` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `pause_end` timestamp NULL DEFAULT NULL,
  `reason` varchar(100) DEFAULT 'Break',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `work_times`
--

CREATE TABLE `work_times` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `start_time` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `end_time` timestamp NULL DEFAULT NULL,
  `pause_duration` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura para la vista `order_details`
--
DROP TABLE IF EXISTS `order_details`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `order_details`  AS SELECT `o`.`id` AS `id`, `o`.`address` AS `address`, `o`.`scheduled_date` AS `scheduled_date`, `o`.`status` AS `status`, `o`.`notes` AS `notes`, `o`.`created_at` AS `created_at`, `creator`.`name` AS `created_by_name`, group_concat(distinct `workers`.`name` separator ', ') AS `assigned_workers`, count(distinct `op`.`id`) AS `total_photos`, count(distinct `s`.`id`) AS `total_signatures`, coalesce(sum(timestampdiff(MINUTE,`wt`.`start_time`,coalesce(`wt`.`end_time`,current_timestamp())) - `wt`.`pause_duration`),0) AS `total_minutes_worked` FROM ((((((`orders` `o` left join `users` `creator` on(`o`.`created_by` = `creator`.`id`)) left join `order_assignments` `oa` on(`o`.`id` = `oa`.`order_id` and `oa`.`is_active` = 1)) left join `users` `workers` on(`oa`.`user_id` = `workers`.`id`)) left join `order_photos` `op` on(`o`.`id` = `op`.`order_id`)) left join `signatures` `s` on(`o`.`id` = `s`.`order_id`)) left join `work_times` `wt` on(`o`.`id` = `wt`.`order_id`)) GROUP BY `o`.`id`, `o`.`address`, `o`.`scheduled_date`, `o`.`status`, `o`.`notes`, `o`.`created_at`, `creator`.`name` ;

-- --------------------------------------------------------

--
-- Estructura para la vista `worker_stats`
--
DROP TABLE IF EXISTS `worker_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `worker_stats`  AS SELECT `u`.`id` AS `id`, `u`.`name` AS `name`, `u`.`email` AS `email`, count(distinct `oa`.`order_id`) AS `total_orders_assigned`, count(distinct case when `o`.`status` = 'completada' then `o`.`id` end) AS `orders_completed`, coalesce(sum(timestampdiff(MINUTE,`wt`.`start_time`,coalesce(`wt`.`end_time`,current_timestamp())) - `wt`.`pause_duration`),0) AS `total_minutes_worked`, count(distinct `op`.`id`) AS `total_photos_uploaded` FROM ((((`users` `u` left join `order_assignments` `oa` on(`u`.`id` = `oa`.`user_id` and `oa`.`is_active` = 1)) left join `orders` `o` on(`oa`.`order_id` = `o`.`id`)) left join `work_times` `wt` on(`u`.`id` = `wt`.`user_id`)) left join `order_photos` `op` on(`u`.`id` = `op`.`user_id`)) WHERE `u`.`role` = 'trabajador' GROUP BY `u`.`id`, `u`.`name`, `u`.`email` ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_activity` (`user_id`),
  ADD KEY `idx_order_activity` (`order_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indices de la tabla `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_notifications` (`user_id`,`is_read`),
  ADD KEY `idx_order_notifications` (`order_id`),
  ADD KEY `idx_notifications_user_unread` (`user_id`,`is_read`,`created_at`);

--
-- Indices de la tabla `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_scheduled_date` (`scheduled_date`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD KEY `idx_orders_status_date` (`status`,`scheduled_date`);

--
-- Indices de la tabla `order_assignments`
--
ALTER TABLE `order_assignments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_active_assignment` (`order_id`,`user_id`,`is_active`),
  ADD KEY `assigned_by` (`assigned_by`),
  ADD KEY `idx_order_user` (`order_id`,`user_id`),
  ADD KEY `idx_user_active` (`user_id`,`is_active`);

--
-- Indices de la tabla `order_notes`
--
ALTER TABLE `order_notes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_order_notes` (`order_id`),
  ADD KEY `idx_note_type` (`note_type`);

--
-- Indices de la tabla `order_photos`
--
ALTER TABLE `order_photos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_photos` (`order_id`),
  ADD KEY `idx_user_photos` (`user_id`);

--
-- Indices de la tabla `signatures`
--
ALTER TABLE `signatures`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_order_signatures` (`order_id`),
  ADD KEY `idx_signature_type` (`signature_type`);

--
-- Indices de la tabla `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_active` (`is_active`);

--
-- Indices de la tabla `work_pauses`
--
ALTER TABLE `work_pauses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_work_time` (`work_time_id`);

--
-- Indices de la tabla `work_times`
--
ALTER TABLE `work_times`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_order_user_time` (`order_id`,`user_id`),
  ADD KEY `idx_active_sessions` (`is_active`),
  ADD KEY `idx_work_times_order_user` (`order_id`,`user_id`,`start_time`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `order_assignments`
--
ALTER TABLE `order_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `order_notes`
--
ALTER TABLE `order_notes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `order_photos`
--
ALTER TABLE `order_photos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `signatures`
--
ALTER TABLE `signatures`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `work_pauses`
--
ALTER TABLE `work_pauses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `work_times`
--
ALTER TABLE `work_times`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `activity_logs_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `order_assignments`
--
ALTER TABLE `order_assignments`
  ADD CONSTRAINT `order_assignments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_assignments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_assignments_ibfk_3` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `order_notes`
--
ALTER TABLE `order_notes`
  ADD CONSTRAINT `order_notes_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_notes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `order_photos`
--
ALTER TABLE `order_photos`
  ADD CONSTRAINT `order_photos_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_photos_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `signatures`
--
ALTER TABLE `signatures`
  ADD CONSTRAINT `signatures_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `signatures_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `system_settings`
--
ALTER TABLE `system_settings`
  ADD CONSTRAINT `system_settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `work_pauses`
--
ALTER TABLE `work_pauses`
  ADD CONSTRAINT `work_pauses_ibfk_1` FOREIGN KEY (`work_time_id`) REFERENCES `work_times` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `work_times`
--
ALTER TABLE `work_times`
  ADD CONSTRAINT `work_times_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `work_times_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
