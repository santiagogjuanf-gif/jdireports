const mysql = require('mysql2/promise');

async function insertarMateriales() {
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

        // Verificar si ya hay materiales
        const [existing] = await connection.query('SELECT COUNT(*) as count FROM materials');
        console.log(`📦 Materiales existentes: ${existing[0].count}`);

        if (existing[0].count > 0) {
            console.log('✅ Ya hay materiales en la base de datos\n');

            // Mostrar los primeros 5
            const [materials] = await connection.query('SELECT name_es, category FROM materials LIMIT 5');
            console.log('🧴 Materiales (primeros 5):');
            materials.forEach(m => console.log(`   - ${m.name_es} (${m.category})`));

            if (existing[0].count > 5) {
                console.log(`   ... y ${existing[0].count - 5} más\n`);
            }

            process.exit(0);
        }

        console.log('⚠️  No hay materiales. Insertando...\n');

        // Insertar materiales (con INSERT IGNORE para evitar duplicados)
        const insertSQL = `
INSERT IGNORE INTO materials (name_es, name_en, name_fr, category, is_active, display_order) VALUES
-- Productos de Limpieza
('Windex', 'Windex', 'Windex', 'cleaning', TRUE, 1),
('Limpiador neutral', 'Neutral cleaner', 'Nettoyant neutre', 'cleaning', TRUE, 2),
('Desinfectante', 'Disinfectant', 'Désinfectant', 'cleaning', TRUE, 3),
('Ácido para tazas', 'Bowl cleaner', 'Nettoyant pour cuvette', 'cleaning', TRUE, 4),
('Limpiador de pisos', 'Floor cleaner', 'Nettoyant pour sols', 'cleaning', TRUE, 5),
('Desengrasante', 'Degreaser', 'Dégraissant', 'cleaning', TRUE, 6),
('Limpiador multiusos', 'All-purpose cleaner', 'Nettoyant multi-usages', 'cleaning', TRUE, 7),
('Pulidor de muebles', 'Furniture polish', 'Polish à meubles', 'cleaning', TRUE, 8),

-- Herramientas
('Escobón', 'Broom', 'Balai', 'tools', TRUE, 10),
('Escoba', 'Small broom', 'Petit balai', 'tools', TRUE, 11),
('Trapeador', 'Mop', 'Vadrouille', 'tools', TRUE, 12),
('Recogedor', 'Dustpan', 'Pelle à poussière', 'tools', TRUE, 13),
('Cubeta', 'Bucket', 'Seau', 'tools', TRUE, 14),
('Atomizador', 'Spray bottle', 'Vaporisateur', 'tools', TRUE, 15),
('Esponja', 'Sponge', 'Éponge', 'tools', TRUE, 16),
('Paño de microfibra', 'Microfiber cloth', 'Chiffon microfibre', 'tools', TRUE, 17),
('Cepillo para taza', 'Toilet brush', 'Brosse de toilette', 'tools', TRUE, 18),
('Jalador de agua (Squeegee)', 'Squeegee', 'Raclette', 'tools', TRUE, 19),
('Guantes de limpieza', 'Cleaning gloves', 'Gants de nettoyage', 'tools', TRUE, 20),

-- Consumibles
('Bolsas de basura', 'Garbage bags', 'Sacs poubelle', 'supplies', TRUE, 30),
('Papel toalla', 'Paper towels', 'Essuie-tout', 'supplies', TRUE, 31),
('Toallitas desinfectantes', 'Disinfectant wipes', 'Lingettes désinfectantes', 'supplies', TRUE, 32)
        `;

        await connection.query(insertSQL);
        console.log('✅ Materiales insertados exitosamente\n');

        // Verificar inserción
        const [result] = await connection.query('SELECT COUNT(*) as count FROM materials');
        console.log(`📦 Total de materiales: ${result[0].count}\n`);

        // Mostrar por categoría
        const [byCategory] = await connection.query(`
            SELECT category, COUNT(*) as count FROM materials GROUP BY category
        `);

        console.log('📊 Materiales por categoría:');
        byCategory.forEach(cat => {
            const categoryName = cat.category === 'cleaning' ? 'Productos de Limpieza' :
                                cat.category === 'tools' ? 'Herramientas' : 'Consumibles';
            console.log(`   - ${categoryName}: ${cat.count}`);
        });

        console.log('\n✅ Proceso completado\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

insertarMateriales();
