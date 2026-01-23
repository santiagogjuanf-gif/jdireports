const mysql = require('mysql2/promise');

async function verEstructura() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'jd_cleaning_services'
        });

        console.log('📋 Estructura de la tabla materials:\n');

        const [columns] = await connection.query(`
            DESCRIBE materials
        `);

        console.log('Columna                | Tipo                | Null | Key | Default');
        console.log('-'.repeat(75));
        columns.forEach(col => {
            const field = col.Field.padEnd(22);
            const type = col.Type.padEnd(19);
            const nullable = col.Null.padEnd(4);
            const key = col.Key.padEnd(3);
            const def = (col.Default || 'NULL').toString().padEnd(10);
            console.log(`${field} | ${type} | ${nullable} | ${key} | ${def}`);
        });

        console.log();

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

verEstructura();
