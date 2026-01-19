// Verificar estructura actual
const db = require('./db');

async function verificar() {
    try {
        // Verificar si existe tabla usuarios
        const tablaUsuarios = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'usuarios'
            )
        `);

        if (tablaUsuarios.rows[0].exists) {
            console.log('⚠️  Tabla usuarios ya existe\n');

            const columnas = await db.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'usuarios'
                ORDER BY ordinal_position
            `);

            console.log('📋 Estructura actual:');
            columnas.rows.forEach(c => {
                console.log(`  ${c.column_name}: ${c.data_type}`);
            });

            const usuarios = await db.query('SELECT * FROM usuarios LIMIT 5');
            console.log(`\n👥 Usuarios actuales: ${usuarios.rows.length}`);
            usuarios.rows.forEach(u => {
                console.log(`  - ${JSON.stringify(u)}`);
            });
        } else {
            console.log('✅ No existe tabla usuarios, se puede crear');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

verificar();
