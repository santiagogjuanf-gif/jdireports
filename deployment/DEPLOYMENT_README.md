# Scripts de Despliegue - JD Cleaning Services

Scripts automatizados para despliegue, actualización y monitoreo de la aplicación en Ubuntu Server.

## 📋 Scripts Disponibles

### 🚀 deploy.sh - Despliegue Inicial

Script completo para el primer despliegue de la aplicación en un servidor Ubuntu limpio.

**Características:**
- Instalación de dependencias del sistema (Node.js, MySQL, Nginx, PM2)
- Configuración de base de datos
- Clonación del repositorio
- Configuración de variables de entorno
- Ejecución de migraciones
- Configuración de Nginx como proxy reverso
- Configuración de PM2 para gestión de procesos
- Configuración de firewall
- Configuración de rotación de logs
- Creación de script de backup automático

**Uso:**

```bash
# Hacer el script ejecutable
chmod +x deployment/deploy.sh

# Ejecutar el script
./deployment/deploy.sh
```

El script solicitará:
- Dominio o IP del servidor
- Nombre de la base de datos
- Usuario y contraseña de MySQL
- URL del repositorio Git

### 🔄 update.sh - Actualización de la Aplicación

Script para actualizar una aplicación ya desplegada con nuevos cambios del repositorio.

**Características:**
- Backup automático antes de actualizar
- Obtención de cambios del repositorio
- Actualización de dependencias (si cambió package.json)
- Ejecución de nuevas migraciones
- Reinicio de la aplicación con zero-downtime
- Información de rollback en caso de problemas

**Uso:**

```bash
# Hacer el script ejecutable
chmod +x deployment/update.sh

# Ejecutar el script
./deployment/update.sh
```

**Rollback en caso de problemas:**

```bash
# Restaurar base de datos
mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME < /var/backups/jdireports-updates/db_before_update_TIMESTAMP.sql

# Restaurar código
cd /var/www/jdireports
tar -xzf /var/backups/jdireports-updates/code_before_update_TIMESTAMP.tar.gz
pm2 restart jdireports
```

### 📊 monitor.sh - Monitoreo del Sistema

Script para monitorear el estado de la aplicación y servicios relacionados.

**Verifica:**
- Estado de PM2 y la aplicación
- Estado de Nginx
- Estado de MySQL y conectividad
- Respuesta del API endpoint
- Espacio en disco
- Logs de errores recientes
- Validez del certificado SSL

**Uso:**

```bash
# Hacer el script ejecutable
chmod +x deployment/monitor.sh

# Ejecutar manualmente
./deployment/monitor.sh

# Ejecutar periódicamente con cron (cada 5 minutos)
*/5 * * * * /var/www/jdireports/deployment/monitor.sh >> /var/log/jdireports-monitor.log 2>&1
```

**Alertas por Email:**

Para recibir alertas por email, configura la variable de entorno:

```bash
export ALERT_EMAIL="admin@example.com"
```

## 🗂️ Estructura de Directorios

Después del despliegue, la estructura será:

```
/var/www/jdireports/
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── migrations/
│   ├── routes/
│   ├── sockets/
│   ├── utils/
│   └── server.js
├── uploads/
│   ├── photos/
│   ├── thumbnails/
│   └── reports/
├── assets/
├── logs/
│   ├── pm2-error.log
│   └── pm2-out.log
├── .env
├── ecosystem.config.js
└── package.json

/var/backups/
├── jdireports/          # Backups automáticos diarios
└── jdireports-updates/  # Backups antes de actualizaciones

/var/log/
├── nginx/
│   ├── jdireports_access.log
│   └── jdireports_error.log
└── jdireports-monitor.log
```

## 🔧 Configuración Post-Despliegue

### 1. Configurar SSL/HTTPS

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d tudominio.com

# Auto-renovación (ya configurado por certbot)
sudo certbot renew --dry-run
```

### 2. Configurar Email

Editar `/var/www/jdireports/.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-contraseña-de-aplicacion
EMAIL_FROM=noreply@jdcleaning.com
```

### 3. Crear Usuario Administrador Inicial

```bash
# Conectar a MySQL
mysql -u<usuario> -p<contraseña> jd_cleaning

# Insertar usuario admin
INSERT INTO users (name, email, password, role, is_active) VALUES
('Administrador', 'admin@jdcleaning.com', '$2a$10$...', 'admin', 1);

# Generar hash de contraseña con Node.js
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('tu-contraseña', 10));"
```

### 4. Configurar Cloudflare (Opcional)

Editar `/var/www/jdireports/.env`:

```env
CLOUDFLARE_API_KEY=tu-api-key
CLOUDFLARE_ZONE_ID=tu-zone-id
```

## 📝 Comandos Útiles

### PM2

```bash
# Ver estado de aplicaciones
pm2 status

# Ver logs en tiempo real
pm2 logs jdireports

# Reiniciar aplicación
pm2 restart jdireports

# Recargar sin downtime
pm2 reload jdireports

# Detener aplicación
pm2 stop jdireports

# Iniciar aplicación
pm2 start jdireports

# Monitoreo en tiempo real
pm2 monit

# Ver información detallada
pm2 show jdireports
```

### Nginx

```bash
# Verificar configuración
sudo nginx -t

# Recargar configuración
sudo systemctl reload nginx

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver logs de acceso
tail -f /var/log/nginx/jdireports_access.log

# Ver logs de error
tail -f /var/log/nginx/jdireports_error.log
```

### MySQL

```bash
# Conectar a MySQL
mysql -u<usuario> -p<contraseña> jd_cleaning

# Backup manual
mysqldump -u<usuario> -p<contraseña> jd_cleaning > backup.sql

# Restaurar backup
mysql -u<usuario> -p<contraseña> jd_cleaning < backup.sql

# Ver tamaño de base de datos
mysql -u<usuario> -p<contraseña> -e "
  SELECT table_schema 'Database',
         ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) 'Size (MB)'
  FROM information_schema.TABLES
  WHERE table_schema = 'jd_cleaning'
  GROUP BY table_schema;"
```

### Git

```bash
# Ver estado
git status

# Ver cambios
git diff

# Ver log
git log --oneline -10

# Cambiar de rama
git checkout nombre-rama

# Actualizar repositorio
git pull origin nombre-rama
```

### Sistema

```bash
# Ver espacio en disco
df -h

# Ver uso de memoria
free -h

# Ver procesos
top
htop

# Ver puertos en uso
sudo netstat -tulpn | grep LISTEN

# Ver logs del sistema
sudo journalctl -u nginx -f
sudo journalctl -u mysql -f
```

## 🔐 Seguridad

### Firewall

El script de despliegue configura UFW para permitir solo:
- Puerto 22 (SSH)
- Puerto 80 (HTTP)
- Puerto 443 (HTTPS)

```bash
# Ver estado del firewall
sudo ufw status

# Permitir puerto adicional
sudo ufw allow 8080/tcp

# Denegar puerto
sudo ufw deny 8080/tcp
```

### Fail2Ban (Recomendado)

```bash
# Instalar Fail2Ban
sudo apt install fail2ban

# Configurar para SSH
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Editar configuración
sudo nano /etc/fail2ban/jail.local

# Reiniciar Fail2Ban
sudo systemctl restart fail2ban

# Ver status
sudo fail2ban-client status
```

### Actualizar Sistema

```bash
# Actualizar paquetes
sudo apt update
sudo apt upgrade -y

# Actualizar Node.js a nueva versión LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## 📊 Backups

### Backup Automático

El script de despliegue configura backups automáticos diarios a las 2 AM.

```bash
# Ver configuración de cron
crontab -l

# Ejecutar backup manual
/usr/local/bin/backup-jdireports

# Ver backups
ls -lh /var/backups/jdireports/
```

### Backup Manual Completo

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)

# Backup de base de datos
mysqldump -u<usuario> -p<contraseña> jd_cleaning > ~/backup_db_$DATE.sql

# Backup de código
tar -czf ~/backup_code_$DATE.tar.gz \
  --exclude='node_modules' \
  --exclude='logs' \
  /var/www/jdireports

# Backup de uploads
tar -czf ~/backup_uploads_$DATE.tar.gz \
  /var/www/jdireports/uploads
```

## 🐛 Troubleshooting

### Aplicación no inicia

```bash
# Ver logs de PM2
pm2 logs jdireports --lines 100

# Verificar que el puerto no esté en uso
sudo lsof -i :3000

# Reiniciar completamente
pm2 delete jdireports
pm2 start ecosystem.config.js
```

### Base de datos no conecta

```bash
# Verificar que MySQL esté corriendo
sudo systemctl status mysql

# Verificar credenciales en .env
cat /var/www/jdireports/.env | grep DB_

# Probar conexión
mysql -u<usuario> -p<contraseña> jd_cleaning
```

### Nginx retorna 502 Bad Gateway

```bash
# Verificar que la aplicación esté corriendo
pm2 status

# Verificar logs de Nginx
tail -f /var/log/nginx/jdireports_error.log

# Verificar puerto correcto en configuración
sudo nano /etc/nginx/sites-available/jdireports
```

### Espacio en disco lleno

```bash
# Ver uso de disco
df -h

# Encontrar directorios grandes
sudo du -sh /* | sort -h

# Limpiar logs antiguos
sudo journalctl --vacuum-time=7d

# Limpiar cache de npm
npm cache clean --force

# Limpiar paquetes no usados
sudo apt autoremove
sudo apt clean
```

## 📚 Referencias

- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Let's Encrypt](https://letsencrypt.org/)
- [Ubuntu Server Guide](https://ubuntu.com/server/docs)

## 🆘 Soporte

Para problemas o dudas:
1. Revisar logs: `pm2 logs jdireports`
2. Ejecutar monitor: `./deployment/monitor.sh`
3. Revisar esta documentación
4. Contactar al equipo de desarrollo

---

**Última actualización:** 2025-12-30
