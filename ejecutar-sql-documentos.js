// Script para ejecutar el SQL de creación de tabla documentos_empleado
const db = require('./db');
const fs = require('fs');

async function ejecutarSQL() {
    try {
        console.log('📄 Leyendo archivo SQL...');
        const sql = fs.readFileSync('./create-documentos-table.sql', 'utf8');

        console.log('🔧 Ejecutando SQL...');
        await db.query(sql);

        console.log('✅ Tabla documentos_empleado creada exitosamente!');
        console.log('📊 Verificando tabla...');

        const result = await db.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'documentos_empleado'
            ORDER BY ordinal_position
        `);

        console.log('\n📋 Estructura de la tabla:');
        result.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error al crear la tabla:', error.message);
        process.exit(1);
    }
}

ejecutarSQL();
