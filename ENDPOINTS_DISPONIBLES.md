# ENDPOINTS DISPONIBLES - BACKEND API

## BASE URL
```
http://localhost:3000/api
```

## AUTENTICACIÓN
Todos los endpoints requieren header:
```
Authorization: Bearer <token>
```

---

## 1. USUARIOS (users.js)

### GET /users
Lista todos los usuarios (requiere rol: admin, jefe, gerente)
**Query params:**
- page (default: 1)
- limit (default: 10)
- role (filtrar por rol)
- status (filtrar por activo/inactivo)
- search (buscar por nombre/email)

**Response:**
```json
{
  "success": true,
  "users": [...],
  "pagination": {...}
}
```

### POST /users
Crear nuevo usuario (requiere rol: admin, jefe, gerente)
**Body (JSON):**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "Password123",
  "role": "trabajador"
}
```

**Validaciones:**
- name: 2-100 caracteres, solo letras
- email: email válido
- password: 6-50 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número
- role: 'admin', 'jefe', 'gerente', 'trabajador'

**Response:**
```json
{
  "success": true,
  "message": "Usuario Juan Pérez creado exitosamente",
  "data": {
    "user": {
      "id": 2,
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "role": "trabajador",
      "is_active": true
    }
  }
}
```

### GET /users/:id
Obtener detalles de un usuario específico

### PUT /users/:id
Actualizar usuario existente

### PUT /users/:id/toggle-status
Activar/desactivar usuario

### GET /users/workers/available
Lista trabajadores disponibles para asignación

---

## 2. ÓRDENES (orders.js)

### POST /orders/create
Crear nueva orden (requiere rol: admin, jefe, gerente)
**Body (JSON):**
```json
{
  "order_type": "regular",
  "client_name": "María García",
  "client_phone": "305-555-1234",
  "client_email": "maria@example.com",
  "address": "123 Main St",
  "city": "Miami, FL",
  "scheduled_date": "2026-01-25 09:00:00",
  "notes": "Cliente prefiere productos sin aroma"
}
```

**Validaciones:**
- order_type: 'regular' o 'post_construction'
- client_name: mín 2 caracteres
- client_phone: formato válido
- address: mín 5 caracteres
- city: REQUERIDO
- scheduled_date: fecha válida (formato: YYYY-MM-DD HH:MM:SS)

**Response:**
```json
{
  "success": true,
  "message": "Orden ORD-2026-001 creada exitosamente",
  "order": {
    "id": 1,
    "order_number": "ORD-2026-001",
    ...
  }
}
```

### GET /orders
Listar órdenes con filtros
**Query params:**
- status (pending, assigned, in_progress, completed, cancelled)
- order_type (regular, post_construction)
- worker_id
- start_date, end_date
- search (por número, cliente, dirección)
- page, limit

### GET /orders/:id
Obtener detalle completo de una orden

### POST /orders/:id/assign
Asignar trabajadores a una orden

### PUT /orders/:id
Actualizar información de orden

### POST /orders/:id/cancel
Cancelar orden

---

## 3. ÁREAS DE LIMPIEZA (cleaning-areas.js)

### GET /cleaning-areas
Listar todas las áreas de limpieza
**Query params:**
- language (es, en, fr) - default: 'es'
- active_only (true/false) - default: 'true'

**Response:**
```json
{
  "success": true,
  "areas": [
    {
      "id": 1,
      "name_key": "bathroom",
      "name": "Baño",
      "name_es": "Baño",
      "name_en": "Bathroom",
      "name_fr": "Salle de bain",
      "is_active": true,
      "display_order": 1
    }
  ],
  "total": 35,
  "language": "es"
}
```

### POST /cleaning-areas/orders/:orderId/areas
Asignar áreas a una orden
**Body (JSON):**
```json
{
  "area_ids": [1, 2, 3, 4, 5]
}
```

**Response:**
```json
{
  "success": true,
  "message": "5 área(s) asignada(s) exitosamente",
  "order_id": 1,
  "areas_assigned": 5
}
```

---

## 4. MATERIALES (materials.js)

**NOTA IMPORTANTE:** El backend tiene validaciones para campos `name_es`, `name_en`, `name_fr`
pero la tabla solo tiene el campo `name`. Necesita corrección.

### GET /materials
Listar todos los materiales
**Query params:**
- language (es, en, fr)
- active_only (true/false)

### POST /materials/requests
Crear solicitud de materiales
**Body (JSON):**
```json
{
  "materials": [
    {
      "material_id": 1,
      "quantity": 5
    },
    {
      "material_id": 2,
      "quantity": 3
    }
  ],
  "notes": "Urgente - para orden grande"
}
```

**Validaciones:**
- materials: array con al menos 1 item
- material_id: número entero positivo
- quantity: número entero positivo
- notes: opcional, máx 500 caracteres

**Response:**
```json
{
  "success": true,
  "message": "Solicitud de materiales creada exitosamente",
  "request": {
    "id": 1,
    "status": "pending",
    ...
  }
}
```

### GET /materials/requests
Listar solicitudes de materiales

### GET /materials/requests/:id
Detalle de solicitud

### POST /materials/requests/:id/approve
Aprobar solicitud (requiere rol: admin, jefe, gerente)

### POST /materials/requests/:id/deliver
Marcar como entregada (requiere rol: admin, jefe, gerente)

### POST /materials/requests/:id/cancel
Cancelar solicitud

---

## 5. AUTENTICACIÓN (auth.js)

### POST /auth/login
Iniciar sesión
**Body (JSON):**
```json
{
  "email": "admin@jdcleaning.com",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Administrador",
    "email": "admin@jdcleaning.com",
    "role": "admin"
  }
}
```

### GET /auth/verify
Verificar token JWT (devuelve datos del usuario)

---

## ROLES Y PERMISOS

### admin
- Acceso completo a todo

### jefe
- Puede crear usuarios (excepto admin)
- Gestionar órdenes
- Aprobar solicitudes
- Ver reportes

### gerente
- Crear órdenes
- Gestionar trabajadores bajo su supervisión
- Aprobar solicitudes

### trabajador
- Ver órdenes asignadas
- Solicitar materiales
- Crear reportes diarios

---

## CÓDIGOS DE RESPUESTA

- 200: OK
- 201: Created
- 400: Bad Request (validación fallida)
- 401: Unauthorized (sin token o token inválido)
- 403: Forbidden (sin permisos)
- 404: Not Found
- 409: Conflict (duplicado)
- 500: Internal Server Error

---

## NOTAS IMPORTANTES

1. **Campo city es REQUERIDO** en órdenes pero puede no estar en el frontend
2. **Materiales**: Backend espera `name_es/en/fr` pero tabla solo tiene `name`
3. **Passwords**: Deben tener 6-50 caracteres, 1 mayúscula, 1 minúscula, 1 número
4. **Dates**: Formato ISO 8601 o MySQL datetime (YYYY-MM-DD HH:MM:SS)
5. **Todas las rutas** excepto /auth/login requieren autenticación
