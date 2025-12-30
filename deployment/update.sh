#!/bin/bash

# ================================================
# SCRIPT DE ACTUALIZACIÓN
# JD CLEANING SERVICES - UBUNTU SERVER
# ================================================

set -e  # Salir en caso de error

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones
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

# Variables
PROJECT_DIR="/var/www/jdireports"
APP_NAME="jdireports"
BACKUP_DIR="/var/backups/jdireports-updates"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# ================================================
# VERIFICACIONES PREVIAS
# ================================================

print_step "VERIFICACIONES PREVIAS"

if [ ! -d "$PROJECT_DIR" ]; then
  print_error "Proyecto no encontrado en $PROJECT_DIR"
  print_info "Ejecuta primero el script de despliegue: ./deploy.sh"
  exit 1
fi

cd $PROJECT_DIR

if ! command -v pm2 &> /dev/null; then
  print_error "PM2 no está instalado"
  exit 1
fi

print_success "Verificaciones completadas"

# ================================================
# CREAR BACKUP PREVIO
# ================================================

print_step "CREANDO BACKUP"

mkdir -p $BACKUP_DIR

# Backup de base de datos
source .env 2>/dev/null || true

if [ ! -z "$DB_NAME" ] && [ ! -z "$DB_USER" ] && [ ! -z "$DB_PASSWORD" ]; then
  print_info "Creando backup de base de datos..."
  mysqldump -u$DB_USER -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/db_before_update_$TIMESTAMP.sql
  print_success "Backup de base de datos creado"
else
  print_warning "No se pudo crear backup de base de datos (falta configuración en .env)"
fi

# Backup de código actual
print_info "Creando backup del código..."
tar -czf $BACKUP_DIR/code_before_update_$TIMESTAMP.tar.gz \
  --exclude='node_modules' \
  --exclude='uploads' \
  --exclude='logs' \
  --exclude='.git' \
  .

print_success "Backup del código creado"

# ================================================
# OBTENER CAMBIOS
# ================================================

print_step "OBTENIENDO CAMBIOS DEL REPOSITORIO"

# Guardar cambios locales si existen
git stash

# Obtener rama actual
CURRENT_BRANCH=$(git branch --show-current)
print_info "Rama actual: $CURRENT_BRANCH"

# Fetch y pull
git fetch origin
git pull origin $CURRENT_BRANCH

print_success "Cambios obtenidos"

# ================================================
# ACTUALIZAR DEPENDENCIAS
# ================================================

print_step "ACTUALIZANDO DEPENDENCIAS"

# Verificar si package.json cambió
if git diff HEAD@{1} HEAD -- package.json | grep -q .; then
  print_info "package.json cambió, actualizando dependencias..."
  npm install --production
  print_success "Dependencias actualizadas"
else
  print_info "Sin cambios en package.json, omitiendo actualización de dependencias"
fi

# ================================================
# EJECUTAR NUEVAS MIGRACIONES
# ================================================

print_step "VERIFICANDO MIGRACIONES"

if [ -d "backend/migrations" ]; then
  print_info "Ejecutando migraciones..."

  # Obtener lista de migraciones ejecutadas previamente
  LAST_MIGRATION_FILE="$BACKUP_DIR/last_migration.txt"

  if [ -f "$LAST_MIGRATION_FILE" ]; then
    LAST_MIGRATION=$(cat "$LAST_MIGRATION_FILE")
  else
    LAST_MIGRATION=""
  fi

  # Ejecutar migraciones nuevas
  NEW_MIGRATIONS=false
  for migration in backend/migrations/*.sql; do
    if [ -f "$migration" ]; then
      MIGRATION_NAME=$(basename $migration)

      # Si es posterior a la última migración ejecutada, ejecutarla
      if [[ "$MIGRATION_NAME" > "$LAST_MIGRATION" ]] || [ -z "$LAST_MIGRATION" ]; then
        print_info "Ejecutando migración: $MIGRATION_NAME"

        if [ ! -z "$DB_NAME" ] && [ ! -z "$DB_USER" ] && [ ! -z "$DB_PASSWORD" ]; then
          mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME < $migration
          print_success "$MIGRATION_NAME ejecutada"
          echo "$MIGRATION_NAME" > "$LAST_MIGRATION_FILE"
          NEW_MIGRATIONS=true
        else
          print_warning "No se pudo ejecutar migración (falta configuración en .env)"
        fi
      fi
    fi
  done

  if [ "$NEW_MIGRATIONS" = false ]; then
    print_info "No hay migraciones nuevas"
  fi
else
  print_info "Directorio de migraciones no encontrado"
fi

# ================================================
# ACTUALIZAR ARCHIVOS ESTÁTICOS
# ================================================

print_step "ACTUALIZANDO ARCHIVOS ESTÁTICOS"

# Crear directorios si no existen
mkdir -p uploads/photos
mkdir -p uploads/thumbnails
mkdir -p uploads/reports
mkdir -p assets
mkdir -p logs

chmod -R 755 uploads
chmod -R 755 assets
chmod -R 755 logs

print_success "Directorios verificados"

# ================================================
# REINICIAR APLICACIÓN
# ================================================

print_step "REINICIANDO APLICACIÓN"

# Opción 1: Reload (zero-downtime)
print_info "Reiniciando aplicación con zero-downtime..."
pm2 reload $APP_NAME --update-env

# Esperar a que se estabilice
sleep 3

# Verificar estado
if pm2 show $APP_NAME | grep -q "online"; then
  print_success "Aplicación reiniciada correctamente"
else
  print_error "Error al reiniciar aplicación"
  print_warning "Intentando restart completo..."
  pm2 restart $APP_NAME
fi

# Guardar configuración
pm2 save

# ================================================
# LIMPIAR CACHE Y LOGS
# ================================================

print_step "LIMPIANDO CACHE Y LOGS"

# Limpiar logs antiguos (más de 7 días)
if [ -d "logs" ]; then
  find logs/ -name "*.log" -mtime +7 -delete
  print_success "Logs antiguos eliminados"
fi

# Limpiar módulos de npm cache si es necesario
npm cache clean --force 2>/dev/null || true

print_success "Limpieza completada"

# ================================================
# REINICIAR NGINX
# ================================================

print_step "REINICIANDO NGINX"

# Verificar configuración
sudo nginx -t

# Reiniciar solo si la configuración es válida
if [ $? -eq 0 ]; then
  sudo systemctl reload nginx
  print_success "Nginx recargado"
else
  print_error "Error en configuración de Nginx"
fi

# ================================================
# MOSTRAR ESTADO
# ================================================

print_step "ESTADO ACTUAL"

pm2 list

echo ""
print_info "Logs en tiempo real:"
echo "  pm2 logs $APP_NAME"
echo ""

print_info "Monitoreo:"
echo "  pm2 monit"
echo ""

# ================================================
# ROLLBACK INFO
# ================================================

print_step "INFORMACIÓN DE ROLLBACK"

print_warning "En caso de problemas, puedes hacer rollback con:"
echo ""
echo "  # Restaurar base de datos:"
echo "  mysql -u\$DB_USER -p\$DB_PASSWORD \$DB_NAME < $BACKUP_DIR/db_before_update_$TIMESTAMP.sql"
echo ""
echo "  # Restaurar código:"
echo "  cd $PROJECT_DIR"
echo "  tar -xzf $BACKUP_DIR/code_before_update_$TIMESTAMP.tar.gz"
echo "  pm2 restart $APP_NAME"
echo ""

# ================================================
# LIMPIAR BACKUPS ANTIGUOS
# ================================================

print_info "Limpiando backups antiguos (más de 30 días)..."
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

# ================================================
# FINALIZAR
# ================================================

print_step "ACTUALIZACIÓN COMPLETADA"

print_success "Aplicación actualizada exitosamente!"
echo ""

print_info "Próximos pasos:"
echo ""
echo "  1. Verificar logs:     pm2 logs $APP_NAME"
echo "  2. Verificar estado:   pm2 status"
echo "  3. Probar aplicación:  curl http://localhost:\$PORT/health"
echo ""

print_step "¡LISTO! 🎉"
