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
            const [materials] = await connection.query('SELECT name, unit FROM materials LIMIT 5');
            console.log('🧴 Materiales (primeros 5):');
            materials.forEach(m => console.log(`   - ${m.name} (${m.unit})`));

            if (existing[0].count > 5) {
                console.log(`   ... y ${existing[0].count - 5} más\n`);
            }

            process.exit(0);
        }

        console.log('⚠️  No hay materiales. Insertando...\n');

        // Insertar materiales (con INSERT IGNORE para evitar duplicados)
        const insertSQL = `
INSERT IGNORE INTO materials (name, description, unit, current_stock, min_stock, is_active) VALUES
-- Productos de Limpieza
('Windex', 'Limpiador de vidrios', 'liter', 0, 2, TRUE),
('Limpiador neutral', 'Limpiador de uso general', 'liter', 0, 3, TRUE),
('Desinfectante', 'Desinfectante para superficies', 'liter', 0, 2, TRUE),
('Ácido para tazas', 'Limpiador para baños', 'liter', 0, 2, TRUE),
('Limpiador de pisos', 'Limpiador especializado para pisos', 'liter', 0, 3, TRUE),
('Desengrasante', 'Desengrasante para cocinas', 'liter', 0, 2, TRUE),
('Limpiador multiusos', 'Limpiador para todo tipo de superficies', 'liter', 0, 3, TRUE),
('Pulidor de muebles', 'Pulidor y abrillantador de madera', 'liter', 0, 1, TRUE),

-- Herramientas
('Escobón', 'Escoba grande para exteriores', 'unit', 0, 3, TRUE),
('Escoba', 'Escoba pequeña para interiores', 'unit', 0, 5, TRUE),
('Trapeador', 'Trapeador de microfibra', 'unit', 0, 5, TRUE),
('Recogedor', 'Recogedor de basura', 'unit', 0, 3, TRUE),
('Cubeta', 'Cubeta de plástico 10L', 'unit', 0, 4, TRUE),
('Atomizador', 'Botella con atomizador', 'unit', 0, 5, TRUE),
('Esponja', 'Esponja de limpieza', 'pack', 0, 10, TRUE),
('Paño de microfibra', 'Paño de microfibra multiuso', 'pack', 0, 10, TRUE),
('Cepillo para taza', 'Cepillo para inodoro', 'unit', 0, 3, TRUE),
('Jalador de agua', 'Jalador de agua para pisos y vidrios', 'unit', 0, 3, TRUE),
('Guantes de limpieza', 'Guantes de goma para limpieza', 'pack', 0, 5, TRUE),

-- Consumibles
('Bolsas de basura', 'Bolsas de basura grande 100L', 'pack', 0, 20, TRUE),
('Papel toalla', 'Papel toalla en rollo', 'pack', 0, 15, TRUE),
('Toallitas desinfectantes', 'Toallitas desinfectantes desechables', 'pack', 0, 10, TRUE)
        `;

        await connection.query(insertSQL);
        console.log('✅ Materiales insertados exitosamente\n');

        // Verificar inserción
        const [result] = await connection.query('SELECT COUNT(*) as count FROM materials');
        console.log(`📦 Total de materiales: ${result[0].count}\n`);

        // Mostrar por unidad de medida
        const [byUnit] = await connection.query(`
            SELECT unit, COUNT(*) as count FROM materials GROUP BY unit
        `);

        console.log('📊 Materiales por unidad de medida:');
        byUnit.forEach(u => {
            const unitName = u.unit === 'unit' ? 'Unidades' :
                            u.unit === 'liter' ? 'Litros' :
                            u.unit === 'pack' ? 'Paquetes' :
                            u.unit === 'kg' ? 'Kilogramos' : 'Cajas';
            console.log(`   - ${unitName}: ${u.count}`);
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
