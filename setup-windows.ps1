# ================================================
# SCRIPT DE SETUP PARA WINDOWS 11
# JD CLEANING SERVICES
# ================================================

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "  JD CLEANING SERVICES - SETUP WINDOWS 11" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# Verificar que estamos en la carpeta correcta
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Ejecuta este script desde la carpeta raíz del proyecto" -ForegroundColor Red
    exit 1
}

# ================================================
# PASO 1: Verificar Node.js
# ================================================
Write-Host "📋 Verificando Node.js..." -ForegroundColor Yellow

try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js no está instalado" -ForegroundColor Red
    Write-Host "   Descárgalo desde: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# ================================================
# PASO 2: Verificar MySQL de XAMPP
# ================================================
Write-Host "`n📋 Verificando MySQL..." -ForegroundColor Yellow

$mysqlPath = "C:\xampp\mysql\bin\mysql.exe"

if (Test-Path $mysqlPath) {
    Write-Host "✅ MySQL encontrado en XAMPP" -ForegroundColor Green
} else {
    Write-Host "⚠️  MySQL no encontrado en C:\xampp\" -ForegroundColor Yellow
    Write-Host "   Asegúrate de que XAMPP esté instalado" -ForegroundColor Yellow
}

# ================================================
# PASO 3: Crear archivo .env
# ================================================
Write-Host "`n📋 Configurando archivo .env..." -ForegroundColor Yellow

if (Test-Path ".env") {
    Write-Host "⚠️  El archivo .env ya existe" -ForegroundColor Yellow
    $overwrite = Read-Host "¿Quieres sobrescribirlo? (s/n)"
    if ($overwrite -eq "s") {
        Copy-Item ".env.example" ".env" -Force
        Write-Host "✅ Archivo .env creado desde .env.example" -ForegroundColor Green
    } else {
        Write-Host "⏭️  Saltando creación de .env" -ForegroundColor Yellow
    }
} else {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Archivo .env creado desde .env.example" -ForegroundColor Green
}

# ================================================
# PASO 4: Generar JWT_SECRET
# ================================================
Write-Host "`n📋 Generando JWT_SECRET..." -ForegroundColor Yellow

$jwtSecret = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
Write-Host "✅ JWT_SECRET generado:" -ForegroundColor Green
Write-Host "   $jwtSecret" -ForegroundColor Cyan
Write-Host "`n   Copia este valor y pégalo en el archivo .env en la línea JWT_SECRET=" -ForegroundColor Yellow

# ================================================
# PASO 5: Crear directorios
# ================================================
Write-Host "`n📋 Creando directorios necesarios..." -ForegroundColor Yellow

$directories = @(
    "uploads",
    "uploads\photos",
    "uploads\thumbnails",
    "uploads\reports",
    "assets",
    "logs"
)

foreach ($dir in $directories) {
    New-Item -Path $dir -ItemType Directory -Force | Out-Null
    Write-Host "✅ Directorio creado: $dir" -ForegroundColor Green
}

# ================================================
# PASO 6: Instalar dependencias
# ================================================
Write-Host "`n📋 Instalando dependencias de Node.js..." -ForegroundColor Yellow
Write-Host "   Esto puede tardar unos minutos...`n" -ForegroundColor Yellow

npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Dependencias instaladas correctamente" -ForegroundColor Green
} else {
    Write-Host "`n❌ Error al instalar dependencias" -ForegroundColor Red
    exit 1
}

# ================================================
# RESUMEN
# ================================================
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "  SETUP COMPLETADO" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

Write-Host "✅ Archivo .env creado" -ForegroundColor Green
Write-Host "✅ Directorios creados" -ForegroundColor Green
Write-Host "✅ Dependencias instaladas" -ForegroundColor Green

Write-Host "`n📝 PRÓXIMOS PASOS:`n" -ForegroundColor Yellow

Write-Host "1. Edita el archivo .env y configura:" -ForegroundColor White
Write-Host "   - JWT_SECRET (usa el generado arriba)" -ForegroundColor Gray
Write-Host "   - EMAIL_USER (tu email de Gmail)" -ForegroundColor Gray
Write-Host "   - EMAIL_PASSWORD (contraseña de aplicación de Gmail)" -ForegroundColor Gray

Write-Host "`n2. Asegúrate de que MySQL esté corriendo en XAMPP" -ForegroundColor White
Write-Host "   - Abre XAMPP Control Panel" -ForegroundColor Gray
Write-Host "   - Click en 'Start' junto a MySQL" -ForegroundColor Gray

Write-Host "`n3. Crea la base de datos:" -ForegroundColor White
Write-Host "   - Ve a http://localhost/phpmyadmin" -ForegroundColor Gray
Write-Host "   - Ejecuta: CREATE DATABASE jd_cleaning_services CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" -ForegroundColor Gray

Write-Host "`n4. Ejecuta las migraciones (ver README_WINDOWS.md)" -ForegroundColor White

Write-Host "`n5. Inicia el servidor:" -ForegroundColor White
Write-Host "   npm start`n" -ForegroundColor Cyan

Write-Host "================================================`n" -ForegroundColor Cyan
