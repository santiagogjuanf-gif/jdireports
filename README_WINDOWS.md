# 🪟 JD Cleaning Services - Instalación en Windows 11

Esta guía te ayudará a instalar y configurar el sistema JD Cleaning Services en Windows 11 usando XAMPP.

## 📋 Requisitos Previos

- ✅ Windows 11
- ✅ XAMPP instalado (con MySQL)
- ✅ Node.js v16 o superior
- ✅ Git para Windows (opcional, para clonar el repositorio)

---

## 🚀 INSTALACIÓN PASO A PASO

### **PASO 1: Instalar Node.js**

1. Descarga Node.js LTS desde: https://nodejs.org/
2. Ejecuta el instalador y sigue los pasos (opciones por defecto están bien)
3. Verifica la instalación abriendo **PowerShell** o **CMD**:

```powershell
node --version
npm --version
```

### **PASO 2: Instalar XAMPP**

1. Descarga XAMPP desde: https://www.apachefriends.org/
2. Instala en `C:\xampp\` (ruta por defecto)
3. Durante la instalación, asegúrate de seleccionar:
   - ✅ Apache
   - ✅ MySQL
   - ✅ PHP
   - ✅ phpMyAdmin

### **PASO 3: Clonar o descargar el proyecto**

#### Opción A: Con Git

```powershell
# Abre PowerShell o CMD
cd C:\xampp\htdocs

# Clona el repositorio
git clone https://github.com/santiagogjuanf-gif/jdireports.git

# Entra a la carpeta
cd jdireports

# Cambia a la rama correcta
git checkout claude/find-fix-bug-mjs1a1eafgejasz0-JJV9h
```

#### Opción B: Descarga manual

1. Descarga el ZIP del repositorio desde GitHub
2. Extrae en `C:\xampp\htdocs\jdireports`

---

### **PASO 4: Iniciar MySQL en XAMPP**

1. Abre **XAMPP Control Panel** (busca "XAMPP" en el menú Inicio)
2. Haz clic en **"Start"** junto a **MySQL**
3. Debe aparecer en color **verde** cuando esté corriendo
4. Opcional: También puedes iniciar **Apache** si quieres usar phpMyAdmin

---

### **PASO 5: Crear la base de datos**

#### Opción A: Usando phpMyAdmin (RECOMENDADO)

1. Asegúrate de que Apache y MySQL estén corriendo en XAMPP
2. Abre tu navegador y ve a: http://localhost/phpmyadmin
3. Haz clic en la pestaña **"SQL"**
4. Pega este código y presiona **"Go"**:

```sql
CREATE DATABASE jd_cleaning_services CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### Opción B: Desde línea de comandos

```powershell
# Abre PowerShell y ejecuta:
C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE jd_cleaning_services CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

---

### **PASO 6: Ejecutar las migraciones de base de datos**

Navega a la carpeta del proyecto en PowerShell:

```powershell
cd C:\xampp\htdocs\jdireports
```

Ejecuta las 5 migraciones **EN ESTE ORDEN**:

```powershell
# Migración 1: Estructura completa del sistema
C:\xampp\mysql\bin\mysql.exe -u root jd_cleaning_services < database\migrations\001_complete_system_upgrade.sql

# Migración 2: Datos iniciales
C:\xampp\mysql\bin\mysql.exe -u root jd_cleaning_services < database\migrations\002_initial_data.sql

# Migración 3: Áreas de limpieza adicionales (20 áreas)
C:\xampp\mysql\bin\mysql.exe -u root jd_cleaning_services < backend\migrations\003_cleaning_areas.sql

# Migración 4: Mensajes motivacionales con emojis (27 mensajes)
C:\xampp\mysql\bin\mysql.exe -u root jd_cleaning_services < backend\migrations\004_motivational_messages.sql

# Migración 5: Sistema de chat
C:\xampp\mysql\bin\mysql.exe -u root jd_cleaning_services < backend\migrations\005_chat_system.sql
```

**⚠️ IMPORTANTE:** Si alguna migración da error, **NO continúes** con las siguientes. Revisa el error primero.

---

### **PASO 7: Verificar las migraciones**

Entra a MySQL para verificar:

```powershell
# Conectarse a MySQL
C:\xampp\mysql\bin\mysql.exe -u root jd_cleaning_services
```

Dentro de MySQL, ejecuta:

```sql
-- Ver todas las tablas creadas
SHOW TABLES;

-- Ver cuántas áreas de limpieza (debe ser 35 total)
SELECT COUNT(*) as total_areas FROM cleaning_areas;

-- Ver cuántos mensajes motivacionales (debe ser 42 total)
SELECT COUNT(*) as total_mensajes FROM motivational_messages;

-- Ver algunos mensajes con emojis
SELECT message_es, emoji FROM motivational_messages LIMIT 5;

-- Salir
EXIT;
```

---

### **PASO 8: Configurar el archivo .env**

Crea el archivo `.env` desde el ejemplo:

```powershell
# En PowerShell
Copy-Item .env.example .env

# Editar con el Bloc de notas
notepad .env

# O con VS Code (si lo tienes instalado)
code .env
```

**Edita estos valores importantes:**

```env
# Base de datos (para XAMPP)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=jd_cleaning_services
DB_USER=root
DB_PASSWORD=
# ⚠️ XAMPP por defecto NO tiene password, déjalo vacío

# JWT Secret - Genera uno ejecutando:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=tu_secret_generado_aqui

# Email (Gmail)
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_password_de_aplicacion_16_digitos
```

**Para generar el JWT_SECRET:**

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia el resultado y pégalo en `JWT_SECRET=`

---

### **PASO 9: Crear directorios necesarios**

```powershell
# Crear carpetas para uploads y logs
New-Item -Path "uploads" -ItemType Directory -Force
New-Item -Path "uploads\photos" -ItemType Directory -Force
New-Item -Path "uploads\thumbnails" -ItemType Directory -Force
New-Item -Path "uploads\reports" -ItemType Directory -Force
New-Item -Path "assets" -ItemType Directory -Force
New-Item -Path "logs" -ItemType Directory -Force
```

---

### **PASO 10: Instalar dependencias de Node.js**

```powershell
npm install
```

Esto instalará todas las dependencias necesarias. Puede tardar unos minutos.

---

### **PASO 11: Iniciar el servidor**

```powershell
npm start
```

**Deberías ver:**

```
================================================
  JD CLEANING SERVICES - SERVIDOR INICIADO
================================================

✅ Servidor corriendo en puerto 3000
✅ Entorno: production
✅ URL: http://localhost:3000
✅ Socket.IO habilitado para chat en tiempo real

================================================
```

---

### **PASO 12: Probar que funciona**

Abre tu navegador:

- **Frontend**: http://localhost:3000
- **API Health Check**: http://localhost:3000/health
- **API Info**: http://localhost:3000/api

---

## 🔧 Configurar Cloudflare Tunnel (Opcional)

Si quieres acceder a tu aplicación desde internet usando Cloudflare Tunnel:

1. Descarga `cloudflared` para Windows desde: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
2. Inicia el túnel apuntando al puerto 3000:

```powershell
cloudflared tunnel --url http://localhost:3000
```

Te dará una URL pública como: `https://tu-subdominio.trycloudflare.com`

---

## 📝 Comandos Útiles

### Ver procesos de Node corriendo:

```powershell
Get-Process | Where-Object {$_.ProcessName -like "*node*"}
```

### Detener el servidor (Ctrl + C no funciona):

```powershell
Stop-Process -Name node -Force
```

### Ver qué está usando el puerto 3000:

```powershell
netstat -ano | findstr :3000
```

### Reiniciar MySQL en XAMPP:

- Abre XAMPP Control Panel
- Click en "Stop" junto a MySQL
- Espera unos segundos
- Click en "Start"

---

## 🆘 Solución de Problemas

### Error: "Cannot find module"

```powershell
# Reinstala las dependencias
Remove-Item -Path "node_modules" -Recurse -Force
npm install
```

### Error: "ECONNREFUSED" al conectar con MySQL

- Verifica que MySQL esté corriendo en XAMPP (luz verde)
- Verifica que el puerto 3306 esté libre
- Verifica que `DB_PASSWORD` esté vacío en `.env` (XAMPP no tiene password por defecto)

### Error: "Database not found"

- Verifica que creaste la base de datos `jd_cleaning_services`
- Conéctate a phpMyAdmin y verifica que existe

### Error: "Port 3000 already in use"

```powershell
# Ver qué proceso usa el puerto
netstat -ano | findstr :3000

# Matar el proceso (reemplaza PID con el número que obtuviste)
Stop-Process -Id PID -Force

# O cambia el puerto en .env
# PORT=3001
```

---

## 📂 Estructura del Proyecto

```
C:\xampp\htdocs\jdireports\
├── backend/
│   ├── config/         # Configuración de base de datos
│   ├── middleware/     # Autenticación, logging, etc.
│   ├── routes/         # Rutas de la API
│   ├── utils/          # Utilidades (email, imágenes, PDF)
│   ├── sockets/        # Manejadores de Socket.IO
│   ├── migrations/     # Migraciones 003, 004, 005
│   └── server.js       # Servidor principal
├── database/
│   └── migrations/     # Migraciones 001, 002
├── frontend/
│   └── public/         # Archivos HTML, CSS, JS
├── uploads/            # Fotos y reportes
├── logs/               # Archivos de log
├── .env                # Variables de entorno (NO subir a Git)
├── .env.example        # Ejemplo de variables de entorno
└── package.json        # Dependencias de Node.js
```

---

## ✅ Checklist de Instalación

- [ ] Node.js instalado
- [ ] XAMPP instalado
- [ ] MySQL corriendo en XAMPP
- [ ] Repositorio clonado/descargado
- [ ] Base de datos `jd_cleaning_services` creada
- [ ] 5 migraciones ejecutadas sin errores
- [ ] Archivo `.env` configurado
- [ ] JWT_SECRET generado
- [ ] Directorios creados
- [ ] `npm install` completado
- [ ] Servidor inicia sin errores
- [ ] Frontend accesible en http://localhost:3000

---

## 🎯 Próximos Pasos

1. **Crear usuario administrador** - Necesitarás crear el primer usuario admin en la base de datos
2. **Configurar email** - Si quieres enviar notificaciones por email
3. **Subir logo** - Agregar el logo de la empresa en `assets/logo.png`
4. **Configurar backup** - Configurar respaldos automáticos de la base de datos

---

## 📞 Soporte

Si tienes problemas con la instalación, revisa:

1. Que todos los servicios de XAMPP estén corriendo (luz verde)
2. Que el archivo `.env` esté configurado correctamente
3. Que las migraciones se hayan ejecutado sin errores
4. Los logs en `logs/app.log`

---

**¡Listo!** Tu sistema JD Cleaning Services está corriendo en Windows 11. 🎉
