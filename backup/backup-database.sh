#!/bin/bash
# ================================================
# SCRIPT DE BACKUP AUTOMÁTICO - JDI CLEANING SERVICES
# Para Linux/Mac/WSL
# ================================================

# ================================================
# CONFIGURACIÓN
# ================================================

# Configuración de la base de datos
DB_USER="root"
DB_PASSWORD=""
DB_NAME="jd_cleaning_services"
DB_HOST="localhost"
DB_PORT="3306"

# Directorios
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/backups"
LOG_DIR="${SCRIPT_DIR}/logs"

# Crear directorios si no existen
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"

# Timestamp para nombres de archivo
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="${BACKUP_DIR}/jd_cleaning_${TIMESTAMP}.sql"
LOG_FILE="${LOG_DIR}/backup_${TIMESTAMP}.log"

# ================================================
# FUNCIONES
# ================================================

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# ================================================
# INICIAR BACKUP
# ================================================

log "================================================"
log "JDI CLEANING SERVICES - BACKUP AUTOMÁTICO"
log "================================================"
log ""
log "Iniciando backup de la base de datos..."
log "Archivo: $BACKUP_FILE"

# Ejecutar mysqldump
if [ -z "$DB_PASSWORD" ]; then
    # Sin contraseña
    mysqldump -h "$DB_HOST" \
              -P "$DB_PORT" \
              -u "$DB_USER" \
              --databases "$DB_NAME" \
              --routines \
              --triggers \
              --events \
              --single-transaction \
              --quick \
              --lock-tables=false \
              > "$BACKUP_FILE" 2>> "$LOG_FILE"
else
    # Con contraseña
    mysqldump -h "$DB_HOST" \
              -P "$DB_PORT" \
              -u "$DB_USER" \
              -p"$DB_PASSWORD" \
              --databases "$DB_NAME" \
              --routines \
              --triggers \
              --events \
              --single-transaction \
              --quick \
              --lock-tables=false \
              > "$BACKUP_FILE" 2>> "$LOG_FILE"
fi

# Verificar resultado
if [ $? -eq 0 ]; then
    FILE_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null)
    log "✓ Backup completado exitosamente"
    log "Tamaño del archivo: $FILE_SIZE bytes"

    # Comprimir backup
    log "Comprimiendo backup..."
    gzip "$BACKUP_FILE"

    if [ $? -eq 0 ]; then
        log "✓ Backup comprimido exitosamente: ${BACKUP_FILE}.gz"
    else
        log "⚠ Error al comprimir backup"
    fi
else
    log "✗ ERROR: Fallo al crear backup"
    log "Código de error: $?"
    exit 1
fi

# ================================================
# LIMPIEZA DE BACKUPS ANTIGUOS (>30 días)
# ================================================

log ""
log "Eliminando backups antiguos (más de 30 días)..."
find "$BACKUP_DIR" -name "jd_cleaning_*.sql.gz" -type f -mtime +30 -exec rm -f {} \; -print | while read file; do
    log "Eliminado: $(basename "$file")"
done

# ================================================
# ESTADÍSTICAS
# ================================================

TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "jd_cleaning_*.sql.gz" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

log ""
log "Estadísticas:"
log "  - Backups totales: $TOTAL_BACKUPS"
log "  - Espacio usado: $TOTAL_SIZE"
log ""
log "================================================"
log "BACKUP COMPLETADO"
log "================================================"
log ""

exit 0
