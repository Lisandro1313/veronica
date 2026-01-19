// Script para asignar empresa_id a empleados existentes
const db = require('./db');

async function asignarEmpresaAEmpleados() {
    try {
        console.log('🔄 Asignando empresa_id a empleados existentes...\n');
        
        // Verificar empleados sin empresa
        const sinEmpresa = await db.query(`
            SELECT COUNT(*) FROM empleados WHERE empresa_id IS NULL
        `);
        
        console.log(`📊 Empleados sin empresa: ${sinEmpresa.rows[0].count}`);
        
        if (sinEmpresa.rows[0].count > 0) {
            // Obtener primera empresa
            const empresas = await db.query('SELECT id, nombre FROM empresas ORDER BY id LIMIT 1');
            
            if (empresas.rows.length === 0) {
                console.log('❌ No hay empresas creadas. Crea una empresa primero.');
                process.exit(1);
            }
            
            const empresaId = empresas.rows[0].id;
            const empresaNombre = empresas.rows[0].nombre;
            
            console.log(`\n✓ Asignando todos los empleados a: "${empresaNombre}" (ID: ${empresaId})`);
            
            // Actualizar empleados sin empresa
            const result = await db.query(
                'UPDATE empleados SET empresa_id = $1 WHERE empresa_id IS NULL',
                [empresaId]
            );
            
            console.log(`✅ ${result.rowCount} empleados actualizados\n`);
        } else {
            console.log('\n✅ Todos los empleados ya tienen empresa asignada\n');
        }
        
        // Verificar distribución
        const distribucion = await db.query(`
            SELECT e.id, e.nombre, COUNT(em.id) as empleados
            FROM empresas e
            LEFT JOIN empleados em ON e.id = em.empresa_id
            GROUP BY e.id, e.nombre
            ORDER BY e.id
        `);
        
        console.log('📊 Distribución de empleados por empresa:');
        distribucion.rows.forEach(e => {
            console.log(`  ${e.nombre.padEnd(30)} ${e.empleados} empleados`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

asignarEmpresaAEmpleados();
