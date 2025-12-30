#!/bin/bash

# ================================================
# SCRIPT DE MONITOREO
# JD CLEANING SERVICES - UBUNTU SERVER
# ================================================

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variables
APP_NAME="jdireports"
PROJECT_DIR="/var/www/jdireports"
ALERT_EMAIL="${ALERT_EMAIL:-}"

# ================================================
# FUNCIONES
# ================================================

print_header() {
  echo -e "\n${BLUE}===================================================${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}===================================================${NC}\n"
}

print_ok() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

send_alert() {
  local message="$1"

  echo "[$(date)] ALERT: $message" >> /var/log/jdireports-monitor.log

  if [ ! -z "$ALERT_EMAIL" ]; then
    echo "$message" | mail -s "JD Reports Alert" "$ALERT_EMAIL" 2>/dev/null || true
  fi
}

# ================================================
# VERIFICAR APLICACIÓN PM2
# ================================================

check_pm2() {
  print_header "VERIFICANDO PM2"

  if ! command -v pm2 &> /dev/null; then
    print_error "PM2 no está instalado"
    return 1
  fi

  # Verificar si la app está corriendo
  if pm2 show $APP_NAME &> /dev/null; then
    STATUS=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.status" 2>/dev/null || echo "unknown")

    if [ "$STATUS" == "online" ]; then
      UPTIME=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.pm_uptime" 2>/dev/null)
      RESTARTS=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.restart_time" 2>/dev/null || echo "0")
      MEMORY=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .monit.memory" 2>/dev/null || echo "0")
      CPU=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .monit.cpu" 2>/dev/null || echo "0")

      print_ok "Aplicación en línea"
      echo "  Reinicios: $RESTARTS"
      echo "  Memoria: $(( $MEMORY / 1024 / 1024 )) MB"
      echo "  CPU: $CPU%"

      # Alertar si hay demasiados reinicios
      if [ "$RESTARTS" -gt 10 ]; then
        print_warning "Demasiados reinicios detectados: $RESTARTS"
        send_alert "Aplicación $APP_NAME ha reiniciado $RESTARTS veces"
      fi

      # Alertar si el uso de memoria es muy alto
      MEMORY_MB=$(( $MEMORY / 1024 / 1024 ))
      if [ "$MEMORY_MB" -gt 400 ]; then
        print_warning "Uso alto de memoria: ${MEMORY_MB}MB"
        send_alert "Aplicación $APP_NAME usando ${MEMORY_MB}MB de memoria"
      fi

      return 0
    else
      print_error "Aplicación no está en línea (Status: $STATUS)"
      send_alert "Aplicación $APP_NAME está caída (Status: $STATUS)"
      return 1
    fi
  else
    print_error "Aplicación no encontrada en PM2"
    send_alert "Aplicación $APP_NAME no encontrada en PM2"
    return 1
  fi
}

# ================================================
# VERIFICAR NGINX
# ================================================

check_nginx() {
  print_header "VERIFICANDO NGINX"

  if systemctl is-active --quiet nginx; then
    print_ok "Nginx está corriendo"

    # Verificar configuración
    if sudo nginx -t &> /dev/null; then
      print_ok "Configuración de Nginx válida"
    else
      print_error "Error en configuración de Nginx"
      send_alert "Error en configuración de Nginx"
      return 1
    fi

    return 0
  else
    print_error "Nginx no está corriendo"
    send_alert "Nginx está caído"

    # Intentar reiniciar
    print_warning "Intentando reiniciar Nginx..."
    if sudo systemctl start nginx; then
      print_ok "Nginx reiniciado exitosamente"
      send_alert "Nginx fue reiniciado automáticamente"
    else
      print_error "No se pudo reiniciar Nginx"
    fi

    return 1
  fi
}

# ================================================
# VERIFICAR MYSQL
# ================================================

check_mysql() {
  print_header "VERIFICANDO MYSQL"

  if systemctl is-active --quiet mysql; then
    print_ok "MySQL está corriendo"

    # Intentar conectar
    source $PROJECT_DIR/.env 2>/dev/null || true

    if [ ! -z "$DB_USER" ] && [ ! -z "$DB_PASSWORD" ]; then
      if mysql -u$DB_USER -p$DB_PASSWORD -e "SELECT 1" &> /dev/null; then
        print_ok "Conexión a base de datos exitosa"

        # Verificar tamaño de base de datos
        DB_SIZE=$(mysql -u$DB_USER -p$DB_PASSWORD -e "
          SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
          FROM information_schema.TABLES
          WHERE table_schema = '$DB_NAME';" -s -N 2>/dev/null || echo "0")

        echo "  Tamaño de BD: ${DB_SIZE}MB"

        return 0
      else
        print_error "No se pudo conectar a la base de datos"
        send_alert "No se puede conectar a MySQL"
        return 1
      fi
    else
      print_warning "Credenciales de base de datos no configuradas"
    fi
  else
    print_error "MySQL no está corriendo"
    send_alert "MySQL está caído"

    # Intentar reiniciar
    print_warning "Intentando reiniciar MySQL..."
    if sudo systemctl start mysql; then
      print_ok "MySQL reiniciado exitosamente"
      send_alert "MySQL fue reiniciado automáticamente"
    else
      print_error "No se pudo reiniciar MySQL"
    fi

    return 1
  fi
}

# ================================================
# VERIFICAR API ENDPOINT
# ================================================

check_api() {
  print_header "VERIFICANDO API"

  source $PROJECT_DIR/.env 2>/dev/null || true
  PORT=${PORT:-3000}

  # Health check endpoint
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/health 2>/dev/null || echo "000")

  if [ "$RESPONSE" == "200" ]; then
    print_ok "API respondiendo correctamente (HTTP $RESPONSE)"

    # Obtener info del health endpoint
    HEALTH_INFO=$(curl -s http://localhost:$PORT/health 2>/dev/null)
    UPTIME=$(echo $HEALTH_INFO | jq -r '.uptime' 2>/dev/null || echo "N/A")
    echo "  Uptime: $(printf '%dd %dh %dm' $(($UPTIME/86400)) $(($UPTIME%86400/3600)) $(($UPTIME%3600/60)))"

    return 0
  else
    print_error "API no responde (HTTP $RESPONSE)"
    send_alert "API no responde en puerto $PORT (HTTP $RESPONSE)"
    return 1
  fi
}

# ================================================
# VERIFICAR ESPACIO EN DISCO
# ================================================

check_disk() {
  print_header "VERIFICANDO ESPACIO EN DISCO"

  DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

  echo "  Uso de disco: ${DISK_USAGE}%"

  if [ "$DISK_USAGE" -gt 90 ]; then
    print_error "Espacio en disco crítico: ${DISK_USAGE}%"
    send_alert "Espacio en disco crítico: ${DISK_USAGE}%"
    return 1
  elif [ "$DISK_USAGE" -gt 80 ]; then
    print_warning "Espacio en disco alto: ${DISK_USAGE}%"
    return 0
  else
    print_ok "Espacio en disco normal: ${DISK_USAGE}%"
    return 0
  fi
}

# ================================================
# VERIFICAR LOGS
# ================================================

check_logs() {
  print_header "VERIFICANDO LOGS"

  if [ -d "$PROJECT_DIR/logs" ]; then
    # Buscar errores recientes (última hora)
    ERROR_COUNT=$(find $PROJECT_DIR/logs -name "*.log" -mmin -60 -exec grep -i "error" {} \; 2>/dev/null | wc -l)

    if [ "$ERROR_COUNT" -gt 0 ]; then
      print_warning "Errores encontrados en logs (última hora): $ERROR_COUNT"

      if [ "$ERROR_COUNT" -gt 50 ]; then
        send_alert "Alto número de errores en logs: $ERROR_COUNT en la última hora"
      fi
    else
      print_ok "Sin errores en logs recientes"
    fi

    # Verificar tamaño de logs
    LOG_SIZE=$(du -sh $PROJECT_DIR/logs 2>/dev/null | awk '{print $1}')
    echo "  Tamaño total de logs: $LOG_SIZE"

    return 0
  else
    print_warning "Directorio de logs no encontrado"
    return 0
  fi
}

# ================================================
# VERIFICAR CERTIFICADO SSL
# ================================================

check_ssl() {
  print_header "VERIFICANDO SSL"

  CERT_FILE="/etc/letsencrypt/live/*/fullchain.pem"

  if ls $CERT_FILE 2>/dev/null; then
    EXPIRY_DATE=$(sudo openssl x509 -enddate -noout -in $(ls $CERT_FILE | head -1) | cut -d= -f2)
    EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

    if [ "$DAYS_LEFT" -gt 30 ]; then
      print_ok "Certificado SSL válido ($DAYS_LEFT días restantes)"
    elif [ "$DAYS_LEFT" -gt 0 ]; then
      print_warning "Certificado SSL expira pronto ($DAYS_LEFT días)"
      send_alert "Certificado SSL expira en $DAYS_LEFT días"
    else
      print_error "Certificado SSL expirado"
      send_alert "Certificado SSL ha expirado"
    fi
  else
    print_warning "Certificado SSL no encontrado (HTTPS no configurado)"
  fi
}

# ================================================
# RESUMEN
# ================================================

print_summary() {
  print_header "RESUMEN DE MONITOREO"

  echo "Fecha: $(date)"
  echo ""

  if [ $CHECKS_PASSED -eq $TOTAL_CHECKS ]; then
    print_ok "Todos los checks pasaron ($CHECKS_PASSED/$TOTAL_CHECKS)"
    exit 0
  else
    print_error "Algunos checks fallaron ($CHECKS_PASSED/$TOTAL_CHECKS)"
    exit 1
  fi
}

# ================================================
# EJECUTAR CHECKS
# ================================================

TOTAL_CHECKS=7
CHECKS_PASSED=0

check_pm2 && ((CHECKS_PASSED++))
check_nginx && ((CHECKS_PASSED++))
check_mysql && ((CHECKS_PASSED++))
check_api && ((CHECKS_PASSED++))
check_disk && ((CHECKS_PASSED++))
check_logs && ((CHECKS_PASSED++))
check_ssl && ((CHECKS_PASSED++))

print_summary
