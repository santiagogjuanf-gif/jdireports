// ================================================
// SCRIPT DE VERIFICACIÓN DEL SERVIDOR
// Ejecutar con: node verificar-servidor.js
// ================================================

const fs = require('fs');
const path = require('path');

console.log('\n========================================');
console.log('🔍 VERIFICANDO CONFIGURACIÓN DEL SERVIDOR');
console.log('========================================\n');

let errorsFound = 0;

// 1. Verificar archivo .env
console.log('1️⃣  Verificando archivo .env...');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    console.log('   ✅ Archivo .env existe');
    const envContent = fs.readFileSync(envPath, 'utf8');

    // Verificar variables críticas
    const requiredVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'JWT_SECRET'];
    requiredVars.forEach(varName => {
        if (envContent.includes(`${varName}=`)) {
            const value = envContent.match(new RegExp(`${varName}=(.+)`))?.[1]?.trim();
            if (value && value !== 'CAMBIA_ESTE_SECRET_POR_UNO_GENERADO_ALEATORIAMENTE') {
                console.log(`   ✅ ${varName} está configurado`);
            } else {
                console.log(`   ❌ ${varName} no está configurado correctamente`);
                errorsFound++;
            }
        } else {
            console.log(`   ❌ ${varName} no encontrado en .env`);
            errorsFound++;
        }
    });
} else {
    console.log('   ❌ Archivo .env NO existe');
    console.log('   💡 Copia .env.example a .env y configúralo');
    errorsFound++;
}

// 2. Verificar node_modules
console.log('\n2️⃣  Verificando dependencias...');
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
    console.log('   ✅ Carpeta node_modules existe');

    // Verificar dependencias críticas
    const criticalDeps = ['express', 'mysql2', 'bcryptjs', 'jsonwebtoken', 'dotenv'];
    criticalDeps.forEach(dep => {
        const depPath = path.join(nodeModulesPath, dep);
        if (fs.existsSync(depPath)) {
            console.log(`   ✅ ${dep} instalado`);
        } else {
            console.log(`   ❌ ${dep} NO instalado`);
            errorsFound++;
        }
    });
} else {
    console.log('   ❌ Carpeta node_modules NO existe');
    console.log('   💡 Ejecuta: npm install');
    errorsFound++;
}

// 3. Verificar estructura de archivos
console.log('\n3️⃣  Verificando estructura de archivos...');
const criticalFiles = [
    'backend/server.js',
    'backend/config/database.js',
    'backend/routes/auth.js',
    'frontend/public/login.html'
];

criticalFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${file}`);
    } else {
        console.log(`   ❌ ${file} NO existe`);
        errorsFound++;
    }
});

// 4. Verificar puerto 3000
console.log('\n4️⃣  Verificando puerto 3000...');
const net = require('net');
const server = net.createServer();

server.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log('   ⚠️  Puerto 3000 está en uso');
        console.log('   💡 Puede que el servidor ya esté corriendo');
        console.log('   💡 O ejecuta: taskkill /F /IM node.exe (si está bloqueado)');
    } else {
        console.log(`   ❌ Error al verificar puerto: ${err.message}`);
        errorsFound++;
    }
    server.close();
    showResults();
});

server.once('listening', () => {
    console.log('   ✅ Puerto 3000 está disponible');
    server.close();
    showResults();
});

server.listen(3000);

function showResults() {
    console.log('\n========================================');
    console.log('📊 RESUMEN DE VERIFICACIÓN');
    console.log('========================================\n');

    if (errorsFound === 0) {
        console.log('✅ Todo está configurado correctamente\n');
        console.log('🚀 Puedes iniciar el servidor con:');
        console.log('   node backend/server.js\n');
    } else {
        console.log(`❌ Se encontraron ${errorsFound} problemas\n`);
        console.log('🔧 Soluciones sugeridas:\n');
        console.log('1. Si falta .env:');
        console.log('   copy .env.example .env');
        console.log('   (Luego edita .env y configura JWT_SECRET)\n');
        console.log('2. Si faltan dependencias:');
        console.log('   npm install\n');
        console.log('3. Si faltan archivos:');
        console.log('   git pull origin claude/find-fix-bug-mjs1a1eafgejasz0-JJV9h\n');
    }

    console.log('========================================\n');
}
