#!/bin/bash
# ================================================
# SCRIPT DE RESTAURACIÓN - JDI CLEANING SERVICES
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
mkdir -p "$LOG_DIR"

# Timestamp para log
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_FILE="${LOG_DIR}/restore_${TIMESTAMP}.log"

# ================================================
# FUNCIONES
# ================================================

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# ================================================
# VERIFICAR DIRECTORIO DE BACKUPS
# ================================================

if [ ! -d "$BACKUP_DIR" ]; then
    echo "ERROR: No existe el directorio de backups: $BACKUP_DIR"
    exit 1
fi

# ================================================
# LISTAR BACKUPS DISPONIBLES
# ================================================

echo "================================================"
echo "JDI CLEANING SERVICES - RESTAURAR BASE DE DATOS"
echo "================================================"
echo ""
echo "Backups disponibles:"
echo ""

INDEX=0
declare -a FILES

while IFS= read -r file; do
    ((INDEX++))
    FILES[$INDEX]="$file"
    FILEDATE=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$file" 2>/dev/null || stat -c "%y" "$file" 2>/dev/null | cut -d' ' -f1,2)
    FILESIZE=$(stat -f "%z" "$file" 2>/dev/null || stat -c "%s" "$file" 2>/dev/null)
    FILESIZEH=$(numfmt --to=iec-i --suffix=B "$FILESIZE" 2>/dev/null || echo "${FILESIZE}B")
    echo "$INDEX. $(basename "$file") - $FILEDATE ($FILESIZEH)"
done < <(find "$BACKUP_DIR" -name "jd_cleaning_*.sql.gz" -type f | sort -r)

if [ $INDEX -eq 0 ]; then
    echo "No se encontraron backups en $BACKUP_DIR"
    echo ""
    exit 1
fi

echo ""
read -p "Seleccione el número del backup a restaurar (0 para cancelar): " SELECTION

if [ "$SELECTION" = "0" ]; then
    echo "Operación cancelada."
    exit 0
fi

if [ "$SELECTION" -gt "$INDEX" ] || [ "$SELECTION" -lt 1 ]; then
    echo "Selección inválida."
    exit 1
fi

SELECTED_FILE="${FILES[$SELECTION]}"

echo ""
echo "Backup seleccionado: $(basename "$SELECTED_FILE")"
echo ""
echo "ADVERTENCIA: Esta operación sobrescribirá la base de datos actual."
read -p "¿Está seguro de continuar? (s/N): " CONFIRM

if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
    echo "Operación cancelada."
    exit 0
fi

# ================================================
# DESCOMPRIMIR Y RESTAURAR
# ================================================

log "================================================"
log "JDI CLEANING SERVICES - RESTAURACIÓN"
log "================================================"
log ""
log "Iniciando restauración..."
log "Archivo: $SELECTED_FILE"

# Descomprimir
TEMP_SQL="${BACKUP_DIR}/temp_restore_${TIMESTAMP}.sql"
log "Descomprimiendo backup..."
gunzip -c "$SELECTED_FILE" > "$TEMP_SQL" 2>> "$LOG_FILE"

if [ $? -ne 0 ]; then
    log "✗ ERROR: No se pudo descomprimir el backup"
    rm -f "$TEMP_SQL"
    exit 1
fi

log "✓ Backup descomprimido"

# Restaurar
echo ""
echo "Restaurando base de datos..."
log "Ejecutando restauración..."

if [ -z "$DB_PASSWORD" ]; then
    # Sin contraseña
    mysql -h "$DB_HOST" \
          -P "$DB_PORT" \
          -u "$DB_USER" \
          < "$TEMP_SQL" 2>> "$LOG_FILE"
else
    # Con contraseña
    mysql -h "$DB_HOST" \
          -P "$DB_PORT" \
          -u "$DB_USER" \
          -p"$DB_PASSWORD" \
          < "$TEMP_SQL" 2>> "$LOG_FILE"
fi

# Verificar resultado
if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Base de datos restaurada exitosamente"
    log "✓ Restauración completada exitosamente"

    # Limpiar archivo temporal
    rm -f "$TEMP_SQL"
    log "Archivo temporal eliminado"
else
    echo ""
    echo "✗ ERROR: Fallo al restaurar la base de datos"
    log "✗ ERROR: Fallo al restaurar (código: $?)"
    log "Consulte el archivo de log para más detalles: $LOG_FILE"
fi

log ""
log "================================================"
log "RESTAURACIÓN FINALIZADA"
log "================================================"
log ""

exit 0
