@echo off
REM ================================================
REM SCRIPT DE RESTAURACIÓN - JDI CLEANING SERVICES
REM Para Windows + XAMPP
REM ================================================

SETLOCAL EnableDelayedExpansion

REM ================================================
REM CONFIGURACIÓN
REM ================================================

REM Ruta de mysql en XAMPP (ajustar si es necesario)
SET MYSQL="C:\xampp\mysql\bin\mysql.exe"

REM Configuración de la base de datos
SET DB_USER=root
SET DB_PASSWORD=
SET DB_NAME=jd_cleaning_services
SET DB_HOST=localhost

REM Directorio de backups
SET BACKUP_DIR=%~dp0backups
SET LOG_DIR=%~dp0logs

REM Verificar que existe el directorio de backups
IF NOT EXIST "%BACKUP_DIR%" (
    echo ERROR: No existe el directorio de backups: %BACKUP_DIR%
    exit /b 1
)

REM ================================================
REM LISTAR BACKUPS DISPONIBLES
REM ================================================

echo ================================================
echo JDI CLEANING SERVICES - RESTAURAR BASE DE DATOS
echo ================================================
echo.
echo Backups disponibles:
echo.

SET INDEX=0
FOR %%F IN ("%BACKUP_DIR%\*.zip") DO (
    SET /A INDEX+=1
    SET "FILE_!INDEX!=%%F"
    echo !INDEX!. %%~nxF (%%~tF)
)

IF %INDEX%==0 (
    echo No se encontraron backups en %BACKUP_DIR%
    echo.
    pause
    exit /b 1
)

echo.
SET /P SELECTION="Seleccione el número del backup a restaurar (0 para cancelar): "

IF "%SELECTION%"=="0" (
    echo Operación cancelada.
    exit /b 0
)

IF %SELECTION% GTR %INDEX% (
    echo Selección inválida.
    pause
    exit /b 1
)

SET SELECTED_FILE=!FILE_%SELECTION%!

echo.
echo Backup seleccionado: %SELECTED_FILE%
echo.
echo ADVERTENCIA: Esta operación sobrescribirá la base de datos actual.
SET /P CONFIRM="¿Está seguro de continuar? (S/N): "

IF /I NOT "%CONFIRM%"=="S" (
    echo Operación cancelada.
    exit /b 0
)

REM ================================================
REM DESCOMPRIMIR Y RESTAURAR
REM ================================================

REM Crear timestamp para el log
FOR /f "tokens=2-4 delims=/ " %%a IN ('date /t') DO (SET DATE_STR=%%c-%%a-%%b)
FOR /f "tokens=1-2 delims=/: " %%a IN ("%TIME%") DO (SET TIME_STR=%%a-%%b)
SET TIMESTAMP=%DATE_STR%_%TIME_STR%

IF NOT EXIST "%LOG_DIR%" mkdir "%LOG_DIR%"
SET LOG_FILE=%LOG_DIR%\restore_%TIMESTAMP%.log

echo [%TIME%] Iniciando restauración... >> "%LOG_FILE%"
echo [%TIME%] Archivo: %SELECTED_FILE% >> "%LOG_FILE%"

REM Descomprimir
SET TEMP_SQL=%BACKUP_DIR%\temp_restore.sql
powershell -Command "Expand-Archive -Path '%SELECTED_FILE%' -DestinationPath '%BACKUP_DIR%' -Force" 2>> "%LOG_FILE%"

REM Buscar el archivo SQL descomprimido
FOR %%F IN ("%BACKUP_DIR%\jd_cleaning_*.sql") DO SET TEMP_SQL=%%F

IF NOT EXIST "%TEMP_SQL%" (
    echo ERROR: No se pudo descomprimir el backup
    echo [%TIME%] ERROR: No se pudo descomprimir el backup >> "%LOG_FILE%"
    pause
    exit /b 1
)

echo.
echo Restaurando base de datos...

REM Ejecutar restauración
IF "%DB_PASSWORD%"=="" (
    %MYSQL% -h %DB_HOST% -u %DB_USER% < "%TEMP_SQL%" 2>> "%LOG_FILE%"
) ELSE (
    %MYSQL% -h %DB_HOST% -u %DB_USER% -p%DB_PASSWORD% < "%TEMP_SQL%" 2>> "%LOG_FILE%"
)

IF %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Base de datos restaurada exitosamente
    echo [%TIME%] ✓ Restauración completada exitosamente >> "%LOG_FILE%"

    REM Limpiar archivo temporal
    del "%TEMP_SQL%"
) ELSE (
    echo.
    echo ✗ ERROR: Fallo al restaurar la base de datos
    echo [%TIME%] ✗ ERROR: Fallo al restaurar (código: %ERRORLEVEL%) >> "%LOG_FILE%"
)

echo.
echo Presione cualquier tecla para salir...
pause >nul

ENDLOCAL
