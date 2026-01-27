require('dotenv').config();
const bcryptjs = require('bcryptjs');
const db = require('./db');

async function crearUsuarioSupervisor() {
    try {
        console.log('🔧 Creando usuario supervisor...\n');

        // Contraseña para el supervisor
        const password = 'Supervisor123!';
        const passwordHash = await bcryptjs.hash(password, 10);

        // Verificar si ya existe
        const existente = await db.query(
            'SELECT id FROM usuarios WHERE username = $1',
            ['supervisor']
        );

        if (existente.rows.length > 0) {
            console.log('❌ El usuario "supervisor" ya existe.');
            process.exit(0);
        }

        // Obtener todas las empresas
        const empresas = await db.query('SELECT id FROM empresas WHERE activa = true');

        if (empresas.rows.length === 0) {
            console.log('❌ No hay empresas activas para asignar.');
            process.exit(1);
        }

        // Crear usuario
        const resultUsuario = await db.query(
            `INSERT INTO usuarios (username, email, nombre, password, password_hash, rol, rol_global, activo, debe_cambiar_password)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id, username, nombre, rol_global`,
            ['supervisor', 'supervisor@verapp.local', 'Supervisor', passwordHash, passwordHash, 'supervisor', 'supervisor', true, false]
        );

        const usuarioId = resultUsuario.rows[0].id;

        console.log('✅ Usuario creado:');
        console.log(`   Username: supervisor`);
        console.log(`   Contraseña: ${password}`);
        console.log(`   Rol: supervisor\n`);

        // Asignar a todas las empresas
        for (const empresa of empresas.rows) {
            await db.query(
                `INSERT INTO usuarios_empresas (usuario_id, empresa_id, rol_empresa, permisos)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (usuario_id, empresa_id) DO NOTHING`,
                [usuarioId, empresa.id, 'admin', JSON.stringify({
                    empleados: true,
                    tickets: true,
                    reportes: true,
                    usuarios: true,
                    configuracion: true
                })]
            );
        }

        console.log(`✅ Usuario asignado a ${empresas.rows.length} empresa(s)`);
        console.log('\n📝 Datos de acceso:');
        console.log('   URL: https://verapp.vercel.app (o tu URL local)');
        console.log('   Usuario: supervisor');
        console.log(`   Contraseña: ${password}`);
        console.log('\n💡 Nota: Este usuario entrará directo a configuración.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

crearUsuarioSupervisor();
