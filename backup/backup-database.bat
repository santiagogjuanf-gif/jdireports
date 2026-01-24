@echo off
REM ================================================
REM SCRIPT DE BACKUP AUTOMÁTICO - JDI CLEANING SERVICES
REM Para Windows + XAMPP
REM ================================================

SETLOCAL EnableDelayedExpansion

REM ================================================
REM CONFIGURACIÓN
REM ================================================

REM Ruta de mysqldump en XAMPP (ajustar si es necesario)
SET MYSQL_DUMP="C:\xampp\mysql\bin\mysqldump.exe"

REM Configuración de la base de datos
SET DB_USER=root
SET DB_PASSWORD=
SET DB_NAME=jd_cleaning_services
SET DB_HOST=localhost

REM Directorio de backups (relativo al script)
SET BACKUP_DIR=%~dp0backups
SET LOG_DIR=%~dp0logs

REM Crear directorios si no existen
IF NOT EXIST "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
IF NOT EXIST "%LOG_DIR%" mkdir "%LOG_DIR%"

REM Generar nombre de archivo con timestamp
FOR /f "tokens=2-4 delims=/ " %%a IN ('date /t') DO (SET DATE_STR=%%c-%%a-%%b)
FOR /f "tokens=1-2 delims=/: " %%a IN ("%TIME%") DO (SET TIME_STR=%%a-%%b)
SET TIMESTAMP=%DATE_STR%_%TIME_STR%

SET BACKUP_FILE=%BACKUP_DIR%\jd_cleaning_%TIMESTAMP%.sql
SET LOG_FILE=%LOG_DIR%\backup_%TIMESTAMP%.log

REM ================================================
REM INICIAR BACKUP
REM ================================================

echo ================================================ >> "%LOG_FILE%"
echo JDI CLEANING SERVICES - BACKUP AUTOMÁTICO >> "%LOG_FILE%"
echo ================================================ >> "%LOG_FILE%"
echo Fecha: %DATE% %TIME% >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

echo [%TIME%] Iniciando backup de la base de datos... >> "%LOG_FILE%"
echo [%TIME%] Archivo: %BACKUP_FILE% >> "%LOG_FILE%"

REM Ejecutar mysqldump
IF "%DB_PASSWORD%"=="" (
    %MYSQL_DUMP% -h %DB_HOST% -u %DB_USER% --databases %DB_NAME% --routines --triggers --events --single-transaction --quick --lock-tables=false > "%BACKUP_FILE%" 2>> "%LOG_FILE%"
) ELSE (
    %MYSQL_DUMP% -h %DB_HOST% -u %DB_USER% -p%DB_PASSWORD% --databases %DB_NAME% --routines --triggers --events --single-transaction --quick --lock-tables=false > "%BACKUP_FILE%" 2>> "%LOG_FILE%"
)

IF %ERRORLEVEL% EQU 0 (
    echo [%TIME%] ✓ Backup completado exitosamente >> "%LOG_FILE%"
    echo [%TIME%] Tamaño del archivo: >> "%LOG_FILE%"
    FOR %%A IN ("%BACKUP_FILE%") DO echo %%~zA bytes >> "%LOG_FILE%"

    REM Comprimir backup
    echo [%TIME%] Comprimiendo backup... >> "%LOG_FILE%"
    powershell -Command "Compress-Archive -Path '%BACKUP_FILE%' -DestinationPath '%BACKUP_FILE%.zip' -Force" 2>> "%LOG_FILE%"

    IF %ERRORLEVEL% EQU 0 (
        echo [%TIME%] ✓ Backup comprimido exitosamente >> "%LOG_FILE%"
        del "%BACKUP_FILE%"
        echo [%TIME%] Archivo SQL eliminado, conservando .zip >> "%LOG_FILE%"
    ) ELSE (
        echo [%TIME%] ⚠ Error al comprimir backup >> "%LOG_FILE%"
    )

) ELSE (
    echo [%TIME%] ✗ ERROR: Fallo al crear backup >> "%LOG_FILE%"
    echo [%TIME%] Código de error: %ERRORLEVEL% >> "%LOG_FILE%"
)

REM ================================================
REM LIMPIEZA DE BACKUPS ANTIGUOS (>30 días)
REM ================================================

echo. >> "%LOG_FILE%"
echo [%TIME%] Eliminando backups antiguos (más de 30 días)... >> "%LOG_FILE%"
forfiles /P "%BACKUP_DIR%" /M *.zip /D -30 /C "cmd /c del @path && echo [@fdate @ftime] Eliminado: @file" >> "%LOG_FILE%" 2>&1

echo. >> "%LOG_FILE%"
echo ================================================ >> "%LOG_FILE%"
echo BACKUP COMPLETADO >> "%LOG_FILE%"
echo ================================================ >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

REM Mostrar en consola
type "%LOG_FILE%"

ENDLOCAL
