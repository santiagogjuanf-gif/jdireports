#!/bin/bash

# ================================================
# INICIO RÁPIDO - JD CLEANING SERVICES
# ================================================

echo "================================================"
echo "  JD CLEANING SERVICES - INICIO RÁPIDO"
echo "================================================"
echo ""

# Verificar que exista .env
if [ ! -f .env ]; then
    echo "⚠️  Archivo .env no encontrado"
    echo ""
    echo "Creando .env desde .env.example..."
    cp .env.example .env
    echo ""
    echo "✅ Archivo .env creado"
    echo ""
    echo "⚠️  IMPORTANTE: Debes editar .env y configurar:"
    echo "   - DB_PASSWORD"
    echo "   - JWT_SECRET (genera uno con: openssl rand -hex 32)"
    echo "   - EMAIL_USER y EMAIL_PASSWORD (si quieres emails)"
    echo ""
    read -p "Presiona Enter cuando hayas configurado .env..."
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    echo "   Instala Node.js 16+ desde https://nodejs.org"
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"

# Verificar MySQL
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL no está instalado"
    echo "   Instala MySQL 8.0+ o usa el script de despliegue:"
    echo "   ./deployment/deploy.sh"
    exit 1
fi

echo "✅ MySQL detectado"

# Instalar dependencias
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Instalando dependencias..."
    npm install
fi

# Verificar directorios
echo ""
echo "📁 Creando directorios necesarios..."
mkdir -p uploads/photos uploads/thumbnails uploads/reports
mkdir -p logs
chmod -R 755 uploads logs

echo "✅ Directorios creados"

# Verificar base de datos
echo ""
echo "🗄️  Verificando base de datos..."

source .env 2>/dev/null

if [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    echo "❌ Variables de base de datos no configuradas en .env"
    exit 1
fi

# Intentar conectar
if ! mysql -u$DB_USER -p$DB_PASSWORD -e "USE $DB_NAME" 2>/dev/null; then
    echo "⚠️  Base de datos no existe o no se puede conectar"
    echo ""
    read -p "¿Quieres crear la base de datos ahora? (s/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[SsYy]$ ]]; then
        echo "Creando base de datos..."
        mysql -u root -p << SQLEOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
SQLEOF
        
        echo "✅ Base de datos creada"
        
        # Ejecutar migraciones
        echo ""
        echo "📊 Ejecutando migraciones..."
        for migration in backend/migrations/*.sql; do
            if [ -f "$migration" ]; then
                echo "  - $(basename $migration)"
                mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME < $migration
            fi
        done
        
        echo "✅ Migraciones completadas"
    else
        echo "❌ No se puede continuar sin base de datos"
        exit 1
    fi
else
    echo "✅ Base de datos conectada"
fi

# Iniciar servidor
echo ""
echo "================================================"
echo "  INICIANDO SERVIDOR"
echo "================================================"
echo ""
echo "🚀 Iniciando servidor en modo desarrollo..."
echo ""
echo "   URL: http://localhost:${PORT:-3000}"
echo "   API: http://localhost:${PORT:-3000}/api"
echo ""
echo "   Presiona Ctrl+C para detener"
echo ""

npm run dev
