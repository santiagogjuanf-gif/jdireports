// ================================================
// SCRIPT PARA CREAR USUARIO ADMIN
// Ejecutar con: node backend/scripts/create-admin.js
// ================================================

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createAdmin() {
  try {
    console.log('🔧 Creando usuario administrador...\n');

    // Generar hash de contraseña
    const password = 'Admin123!';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    console.log('✅ Hash generado correctamente');
    console.log(`📝 Contraseña: ${password}`);
    console.log(`🔐 Hash: ${passwordHash}\n`);

    // Conectar a base de datos
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'jd_cleaning_services'
    });

    console.log('🔌 Conectado a base de datos');

    // Eliminar admin existente si hay
    await connection.execute(`DELETE FROM users WHERE role = 'admin'`);
    console.log('🗑️  Usuario admin anterior eliminado (si existía)');

    // Insertar nuevo admin (sin full_name)
    const [result] = await connection.execute(`
      INSERT INTO users (
        name, email, username, password, role,
        is_active, password_reset_required, preferred_language, phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'Administrador',
      'admin@jdcleaning.com',
      'admin',
      passwordHash,
      'admin',
      1,
      0,
      'es',
      '1234567890'
    ]);

    console.log(`✅ Usuario admin creado con ID: ${result.insertId}\n`);

    // Verificar el usuario
    const [users] = await connection.execute(`
      SELECT id, name, email, username, role, is_active, preferred_language
      FROM users
      WHERE role = 'admin'
    `);

    console.log('👤 Usuario creado:');
    console.log(users[0]);
    console.log('\n📋 CREDENCIALES DE LOGIN:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Usuario:    admin`);
    console.log(`Email:      admin@jdcleaning.com`);
    console.log(`Contraseña: ${password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await connection.end();
    console.log('✅ Proceso completado exitosamente\n');

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('\n💡 La tabla "users" no existe. Ejecuta primero las migraciones:\n');
      console.error('   1. Abre phpMyAdmin');
      console.error('   2. Selecciona la base de datos "jd_cleaning_services"');
      console.error('   3. Ve a la pestaña SQL');
      console.error('   4. Copia y ejecuta el contenido de backend/migrations/001_complete_system_upgrade.sql\n');
    } else if (error.code === 'MODULE_NOT_FOUND') {
      console.error('\n💡 Debes ejecutar primero: npm install\n');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 No se puede conectar a MySQL. Verifica que XAMPP esté corriendo.\n');
    }

    process.exit(1);
  }
}

createAdmin();
