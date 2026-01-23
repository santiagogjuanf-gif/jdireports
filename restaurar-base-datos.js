// ================================================
// SCRIPT DE RESTAURACIÓN DE BASE DE DATOS
// Ejecutar con: node restaurar-base-datos.js
// ================================================

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

console.log('\n╔════════════════════════════════════════════════╗');
console.log('║  🔧 RESTAURACIÓN DE BASE DE DATOS             ║');
console.log('╚════════════════════════════════════════════════╝\n');

async function restaurarBaseDatos() {
    let connection;

    try {
        // PASO 1: Conectar a MySQL (sin seleccionar base de datos específica)
        console.log('📋 PASO 1: Conectando a MySQL...\n');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        console.log('✅ Conectado a MySQL\n');

        // PASO 2: Crear la base de datos si no existe
        console.log('📋 PASO 2: Verificando/creando base de datos...\n');

        const dbName = process.env.DB_NAME || 'jd_cleaning_services';

        await connection.execute(`
            CREATE DATABASE IF NOT EXISTS \`${dbName}\`
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
        `);

        console.log(`✅ Base de datos "${dbName}" lista\n`);

        // Cambiar a la base de datos
        await connection.execute(`USE \`${dbName}\``);

        // PASO 3: Ejecutar migraciones
        console.log('📋 PASO 3: Ejecutando migraciones...\n');

        const migrationsDir = path.join(__dirname, 'backend', 'migrations');
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();

        console.log(`Encontradas ${migrationFiles.length} migraciones:\n`);

        for (const file of migrationFiles) {
            console.log(`   Ejecutando: ${file}...`);
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf8');

            // Dividir por punto y coma y ejecutar cada statement
            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            for (const statement of statements) {
                try {
                    await connection.execute(statement);
                } catch (error) {
                    // Ignorar errores de "tabla ya existe"
                    if (!error.message.includes('already exists')) {
                        console.log(`      ⚠️  Advertencia en ${file}: ${error.message}`);
                    }
                }
            }

            console.log(`   ✅ ${file} completado`);
        }

        console.log('\n✅ Todas las migraciones ejecutadas\n');

        // PASO 4: Verificar tablas creadas
        console.log('📋 PASO 4: Verificando tablas creadas...\n');

        const [tables] = await connection.execute('SHOW TABLES');

        console.log(`Se crearon ${tables.length} tablas:\n`);
        tables.forEach((table, index) => {
            const tableName = Object.values(table)[0];
            console.log(`   ${index + 1}. ${tableName}`);
        });
        console.log('');

        // PASO 5: Crear usuario admin
        console.log('📋 PASO 5: Creando usuario administrador...\n');

        // Eliminar admin anterior si existe
        await connection.execute(`DELETE FROM users WHERE username = 'admin'`);

        const password = 'Admin123!';
        const passwordHash = await bcrypt.hash(password, 10);

        const [result] = await connection.execute(`
            INSERT INTO users (
                name, email, username, full_name, password, role,
                is_active, password_reset_required, preferred_language, phone
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            'Administrador',
            'admin@jdcleaning.com',
            'admin',
            'Administrador del Sistema',
            passwordHash,
            'admin',
            1,
            0,
            'es',
            '1234567890'
        ]);

        console.log(`✅ Usuario admin creado con ID: ${result.insertId}\n`);

        // PASO 6: Verificar usuario
        console.log('📋 PASO 6: Verificando usuario creado...\n');

        const [users] = await connection.execute(`
            SELECT id, name, email, username, role, is_active, preferred_language
            FROM users
            WHERE username = 'admin'
        `);

        if (users.length > 0) {
            console.log('👤 Usuario administrador:');
            console.log('   ID:', users[0].id);
            console.log('   Nombre:', users[0].name);
            console.log('   Email:', users[0].email);
            console.log('   Username:', users[0].username);
            console.log('   Role:', users[0].role);
            console.log('   Activo:', users[0].is_active ? 'Sí' : 'No');
            console.log('   Idioma:', users[0].preferred_language);
            console.log('');
        }

        // RESUMEN FINAL
        console.log('\n╔════════════════════════════════════════════════╗');
        console.log('║  ✅ RESTAURACIÓN COMPLETADA EXITOSAMENTE      ║');
        console.log('╚════════════════════════════════════════════════╝\n');

        console.log('📝 CREDENCIALES DE LOGIN:\n');
        console.log('┌────────────────────────────────────────┐');
        console.log('│  Usuario:    admin                     │');
        console.log('│  Email:      admin@jdcleaning.com      │');
        console.log('│  Contraseña: Admin123!                 │');
        console.log('└────────────────────────────────────────┘\n');

        console.log('🚀 PRÓXIMOS PASOS:\n');
        console.log('1. Reinicia el servidor: node backend/server.js');
        console.log('2. Abre el navegador: http://localhost:3000/login');
        console.log('3. Inicia sesión con las credenciales de arriba\n');

    } catch (error) {
        console.error('\n❌ ERROR CRÍTICO:', error.message);
        console.error('\nDetalles del error:');
        console.error(error);
        console.log('');

        if (error.code === 'ECONNREFUSED') {
            console.log('💡 SOLUCIÓN: MySQL no está corriendo. Inicia MySQL en XAMPP.\n');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('💡 SOLUCIÓN: Usuario o contraseña de MySQL incorrectos.');
            console.log('   Verifica tu archivo .env\n');
        } else if (error.errno === 1044) {
            console.log('💡 SOLUCIÓN: El usuario no tiene permisos para crear bases de datos.');
            console.log('   Usa phpMyAdmin para crear la base de datos "jd_cleaning_services"\n');
        }

        process.exit(1);

    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada\n');
        }
    }
}

restaurarBaseDatos();
