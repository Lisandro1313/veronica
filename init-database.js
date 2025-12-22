// Auto-inicialización de base de datos
// Este script se ejecuta automáticamente al iniciar el servidor

const db = require('./db');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
    console.log('🔍 Verificando estructura de base de datos...');
    
    try {
        // Verificar si la tabla usuarios existe
        const checkTable = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'usuarios'
            );
        `);
        
        if (!checkTable.rows[0].exists) {
            console.log('📦 Tablas no encontradas. Iniciando creación...');
            
            // Leer el archivo init-db.sql
            const sqlScript = fs.readFileSync(path.join(__dirname, 'init-db.sql'), 'utf8');
            
            // Ejecutar el script SQL
            await db.query(sqlScript);
            
            console.log('✅ Base de datos inicializada correctamente');
            console.log('✅ Tablas creadas: usuarios, empleados, tickets');
            console.log('✅ Usuarios por defecto creados');
        } else {
            console.log('✅ Base de datos ya inicializada');
        }
        
    } catch (error) {
        console.error('❌ Error al inicializar base de datos:', error);
        console.log('ℹ️  Intenta ejecutar init-db.sql manualmente');
    }
}

module.exports = { initDatabase };
