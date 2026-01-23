// ================================================
// SCRIPT PARA LIMPIAR TABLESPACES CORRUPTOS
// Ejecutar con: node limpiar-tablespaces.js
// ================================================

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function limpiarTablespaces() {
    let connection;

    try {
        console.log('\n╔════════════════════════════════════════════════╗');
        console.log('║  🧹 LIMPIEZA DE TABLESPACES CORRUPTOS         ║');
        console.log('╚════════════════════════════════════════════════╝\n');

        // Conectar a MySQL (sin seleccionar base de datos)
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        console.log('✅ Conectado a MySQL\n');

        const dbName = process.env.DB_NAME || 'jd_cleaning_services';

        // PASO 1: Eliminar la base de datos completamente
        console.log('📋 PASO 1: Eliminando base de datos corrupta...\n');

        try {
            await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
            console.log(`✅ Base de datos "${dbName}" eliminada\n`);
        } catch (error) {
            console.log(`⚠️  Advertencia: ${error.message}\n`);
        }

        // Esperar un momento para que MySQL libere los archivos
        console.log('⏳ Esperando 2 segundos para que MySQL libere los archivos...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // PASO 2: Verificar si hay archivos residuales
        console.log('📋 PASO 2: Verificando archivos residuales...\n');

        const xamppDataPath = 'C:\\xampp\\mysql\\data';
        const dbPath = path.join(xamppDataPath, dbName);

        console.log(`Ubicación de datos: ${dbPath}\n`);

        if (fs.existsSync(dbPath)) {
            console.log('⚠️  ADVERTENCIA: La carpeta de la base de datos todavía existe.\n');
            console.log('Esto puede causar problemas. Por favor:\n');
            console.log('1. Detén MySQL en XAMPP');
            console.log('2. Elimina manualmente la carpeta:');
            console.log(`   ${dbPath}`);
            console.log('3. Reinicia MySQL');
            console.log('4. Ejecuta de nuevo: node restaurar-base-datos.js\n');
            console.log('O continúa si quieres intentar de todos modos...\n');
        } else {
            console.log('✅ No hay archivos residuales\n');
        }

        // PASO 3: Recrear la base de datos limpia
        console.log('📋 PASO 3: Creando base de datos nueva y limpia...\n');

        await connection.query(`
            CREATE DATABASE \`${dbName}\`
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
        `);

        console.log(`✅ Base de datos "${dbName}" creada limpia\n`);

        // PASO 4: Verificar que esté limpia
        await connection.query(`USE \`${dbName}\``);

        const [tables] = await connection.query('SHOW TABLES');
        console.log(`📋 PASO 4: Verificando base de datos limpia...\n`);
        console.log(`   Tablas encontradas: ${tables.length}`);

        if (tables.length === 0) {
            console.log('   ✅ Base de datos está limpia y lista\n');
        } else {
            console.log('   ⚠️  Todavía hay tablas residuales\n');
        }

        console.log('\n╔════════════════════════════════════════════════╗');
        console.log('║  ✅ LIMPIEZA COMPLETADA                        ║');
        console.log('╚════════════════════════════════════════════════╝\n');

        console.log('🚀 PRÓXIMO PASO:\n');
        console.log('   Ejecuta: node restaurar-base-datos.js\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('Código:', error.code);
        console.error('');

        if (error.code === 'ECONNREFUSED') {
            console.log('💡 MySQL no está corriendo. Inicia MySQL en XAMPP.\n');
        } else if (error.code === 'ER_DB_DROP_EXISTS') {
            console.log('💡 La base de datos no existe, está bien, continúa.\n');
        }

    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada\n');
        }
    }
}

limpiarTablespaces();
