# 🔧 INSTRUCCIONES PARA CORREGIR TABLA MATERIALS

## ❗ PROBLEMA IDENTIFICADO
La tabla `materials` en tu base de datos tiene una estructura antigua que no coincide con el código.

**Estructura actual (INCORRECTA):**
- `name` (una sola columna)
- `unit` (tipo ENUM)

**Estructura requerida (CORRECTA):**
- `name_es`, `name_en`, `name_fr` (multiidioma)
- `unit` (tipo VARCHAR)

---

## 📋 PASOS PARA CORREGIR

### PASO 1: Corregir la estructura de la tabla
1. Abre **phpMyAdmin** en http://localhost/phpmyadmin
2. Selecciona la base de datos **`jdi_cleaning`**
3. Ve a la pestaña **SQL**
4. Abre el archivo: **`fix-materials-table.sql`**
   - Ruta: `C:\xampp\htdocs\jdireports\backend\database\fix-materials-table.sql`
5. Copia TODO el contenido y pégalo en phpMyAdmin
6. Click en **"Continuar"** o **"Go"**

✅ Esto agregará las columnas `name_es`, `name_en`, `name_fr` y migrará cualquier dato existente.

---

### PASO 2: Insertar los materiales
1. Permanece en phpMyAdmin con la base de datos **`jdi_cleaning`** seleccionada
2. Ve a la pestaña **SQL**
3. Abre el archivo: **`seed-materials.sql`**
   - Ruta: `C:\xampp\htdocs\jdireports\backend\database\seed-materials.sql`
4. Copia TODO el contenido y pégalo en phpMyAdmin
5. Click en **"Continuar"** o **"Go"**

✅ Esto insertará 34 materiales en 3 idiomas.

---

## 🎯 RESULTADO ESPERADO

Después de ejecutar ambos scripts deberías ver:

```
Consulta correcta, se afectaron 34 filas
```

Y al revisar la tabla `materials` verás:
- 34 materiales
- Cada uno con nombre en 3 idiomas (español, inglés, francés)
- Unidades como: litro, unidad, rollo, par, caja, paquete

---

## ✅ VERIFICACIÓN

Para verificar que todo funcionó correctamente:

1. En phpMyAdmin, selecciona la tabla **`materials`**
2. Click en **"Examinar"** o **"Browse"**
3. Deberías ver materiales como:
   - Desinfectante multiusos
   - Cloro/Blanqueador
   - Trapeador de microfibra
   - Guantes de látex
   - etc.

4. **Prueba en la aplicación:**
   - Ve a http://localhost:3000/solicitar-material
   - Deberías ver la lista completa de 34 materiales con sus iconos
   - NO más error 500

---

## 🆘 SI HAY ERRORES

### Error: "Column 'name' doesn't exist"
✅ **Solución**: Es normal después de ejecutar el fix. Ejecuta el seed-materials.sql

### Error: "Duplicate column name 'name_es'"
✅ **Solución**: Ya ejecutaste el fix antes. Solo ejecuta seed-materials.sql

### Error: "Duplicate entry"
✅ **Solución**: Los materiales ya existen. Puedes:
   - Ignorar el error (ya tienes los datos)
   - O ejecutar `DELETE FROM materials;` antes de insertar

---

## 📞 SIGUIENTE PASO

Una vez completados estos pasos, **reinicia el servidor backend**:

```bash
# En CMD de Windows:
Ctrl+C  (para detener el servidor)
cd C:\xampp\htdocs\jdireports\backend
npm start
```

Luego prueba crear una solicitud de material desde:
http://localhost:3000/solicitar-material
