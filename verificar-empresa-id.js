require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function verificarYCorregir() {
    try {
        console.log('🔍 Verificando empresa_id en empleados...\n');

        // Contar empleados
        const countResult = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(empresa_id) as con_empresa,
                COUNT(*) FILTER (WHERE empresa_id IS NULL) as sin_empresa
            FROM empleados
        `);

        const { total, con_empresa, sin_empresa } = countResult.rows[0];
        console.log(`📊 Estadísticas:`);
        console.log(`   Total empleados: ${total}`);
        console.log(`   Con empresa_id: ${con_empresa}`);
        console.log(`   Sin empresa_id: ${sin_empresa}\n`);

        if (sin_empresa > 0) {
            console.log(`⚠️  Hay ${sin_empresa} empleados sin empresa_id\n`);

            // Obtener la primera empresa disponible
            const empresaResult = await pool.query('SELECT id, nombre FROM empresas ORDER BY id LIMIT 1');

            if (empresaResult.rows.length === 0) {
                console.error('❌ No hay empresas en la base de datos. Crea una empresa primero.');
                process.exit(1);
            }

            const empresaPredeterminada = empresaResult.rows[0];
            console.log(`✅ Empresa predeterminada encontrada: "${empresaPredeterminada.nombre}" (ID: ${empresaPredeterminada.id})\n`);

            // Actualizar empleados sin empresa_id
            const updateResult = await pool.query(`
                UPDATE empleados 
                SET empresa_id = $1 
                WHERE empresa_id IS NULL
                RETURNING id, nombre_completo
            `, [empresaPredeterminada.id]);

            console.log(`✅ ${updateResult.rowCount} empleados actualizados con empresa_id = ${empresaPredeterminada.id}\n`);

            if (updateResult.rows.length > 0) {
                console.log('Empleados actualizados:');
                updateResult.rows.forEach((emp, i) => {
                    console.log(`   ${i + 1}. ${emp.nombre_completo} (ID: ${emp.id})`);
                });
            }
        } else {
            console.log('✅ Todos los empleados tienen empresa_id asignado');
        }

        // Verificar distribución por empresa
        console.log('\n📊 Distribución de empleados por empresa:');
        const distResult = await pool.query(`
            SELECT 
                e.id,
                e.nombre,
                COUNT(em.id) as cantidad_empleados
            FROM empresas e
            LEFT JOIN empleados em ON em.empresa_id = e.id
            GROUP BY e.id, e.nombre
            ORDER BY e.id
        `);

        distResult.rows.forEach(row => {
            console.log(`   ${row.nombre}: ${row.cantidad_empleados} empleados`);
        });

        console.log('\n✅ Proceso completado');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

verificarYCorregir();
