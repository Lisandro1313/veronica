// Ejecutar migración del sistema de usuarios
const db = require('./db');
const fs = require('fs');

async function migrarSistema() {
    try {
        console.log('🔄 Iniciando migración del sistema de usuarios...\n');

        console.log('📄 Leyendo SQL de migración...');
        const sql = fs.readFileSync('./migrar-usuarios-sistema.sql', 'utf8');

        console.log('🔧 Ejecutando migración...');
        await db.query(sql);

        console.log('✅ Migración completada!\n');

        // Verificar estructura actualizada
        console.log('📊 Verificando cambios...\n');

        const columnas = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'usuarios' 
            ORDER BY ordinal_position
        `);

        console.log('📋 Columnas en tabla usuarios:');
        columnas.rows.forEach(c => {
            console.log(`  ✓ ${c.column_name.padEnd(25)} ${c.data_type}`);
        });

        // Verificar tablas nuevas
        const tablas = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name IN ('usuarios_empresas', 'sesiones_usuarios', 'log_accesos')
            ORDER BY table_name
        `);

        console.log('\n📋 Tablas creadas:');
        tablas.rows.forEach(t => console.log(`  ✓ ${t.table_name}`));

        // Verificar relaciones usuarios-empresas
        const relaciones = await db.query(`
            SELECT 
                u.username, 
                u.nombre, 
                e.nombre as empresa,
                ue.rol_empresa,
                ue.permisos->>'ver_empleados' as puede_ver_empleados
            FROM usuarios_empresas ue
            JOIN usuarios u ON u.id = ue.usuario_id
            JOIN empresas e ON e.id = ue.empresa_id
            ORDER BY u.id, e.id
            LIMIT 10
        `);

        console.log('\n👥 Relaciones usuarios-empresas (primeras 10):');
        relaciones.rows.forEach(r => {
            console.log(`  ✓ ${r.username.padEnd(15)} → ${r.empresa.padEnd(20)} [${r.rol_empresa}]`);
        });

        // Contar relaciones totales
        const count = await db.query('SELECT COUNT(*) FROM usuarios_empresas');
        console.log(`\n📊 Total de relaciones: ${count.rows[0].count}`);

        const usuarios = await db.query('SELECT COUNT(*) FROM usuarios');
        const empresas = await db.query('SELECT COUNT(*) FROM empresas');
        console.log(`👥 Usuarios: ${usuarios.rows[0].count}`);
        console.log(`🏢 Empresas: ${empresas.rows[0].count}`);

        console.log('\n✅ Sistema de usuarios mejorado exitosamente!');
        console.log('✨ Todos los usuarios mantienen acceso a todas las empresas');
        console.log('🔐 Ahora puedes gestionar permisos granulares por empresa');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error en migración:', error.message);
        console.error(error);
        process.exit(1);
    }
}

migrarSistema();
