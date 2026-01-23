// Script para probar creación de UNA tabla simple
const mysql = require('mysql2/promise');
require('dotenv').config();

async function probarCrearTabla() {
    let connection;

    try {
        console.log('\n🔍 PRUEBA: Crear una tabla simple\n');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'jd_cleaning_services'
        });

        console.log('✅ Conectado a MySQL\n');

        // Intentar crear tabla users
        console.log('📋 Ejecutando CREATE TABLE users...\n');

        const createSQL = `
            CREATE TABLE IF NOT EXISTS users (
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

        console.log('SQL a ejecutar:');
        console.log(createSQL);
        console.log('');

        try {
            const result = await connection.query(createSQL);
            console.log('✅ Comando ejecutado sin errores\n');
            console.log('Resultado:', result);
            console.log('');
        } catch (error) {
            console.log('❌ ERROR AL CREAR TABLA:\n');
            console.log('Mensaje:', error.message);
            console.log('Código:', error.code);
            console.log('Errno:', error.errno);
            console.log('SQL State:', error.sqlState);
            console.log('SQL:', error.sql);
            console.log('');
            console.log('Error completo:', error);
            console.log('');
        }

        // Verificar si se creó
        console.log('📋 Verificando si la tabla existe...\n');

        const [tables] = await connection.query('SHOW TABLES');
        console.log(`Tablas encontradas: ${tables.length}\n`);

        if (tables.length > 0) {
            console.log('Lista de tablas:');
            tables.forEach(table => {
                console.log('  -', Object.values(table)[0]);
            });
            console.log('');

            // Si existe users, mostrar su estructura
            const hasUsers = tables.some(t => Object.values(t)[0] === 'users');
            if (hasUsers) {
                console.log('📋 Estructura de la tabla users:\n');
                const [columns] = await connection.query('DESCRIBE users');
                columns.forEach(col => {
                    console.log(`  ${col.Field} - ${col.Type}`);
                });
                console.log('');
            }
        } else {
            console.log('❌ NO HAY TABLAS - La creación falló\n');
        }

        // Verificar información de la base de datos
        console.log('📋 Información de la base de datos:\n');
        const [dbInfo] = await connection.query(`
            SELECT
                SCHEMA_NAME,
                DEFAULT_CHARACTER_SET_NAME,
                DEFAULT_COLLATION_NAME
            FROM information_schema.SCHEMATA
            WHERE SCHEMA_NAME = '${process.env.DB_NAME || 'jd_cleaning_services'}'
        `);

        if (dbInfo.length > 0) {
            console.log('  Nombre:', dbInfo[0].SCHEMA_NAME);
            console.log('  Charset:', dbInfo[0].DEFAULT_CHARACTER_SET_NAME);
            console.log('  Collation:', dbInfo[0].DEFAULT_COLLATION_NAME);
        }
        console.log('');

        // Verificar permisos del usuario
        console.log('📋 Permisos del usuario MySQL:\n');
        const [grants] = await connection.query('SHOW GRANTS');
        grants.forEach(grant => {
            console.log('  ', Object.values(grant)[0]);
        });
        console.log('');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('');
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

probarCrearTabla();
