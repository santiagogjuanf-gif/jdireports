-- ================================================
-- JDI REPORTS - SISTEMA COMPLETO
-- Script de Migración y Actualización
-- ================================================
-- Fecha: 2025-01-15
-- Descripción: Migración completa del sistema con:
--   - Limpieza Regular
--   - Limpieza Post-Construcción
--   - Sistema de Tutoriales
--   - Gestión de Materiales
--   - Mensajes Motivacionales
--   - Sistema de Chat
--   - Y más...
-- ================================================

USE jd_cleaning_services;

SET FOREIGN_KEY_CHECKS = 0;

-- ================================================
-- 1. MODIFICACIONES A TABLAS EXISTENTES
-- ================================================

-- ------------------------------------------------
-- 1.1 MODIFICAR TABLA: users
-- ------------------------------------------------
ALTER TABLE `users`
ADD COLUMN IF NOT EXISTS `username` VARCHAR(50) UNIQUE AFTER `email`,
ADD COLUMN IF NOT EXISTS `password_reset_required` BOOLEAN DEFAULT TRUE AFTER `password`,
ADD COLUMN IF NOT EXISTS `password_changed_at` TIMESTAMP NULL AFTER `password_reset_required`,
ADD COLUMN IF NOT EXISTS `last_password_reset_by` INT NULL AFTER `password_changed_at`,
ADD COLUMN IF NOT EXISTS `preferred_language` ENUM('es', 'en', 'fr') DEFAULT 'es' AFTER `last_password_reset_by`,
ADD COLUMN IF NOT EXISTS `phone` VARCHAR(20) NULL AFTER `preferred_language`;

-- Índices para users
CREATE INDEX IF NOT EXISTS idx_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_preferred_language ON users(preferred_language);

-- ------------------------------------------------
-- 1.2 MODIFICAR TABLA: orders
-- ------------------------------------------------
ALTER TABLE `orders`
ADD COLUMN IF NOT EXISTS `order_number` VARCHAR(20) UNIQUE AFTER `id`,
ADD COLUMN IF NOT EXISTS `order_type` ENUM('regular', 'post_construction') DEFAULT 'regular' AFTER `order_number`,
ADD COLUMN IF NOT EXISTS `client_name` VARCHAR(100) AFTER `order_type`,
ADD COLUMN IF NOT EXISTS `client_phone` VARCHAR(20) AFTER `client_name`,
ADD COLUMN IF NOT EXISTS `client_email` VARCHAR(100) AFTER `client_phone`,
ADD COLUMN IF NOT EXISTS `property_type` ENUM('house', 'apartment', 'office', 'commercial', 'building') AFTER `client_email`,
ADD COLUMN IF NOT EXISTS `project_description` TEXT AFTER `property_type`,
ADD COLUMN IF NOT EXISTS `has_duration` BOOLEAN DEFAULT FALSE AFTER `project_description`,
ADD COLUMN IF NOT EXISTS `duration_start_date` DATE NULL AFTER `has_duration`,
ADD COLUMN IF NOT EXISTS `duration_end_date` DATE NULL AFTER `duration_start_date`,
ADD COLUMN IF NOT EXISTS `estimated_hours` DECIMAL(5,2) NULL AFTER `duration_end_date`,
ADD COLUMN IF NOT EXISTS `priority` ENUM('low', 'medium', 'high') DEFAULT 'medium' AFTER `estimated_hours`,
ADD COLUMN IF NOT EXISTS `started_at` TIMESTAMP NULL AFTER `priority`,
ADD COLUMN IF NOT EXISTS `paused_at` TIMESTAMP NULL AFTER `started_at`,
ADD COLUMN IF NOT EXISTS `start_gps_latitude` DECIMAL(10,8) NULL AFTER `paused_at`,
ADD COLUMN IF NOT EXISTS `start_gps_longitude` DECIMAL(11,8) NULL AFTER `start_gps_latitude`,
ADD COLUMN IF NOT EXISTS `end_gps_latitude` DECIMAL(10,8) NULL AFTER `start_gps_longitude`,
ADD COLUMN IF NOT EXISTS `end_gps_longitude` DECIMAL(11,8) NULL AFTER `end_gps_latitude`,
ADD COLUMN IF NOT EXISTS `client_signature_data` LONGTEXT NULL AFTER `end_gps_longitude`,
ADD COLUMN IF NOT EXISTS `client_signature_ip` VARCHAR(45) NULL AFTER `client_signature_data`,
ADD COLUMN IF NOT EXISTS `signed_at` TIMESTAMP NULL AFTER `client_signature_ip`,
ADD COLUMN IF NOT EXISTS `signature_type` ENUM('client', 'worker') DEFAULT 'client' AFTER `signed_at`,
ADD COLUMN IF NOT EXISTS `signed_by_user_id` INT NULL AFTER `signature_type`,
ADD COLUMN IF NOT EXISTS `final_notes` TEXT NULL AFTER `signed_by_user_id`,
ADD COLUMN IF NOT EXISTS `pdf_generated` BOOLEAN DEFAULT FALSE AFTER `final_notes`,
ADD COLUMN IF NOT EXISTS `pdf_path` VARCHAR(500) NULL AFTER `pdf_generated`,
ADD COLUMN IF NOT EXISTS `pdf_description` TEXT NULL AFTER `pdf_path`,
ADD COLUMN IF NOT EXISTS `pdf_generated_by` INT NULL AFTER `pdf_description`,
ADD COLUMN IF NOT EXISTS `pdf_generated_at` TIMESTAMP NULL AFTER `pdf_generated_by`;

-- Índices para orders
CREATE INDEX IF NOT EXISTS idx_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_property_type ON orders(property_type);
CREATE INDEX IF NOT EXISTS idx_priority ON orders(priority);
CREATE INDEX IF NOT EXISTS idx_client_name ON orders(client_name);

-- ------------------------------------------------
-- 1.3 MODIFICAR TABLA: order_assignments
-- ------------------------------------------------
ALTER TABLE `order_assignments`
ADD COLUMN IF NOT EXISTS `is_responsible` BOOLEAN DEFAULT FALSE AFTER `user_id`;

-- Índice para responsable
CREATE INDEX IF NOT EXISTS idx_responsible ON order_assignments(is_responsible);

-- ------------------------------------------------
-- 1.4 MODIFICAR TABLA: order_photos
-- ------------------------------------------------
ALTER TABLE `order_photos`
ADD COLUMN IF NOT EXISTS `order_area_id` INT NULL AFTER `order_id`,
ADD COLUMN IF NOT EXISTS `daily_report_id` INT NULL AFTER `order_area_id`,
ADD COLUMN IF NOT EXISTS `thumbnail_path` VARCHAR(500) NULL AFTER `file_path`,
ADD COLUMN IF NOT EXISTS `has_watermark` BOOLEAN DEFAULT FALSE AFTER `height`,
ADD COLUMN IF NOT EXISTS `gps_latitude` DECIMAL(10,8) NULL AFTER `has_watermark`,
ADD COLUMN IF NOT EXISTS `gps_longitude` DECIMAL(11,8) NULL AFTER `gps_latitude`;

-- ------------------------------------------------
-- 1.5 MODIFICAR TABLA: notifications
-- ------------------------------------------------
ALTER TABLE `notifications`
MODIFY COLUMN `type` ENUM(
  'order_assigned',
  'order_reassigned',
  'order_completed',
  'order_cancelled',
  'order_started',
  'order_paused',
  'chat_message',
  'inventory_approved',
  'inventory_rejected',
  'inventory_delivered',
  'system'
) NOT NULL,
ADD COLUMN IF NOT EXISTS `related_data` JSON NULL AFTER `message`,
ADD COLUMN IF NOT EXISTS `read_at` TIMESTAMP NULL AFTER `is_read`;

-- ================================================
-- 2. CREAR NUEVAS TABLAS
-- ================================================

-- ------------------------------------------------
-- 2.1 TABLA: cleaning_areas (Catálogo de Áreas)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS `cleaning_areas` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `name_key` VARCHAR(50) UNIQUE NOT NULL COMMENT 'Key en inglés: bathroom, kitchen, etc',
  `name_es` VARCHAR(100) NOT NULL,
  `name_en` VARCHAR(100) NOT NULL,
  `name_fr` VARCHAR(100) NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `display_order` INT DEFAULT 0,
  `created_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_name_key ON cleaning_areas(name_key);
CREATE INDEX idx_is_active ON cleaning_areas(is_active);
CREATE INDEX idx_display_order ON cleaning_areas(display_order);

-- ------------------------------------------------
-- 2.2 TABLA: order_areas (Áreas de Órdenes Regulares)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_areas` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `order_id` INT NOT NULL,
  `area_id` INT NULL COMMENT 'NULL si es área personalizada',
  `custom_area_name` VARCHAR(100) NULL COMMENT 'Solo si área personalizada',
  `quantity` INT DEFAULT 1,
  `is_completed` BOOLEAN DEFAULT FALSE,
  `completed_at` TIMESTAMP NULL,
  `completed_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`area_id`) REFERENCES `cleaning_areas`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`completed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_order_area ON order_areas(order_id);
CREATE INDEX idx_area ON order_areas(area_id);
CREATE INDEX idx_is_completed ON order_areas(is_completed);

-- Agregar FK a order_photos
ALTER TABLE `order_photos`
ADD CONSTRAINT fk_order_photos_area FOREIGN KEY (`order_area_id`) REFERENCES `order_areas`(`id`) ON DELETE CASCADE;

-- ------------------------------------------------
-- 2.3 TABLA: daily_reports (Reportes Post-Construcción)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS `daily_reports` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `order_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `report_date` DATE NOT NULL,
  `description` TEXT NOT NULL,
  `photo_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_order_report ON daily_reports(order_id);
CREATE INDEX idx_report_date ON daily_reports(report_date);
CREATE INDEX idx_user_report ON daily_reports(user_id);

-- Agregar FK a order_photos
ALTER TABLE `order_photos`
ADD CONSTRAINT fk_order_photos_report FOREIGN KEY (`daily_report_id`) REFERENCES `daily_reports`(`id`) ON DELETE CASCADE;

-- ------------------------------------------------
-- 2.4 TABLA: order_messages (Chat de Órdenes)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_messages` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `order_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `message_type` ENUM('text', 'image') DEFAULT 'text',
  `message_text` TEXT NULL,
  `image_path` VARCHAR(500) NULL,
  `read_by` JSON NULL COMMENT 'Array de user_ids que leyeron',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_order_messages ON order_messages(order_id);
CREATE INDEX idx_message_user ON order_messages(user_id);
CREATE INDEX idx_created_at_msg ON order_messages(created_at);

-- ------------------------------------------------
-- 2.5 TABLA: materials (Catálogo de Materiales)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS `materials` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `name_es` VARCHAR(100) NOT NULL,
  `name_en` VARCHAR(100) NOT NULL,
  `name_fr` VARCHAR(100) NOT NULL,
  `category` VARCHAR(50) NULL COMMENT 'cleaning, tools, etc',
  `is_active` BOOLEAN DEFAULT TRUE,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_category ON materials(category);
CREATE INDEX idx_is_active_mat ON materials(is_active);

-- ------------------------------------------------
-- 2.6 TABLA: material_requests (Solicitudes)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS `material_requests` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `requested_by` INT NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected', 'delivered') DEFAULT 'pending',
  `notes` TEXT NULL,
  `approved_by` INT NULL,
  `approved_at` TIMESTAMP NULL,
  `rejected_reason` TEXT NULL,
  `delivered_by` INT NULL,
  `delivered_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`delivered_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_status_req ON material_requests(status);
CREATE INDEX idx_requested_by ON material_requests(requested_by);

-- ------------------------------------------------
-- 2.7 TABLA: material_request_items
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS `material_request_items` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `material_request_id` INT NOT NULL,
  `material_id` INT NULL,
  `custom_item_name` VARCHAR(100) NULL COMMENT 'Si no está en catálogo',
  `quantity_requested` INT NOT NULL,
  `quantity_approved` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`material_request_id`) REFERENCES `material_requests`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_request_items ON material_request_items(material_request_id);

-- ------------------------------------------------
-- 2.8 TABLA: motivational_messages
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS `motivational_messages` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `message_es` VARCHAR(200) NOT NULL,
  `message_en` VARCHAR(200) NOT NULL,
  `message_fr` VARCHAR(200) NOT NULL,
  `emoji` VARCHAR(10) NULL COMMENT 'Unicode emoji',
  `is_active` BOOLEAN DEFAULT TRUE,
  `is_default` BOOLEAN DEFAULT FALSE COMMENT 'Mensajes predeterminados del sistema',
  `created_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_is_active_msg ON motivational_messages(is_active);
CREATE INDEX idx_is_default ON motivational_messages(is_default);

-- ------------------------------------------------
-- 2.9 TABLA: manager_permissions
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS `manager_permissions` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT UNIQUE NOT NULL,
  `can_create_orders` BOOLEAN DEFAULT FALSE,
  `can_edit_orders` BOOLEAN DEFAULT FALSE,
  `can_delete_orders` BOOLEAN DEFAULT FALSE,
  `can_cancel_orders` BOOLEAN DEFAULT FALSE,
  `can_assign_workers` BOOLEAN DEFAULT FALSE,
  `can_reassign_workers` BOOLEAN DEFAULT FALSE,
  `can_generate_pdf` BOOLEAN DEFAULT FALSE,
  `can_view_inventory` BOOLEAN DEFAULT FALSE,
  `can_approve_inventory` BOOLEAN DEFAULT FALSE,
  `can_configure_system` BOOLEAN DEFAULT FALSE,
  `updated_by` INT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_user_permissions ON manager_permissions(user_id);

-- ------------------------------------------------
-- 2.10 TABLA: tutorials
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS `tutorials` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `title_es` VARCHAR(255) NOT NULL,
  `title_en` VARCHAR(255) NOT NULL,
  `title_fr` VARCHAR(255) NOT NULL,
  `content_es` TEXT NOT NULL,
  `content_en` TEXT NOT NULL,
  `content_fr` TEXT NOT NULL,
  `target_role` ENUM('all', 'worker', 'manager', 'jefe', 'admin') DEFAULT 'all',
  `display_order` INT DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `is_default` BOOLEAN DEFAULT FALSE COMMENT 'Tutoriales predeterminados',
  `created_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_target_role ON tutorials(target_role);
CREATE INDEX idx_is_active_tut ON tutorials(is_active);
CREATE INDEX idx_display_order_tut ON tutorials(display_order);

-- ------------------------------------------------
-- 2.11 TABLA: company_settings (Info de la Empresa)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS `company_settings` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `company_name` VARCHAR(100) DEFAULT 'JD Cleaning Services',
  `manager_name` VARCHAR(100) NULL,
  `phone` VARCHAR(20) NULL,
  `email` VARCHAR(100) NULL,
  `address` TEXT NULL,
  `website` VARCHAR(255) NULL,
  `logo_path` VARCHAR(500) NULL,
  `updated_by` INT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------
-- 2.12 TABLA: notification_settings (Preferencias)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS `notification_settings` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT UNIQUE NOT NULL,
  `email_order_assigned` BOOLEAN DEFAULT TRUE,
  `email_order_reassigned` BOOLEAN DEFAULT TRUE,
  `email_order_completed` BOOLEAN DEFAULT TRUE,
  `email_order_cancelled` BOOLEAN DEFAULT TRUE,
  `email_chat_message` BOOLEAN DEFAULT FALSE,
  `email_inventory_approved` BOOLEAN DEFAULT TRUE,
  `email_inventory_rejected` BOOLEAN DEFAULT TRUE,
  `email_inventory_delivered` BOOLEAN DEFAULT TRUE,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_user_notif_settings ON notification_settings(user_id);

SET FOREIGN_KEY_CHECKS = 1;

-- ================================================
-- SCRIPT COMPLETADO
-- ================================================
-- Siguiente paso: Ejecutar script de datos iniciales
-- ================================================
