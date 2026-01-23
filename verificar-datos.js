const mysql = require('mysql2/promise');

async function verificarDatos() {
    let connection;

    try {
        console.log('🔌 Conectando a MySQL...\n');
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'jd_cleaning_services'
        });

        console.log('✅ Conectado a la base de datos\n');
        console.log('📊 VERIFICACIÓN DE DATOS EN TABLAS\n');
        console.log('='.repeat(70));

        // Lista de tablas importantes a verificar
        const tablasImportantes = [
            'users',
            'cleaning_areas',
            'materials',
            'motivational_messages',
            'orders',
            'daily_reports',
            'messages',
            'notifications',
            'material_requests',
            'conversations'
        ];

        for (const tabla of tablasImportantes) {
            try {
                const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${tabla}`);
                const count = rows[0].count;

                if (count > 0) {
                    console.log(`✅ ${tabla.padEnd(30)} ${count} registros`);
                } else {
                    console.log(`⚪ ${tabla.padEnd(30)} 0 registros (vacía)`);
                }
            } catch (error) {
                console.log(`❌ ${tabla.padEnd(30)} (tabla no existe)`);
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log('\n📋 DETALLES DE DATOS IMPORTANTES:\n');

        // Verificar usuarios
        try {
            const [users] = await connection.query('SELECT username, role FROM users');
            if (users.length > 0) {
                console.log('👥 USUARIOS:');
                users.forEach(u => console.log(`   - ${u.username} (${u.role})`));
            }
        } catch (e) {}

        // Verificar áreas
        try {
            const [areas] = await connection.query('SELECT name_key, name_es FROM cleaning_areas LIMIT 5');
            if (areas.length > 0) {
                console.log('\n🏢 ÁREAS DE LIMPIEZA (primeras 5):');
                areas.forEach(a => console.log(`   - ${a.name_key}: ${a.name_es}`));
                const [total] = await connection.query('SELECT COUNT(*) as count FROM cleaning_areas');
                if (total[0].count > 5) {
                    console.log(`   ... y ${total[0].count - 5} más`);
                }
            }
        } catch (e) {}

        // Verificar materiales
        try {
            const [materials] = await connection.query('SELECT name, unit FROM materials LIMIT 5');
            if (materials.length > 0) {
                console.log('\n🧴 MATERIALES (primeros 5):');
                materials.forEach(m => console.log(`   - ${m.name} (${m.unit})`));
                const [total] = await connection.query('SELECT COUNT(*) as count FROM materials');
                if (total[0].count > 5) {
                    console.log(`   ... y ${total[0].count - 5} más`);
                }
            } else {
                console.log('\n⚠️  No hay materiales en la base de datos');
            }
        } catch (e) {
            console.log('\n⚠️  Tabla materials no existe o está vacía');
        }

        // Verificar mensajes motivacionales
        try {
            const [messages] = await connection.query('SELECT language, COUNT(*) as count FROM motivational_messages GROUP BY language');
            if (messages.length > 0) {
                console.log('\n💬 MENSAJES MOTIVACIONALES:');
                messages.forEach(m => console.log(`   - ${m.language.toUpperCase()}: ${m.count} mensajes`));
            } else {
                console.log('\n⚠️  No hay mensajes motivacionales en la base de datos');
            }
        } catch (e) {
            console.log('\n⚠️  Tabla motivational_messages no existe o está vacía');
        }

        console.log('\n' + '='.repeat(70));
        console.log('\n💡 RECOMENDACIÓN:\n');

        try {
            const [materials] = await connection.query('SELECT COUNT(*) as count FROM materials');
            const [messages] = await connection.query('SELECT COUNT(*) as count FROM motivational_messages');
            const [areas] = await connection.query('SELECT COUNT(*) as count FROM cleaning_areas');

            const materialsCount = materials[0].count;
            const messagesCount = messages[0].count;
            const areasCount = areas[0].count;

            if (materialsCount === 0 || messagesCount === 0 || areasCount === 0) {
                console.log('⚠️  Faltan datos iniciales. Ejecuta:');
                console.log('   node ejecutar-todas-migraciones.js\n');
            } else {
                console.log('✅ La base de datos tiene todos los datos necesarios');
                console.log(`   - ${areasCount} áreas de limpieza`);
                console.log(`   - ${messagesCount} mensajes motivacionales`);
                console.log(`   - ${materialsCount} materiales\n`);
            }
        } catch (error) {
            console.log('⚠️  Error verificando datos:', error.message);
            console.log('   Ejecuta: node ejecutar-todas-migraciones.js\n');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

verificarDatos();
