# ESTRUCTURA DE LA BASE DE DATOS - JD CLEANING SERVICES

## TABLAS Y COLUMNAS COMPLETAS

### 1. users (Usuarios del Sistema)
```sql
id                         INT AUTO_INCREMENT PRIMARY KEY
name                       VARCHAR(100) NOT NULL
email                      VARCHAR(100) UNIQUE NOT NULL
username                   VARCHAR(50) UNIQUE
full_name                  VARCHAR(100)
password                   VARCHAR(255) NOT NULL
role                       ENUM('admin', 'jefe', 'gerente', 'trabajador') NOT NULL
is_active                  BOOLEAN DEFAULT TRUE
password_reset_required    BOOLEAN DEFAULT FALSE
password_changed_at        TIMESTAMP NULL
last_password_reset_by     INT NULL
preferred_language         ENUM('es', 'en', 'fr') DEFAULT 'es'
phone                      VARCHAR(20)
created_at                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
created_by                 INT NULL
```

### 2. orders (Órdenes de Limpieza)
```sql
id                      INT AUTO_INCREMENT PRIMARY KEY
order_number            VARCHAR(20) UNIQUE NOT NULL
order_type              ENUM('regular', 'post_construction') DEFAULT 'regular'
client_name             VARCHAR(100) NOT NULL
client_phone            VARCHAR(20)
client_email            VARCHAR(100)
property_type           ENUM('house', 'apartment', 'office', 'commercial', 'building')
address                 VARCHAR(255) NOT NULL
city                    VARCHAR(100) NOT NULL
scheduled_date          DATE NOT NULL
status                  ENUM('pending', 'assigned', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending'
notes                   TEXT
project_description     TEXT
has_duration            BOOLEAN DEFAULT FALSE
duration_hours          DECIMAL(5,2)
created_by              INT NOT NULL -> users(id)
responsible_worker_id   INT NULL -> users(id)
created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

### 3. cleaning_areas (Áreas de Limpieza)
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
name_key        VARCHAR(100) UNIQUE NOT NULL
name_es         VARCHAR(100) NOT NULL
name_en         VARCHAR(100) NOT NULL
name_fr         VARCHAR(100) NOT NULL
is_active       BOOLEAN DEFAULT TRUE
display_order   INT DEFAULT 0
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```
**DATOS**: 35 áreas en 3 idiomas

### 4. order_areas (Áreas Asignadas a Órdenes)
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
order_id        INT NOT NULL -> orders(id) ON DELETE CASCADE
area_id         INT NOT NULL -> cleaning_areas(id)
is_completed    BOOLEAN DEFAULT FALSE
completed_at    TIMESTAMP NULL
completed_by    INT NULL -> users(id)
notes           TEXT
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### 5. order_assignments (Trabajadores Asignados a Órdenes)
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
order_id        INT NOT NULL -> orders(id) ON DELETE CASCADE
worker_id       INT NOT NULL -> users(id)
assigned_by     INT NOT NULL -> users(id)
assigned_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
is_active       BOOLEAN DEFAULT TRUE
```

### 6. materials (Materiales/Inventario)
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
name            VARCHAR(100) NOT NULL
description     TEXT
unit            ENUM('unit', 'liter', 'kg', 'box', 'pack') NOT NULL
current_stock   DECIMAL(10,2) DEFAULT 0
min_stock       DECIMAL(10,2) DEFAULT 0
is_active       BOOLEAN DEFAULT TRUE
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```
**DATOS**: 22 materiales (8 productos, 8 herramientas, 6 consumibles)

### 7. material_requests (Solicitudes de Material)
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
requester_id    INT NOT NULL -> users(id)
status          ENUM('pending', 'approved', 'rejected', 'delivered') DEFAULT 'pending'
notes           TEXT
approved_by     INT NULL -> users(id)
approved_at     TIMESTAMP NULL
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

### 8. material_request_items (Items de Solicitud)
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
request_id      INT NOT NULL -> material_requests(id) ON DELETE CASCADE
material_id     INT NOT NULL -> materials(id)
quantity        DECIMAL(10,2) NOT NULL
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### 9. motivational_messages (Mensajes Motivacionales)
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
message_es      VARCHAR(255) NOT NULL
message_en      VARCHAR(255) NOT NULL
message_fr      VARCHAR(255) NOT NULL
emoji           VARCHAR(10)
is_active       BOOLEAN DEFAULT TRUE
is_default      BOOLEAN DEFAULT FALSE
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```
**DATOS**: 27 mensajes en 3 idiomas

### 10. daily_reports (Reportes Diarios)
```sql
id                  INT AUTO_INCREMENT PRIMARY KEY
worker_id           INT NOT NULL -> users(id)
report_date         DATE NOT NULL
total_hours         DECIMAL(5,2)
orders_completed    INT DEFAULT 0
notes               TEXT
created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### 11. order_photos (Fotos de Órdenes)
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
order_id        INT NOT NULL -> orders(id) ON DELETE CASCADE
photo_type      ENUM('before', 'during', 'after') NOT NULL
photo_path      VARCHAR(500) NOT NULL
uploaded_by     INT NOT NULL -> users(id)
uploaded_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### 12. signatures (Firmas)
```sql
id                  INT AUTO_INCREMENT PRIMARY KEY
order_id            INT NOT NULL -> orders(id) ON DELETE CASCADE
signature_type      ENUM('worker', 'client') NOT NULL
signature_data      LONGTEXT NOT NULL
signed_by           INT NULL -> users(id)
signed_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### 13. notifications (Notificaciones)
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
user_id         INT NOT NULL -> users(id) ON DELETE CASCADE
title           VARCHAR(200) NOT NULL
message         TEXT NOT NULL
type            ENUM('info', 'warning', 'success', 'error') DEFAULT 'info'
is_read         BOOLEAN DEFAULT FALSE
related_type    VARCHAR(50)
related_id      INT
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### 14. activity_logs (Registro de Actividades)
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
user_id         INT NULL -> users(id) ON DELETE SET NULL
order_id        INT NULL -> orders(id) ON DELETE SET NULL
action_type     VARCHAR(50) NOT NULL
description     TEXT NOT NULL
ip_address      VARCHAR(45)
user_agent      VARCHAR(500)
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### 15. conversations (Conversaciones de Chat)
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
name            VARCHAR(200)
is_group        BOOLEAN DEFAULT FALSE
created_by      INT NOT NULL -> users(id)
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

### 16. messages (Mensajes de Chat)
```sql
id                  INT AUTO_INCREMENT PRIMARY KEY
conversation_id     INT NOT NULL -> conversations(id) ON DELETE CASCADE
sender_id           INT NOT NULL -> users(id)
message             TEXT NOT NULL
is_read             BOOLEAN DEFAULT FALSE
created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

## RELACIONES IMPORTANTES

### Para Crear Órdenes:
1. Crear en `orders` (requiere: client_name, address, city, scheduled_date, created_by)
2. Asignar áreas en `order_areas` (requiere: order_id, area_id)

### Para Asignar Trabajadores:
1. Insertar en `order_assignments` (requiere: order_id, worker_id, assigned_by)
2. Actualizar `orders.responsible_worker_id`

### Para Solicitar Materiales:
1. Crear en `material_requests` (requiere: requester_id)
2. Insertar items en `material_request_items` (requiere: request_id, material_id, quantity)

### Para Crear Trabajadores:
1. Insertar en `users` con `role='trabajador'`
2. Campos requeridos: name, email, password, role

## ENDPOINTS DEL BACKEND DISPONIBLES

### Órdenes:
- POST `/api/orders/create` - Crear orden
- GET `/api/orders` - Listar órdenes
- GET `/api/orders/:id` - Detalle de orden
- POST `/api/orders/:id/assign` - Asignar trabajadores
- PUT `/api/orders/:id` - Actualizar orden
- POST `/api/orders/:id/cancel` - Cancelar orden

### Áreas:
- GET `/api/cleaning-areas` - Listar áreas
- POST `/api/cleaning-areas/orders/:orderId/areas` - Asignar áreas a orden

### Materiales:
- (Revisar si existen endpoints en backend/routes/materials.js)

### Usuarios:
- (Revisar si existen endpoints en backend/routes/users.js)

## VALIDACIONES IMPORTANTES

### orders:
- client_name: min 2 caracteres
- address: min 5 caracteres
- scheduled_date: debe ser fecha válida (>= hoy)
- order_type: 'regular' o 'post_construction'
- city: REQUERIDO (aunque en nueva-orden.html no lo estamos capturando!)

### users:
- email: debe ser email válido
- role: 'admin', 'jefe', 'gerente', 'trabajador'
- password: hash con bcrypt

### materials:
- unit: 'unit', 'liter', 'kg', 'box', 'pack'
- quantity: debe ser número decimal positivo
