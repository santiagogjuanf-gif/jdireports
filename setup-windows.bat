@echo off
REM ================================================
REM SCRIPT DE SETUP PARA WINDOWS 11 (CMD)
REM JD CLEANING SERVICES
REM ================================================

echo.
echo ================================================
echo   JD CLEANING SERVICES - SETUP WINDOWS 11
echo ================================================
echo.

REM Verificar que estamos en la carpeta correcta
if not exist package.json (
    echo ❌ Error: Ejecuta este script desde la carpeta raiz del proyecto
    pause
    exit /b 1
)

REM ================================================
REM PASO 1: Verificar Node.js
REM ================================================
echo 📋 Verificando Node.js...

node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no esta instalado
    echo    Descargalo desde: https://nodejs.org/
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js instalado: %NODE_VERSION%
)

REM ================================================
REM PASO 2: Verificar MySQL de XAMPP
REM ================================================
echo.
echo 📋 Verificando MySQL...

if exist "C:\xampp\mysql\bin\mysql.exe" (
    echo ✅ MySQL encontrado en XAMPP
) else (
    echo ⚠️  MySQL no encontrado en C:\xampp\
    echo    Asegurate de que XAMPP este instalado
)

REM ================================================
REM PASO 3: Crear archivo .env
REM ================================================
echo.
echo 📋 Configurando archivo .env...

if exist .env (
    echo ⚠️  El archivo .env ya existe
    echo    No se sobrescribira
) else (
    copy .env.example .env >nul
    echo ✅ Archivo .env creado desde .env.example
)

REM ================================================
REM PASO 4: Generar JWT_SECRET
REM ================================================
echo.
echo 📋 Generando JWT_SECRET...
echo.

for /f "tokens=*" %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set JWT_SECRET=%%i
echo ✅ JWT_SECRET generado:
echo    %JWT_SECRET%
echo.
echo    Copia este valor y pegalo en el archivo .env en la linea JWT_SECRET=
echo.

REM ================================================
REM PASO 5: Crear directorios
REM ================================================
echo 📋 Creando directorios necesarios...

mkdir uploads 2>nul
mkdir uploads\photos 2>nul
mkdir uploads\thumbnails 2>nul
mkdir uploads\reports 2>nul
mkdir assets 2>nul
mkdir logs 2>nul

echo ✅ Directorios creados

REM ================================================
REM PASO 6: Instalar dependencias
REM ================================================
echo.
echo 📋 Instalando dependencias de Node.js...
echo    Esto puede tardar unos minutos...
echo.

call npm install

if errorlevel 1 (
    echo.
    echo ❌ Error al instalar dependencias
    pause
    exit /b 1
)

echo.
echo ✅ Dependencias instaladas correctamente

REM ================================================
REM RESUMEN
REM ================================================
echo.
echo ================================================
echo   SETUP COMPLETADO
echo ================================================
echo.

echo ✅ Archivo .env creado
echo ✅ Directorios creados
echo ✅ Dependencias instaladas

echo.
echo 📝 PROXIMOS PASOS:
echo.

echo 1. Edita el archivo .env y configura:
echo    - JWT_SECRET (usa el generado arriba)
echo    - EMAIL_USER (tu email de Gmail)
echo    - EMAIL_PASSWORD (contraseña de aplicacion de Gmail)

echo.
echo 2. Asegurate de que MySQL este corriendo en XAMPP
echo    - Abre XAMPP Control Panel
echo    - Click en 'Start' junto a MySQL

echo.
echo 3. Crea la base de datos:
echo    - Ve a http://localhost/phpmyadmin
echo    - Ejecuta: CREATE DATABASE jd_cleaning_services CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

echo.
echo 4. Ejecuta las migraciones (ver README_WINDOWS.md)

echo.
echo 5. Inicia el servidor:
echo    npm start

echo.
echo ================================================
echo.

pause
