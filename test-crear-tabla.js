// Script de prueba para verificar por qué no se crean las tablas
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testCrearTabla() {
    let connection;

    try {
        console.log('\n🔍 DIAGNÓSTICO: Por qué no se crean las tablas\n');

        // Conectar a MySQL
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'jd_cleaning_services'
        });

        console.log('✅ Conectado a MySQL\n');

        // Probar crear una tabla simple DIRECTAMENTE
        console.log('📋 PASO 1: Intentando crear tabla users directamente...\n');

        try {
            await connection.query('DROP TABLE IF EXISTS users');
            console.log('   ✅ Tabla users eliminada (si existía)\n');

            const createSQL = `
                CREATE TABLE users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    username VARCHAR(50) UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    role ENUM('admin', 'jefe', 'gerente', 'trabajador') NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `;

            console.log('Ejecutando CREATE TABLE...\n');
            await connection.query(createSQL);
            console.log('   ✅ CREATE TABLE ejecutado sin errores\n');

        } catch (error) {
            console.log(`   ❌ Error al crear tabla: ${error.message}\n`);
            console.log('   Código de error:', error.code);
            console.log('   SQL State:', error.sqlState);
            console.log('');
        }

        // Verificar si la tabla existe
        console.log('📋 PASO 2: Verificando si la tabla fue creada...\n');

        const [tables] = await connection.query('SHOW TABLES');
        console.log(`   Se encontraron ${tables.length} tablas:\n`);

        if (tables.length === 0) {
            console.log('   ❌ NO HAY TABLAS - La tabla NO se creó\n');
        } else {
            tables.forEach(table => {
                const tableName = Object.values(table)[0];
                console.log(`   - ${tableName}`);
            });
            console.log('');
        }

        // Verificar el motor de almacenamiento
        console.log('📋 PASO 3: Verificando motor de almacenamiento predeterminado...\n');

        const [engine] = await connection.query("SHOW VARIABLES LIKE 'default_storage_engine'");
        console.log('   Motor predeterminado:', engine[0].Value);
        console.log('');

        // Verificar si hay algo raro con la base de datos
        console.log('📋 PASO 4: Verificando información de la base de datos...\n');

        const [dbInfo] = await connection.query(`
            SELECT
                DEFAULT_CHARACTER_SET_NAME,
                DEFAULT_COLLATION_NAME
            FROM information_schema.SCHEMATA
            WHERE SCHEMA_NAME = '${process.env.DB_NAME || 'jd_cleaning_services'}'
        `);

        console.log('   Charset:', dbInfo[0].DEFAULT_CHARACTER_SET_NAME);
        console.log('   Collation:', dbInfo[0].DEFAULT_COLLATION_NAME);
        console.log('');

        // Intentar SHOW CREATE TABLE
        if (tables.length > 0) {
            console.log('📋 PASO 5: Ver definición de la tabla creada...\n');

            const [createDef] = await connection.query('SHOW CREATE TABLE users');
            console.log(createDef[0]['Create Table']);
            console.log('');
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('Código:', error.code);
        console.error('');

    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada\n');
        }
    }
}

testCrearTabla();
