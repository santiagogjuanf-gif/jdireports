#!/bin/bash

# ================================================
# SCRIPT DE DESPLIEGUE AUTOMÁTICO
# JD CLEANING SERVICES - UBUNTU SERVER
# ================================================

set -e  # Salir en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ================================================
# FUNCIONES DE UTILIDAD
# ================================================

print_step() {
  echo -e "\n${BLUE}===================================================${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}===================================================${NC}\n"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "ℹ️  $1"
}

# ================================================
# VERIFICAR PRIVILEGIOS
# ================================================

if [ "$EUID" -eq 0 ]; then
  print_error "No ejecutar este script como root. Se solicitarán permisos sudo cuando sea necesario."
  exit 1
fi

# ================================================
# VARIABLES DE CONFIGURACIÓN
# ================================================

print_step "CONFIGURACIÓN INICIAL"

# Directorio del proyecto
PROJECT_DIR="/var/www/jdireports"

# Nombre de la aplicación en PM2
APP_NAME="jdireports"

# Puerto de la aplicación
APP_PORT="${PORT:-3000}"

# Usuario de sistema
APP_USER=$(whoami)

# Dominio (si aplica)
read -p "Ingrese el dominio (o presione Enter para usar localhost): " DOMAIN
DOMAIN=${DOMAIN:-localhost}

# Base de datos
read -p "Ingrese el nombre de la base de datos [jd_cleaning]: " DB_NAME
DB_NAME=${DB_NAME:-jd_cleaning}

read -p "Ingrese el usuario de MySQL [jduser]: " DB_USER
DB_USER=${DB_USER:-jduser}

read -s -p "Ingrese la contraseña de MySQL: " DB_PASSWORD
echo ""

# JWT Secret
JWT_SECRET=$(openssl rand -hex 32)

print_success "Configuración inicial completada"

# ================================================
# ACTUALIZAR SISTEMA
# ================================================

print_step "ACTUALIZANDO SISTEMA"

sudo apt update
sudo apt upgrade -y

print_success "Sistema actualizado"

# ================================================
# INSTALAR NODE.JS
# ================================================

print_step "INSTALANDO NODE.JS"

if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  print_info "Node.js ya está instalado: $NODE_VERSION"
else
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
  print_success "Node.js instalado: $(node -v)"
fi

print_success "npm instalado: $(npm -v)"

# ================================================
# INSTALAR MYSQL
# ================================================

print_step "INSTALANDO MYSQL"

if command -v mysql &> /dev/null; then
  MYSQL_VERSION=$(mysql --version)
  print_info "MySQL ya está instalado: $MYSQL_VERSION"
else
  sudo apt install -y mysql-server
  sudo systemctl start mysql
  sudo systemctl enable mysql
  print_success "MySQL instalado y habilitado"
fi

# ================================================
# CONFIGURAR BASE DE DATOS
# ================================================

print_step "CONFIGURANDO BASE DE DATOS"

# Crear base de datos y usuario
sudo mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';"
sudo mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

print_success "Base de datos creada: $DB_NAME"
print_success "Usuario creado: $DB_USER"

# ================================================
# INSTALAR PM2
# ================================================

print_step "INSTALANDO PM2"

if command -v pm2 &> /dev/null; then
  PM2_VERSION=$(pm2 -v)
  print_info "PM2 ya está instalado: $PM2_VERSION"
else
  sudo npm install -g pm2
  pm2 startup systemd -u $APP_USER --hp /home/$APP_USER
  sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $APP_USER --hp /home/$APP_USER
  print_success "PM2 instalado: $(pm2 -v)"
fi

# ================================================
# INSTALAR NGINX
# ================================================

print_step "INSTALANDO NGINX"

if command -v nginx &> /dev/null; then
  NGINX_VERSION=$(nginx -v 2>&1)
  print_info "Nginx ya está instalado: $NGINX_VERSION"
else
  sudo apt install -y nginx
  sudo systemctl start nginx
  sudo systemctl enable nginx
  print_success "Nginx instalado y habilitado"
fi

# ================================================
# CLONAR/ACTUALIZAR REPOSITORIO
# ================================================

print_step "CONFIGURANDO PROYECTO"

if [ -d "$PROJECT_DIR" ]; then
  print_info "Proyecto ya existe. Actualizando..."
  cd $PROJECT_DIR
  git pull
else
  print_info "Clonando proyecto..."
  sudo mkdir -p /var/www
  sudo chown -R $APP_USER:$APP_USER /var/www

  read -p "Ingrese la URL del repositorio Git: " REPO_URL

  git clone $REPO_URL $PROJECT_DIR
  cd $PROJECT_DIR
fi

# ================================================
# CREAR ARCHIVO .ENV
# ================================================

print_step "CREANDO ARCHIVO .ENV"

cat > .env <<EOF
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# Aplicación
PORT=$APP_PORT
NODE_ENV=production

# JWT
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://$DOMAIN

# Email (Configurar después)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=noreply@jdcleaning.com

# Cloudflare (Opcional)
CLOUDFLARE_API_KEY=
CLOUDFLARE_ZONE_ID=
EOF

print_success "Archivo .env creado"

# ================================================
# INSTALAR DEPENDENCIAS
# ================================================

print_step "INSTALANDO DEPENDENCIAS"

npm install --production

print_success "Dependencias instaladas"

# ================================================
# EJECUTAR MIGRACIONES
# ================================================

print_step "EJECUTANDO MIGRACIONES DE BASE DE DATOS"

# Ejecutar migraciones en orden
for migration in backend/migrations/*.sql; do
  if [ -f "$migration" ]; then
    print_info "Ejecutando $(basename $migration)..."
    mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME < $migration
    print_success "$(basename $migration) completada"
  fi
done

# ================================================
# CREAR DIRECTORIOS NECESARIOS
# ================================================

print_step "CREANDO DIRECTORIOS"

mkdir -p uploads/photos
mkdir -p uploads/thumbnails
mkdir -p uploads/reports
mkdir -p assets
mkdir -p logs

chmod -R 755 uploads
chmod -R 755 assets
chmod -R 755 logs

print_success "Directorios creados"

# ================================================
# CONFIGURAR NGINX
# ================================================

print_step "CONFIGURANDO NGINX"

sudo tee /etc/nginx/sites-available/jdireports > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    client_max_body_size 10M;

    # Logs
    access_log /var/log/nginx/jdireports_access.log;
    error_log /var/log/nginx/jdireports_error.log;

    # Archivos estáticos
    location /uploads/ {
        alias $PROJECT_DIR/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /assets/ {
        alias $PROJECT_DIR/assets/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Proxy a la aplicación Node.js
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Socket.IO
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

# Habilitar sitio
sudo ln -sf /etc/nginx/sites-available/jdireports /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

print_success "Nginx configurado"

# ================================================
# CONFIGURAR PM2
# ================================================

print_step "CONFIGURANDO PM2"

# Crear archivo de configuración PM2
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: './backend/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: $APP_PORT
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '500M',
    watch: false
  }]
};
EOF

# Detener app si está corriendo
pm2 delete $APP_NAME 2>/dev/null || true

# Iniciar aplicación
pm2 start ecosystem.config.js

# Guardar configuración PM2
pm2 save

print_success "PM2 configurado y aplicación iniciada"

# ================================================
# CONFIGURAR FIREWALL
# ================================================

print_step "CONFIGURANDO FIREWALL"

sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

print_success "Firewall configurado"

# ================================================
# CONFIGURAR LOGS ROTATION
# ================================================

print_step "CONFIGURANDO ROTACIÓN DE LOGS"

sudo tee /etc/logrotate.d/jdireports > /dev/null <<EOF
$PROJECT_DIR/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 $APP_USER $APP_USER
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

print_success "Rotación de logs configurada"

# ================================================
# CREAR SCRIPT DE BACKUP
# ================================================

print_step "CREANDO SCRIPT DE BACKUP"

sudo tee /usr/local/bin/backup-jdireports > /dev/null <<EOF
#!/bin/bash

BACKUP_DIR="/var/backups/jdireports"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# Backup de base de datos
mysqldump -u$DB_USER -p$DB_PASSWORD $DB_NAME > \$BACKUP_DIR/db_\$DATE.sql

# Comprimir uploads
tar -czf \$BACKUP_DIR/uploads_\$DATE.tar.gz -C $PROJECT_DIR uploads/

# Mantener solo últimos 7 días
find \$BACKUP_DIR -name "db_*.sql" -mtime +7 -delete
find \$BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete

echo "Backup completado: \$DATE"
EOF

sudo chmod +x /usr/local/bin/backup-jdireports

# Agregar a crontab (diario a las 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-jdireports >> /var/log/jdireports-backup.log 2>&1") | crontab -

print_success "Script de backup configurado (ejecuta diariamente a las 2 AM)"

# ================================================
# MOSTRAR INFORMACIÓN FINAL
# ================================================

print_step "DESPLIEGUE COMPLETADO"

echo ""
print_success "Aplicación desplegada exitosamente!"
echo ""
print_info "Información del despliegue:"
echo ""
echo "  📁 Directorio: $PROJECT_DIR"
echo "  🌐 Dominio: http://$DOMAIN"
echo "  🔌 Puerto: $APP_PORT"
echo "  📊 Base de datos: $DB_NAME"
echo "  👤 Usuario DB: $DB_USER"
echo "  🔐 JWT Secret: (almacenado en .env)"
echo ""

print_info "Comandos útiles:"
echo ""
echo "  Ver estado:        pm2 status"
echo "  Ver logs:          pm2 logs $APP_NAME"
echo "  Reiniciar app:     pm2 restart $APP_NAME"
echo "  Recargar app:      pm2 reload $APP_NAME"
echo "  Detener app:       pm2 stop $APP_NAME"
echo "  Backup manual:     /usr/local/bin/backup-jdireports"
echo ""

print_warning "PENDIENTES:"
echo ""
echo "  1. Configurar SSL/HTTPS con Let's Encrypt"
echo "  2. Configurar variables de email en .env"
echo "  3. Crear usuario administrador inicial"
echo "  4. Revisar y ajustar configuración de seguridad"
echo ""

print_info "Para configurar SSL:"
echo "  sudo apt install certbot python3-certbot-nginx"
echo "  sudo certbot --nginx -d $DOMAIN"
echo ""

print_step "¡LISTO! 🎉"
