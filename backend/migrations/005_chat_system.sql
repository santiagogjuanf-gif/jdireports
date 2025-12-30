-- ================================================
-- MIGRACIÓN 005: SISTEMA DE CHAT
-- JD CLEANING SERVICES
-- ================================================

-- Tabla de conversaciones
CREATE TABLE IF NOT EXISTS conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NULL COMMENT 'Título de la conversación (para grupos)',
  is_group BOOLEAN DEFAULT 0 COMMENT 'Si es conversación grupal o directa',
  created_by INT NOT NULL COMMENT 'Usuario que creó la conversación',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_message_at TIMESTAMP NULL COMMENT 'Fecha del último mensaje',

  INDEX idx_created_by (created_by),
  INDEX idx_last_message_at (last_message_at),

  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Conversaciones de chat (directas o grupales)';

-- Tabla de participantes de conversaciones
CREATE TABLE IF NOT EXISTS conversation_participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  user_id INT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_conversation_id (conversation_id),
  INDEX idx_user_id (user_id),
  UNIQUE KEY unique_participant (conversation_id, user_id),

  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Participantes de cada conversación';

-- Tabla de mensajes
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,
  content TEXT NULL COMMENT 'Contenido del mensaje',
  reply_to_message_id INT NULL COMMENT 'ID del mensaje al que responde',
  is_read BOOLEAN DEFAULT 0 COMMENT 'Si el mensaje ha sido leído',
  read_at TIMESTAMP NULL COMMENT 'Fecha de lectura',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_conversation_id (conversation_id),
  INDEX idx_sender_id (sender_id),
  INDEX idx_created_at (created_at),
  INDEX idx_is_read (is_read),
  INDEX idx_reply_to (reply_to_message_id),

  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reply_to_message_id) REFERENCES messages(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Mensajes de chat';

-- Tabla de imágenes de mensajes
CREATE TABLE IF NOT EXISTS message_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL COMMENT 'URL de la imagen',
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_message_id (message_id),

  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Imágenes adjuntas a mensajes (máximo 3 por mensaje)';

-- ================================================
-- TRIGGERS
-- ================================================

-- Trigger para actualizar last_message_at en conversations
DELIMITER //

CREATE TRIGGER after_message_insert
AFTER INSERT ON messages
FOR EACH ROW
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
END//

DELIMITER ;

-- ================================================
-- ÍNDICES ADICIONALES PARA RENDIMIENTO
-- ================================================

-- Índice compuesto para consultas de mensajes no leídos por conversación
CREATE INDEX idx_conversation_unread ON messages (conversation_id, is_read, created_at);

-- Índice para búsqueda de conversaciones de un usuario
CREATE INDEX idx_user_conversations ON conversation_participants (user_id, conversation_id);
