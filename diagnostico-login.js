// ================================================
// SCRIPT DE DIAGNÓSTICO COMPLETO PARA LOGIN
// Este script muestra TODOS los errores en detalle
// Ejecutar con: node diagnostico-login.js
// ================================================

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

console.log('\n========================================');
console.log('🔍 DIAGNÓSTICO COMPLETO DE LOGIN');
console.log('========================================\n');

async function diagnosticar() {
    let connection;

    try {
        // PASO 1: Verificar variables de entorno
        console.log('📋 PASO 1: Verificando variables de entorno...\n');
        console.log('DB_HOST:', process.env.DB_HOST || 'localhost');
        console.log('DB_PORT:', process.env.DB_PORT || '3306');
        console.log('DB_NAME:', process.env.DB_NAME);
        console.log('DB_USER:', process.env.DB_USER);
        console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[CONFIGURADO]' : '[VACÍO]');
        console.log('JWT_SECRET:', process.env.JWT_SECRET ? '[CONFIGURADO]' : '❌ NO CONFIGURADO');

        if (!process.env.DB_NAME) {
            console.log('\n❌ ERROR: DB_NAME no está configurado en .env\n');
            return;
        }

        // PASO 2: Conectar a base de datos
        console.log('\n📋 PASO 2: Conectando a MySQL...\n');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME
        });

        console.log('✅ Conexión a MySQL exitosa\n');

        // PASO 3: Verificar tabla users
        console.log('📋 PASO 3: Verificando tabla users...\n');

        const [tables] = await connection.execute(
            "SHOW TABLES LIKE 'users'"
        );

        if (tables.length === 0) {
            console.log('❌ ERROR: La tabla "users" no existe');
            console.log('💡 Debes ejecutar las migraciones primero\n');
            return;
        }

        console.log('✅ Tabla users existe\n');

        // PASO 4: Verificar estructura de la tabla
        console.log('📋 PASO 4: Verificando estructura de tabla users...\n');

        const [columns] = await connection.execute('DESCRIBE users');

        console.log('Columnas encontradas:');
        columns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type})`);
        });

        const requiredColumns = ['id', 'username', 'email', 'password', 'role', 'is_active'];
        const missingColumns = requiredColumns.filter(col =>
            !columns.find(c => c.Field === col)
        );

        if (missingColumns.length > 0) {
            console.log('\n❌ ERROR: Faltan columnas:', missingColumns.join(', '));
            console.log('💡 Ejecuta las migraciones completas\n');
            return;
        }

        console.log('\n✅ Estructura de tabla correcta\n');

        // PASO 5: Buscar usuarios admin
        console.log('📋 PASO 5: Buscando usuarios admin...\n');

        const [adminUsers] = await connection.execute(
            "SELECT id, username, email, role, is_active, LENGTH(password) as password_length FROM users WHERE role = 'admin'"
        );

        if (adminUsers.length === 0) {
            console.log('❌ NO HAY USUARIOS ADMIN EN LA BASE DE DATOS\n');
            console.log('🔧 SOLUCIÓN: Ejecuta este comando para crear uno:');
            console.log('   node backend/scripts/create-admin.js\n');
            return;
        }

        console.log(`✅ Se encontraron ${adminUsers.length} usuario(s) admin:\n`);
        adminUsers.forEach((user, index) => {
            console.log(`Usuario ${index + 1}:`);
            console.log(`  ID: ${user.id}`);
            console.log(`  Username: ${user.username}`);
            console.log(`  Email: ${user.email}`);
            console.log(`  Role: ${user.role}`);
            console.log(`  Is Active: ${user.is_active === 1 ? '✅ Sí' : '❌ No'}`);
            console.log(`  Password Length: ${user.password_length} caracteres`);
            console.log('');
        });

        // PASO 6: Probar login con el primer usuario admin
        const adminUser = adminUsers[0];
        console.log('📋 PASO 6: Probando login con diferentes contraseñas...\n');

        // Obtener el usuario completo con contraseña
        const [fullUser] = await connection.execute(
            'SELECT * FROM users WHERE id = ?',
            [adminUser.id]
        );

        const userWithPassword = fullUser[0];
        const passwords = ['admin123', 'Admin123!', 'admin', '123456', 'password'];

        console.log(`Probando con usuario: ${userWithPassword.username}\n`);

        let loginSuccessful = false;

        for (const testPassword of passwords) {
            try {
                const isValid = await bcrypt.compare(testPassword, userWithPassword.password);

                if (isValid) {
                    console.log(`✅ ¡CONTRASEÑA ENCONTRADA!: "${testPassword}"`);
                    console.log(`\n┌─────────────────────────────────────┐`);
                    console.log(`│  CREDENCIALES DE LOGIN:             │`);
                    console.log(`├─────────────────────────────────────┤`);
                    console.log(`│  Usuario: ${userWithPassword.username.padEnd(23)}│`);
                    console.log(`│  Password: ${testPassword.padEnd(22)}│`);
                    console.log(`└─────────────────────────────────────┘\n`);
                    loginSuccessful = true;
                    break;
                } else {
                    console.log(`❌ "${testPassword}" - Incorrecta`);
                }
            } catch (error) {
                console.log(`❌ Error al probar "${testPassword}": ${error.message}`);
            }
        }

        if (!loginSuccessful) {
            console.log('\n❌ NINGUNA CONTRASEÑA COMÚN FUNCIONÓ\n');
            console.log('🔧 SOLUCIONES:\n');
            console.log('1. Ejecuta este comando para crear un nuevo usuario admin:');
            console.log('   node backend/scripts/create-admin.js\n');
            console.log('2. O genera un nuevo hash y actualiza manualmente:');
            console.log('   node generar-hash.js\n');
        }

        // PASO 7: Verificar que bcrypt funciona correctamente
        console.log('\n📋 PASO 7: Verificando bcrypt...\n');

        const testHash = await bcrypt.hash('test123', 10);
        const testVerify = await bcrypt.compare('test123', testHash);

        if (testVerify) {
            console.log('✅ bcrypt funciona correctamente\n');
        } else {
            console.log('❌ ERROR: bcrypt no está funcionando correctamente\n');
        }

        // PASO 8: Probar login simulado
        console.log('📋 PASO 8: Simulando petición de login al backend...\n');

        try {
            const fetch = require('node-fetch');
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    identifier: userWithPassword.username,
                    password: loginSuccessful ? passwords.find(p => bcrypt.compareSync(p, userWithPassword.password)) : 'test'
                })
            });

            console.log('Status:', response.status, response.statusText);
            const data = await response.json();
            console.log('Respuesta:', JSON.stringify(data, null, 2));
            console.log('');

        } catch (error) {
            console.log('❌ Error al probar login API:', error.message);
            console.log('💡 Verifica que el servidor esté corriendo: node backend/server.js\n');
        }

    } catch (error) {
        console.log('\n❌ ERROR CRÍTICO:', error.message);
        console.log('\nDetalles del error:');
        console.log(error);
        console.log('');

        if (error.code === 'ECONNREFUSED') {
            console.log('💡 MySQL no está corriendo. Inicia MySQL en XAMPP.\n');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('💡 La base de datos no existe. Créala en phpMyAdmin:\n');
            console.log('   CREATE DATABASE jd_cleaning_services CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('💡 Usuario o contraseña de MySQL incorrectos. Verifica tu archivo .env\n');
        }

    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada\n');
        }
    }

    console.log('========================================');
    console.log('FIN DEL DIAGNÓSTICO');
    console.log('========================================\n');
}

diagnosticar();
