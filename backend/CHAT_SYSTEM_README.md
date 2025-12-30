# Sistema de Chat en Tiempo Real - JD Cleaning Services

Sistema de mensajería en tiempo real implementado con Socket.IO que permite comunicación entre usuarios del sistema.

## 📋 Características

### ✅ Conversaciones

- **Conversaciones directas**: Chat privado entre dos usuarios
- **Conversaciones grupales**: Chat entre múltiples usuarios con título personalizado
- **Detección automática**: Si una conversación 1-a-1 ya existe, se reutiliza en lugar de crear duplicados
- **Gestión de participantes**: Agregar/eliminar participantes de grupos

### ✅ Mensajes

- **Mensajes de texto**: Envío de mensajes de texto con soporte UTF-8
- **Imágenes**: Hasta 3 imágenes por mensaje
- **Respuestas**: Reply a mensajes específicos
- **Indicador de lectura**: Marca de leído/no leído
- **Historial completo**: Paginación de mensajes antiguos

### ✅ Características en Tiempo Real

- **Socket.IO**: Comunicación bidireccional en tiempo real
- **Typing indicators**: Indicadores de "escribiendo..."
- **Estado de usuarios**: Lista de usuarios conectados/desconectados
- **Notificaciones**: Alertas en tiempo real de nuevos mensajes
- **Sala por conversación**: Cada conversación es una sala de Socket.IO separada

## 🗄️ Estructura de Base de Datos

### Tabla: `conversations`

```sql
CREATE TABLE conversations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NULL,           -- Solo para grupos
  is_group BOOLEAN DEFAULT 0,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_message_at TIMESTAMP NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### Tabla: `conversation_participants`

```sql
CREATE TABLE conversation_participants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id INT NOT NULL,
  user_id INT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (conversation_id, user_id),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Tabla: `messages`

```sql
CREATE TABLE messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,
  content TEXT NULL,
  reply_to_message_id INT NULL,
  is_read BOOLEAN DEFAULT 0,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reply_to_message_id) REFERENCES messages(id) ON DELETE SET NULL
);
```

### Tabla: `message_images`

```sql
CREATE TABLE message_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  message_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);
```

## 🔌 API REST

### Conversaciones

#### Crear o Obtener Conversación

```http
POST /api/chat/conversations
Authorization: Bearer <token>
Content-Type: application/json

{
  "participantIds": [2, 3, 4],
  "title": "Equipo de limpieza - Proyecto X",  // Opcional, solo para grupos
  "isGroup": true  // Opcional, default: false
}
```

#### Listar Conversaciones del Usuario

```http
GET /api/chat/conversations
Authorization: Bearer <token>
```

Respuesta incluye:
- Detalles de la conversación
- Lista de participantes
- Contador de mensajes no leídos
- Último mensaje enviado

#### Obtener Detalles de Conversación

```http
GET /api/chat/conversations/:conversationId
Authorization: Bearer <token>
```

### Mensajes

#### Obtener Mensajes de Conversación

```http
GET /api/chat/conversations/:conversationId/messages?limit=50&offset=0
Authorization: Bearer <token>
```

Soporta paginación con `limit` y `offset`.

#### Subir Imagen para Chat

```http
POST /api/chat/images
Authorization: Bearer <token>
Content-Type: multipart/form-data

image: <archivo>
```

Devuelve la URL de la imagen que puede usarse en `imageUrls` del mensaje.

### Participantes

#### Agregar Participante a Grupo

```http
POST /api/chat/conversations/:conversationId/participants
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": 5
}
```

#### Salir de Conversación

```http
DELETE /api/chat/conversations/:conversationId/leave
Authorization: Bearer <token>
```

## 🔌 Socket.IO - Eventos en Tiempo Real

### Conexión

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token-here'
  }
});
```

### Eventos del Cliente → Servidor

#### `conversation:join`

Unirse a una conversación para recibir mensajes en tiempo real.

```javascript
socket.emit('conversation:join', {
  conversationId: 123
});
```

#### `conversation:leave`

Salir de una conversación.

```javascript
socket.emit('conversation:leave', {
  conversationId: 123
});
```

#### `message:send`

Enviar un mensaje.

```javascript
socket.emit('message:send', {
  conversationId: 123,
  content: 'Hola, ¿cómo están?',
  imageUrls: ['/uploads/photos/image1.jpg'],  // Opcional, máximo 3
  replyToMessageId: 456  // Opcional
});
```

#### `typing:start`

Indicar que el usuario está escribiendo.

```javascript
socket.emit('typing:start', {
  conversationId: 123
});
```

#### `typing:stop`

Indicar que el usuario dejó de escribir.

```javascript
socket.emit('typing:stop', {
  conversationId: 123
});
```

#### `messages:read`

Marcar mensajes como leídos.

```javascript
socket.emit('messages:read', {
  conversationId: 123,
  messageIds: [1, 2, 3, 4]
});
```

### Eventos del Servidor → Cliente

#### `conversation:joined`

Confirmación de unión a conversación.

```javascript
socket.on('conversation:joined', (data) => {
  console.log('Unido a conversación:', data.conversationId);
});
```

#### `message:new`

Nuevo mensaje recibido.

```javascript
socket.on('message:new', (message) => {
  console.log('Nuevo mensaje:', message);
  // message contiene: id, sender_id, sender_name, content, images, created_at, etc.
});
```

#### `message:sent`

Confirmación de envío de mensaje.

```javascript
socket.on('message:sent', (data) => {
  console.log('Mensaje enviado exitosamente:', data.message);
});
```

#### `user:joined`

Usuario se unió a la conversación.

```javascript
socket.on('user:joined', (data) => {
  console.log(`${data.userName} se unió a la conversación`);
});
```

#### `user:left`

Usuario salió de la conversación.

```javascript
socket.on('user:left', (data) => {
  console.log(`${data.userName} salió de la conversación`);
});
```

#### `user:typing`

Usuario está escribiendo.

```javascript
socket.on('user:typing', (data) => {
  console.log(`${data.userName} está escribiendo...`);
});
```

#### `user:stopped-typing`

Usuario dejó de escribir.

```javascript
socket.on('user:stopped-typing', (data) => {
  console.log(`${data.userName} dejó de escribir`);
});
```

#### `messages:read`

Mensajes fueron leídos por otro usuario.

```javascript
socket.on('messages:read', (data) => {
  console.log(`${data.readByName} leyó los mensajes:`, data.messageIds);
});
```

#### `users:online`

Lista de usuarios conectados actualizada.

```javascript
socket.on('users:online', (data) => {
  console.log('Usuarios en línea:', data.users);
  // users: [{ id, name, role }, ...]
});
```

#### `error`

Error en alguna operación.

```javascript
socket.on('error', (error) => {
  console.error('Error:', error.message);
});
```

## 📱 Ejemplo de Implementación en Frontend

### Conexión y Setup

```javascript
import { useState, useEffect } from 'react';
import io from 'socket.io-client';

function ChatApp() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    // Conectar al servidor
    const newSocket = io('http://localhost:3000', {
      auth: {
        token: localStorage.getItem('authToken')
      }
    });

    // Listeners
    newSocket.on('users:online', (data) => {
      setOnlineUsers(data.users);
    });

    newSocket.on('message:new', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return (
    // Tu UI aquí
  );
}
```

### Enviar Mensaje

```javascript
function sendMessage(conversationId, content, images = []) {
  if (!socket) return;

  socket.emit('message:send', {
    conversationId,
    content,
    imageUrls: images
  });
}
```

### Typing Indicator

```javascript
function handleInputChange(e) {
  const value = e.target.value;
  setMessage(value);

  // Emitir typing start
  if (value && !isTyping) {
    socket.emit('typing:start', { conversationId });
    setIsTyping(true);
  }

  // Limpiar timeout anterior
  clearTimeout(typingTimeout);

  // Emitir typing stop después de 2 segundos de inactividad
  const timeout = setTimeout(() => {
    socket.emit('typing:stop', { conversationId });
    setIsTyping(false);
  }, 2000);

  setTypingTimeout(timeout);
}
```

## 🔒 Seguridad

- **Autenticación JWT**: Todos los sockets requieren token válido
- **Verificación de acceso**: Solo participantes pueden ver/enviar mensajes
- **Rate limiting**: Límites de requests para prevenir spam
- **Validación de imágenes**: Formato y tamaño verificados
- **SQL injection**: Queries parametrizadas
- **XSS protection**: Sanitización de contenido

## 🚀 Despliegue

### Variables de Entorno

```env
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=https://yourdomain.com
PORT=3000
```

### Iniciar Servidor

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

El servidor Socket.IO se inicia automáticamente junto con Express.

## 📊 Límites y Restricciones

- **Imágenes por mensaje**: Máximo 3
- **Tamaño de imagen**: Máximo 5MB
- **Formatos permitidos**: JPG, PNG, WEBP
- **Mensajes por página**: 50 (configurable con query param)
- **Timeout de typing**: 2 segundos de inactividad

## 🐛 Debugging

### Logs del Servidor

El servidor emite logs detallados:

```
✅ Usuario conectado al chat: Juan Pérez (ID: 123)
❌ Usuario desconectado: María García (ID: 456)
```

### Verificar Conexión Socket.IO

```javascript
socket.on('connect', () => {
  console.log('✅ Conectado al servidor');
  console.log('Socket ID:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado del servidor');
});
```

## 📚 Referencias

- [Socket.IO Documentation](https://socket.io/docs/)
- [Express.js](https://expressjs.com/)
- [MySQL2](https://www.npmjs.com/package/mysql2)
