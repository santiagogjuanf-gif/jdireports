const mysql = require('mysql2/promise');

async function agregarColumnasUsers() {
    let connection;

    try {
        console.log('🔌 Conectando a MySQL...');
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'jd_cleaning_services'
        });
        console.log('✅ Conectado a la base de datos\n');

        // Obtener columnas actuales
        console.log('📋 Verificando columnas existentes...');
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'jd_cleaning_services'
              AND TABLE_NAME = 'users'
        `);

        const existingColumns = columns.map(col => col.COLUMN_NAME);
        console.log(`   Columnas encontradas: ${existingColumns.length}`);
        console.log(`   ${existingColumns.join(', ')}\n`);

        // Definir columnas a agregar
        const columnasNuevas = [
            {
                nombre: 'full_name',
                sql: 'ADD COLUMN full_name VARCHAR(100) AFTER username'
            },
            {
                nombre: 'password_reset_required',
                sql: 'ADD COLUMN password_reset_required BOOLEAN DEFAULT FALSE AFTER password'
            },
            {
                nombre: 'password_changed_at',
                sql: 'ADD COLUMN password_changed_at TIMESTAMP NULL AFTER password_reset_required'
            },
            {
                nombre: 'last_password_reset_by',
                sql: 'ADD COLUMN last_password_reset_by INT NULL AFTER password_changed_at'
            },
            {
                nombre: 'preferred_language',
                sql: "ADD COLUMN preferred_language ENUM('es', 'en', 'fr') DEFAULT 'es' AFTER last_password_reset_by"
            },
            {
                nombre: 'phone',
                sql: 'ADD COLUMN phone VARCHAR(20) AFTER preferred_language'
            },
            {
                nombre: 'created_by',
                sql: 'ADD COLUMN created_by INT NULL AFTER created_at'
            },
            {
                nombre: 'updated_at',
                sql: 'ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_by'
            }
        ];

        console.log('🔧 Agregando columnas faltantes...\n');
        let agregadas = 0;
        let omitidas = 0;

        for (const columna of columnasNuevas) {
            if (existingColumns.includes(columna.nombre)) {
                console.log(`   ⏭️  ${columna.nombre} - Ya existe, omitiendo`);
                omitidas++;
            } else {
                try {
                    await connection.query(`ALTER TABLE users ${columna.sql}`);
                    console.log(`   ✅ ${columna.nombre} - Agregada exitosamente`);
                    agregadas++;
                } catch (error) {
                    console.log(`   ❌ ${columna.nombre} - Error: ${error.message}`);
                }
            }
        }

        console.log(`\n📊 Resumen:`);
        console.log(`   • Columnas agregadas: ${agregadas}`);
        console.log(`   • Columnas omitidas (ya existían): ${omitidas}`);
        console.log(`   • Total de columnas nuevas procesadas: ${columnasNuevas.length}`);

        // Verificar estructura final
        console.log('\n📋 Estructura final de la tabla users:');
        const [finalColumns] = await connection.query(`
            SELECT
                COLUMN_NAME,
                DATA_TYPE,
                COLUMN_DEFAULT,
                IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'jd_cleaning_services'
              AND TABLE_NAME = 'users'
            ORDER BY ORDINAL_POSITION
        `);

        console.log('\n   Columna                    | Tipo          | Default     | Nullable');
        console.log('   ' + '-'.repeat(75));
        finalColumns.forEach(col => {
            const nombre = col.COLUMN_NAME.padEnd(26);
            const tipo = col.DATA_TYPE.padEnd(13);
            const defecto = (col.COLUMN_DEFAULT || 'NULL').toString().substring(0, 11).padEnd(11);
            const nullable = col.IS_NULLABLE;
            console.log(`   ${nombre} | ${tipo} | ${defecto} | ${nullable}`);
        });

        console.log(`\n✅ Total de columnas en users: ${finalColumns.length}`);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

agregarColumnasUsers();
