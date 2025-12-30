# 🗄️ MIGRACIONES DE BASE DE DATOS - JDI REPORTS

## 📋 Archivos de Migración

### 1. `001_complete_system_upgrade.sql`
**Descripción:** Actualización completa del sistema
- Modifica tablas existentes (users, orders, order_photos, notifications)
- Crea 12 nuevas tablas para todas las funcionalidades

### 2. `002_initial_data.sql`
**Descripción:** Datos iniciales del sistema
- 15 áreas de limpieza (3 idiomas)
- 23 materiales (3 idiomas)
- 15 mensajes motivacionales (3 idiomas)
- 5 tutoriales básicos (3 idiomas)
- Configuración inicial

---

## 🚀 CÓMO EJECUTAR LAS MIGRACIONES

### Opción 1: Desde phpMyAdmin (Recomendado)

1. Abre phpMyAdmin en tu navegador:
   ```
   http://localhost/phpmyadmin
   ```

2. Selecciona la base de datos `jd_cleaning_services` en el panel izquierdo

3. Haz clic en la pestaña **"SQL"** arriba

4. Abre el archivo `001_complete_system_upgrade.sql` en un editor de texto

5. Copia TODO el contenido y pégalo en el área de texto de phpMyAdmin

6. Haz clic en el botón **"Continuar"** o **"Go"**

7. Espera a que termine (verás mensaje de éxito)

8. Repite los pasos 3-7 con el archivo `002_initial_data.sql`

---

### Opción 2: Desde la línea de comandos

```bash
# Navega a la carpeta de migraciones
cd /home/user/jdireports/database/migrations

# Ejecuta la primera migración
mysql -u root -p jd_cleaning_services < 001_complete_system_upgrade.sql

# Ejecuta la segunda migración
mysql -u root -p jd_cleaning_services < 002_initial_data.sql
```

---

### Opción 3: Desde Node.js (Programático)

```javascript
// Ejecutar desde la raíz del proyecto
node -e "
const fs = require('fs');
const db = require('./backend/config/database');

async function runMigrations() {
  try {
    console.log('🔄 Ejecutando migraciones...');

    // Migración 1
    const sql1 = fs.readFileSync('./database/migrations/001_complete_system_upgrade.sql', 'utf8');
    await db.query(sql1);
    console.log('✅ Migración 1 completada');

    // Migración 2
    const sql2 = fs.readFileSync('./database/migrations/002_initial_data.sql', 'utf8');
    await db.query(sql2);
    console.log('✅ Migración 2 completada');

    console.log('🎉 ¡Migraciones completadas exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migraciones:', error);
    process.exit(1);
  }
}

runMigrations();
"
```

---

## ✅ VERIFICAR QUE TODO FUNCIONÓ

Después de ejecutar las migraciones, verifica en phpMyAdmin que existan estas tablas:

### Tablas Existentes (modificadas):
- ✅ users
- ✅ orders
- ✅ order_assignments
- ✅ order_photos
- ✅ notifications
- ✅ activity_logs
- ✅ system_settings

### Tablas Nuevas:
- ✅ cleaning_areas
- ✅ order_areas
- ✅ daily_reports
- ✅ order_messages
- ✅ materials
- ✅ material_requests
- ✅ material_request_items
- ✅ motivational_messages
- ✅ manager_permissions
- ✅ tutorials
- ✅ company_settings
- ✅ notification_settings

### Verificar Datos Iniciales:

```sql
-- Debe devolver 15 áreas
SELECT COUNT(*) FROM cleaning_areas;

-- Debe devolver 23 materiales
SELECT COUNT(*) FROM materials;

-- Debe devolver 15 mensajes
SELECT COUNT(*) FROM motivational_messages;

-- Debe devolver 5 tutoriales
SELECT COUNT(*) FROM tutorials;
```

---

## ⚠️ IMPORTANTE

- **Haz un respaldo** de la base de datos antes de ejecutar las migraciones
- Las migraciones usan `IF NOT EXISTS` para evitar errores si ya existen tablas
- Si algo falla, puedes restaurar el respaldo
- Los datos de prueba existentes NO se borran

---

## 🔄 ROLLBACK (Si necesitas revertir)

Si necesitas revertir los cambios:

```sql
-- CUIDADO: Esto borrará todas las tablas nuevas y sus datos
DROP TABLE IF EXISTS notification_settings;
DROP TABLE IF EXISTS company_settings;
DROP TABLE IF EXISTS tutorials;
DROP TABLE IF EXISTS manager_permissions;
DROP TABLE IF EXISTS motivational_messages;
DROP TABLE IF EXISTS material_request_items;
DROP TABLE IF EXISTS material_requests;
DROP TABLE IF EXISTS materials;
DROP TABLE IF EXISTS order_messages;
DROP TABLE IF EXISTS daily_reports;
DROP TABLE IF EXISTS order_areas;
DROP TABLE IF EXISTS cleaning_areas;

-- Restaura tu respaldo de la base de datos
```

---

## 📞 SOPORTE

Si encuentras algún error durante las migraciones:
1. Copia el mensaje de error completo
2. Verifica que XAMPP/MySQL esté corriendo
3. Verifica que la base de datos `jd_cleaning_services` exista
4. Verifica los permisos del usuario MySQL

---

**¿Listo para continuar?** Después de ejecutar las migraciones, el backend estará listo para programarse.
