# SISTEMA DE BACKUP AUTOMÁTICO - JDI CLEANING SERVICES

**Propósito**: Sistema de backup automático para prevenir pérdida de datos en la base de datos MySQL.

**Características**:
- ✅ Backups automáticos programables
- ✅ Compresión automática (ZIP/GZIP)
- ✅ Limpieza automática de backups antiguos (>30 días)
- ✅ Logs detallados de cada operación
- ✅ Restauración fácil con interfaz interactiva
- ✅ Compatible con Windows (XAMPP) y Linux/Mac

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
backup/
├── README.md                  # Este archivo
├── backup-database.bat        # Script de backup para Windows
├── backup-database.sh         # Script de backup para Linux/Mac
├── restore-database.bat       # Script de restauración para Windows
├── restore-database.sh        # Script de restauración para Linux/Mac
├── backups/                   # Directorio de backups (se crea automáticamente)
│   ├── jd_cleaning_2026-01-23_14-30-00.sql.zip
│   ├── jd_cleaning_2026-01-23_20-00-00.sql.zip
│   └── ...
└── logs/                      # Directorio de logs (se crea automáticamente)
    ├── backup_2026-01-23_14-30-00.log
    ├── restore_2026-01-23_15-45-00.log
    └── ...
```

---

## 🚀 USO RÁPIDO

### Windows (XAMPP)

#### Crear Backup Manual:
```cmd
cd C:\ruta\a\jdireports\backup
backup-database.bat
```

#### Restaurar Backup:
```cmd
cd C:\ruta\a\jdireports\backup
restore-database.bat
```
Luego selecciona el backup a restaurar del menú interactivo.

### Linux/Mac

#### Crear Backup Manual:
```bash
cd /ruta/a/jdireports/backup
./backup-database.sh
```

#### Restaurar Backup:
```bash
cd /ruta/a/jdireports/backup
./restore-database.sh
```
Luego selecciona el backup a restaurar del menú interactivo.

---

## ⚙️ CONFIGURACIÓN

### 1. Configurar Variables (IMPORTANTE)

Antes de usar los scripts, debes configurar las variables según tu entorno:

#### Windows (`backup-database.bat` y `restore-database.bat`):
```batch
SET MYSQL_DUMP="C:\xampp\mysql\bin\mysqldump.exe"
SET MYSQL="C:\xampp\mysql\bin\mysql.exe"
SET DB_USER=root
SET DB_PASSWORD=
SET DB_NAME=jd_cleaning_services
SET DB_HOST=localhost
```

#### Linux/Mac (`backup-database.sh` y `restore-database.sh`):
```bash
DB_USER="root"
DB_PASSWORD=""
DB_NAME="jd_cleaning_services"
DB_HOST="localhost"
DB_PORT="3306"
```

**IMPORTANTE**: Si tu base de datos tiene contraseña, actualiza `DB_PASSWORD`.

---

## 🕐 BACKUPS AUTOMÁTICOS

### Windows - Programador de Tareas

#### Método 1: Interfaz Gráfica (Recomendado)

1. **Abrir Programador de Tareas**:
   - Presiona `Win + R`
   - Escribe `taskschd.msc` y presiona Enter

2. **Crear Tarea Básica**:
   - Click en "Crear tarea básica..." en el panel derecho
   - Nombre: `JDI Backup Automático`
   - Descripción: `Backup automático de base de datos cada 6 horas`
   - Click en "Siguiente"

3. **Configurar Desencadenador**:
   - Selecciona: "Diariamente"
   - Click en "Siguiente"
   - Hora de inicio: `00:00:00` (medianoche)
   - Repetir cada: `1 días`
   - Click en "Siguiente"

4. **Acción**:
   - Selecciona: "Iniciar un programa"
   - Click en "Siguiente"
   - Programa: `C:\ruta\a\jdireports\backup\backup-database.bat`
   - Iniciar en: `C:\ruta\a\jdireports\backup`
   - Click en "Siguiente"

5. **Configuración Avanzada** (después de crear la tarea):
   - Doble click en la tarea creada
   - Pestaña "Desencadenadores" → Editar
   - Marcar: "Repetir la tarea cada: **6 horas**"
   - Durante: **1 día**
   - Click en "Aceptar"

6. **Configuración de Seguridad**:
   - Pestaña "General"
   - Seleccionar: "Ejecutar tanto si el usuario inició sesión como si no"
   - Marcar: "Ejecutar con los privilegios más altos"
   - Click en "Aceptar"

#### Método 2: Línea de Comandos (PowerShell como Administrador)

```powershell
# Crear tarea que se ejecuta cada 6 horas
$action = New-ScheduledTaskAction -Execute "C:\ruta\a\jdireports\backup\backup-database.bat" -WorkingDirectory "C:\ruta\a\jdireports\backup"

$trigger = New-ScheduledTaskTrigger -Daily -At 00:00
$trigger.Repetition = New-ScheduledTaskTrigger -Once -At 00:00 -RepetitionInterval (New-TimeSpan -Hours 6) -RepetitionDuration ([TimeSpan]::MaxValue)

$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName "JDI Backup Automático" -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Backup automático de base de datos JDI cada 6 horas"
```

#### Frecuencias Recomendadas:

- **Cada 6 horas**: Balance ideal (00:00, 06:00, 12:00, 18:00)
- **Cada 4 horas**: Para ambientes con cambios frecuentes
- **Cada 12 horas**: Para ambientes con pocos cambios (00:00, 12:00)
- **Diario**: Backup nocturno (02:00 AM)

### Linux/Mac - Cron

#### Configurar Crontab:

```bash
# Abrir editor de crontab
crontab -e

# Agregar una de estas líneas (según frecuencia deseada):

# Cada 6 horas (00:00, 06:00, 12:00, 18:00)
0 */6 * * * /ruta/a/jdireports/backup/backup-database.sh >> /ruta/a/jdireports/backup/logs/cron.log 2>&1

# Cada 4 horas
0 */4 * * * /ruta/a/jdireports/backup/backup-database.sh >> /ruta/a/jdireports/backup/logs/cron.log 2>&1

# Diario a las 2:00 AM
0 2 * * * /ruta/a/jdireports/backup/backup-database.sh >> /ruta/a/jdireports/backup/logs/cron.log 2>&1

# Cada hora (para ambientes críticos)
0 * * * * /ruta/a/jdireports/backup/backup-database.sh >> /ruta/a/jdireports/backup/logs/cron.log 2>&1
```

#### Verificar Crontab:
```bash
crontab -l
```

---

## 🔄 PROCESO DE BACKUP

### ¿Qué hace el script de backup?

1. **Conecta a MySQL** usando `mysqldump`
2. **Exporta la base de datos completa** incluyendo:
   - Estructura de tablas
   - Datos
   - Stored procedures
   - Triggers
   - Events
3. **Comprime el archivo** (ZIP en Windows, GZIP en Linux/Mac)
4. **Registra todo en un log** con timestamps
5. **Limpia backups antiguos** (>30 días) para ahorrar espacio

### Opciones de mysqldump utilizadas:

- `--databases`: Exporta la base de datos completa
- `--routines`: Incluye stored procedures y functions
- `--triggers`: Incluye triggers
- `--events`: Incluye eventos programados
- `--single-transaction`: Backup consistente sin bloquear tablas
- `--quick`: Reduce uso de memoria
- `--lock-tables=false`: No bloquea tablas durante el backup

### Tamaño de Backups:

- **Base de datos vacía**: ~50 KB comprimido
- **Con 1000 órdenes**: ~200-500 KB comprimido
- **Con 10000 órdenes**: ~2-5 MB comprimido

### Retención de Backups:

- **Automático**: Se eliminan backups mayores a 30 días
- **Manual**: Puedes modificar el número de días en el script:
  ```batch
  REM Windows - línea 89
  forfiles /P "%BACKUP_DIR%" /M *.zip /D -30 ...

  # Linux/Mac - línea 93
  find "$BACKUP_DIR" -name "jd_cleaning_*.sql.gz" -type f -mtime +30 ...
  ```
  Cambia `-30` a `-7` para 7 días, `-60` para 60 días, etc.

---

## 🔙 PROCESO DE RESTAURACIÓN

### ¿Qué hace el script de restauración?

1. **Lista todos los backups** disponibles con fechas y tamaños
2. **Muestra un menú interactivo** para seleccionar el backup
3. **Pide confirmación** antes de restaurar (¡IMPORTANTE!)
4. **Descomprime el backup** seleccionado
5. **Restaura la base de datos** completa
6. **Registra todo en un log** con timestamps
7. **Limpia archivos temporales**

### ⚠️ ADVERTENCIAS IMPORTANTES:

- ✋ **LA RESTAURACIÓN SOBRESCRIBIRÁ TODOS LOS DATOS ACTUALES**
- ✋ **SE PERDERÁN TODOS LOS CAMBIOS DESDE LA FECHA DEL BACKUP**
- ✋ **SIEMPRE VERIFICA QUE ESTÁS RESTAURANDO EL BACKUP CORRECTO**
- ✋ **CONSIDERA HACER UN BACKUP MANUAL ANTES DE RESTAURAR**

### Escenarios de Uso:

#### 1. Recuperación de Corrupción:
```
- Problema: Base de datos corrupta después de reinicio
- Solución: Restaurar el backup más reciente
```

#### 2. Error Humano:
```
- Problema: Se eliminaron datos importantes por error
- Solución: Restaurar backup anterior al error
```

#### 3. Migración/Testing:
```
- Problema: Necesitas copiar la BD a otro servidor
- Solución: Copia el archivo .zip/.gz y restáuralo
```

#### 4. Rollback:
```
- Problema: Una actualización causó problemas
- Solución: Restaurar backup anterior a la actualización
```

---

## 📊 MONITOREO Y LOGS

### Ubicación de Logs:

- **Windows**: `C:\ruta\a\jdireports\backup\logs\`
- **Linux/Mac**: `/ruta/a/jdireports/backup/logs/`

### Tipos de Logs:

1. **backup_YYYY-MM-DD_HH-MM-SS.log**: Log de cada backup
2. **restore_YYYY-MM-DD_HH-MM-SS.log**: Log de cada restauración
3. **cron.log** (Linux/Mac): Log de ejecuciones de cron

### Información en los Logs:

- Timestamp de inicio y fin
- Archivo de backup generado
- Tamaño del backup
- Resultado (éxito/error)
- Backups eliminados (limpieza automática)
- Estadísticas (total de backups, espacio usado)

### Ejemplo de Log Exitoso:

```
================================================
JDI CLEANING SERVICES - BACKUP AUTOMÁTICO
================================================
Fecha: 2026-01-23 14:30:00

[14:30:00] Iniciando backup de la base de datos...
[14:30:00] Archivo: C:\jdireports\backup\backups\jd_cleaning_2026-01-23_14-30-00.sql
[14:30:05] ✓ Backup completado exitosamente
[14:30:05] Tamaño del archivo: 245678 bytes
[14:30:05] Comprimiendo backup...
[14:30:06] ✓ Backup comprimido exitosamente
[14:30:06] Archivo SQL eliminado, conservando .zip
[14:30:06] Eliminando backups antiguos (más de 30 días)...
[14:30:06] Eliminado: jd_cleaning_2025-12-20_14-30-00.sql.zip
================================================
BACKUP COMPLETADO
================================================
```

### Revisar Logs:

#### Windows:
```cmd
cd C:\ruta\a\jdireports\backup\logs
type backup_2026-01-23_14-30-00.log
```

#### Linux/Mac:
```bash
cd /ruta/a/jdireports/backup/logs
cat backup_2026-01-23_14-30-00.log
```

---

## 🛠️ SOLUCIÓN DE PROBLEMAS

### Problema: "mysqldump no se reconoce como comando"

**Windows**:
```
Solución: Verifica la ruta en SET MYSQL_DUMP
Por defecto: C:\xampp\mysql\bin\mysqldump.exe

Si XAMPP está en otra ubicación:
SET MYSQL_DUMP="C:\ruta\correcta\mysql\bin\mysqldump.exe"
```

**Linux/Mac**:
```
Solución: Instala mysql-client
Ubuntu/Debian: sudo apt-get install mysql-client
macOS: brew install mysql-client
```

### Problema: "Access denied for user 'root'@'localhost'"

```
Solución: Verifica usuario y contraseña
- Abre phpMyAdmin
- Verifica el usuario actual
- Actualiza DB_USER y DB_PASSWORD en el script
```

### Problema: "Can't create/write to file"

**Windows**:
```
Solución: Ejecuta el script como Administrador
- Click derecho en backup-database.bat
- "Ejecutar como administrador"
```

**Linux/Mac**:
```
Solución: Verifica permisos
chmod +x backup-database.sh
chmod 755 backup/
```

### Problema: Backups ocupan mucho espacio

```
Solución 1: Reducir retención
- Cambiar -30 a -7 (7 días en vez de 30)

Solución 2: Aumentar frecuencia de limpieza
- Ejecutar manualmente: find backup/backups -name "*.gz" -mtime +7 -delete

Solución 3: Backup externo
- Copiar backups a otro disco/servidor
- Usar herramientas de sincronización (rsync, Dropbox, Google Drive)
```

### Problema: Error "out of memory" durante backup

```
Solución: La base de datos es muy grande
- Aumentar memoria de MySQL en my.ini/my.cnf
- Usar backup por tablas (modificar script)
- Considerar herramientas especializadas (Percona XtraBackup)
```

### Problema: Tarea programada no se ejecuta (Windows)

```
Solución: Verificar configuración
1. Abrir Programador de Tareas
2. Buscar "JDI Backup Automático"
3. Click derecho → "Propiedades"
4. Verificar:
   - Usuario: SYSTEM o tu usuario
   - "Ejecutar con los privilegios más altos": ✅
   - "Ejecutar tanto si el usuario inició sesión como si no": ✅
5. Pestaña "Historial" para ver errores
```

### Problema: Cron no ejecuta el script (Linux/Mac)

```
Solución: Verificar permisos y rutas
1. Verificar script ejecutable:
   chmod +x backup-database.sh

2. Usar rutas absolutas en crontab:
   /home/user/jdireports/backup/backup-database.sh

3. Verificar logs de cron:
   grep CRON /var/log/syslog

4. Probar manualmente:
   cd /ruta/a/backup && ./backup-database.sh
```

---

## 🔐 SEGURIDAD Y MEJORES PRÁCTICAS

### 1. Protección de Backups

```
✅ RECOMENDADO:
- Mantener backups en múltiples ubicaciones
- Encriptar backups con contraseñas
- Restringir permisos de acceso

❌ NO RECOMENDADO:
- Backups en el mismo disco que la BD
- Backups sin protección de contraseña
- Backups accesibles públicamente
```

### 2. Backups Externos (Altamente Recomendado)

#### Opción A: Google Drive / Dropbox / OneDrive
```batch
REM Windows - Agregar al final de backup-database.bat
copy "%BACKUP_FILE%.zip" "C:\Users\Usuario\Google Drive\JDI_Backups\"
```

```bash
# Linux/Mac - Agregar al final de backup-database.sh
cp "${BACKUP_FILE}.gz" "$HOME/Dropbox/JDI_Backups/"
```

#### Opción B: Servidor Remoto (SSH/FTP)
```bash
# Linux/Mac - Usando rsync
rsync -avz "$BACKUP_FILE.gz" user@servidor:/backups/jdi/
```

### 3. Verificación de Backups

**¡IMPORTANTE!** Prueba tus backups regularmente:

```
1. Una vez al mes:
   - Restaura un backup en una BD de prueba
   - Verifica que los datos estén completos
   - Verifica que la aplicación funcione

2. Después de cambios importantes:
   - Migración
   - Actualización de schema
   - Cambio de servidor
```

### 4. Encriptación de Backups (Opcional)

#### Windows (7-Zip):
```batch
REM Después de crear el backup
"C:\Program Files\7-Zip\7z.exe" a -p"TU_CONTRASEÑA_SEGURA" -mhe=on "%BACKUP_FILE%.7z" "%BACKUP_FILE%.zip"
```

#### Linux/Mac (GPG):
```bash
# Encriptar backup
gpg --symmetric --cipher-algo AES256 "${BACKUP_FILE}.gz"

# Desencriptar (para restaurar)
gpg --decrypt "${BACKUP_FILE}.gz.gpg" > "${BACKUP_FILE}.gz"
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Configuración Inicial:

- [ ] Descargar/clonar el repositorio
- [ ] Verificar que XAMPP/MySQL está instalado
- [ ] Editar scripts con configuración correcta (usuario, contraseña, rutas)
- [ ] Probar backup manual una vez
- [ ] Verificar que se creó el archivo en `backup/backups/`
- [ ] Verificar el log en `backup/logs/`
- [ ] Probar restauración con el backup de prueba

### Automatización:

- [ ] **Windows**: Configurar Tarea Programada
  - [ ] Tarea creada en Programador de Tareas
  - [ ] Configurar repetición cada 6 horas
  - [ ] Probar ejecución manual desde Programador
  - [ ] Verificar en "Última ejecución" que funcionó

- [ ] **Linux/Mac**: Configurar Crontab
  - [ ] Editar crontab con `crontab -e`
  - [ ] Agregar línea con frecuencia deseada
  - [ ] Verificar con `crontab -l`
  - [ ] Esperar primera ejecución automática

### Monitoreo:

- [ ] Configurar alerta (email/SMS) en caso de fallo
- [ ] Revisar logs semanalmente
- [ ] Verificar espacio en disco mensualmente
- [ ] Probar restauración mensualmente

### Backups Externos:

- [ ] Configurar copia a otro disco/servidor
- [ ] Configurar sincronización con nube (Google Drive/Dropbox)
- [ ] Verificar que los backups externos se están creando

---

## 📞 SOPORTE Y AYUDA

### Recursos:

- **MySQL Documentation**: https://dev.mysql.com/doc/refman/8.0/en/mysqldump.html
- **Task Scheduler**: https://docs.microsoft.com/en-us/windows/win32/taskschd/
- **Cron**: https://man7.org/linux/man-pages/man5/crontab.5.html

### Archivos de Configuración:

- `backup-database.bat` / `backup-database.sh`: Script de backup
- `restore-database.bat` / `restore-database.sh`: Script de restauración
- Este README.md: Documentación completa

---

## 🎯 RESUMEN

Este sistema de backup automático te protege contra:

✅ **Corrupción de base de datos** (como el problema que tuviste)
✅ **Errores humanos** (eliminación accidental de datos)
✅ **Fallos de hardware** (disco duro dañado)
✅ **Problemas de software** (updates que rompen la BD)

**Configuración recomendada**:
- Backup cada 6 horas
- Retención de 30 días
- Copia externa (nube o servidor remoto)
- Prueba de restauración mensual

**¡IMPORTANTE!**: El mejor backup es el que nunca necesitas usar, pero cuando lo necesitas, ¡no tiene precio!

---

**Creado por**: Claude (AI Assistant)
**Fecha**: 2026-01-23
**Versión**: 1.0.0
