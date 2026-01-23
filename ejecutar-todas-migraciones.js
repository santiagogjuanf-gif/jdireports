const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function ejecutarTodasMigraciones() {
    let connection;

    try {
        console.log('🔌 Conectando a MySQL...\n');
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'jd_cleaning_services',
            multipleStatements: true // IMPORTANTE: permitir múltiples statements
        });
        console.log('✅ Conectado a la base de datos jd_cleaning_services\n');

        // Lista de migraciones en orden
        const migraciones = [
            '000_create_schema.sql',
            '001_complete_system_upgrade.sql',
            '002_initial_data.sql',
            '003_cleaning_areas.sql',
            '004_motivational_messages.sql',
            '005_chat_system.sql'
        ];

        console.log('📋 Migraciones a ejecutar:');
        migraciones.forEach((m, i) => {
            console.log(`   ${i + 1}. ${m}`);
        });
        console.log();

        let exitosas = 0;
        let errores = 0;

        for (const migracion of migraciones) {
            const filePath = path.join(__dirname, 'backend', 'migrations', migracion);

            try {
                console.log(`\n🔄 Ejecutando: ${migracion}`);
                console.log('━'.repeat(70));

                // Leer archivo
                const sql = await fs.readFile(filePath, 'utf8');

                // Ejecutar SQL completo (multipleStatements permite esto)
                await connection.query(sql);

                console.log(`✅ ${migracion} ejecutada exitosamente`);
                exitosas++;

            } catch (error) {
                console.error(`❌ Error en ${migracion}:`);
                console.error(`   ${error.message}`);

                // Algunos errores son aceptables (tabla ya existe, etc.)
                if (error.message.includes('already exists') ||
                    error.message.includes('Duplicate entry') ||
                    error.message.includes('Multiple primary key')) {
                    console.log(`   ⚠️  Error aceptable - continuando...`);
                    exitosas++;
                } else {
                    errores++;
                }
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log('📊 RESUMEN DE MIGRACIONES');
        console.log('='.repeat(70));
        console.log(`✅ Exitosas: ${exitosas}/${migraciones.length}`);
        console.log(`❌ Errores: ${errores}/${migraciones.length}`);

        // Verificar tablas creadas
        console.log('\n🔍 Verificando tablas en la base de datos...\n');
        const [tables] = await connection.query('SHOW TABLES');

        console.log(`📦 Total de tablas: ${tables.length}\n`);
        tables.forEach((table, i) => {
            const tableName = table[`Tables_in_jd_cleaning_services`];
            console.log(`   ${(i + 1).toString().padStart(2)}. ${tableName}`);
        });

        // Verificar datos importantes
        console.log('\n📊 Verificando datos iniciales...\n');

        const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
        console.log(`   👥 Usuarios: ${users[0].count}`);

        try {
            const [areas] = await connection.query('SELECT COUNT(*) as count FROM cleaning_areas');
            console.log(`   🏢 Áreas de limpieza: ${areas[0].count}`);
        } catch (e) {
            console.log(`   🏢 Áreas de limpieza: (tabla no existe aún)`);
        }

        try {
            const [products] = await connection.query('SELECT COUNT(*) as count FROM products');
            console.log(`   🧴 Productos: ${products[0].count}`);
        } catch (e) {
            console.log(`   🧴 Productos: (tabla no existe aún)`);
        }

        try {
            const [messages] = await connection.query('SELECT COUNT(*) as count FROM motivational_messages');
            console.log(`   💬 Mensajes motivacionales: ${messages[0].count}`);
        } catch (e) {
            console.log(`   💬 Mensajes motivacionales: (tabla no existe aún)`);
        }

        console.log('\n✅ Proceso completado\n');

    } catch (error) {
        console.error('\n❌ Error general:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

ejecutarTodasMigraciones();
