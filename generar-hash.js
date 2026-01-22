// Script simple para generar hash de contraseña
// Ejecutar con: node generar-hash.js

const bcrypt = require('bcryptjs');

async function generarHash() {
    try {
        const password = 'admin123';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        console.log('\n========================================');
        console.log('HASH GENERADO CORRECTAMENTE');
        console.log('========================================');
        console.log('Contraseña:', password);
        console.log('Hash:', hash);
        console.log('========================================\n');
        console.log('Copia este hash y úsalo en el SQL:\n');
        console.log(`'${hash}'`);
        console.log('\n========================================\n');

        // Verificar que el hash funciona
        const isValid = await bcrypt.compare(password, hash);
        console.log('Verificación:', isValid ? '✅ Hash válido' : '❌ Hash inválido');
        console.log('\n');

    } catch (error) {
        console.error('Error:', error.message);
        if (error.message.includes('Cannot find module')) {
            console.log('\n⚠️  Debes ejecutar primero: npm install\n');
        }
    }
}

generarHash();
