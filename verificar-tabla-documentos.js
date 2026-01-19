// Verificar tabla documentos_empleado
const db = require('./db');

async function verificarTabla() {
    try {
        console.log('🔍 Verificando tabla documentos_empleado...\n');

        const columnas = await db.query(`
            SELECT column_name, data_type, character_maximum_length, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'documentos_empleado'
            ORDER BY ordinal_position
        `);

        console.log('📋 Estructura de la tabla:');
        columnas.rows.forEach(col => {
            const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
            const nullable = col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL';
            console.log(`  ✓ ${col.column_name.padEnd(20)} ${col.data_type}${length.padEnd(10)} ${nullable}`);
        });

        const indices = await db.query(`
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'documentos_empleado'
        `);

        console.log('\n🔑 Índices:');
        indices.rows.forEach(idx => {
            console.log(`  ✓ ${idx.indexname}`);
        });

        const count = await db.query('SELECT COUNT(*) FROM documentos_empleado');
        console.log(`\n📊 Total de documentos: ${count.rows[0].count}`);

        console.log('\n✅ La tabla está lista para usar!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

verificarTabla();
