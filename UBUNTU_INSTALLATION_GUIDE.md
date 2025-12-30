# 🐧 GUÍA DE INSTALACIÓN EN UBUNTU SERVER - JDI REPORTS

## 📋 REQUISITOS PREVIOS

- Ubuntu Server 20.04 LTS o superior
- Acceso root o sudo
- Dominio configurado apuntando al servidor
- Cloudflare configurado (opcional pero recomendado)

---

## 1️⃣ ACTUALIZAR EL SISTEMA

```bash
sudo apt update && sudo apt upgrade -y
```

---

## 2️⃣ INSTALAR NODE.JS 18.x (LTS)

```bash
# Agregar repositorio de NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Instalar Node.js y npm
sudo apt install -y nodejs

# Verificar instalación
node --version  # Debe mostrar v18.x.x
npm --version   # Debe mostrar 9.x.x o superior
```

---

## 3️⃣ INSTALAR MYSQL 8.0

```bash
# Instalar MySQL Server
sudo apt install -y mysql-server

# Iniciar servicio
sudo systemctl start mysql
sudo systemctl enable mysql

# Configuración segura
sudo mysql_secure_installation
```

**Responde las preguntas:**
- Set root password? **YES** (elige una contraseña segura)
- Remove anonymous users? **YES**
- Disallow root login remotely? **YES**
- Remove test database? **YES**
- Reload privilege tables? **YES**

---

## 4️⃣ CREAR BASE DE DATOS Y USUARIO

```bash
# Acceder a MySQL como root
sudo mysql -u root -p
```

Dentro de MySQL, ejecuta:

```sql
-- Crear base de datos
CREATE DATABASE jd_cleaning_services CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario para la aplicación
CREATE USER 'jdireports'@'localhost' IDENTIFIED BY 'TU_CONTRASEÑA_SEGURA';

-- Otorgar permisos
GRANT ALL PRIVILEGES ON jd_cleaning_services.* TO 'jdireports'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Salir
EXIT;
```

---

## 5️⃣ CLONAR EL REPOSITORIO

```bash
# Ir al directorio home
cd ~

# Clonar el proyecto
git clone https://github.com/tu-usuario/jdireports.git

# Entrar al directorio
cd jdireports
```

---

## 6️⃣ CONFIGURAR VARIABLES DE ENTORNO

```bash
# Crear archivo .env
nano .env
```

Pega el siguiente contenido (ajusta los valores):

```env
# ================================================
# CONFIGURACIÓN DE BASE DE DATOS
# ================================================
DB_HOST=localhost
DB_USER=jdireports
DB_PASSWORD=TU_CONTRASEÑA_SEGURA
DB_NAME=jd_cleaning_services
DB_PORT=3306

# ================================================
# CONFIGURACIÓN DE JWT
# ================================================
JWT_SECRET=tu_secreto_muy_largo_y_aleatorio_aqui_12345
JWT_EXPIRES_IN=7d

# ================================================
# CONFIGURACIÓN DEL SERVIDOR
# ================================================
NODE_ENV=production
PORT=5000
CLIENT_URL=https://tudominio.com

# ================================================
# CONFIGURACIÓN DE EMAIL (Gmail)
# ================================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=jdireports@gmail.com
SMTP_PASS=tu_contraseña_de_aplicacion_gmail
SMTP_FROM_NAME=JDI Reports

# ================================================
# URL DE LA APLICACIÓN
# ================================================
APP_URL=https://tudominio.com
```

**IMPORTANTE:**
- Genera un JWT_SECRET fuerte: `openssl rand -base64 32`
- Para Gmail, usa una "Contraseña de aplicación" (no tu contraseña normal)

Guarda y cierra: `Ctrl + X`, luego `Y`, luego `Enter`

---

## 7️⃣ INSTALAR DEPENDENCIAS

```bash
# Instalar dependencias del backend
npm install

# Instalar dependencias del frontend (si aplica)
cd frontend && npm install && cd ..
```

---

## 8️⃣ EJECUTAR MIGRACIONES DE BASE DE DATOS

```bash
# Opción 1: Usando MySQL CLI
cd database/migrations

# Ejecutar primera migración (estructura)
mysql -u jdireports -p jd_cleaning_services < 001_complete_system_upgrade.sql

# Ejecutar segunda migración (datos)
mysql -u jdireports -p jd_cleaning_services < 002_initial_data.sql

# Volver a la raíz
cd ../..
```

**Verificar que funcionó:**
```bash
mysql -u jdireports -p jd_cleaning_services -e "SHOW TABLES;"
# Debe mostrar todas las tablas creadas
```

---

## 9️⃣ INSTALAR PM2 (Process Manager)

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Iniciar la aplicación con PM2
pm2 start server.js --name jdireports

# Configurar PM2 para iniciarse al arrancar el sistema
pm2 startup systemd
# Copia y ejecuta el comando que te muestra

# Guardar la configuración
pm2 save

# Ver estado
pm2 status
pm2 logs jdireports
```

**Comandos útiles de PM2:**
```bash
pm2 restart jdireports  # Reiniciar
pm2 stop jdireports     # Detener
pm2 logs jdireports     # Ver logs
pm2 monit              # Monitor en tiempo real
```

---

## 🔟 INSTALAR Y CONFIGURAR NGINX

```bash
# Instalar Nginx
sudo apt install -y nginx

# Crear configuración del sitio
sudo nano /etc/nginx/sites-available/jdireports
```

Pega esta configuración:

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    # Redirigir todo el tráfico HTTP a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tudominio.com www.tudominio.com;

    # Logs
    access_log /var/log/nginx/jdireports-access.log;
    error_log /var/log/nginx/jdireports-error.log;

    # SSL Certificates (se configurarán con Cloudflare)
    ssl_certificate /etc/ssl/certs/cloudflare-origin.pem;
    ssl_certificate_key /etc/ssl/private/cloudflare-origin.key;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO support
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Static files
    location /uploads {
        alias /home/usuario/jdireports/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Max upload size
    client_max_body_size 50M;
}
```

**Activar el sitio:**
```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/jdireports /etc/nginx/sites-enabled/

# Eliminar sitio por defecto
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 1️⃣1️⃣ CONFIGURAR CLOUDFLARE

### A. En Cloudflare Dashboard:

1. Ir a **SSL/TLS → Overview**
2. Seleccionar modo: **Full (strict)**

3. Ir a **SSL/TLS → Origin Server**
4. Crear certificado de origen:
   - Click "Create Certificate"
   - Dejar valores por defecto
   - Click "Create"
   - **Copiar el certificado y la clave privada**

### B. En tu servidor Ubuntu:

```bash
# Crear certificado de origen
sudo nano /etc/ssl/certs/cloudflare-origin.pem
# Pegar el certificado copiado de Cloudflare

# Crear clave privada
sudo nano /etc/ssl/private/cloudflare-origin.key
# Pegar la clave privada copiada de Cloudflare

# Ajustar permisos
sudo chmod 644 /etc/ssl/certs/cloudflare-origin.pem
sudo chmod 600 /etc/ssl/private/cloudflare-origin.key
```

### C. Configurar DNS en Cloudflare:

```
Tipo: A
Nombre: @
Contenido: IP_DE_TU_SERVIDOR
Proxy: Activado (nube naranja)

Tipo: A
Nombre: www
Contenido: IP_DE_TU_SERVIDOR
Proxy: Activado (nube naranja)
```

### D. Reiniciar Nginx:

```bash
sudo systemctl restart nginx
```

---

## 1️⃣2️⃣ CONFIGURAR FIREWALL

```bash
# Permitir SSH
sudo ufw allow OpenSSH

# Permitir HTTP y HTTPS
sudo ufw allow 'Nginx Full'

# Activar firewall
sudo ufw enable

# Ver estado
sudo ufw status
```

---

## 1️⃣3️⃣ CREAR USUARIO ADMINISTRADOR INICIAL

```bash
# Acceder a MySQL
mysql -u jdireports -p jd_cleaning_services
```

Dentro de MySQL:

```sql
-- Insertar usuario admin
INSERT INTO users (name, email, username, password, role, is_active, password_reset_required)
VALUES (
  'Administrator',
  'admin@tudominio.com',
  'admin',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyNRMj0Hx6K2',  -- password: admin123
  'admin',
  1,
  1
);

EXIT;
```

**IMPORTANTE:** Cambia la contraseña en el primer login.

---

## 1️⃣4️⃣ VERIFICAR QUE TODO FUNCIONA

```bash
# Ver logs de PM2
pm2 logs jdireports

# Ver estado
pm2 status

# Verificar que la app responde
curl http://localhost:5000/api/health

# Debería devolver JSON con status: OK
```

**Acceder desde el navegador:**
```
https://tudominio.com
```

---

## 🔄 ACTUALIZAR LA APLICACIÓN

```bash
# Ir al directorio
cd ~/jdireports

# Obtener últimos cambios
git pull origin main

# Instalar nuevas dependencias (si hay)
npm install

# Ejecutar nuevas migraciones (si hay)
cd database/migrations
mysql -u jdireports -p jd_cleaning_services < NUEVA_MIGRACION.sql
cd ../..

# Reiniciar aplicación
pm2 restart jdireports

# Ver logs
pm2 logs jdireports
```

---

## 🛠️ COMANDOS ÚTILES DE MANTENIMIENTO

```bash
# Ver logs de la aplicación
pm2 logs jdireports --lines 100

# Ver logs de Nginx
sudo tail -f /var/log/nginx/jdireports-error.log

# Reiniciar todo
pm2 restart jdireports
sudo systemctl restart nginx

# Verificar estado de MySQL
sudo systemctl status mysql

# Backup de base de datos
mysqldump -u jdireports -p jd_cleaning_services > backup_$(date +%Y%m%d).sql

# Restaurar backup
mysql -u jdireports -p jd_cleaning_services < backup_20250115.sql

# Ver espacio en disco
df -h

# Ver memoria
free -h

# Ver procesos
pm2 monit
```

---

## ⚠️ SOLUCIÓN DE PROBLEMAS COMUNES

### La aplicación no inicia:
```bash
# Ver logs
pm2 logs jdireports

# Verificar .env
cat .env

# Verificar conexión a MySQL
mysql -u jdireports -p jd_cleaning_services -e "SELECT 1;"
```

### Error 502 Bad Gateway:
```bash
# Verificar que PM2 esté corriendo
pm2 status

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver logs de Nginx
sudo tail -f /var/log/nginx/jdireports-error.log
```

### No se pueden subir fotos:
```bash
# Crear carpeta uploads
mkdir -p ~/jdireports/uploads

# Dar permisos
chmod 755 ~/jdireports/uploads
```

---

## ✅ CHECKLIST FINAL

- [ ] Node.js 18.x instalado
- [ ] MySQL 8.0 instalado y corriendo
- [ ] Base de datos creada
- [ ] Usuario de BD creado con permisos
- [ ] Repositorio clonado
- [ ] Archivo .env configurado
- [ ] Dependencias instaladas
- [ ] Migraciones ejecutadas
- [ ] PM2 instalado y app corriendo
- [ ] Nginx instalado y configurado
- [ ] Cloudflare SSL configurado
- [ ] Firewall configurado
- [ ] Usuario admin creado
- [ ] Dominio apuntando correctamente
- [ ] HTTPS funcionando
- [ ] Aplicación accesible desde el navegador

---

**🎉 ¡Instalación Completa!**

La aplicación debería estar corriendo en:
```
https://tudominio.com
```

Para cualquier problema, revisar los logs:
```bash
pm2 logs jdireports
sudo tail -f /var/log/nginx/jdireports-error.log
```
