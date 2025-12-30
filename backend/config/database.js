// ================================================
// CONFIGURACIÓN DE BASE DE DATOS MYSQL
// JD CLEANING SERVICES
// ================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la conexión
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jd_cleaning_services',
  charset: 'utf8mb4',
  timezone: '+00:00',
  // Configuración del pool de conexiones
  connectionLimit: 10,
  queueLimit: 0,
  // Configuraciones adicionales para XAMPP
  ssl: false,
  multipleStatements: false
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// ================================================
// FUNCIÓN PARA PROBAR LA CONEXIÓN
// ================================================
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente');
    
    // Probar una query simple
    const [rows] = await connection.execute('SELECT VERSION() as version');
    console.log(`📊 MySQL Version: ${rows[0].version}`);
    
    // Verificar que existe la base de datos
    const dbName = process.env.DB_NAME || 'jd_cleaning_services';
    const [dbs] = await connection.execute(`SHOW DATABASES LIKE '${dbName}'`);
    if (dbs.length > 0) {
      console.log(`🗄️  Base de datos '${dbName}' encontrada`);
    } else {
      console.log('❌ Base de datos no encontrada');
    }
    
    // Verificar tablas
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`📋 Tablas encontradas: ${tables.length}`);
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error de conexión a MySQL:', error.message);
    console.error('💡 Verifica que XAMPP esté corriendo y la configuración en .env');
    return false;
  }
};

// ================================================
// FUNCIONES UTILITARIAS PARA QUERIES
// ================================================

/**
 * Ejecutar una query con parámetros
 * @param {string} sql - Query SQL
 * @param {array} params - Parámetros para la query
 * @returns {Promise} Resultado de la query
 */
const query = async (sql, params = []) => {
  try {
    const [rows, fields] = await pool.execute(sql, params);
    return { rows, fields };
  } catch (error) {
    console.error('Error en query:', error);
    throw error;
  }
};

/**
 * Ejecutar múltiples queries en una transacción
 * @param {array} queries - Array de objetos {sql, params}
 * @returns {Promise} Resultado de todas las queries
 */
const transaction = async (queries) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const query of queries) {
      const [rows] = await connection.execute(query.sql, query.params || []);
      results.push(rows);
    }
    
    await connection.commit();
    connection.release();
    return results;
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
};

/**
 * Obtener una sola fila
 * @param {string} sql - Query SQL
 * @param {array} params - Parámetros para la query
 * @returns {Promise} Primera fila del resultado
 */
const queryOne = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows[0] || null;
  } catch (error) {
    console.error('Error en queryOne:', error);
    throw error;
  }
};

/**
 * Insertar un registro y obtener el ID
 * @param {string} table - Nombre de la tabla
 * @param {object} data - Datos a insertar
 * @returns {Promise} ID del registro insertado
 */
const insert = async (table, data) => {
  try {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    const [result] = await pool.execute(sql, values);
    
    return result.insertId;
  } catch (error) {
    console.error('Error en insert:', error);
    throw error;
  }
};

/**
 * Actualizar registros
 * @param {string} table - Nombre de la tabla
 * @param {object} data - Datos a actualizar
 * @param {object} where - Condiciones WHERE
 * @returns {Promise} Número de filas afectadas
 */
const update = async (table, data, where) => {
  try {
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    const params = [...Object.values(data), ...Object.values(where)];
    
    const [result] = await pool.execute(sql, params);
    return result.affectedRows;
  } catch (error) {
    console.error('Error en update:', error);
    throw error;
  }
};

/**
 * Eliminar registros (soft delete si existe deleted_at)
 * @param {string} table - Nombre de la tabla
 * @param {object} where - Condiciones WHERE
 * @param {boolean} soft - Si hacer soft delete
 * @returns {Promise} Número de filas afectadas
 */
const deleteRecord = async (table, where, soft = false) => {
  try {
    let sql, params;
    
    if (soft) {
      // Soft delete - marcar como eliminado
      sql = `UPDATE ${table} SET deleted_at = NOW() WHERE ${Object.keys(where).map(key => `${key} = ?`).join(' AND ')}`;
      params = Object.values(where);
    } else {
      // Hard delete - eliminar físicamente
      sql = `DELETE FROM ${table} WHERE ${Object.keys(where).map(key => `${key} = ?`).join(' AND ')}`;
      params = Object.values(where);
    }
    
    const [result] = await pool.execute(sql, params);
    return result.affectedRows;
  } catch (error) {
    console.error('Error en delete:', error);
    throw error;
  }
};

/**
 * Obtener estadísticas de la base de datos
 * @returns {Promise} Objeto con estadísticas
 */
const getStats = async () => {
  try {
    const stats = {};
    
    // Contar usuarios por rol
    const [users] = await pool.execute(`
      SELECT role, COUNT(*) as count 
      FROM users 
      WHERE is_active = true 
      GROUP BY role
    `);
    stats.users = users;
    
    // Contar órdenes por estado
    const [orders] = await pool.execute(`
      SELECT status, COUNT(*) as count 
      FROM orders 
      GROUP BY status
    `);
    stats.orders = orders;
    
    // Total de fotos
    const [photos] = await pool.execute(`
      SELECT COUNT(*) as count 
      FROM order_photos
    `);
    stats.totalPhotos = photos[0].count;
    
    // Total de horas trabajadas (aproximado)
    const [hours] = await pool.execute(`
      SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, start_time, COALESCE(end_time, NOW())) - pause_duration), 0) / 60 as total_hours
      FROM work_times
    `);
    stats.totalHours = Math.round(hours[0].total_hours * 100) / 100;
    
    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    throw error;
  }
};

// ================================================
// MANEJO GRACEFUL DE CIERRE
// ================================================
process.on('SIGINT', () => {
  console.log('🔄 Cerrando conexiones a la base de datos...');
  pool.end();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🔄 Cerrando conexiones a la base de datos...');
  pool.end();
  process.exit(0);
});

// ================================================
// EXPORTAR FUNCIONES
// ================================================
module.exports = {
  pool,
  testConnection,
  query,
  queryOne,
  transaction,
  insert,
  update,
  delete: deleteRecord,
  getStats,
  // Exportar también el pool para usar directamente
  execute: pool.execute.bind(pool),
  getConnection: pool.getConnection.bind(pool)
};