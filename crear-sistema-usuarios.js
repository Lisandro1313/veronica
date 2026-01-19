// Script para crear el sistema de usuarios y generar passwords
const db = require('./db');
const bcrypt = require('bcryptjs');
const fs = require('fs');

async function crearSistemaUsuarios() {
    try {
        console.log('🔐 Iniciando creación del sistema de usuarios...\n');

        // Generar hashes para las contraseñas
        console.log('🔒 Generando hash para contraseña admin...');
        const adminHash = await bcrypt.hash('Admin2024!', 10);

        console.log('🔒 Generando hash para contraseña demo...');
        const demoHash = await bcrypt.hash('Demo2024!', 10);

        console.log('\n📄 Leyendo archivo SQL...');
        let sql = fs.readFileSync('./create-usuarios-system.sql', 'utf8');

        // Reemplazar los placeholders con los hashes reales
        sql = sql.replace(/\$2b\$10\$placeholder_hash_will_be_replaced/g, adminHash);
        sql = sql.split('\n').map(line => {
            if (line.includes("'demo@verapp.com'")) {
                return line.replace(adminHash, demoHash);
            }
            return line;
        }).join('\n');

        console.log('🔧 Ejecutando SQL...');
        await db.query(sql);

        console.log('✅ Sistema de usuarios creado exitosamente!\n');

        // Verificar tablas creadas
        console.log('📊 Verificando tablas creadas...');
        const tablas = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name IN ('usuarios', 'usuarios_empresas', 'sesiones_usuarios', 'log_accesos')
            ORDER BY table_name
        `);

        console.log('\n📋 Tablas creadas:');
        tablas.rows.forEach(t => console.log(`  ✓ ${t.table_name}`));

        // Verificar usuarios creados
        const usuarios = await db.query('SELECT id, username, email, nombre, rol_global, activo FROM usuarios ORDER BY id');

        console.log('\n👥 Usuarios creados:');
        usuarios.rows.forEach(u => {
            console.log(`  ✓ ${u.username.padEnd(15)} - ${u.nombre.padEnd(25)} [${u.rol_global}] ${u.activo ? '🟢' : '🔴'}`);
        });

        console.log('\n🔑 Credenciales por defecto:');
        console.log('  Admin:    admin / Admin2024!');
        console.log('  Demo:     demo / Demo2024!');

        console.log('\n✅ ¡Sistema listo para usar!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.code === '42P07') {
            console.log('\n⚠️  Las tablas ya existen. Verificando estructura...');

            const usuarios = await db.query('SELECT id, username, email, nombre, rol_global FROM usuarios ORDER BY id');
            if (usuarios.rows.length > 0) {
                console.log('\n👥 Usuarios existentes:');
                usuarios.rows.forEach(u => {
                    console.log(`  ✓ ${u.username} - ${u.nombre} [${u.rol_global}]`);
                });
                console.log('\n✅ El sistema ya está configurado.');
                process.exit(0);
            }
        }
        process.exit(1);
    }
}

crearSistemaUsuarios();
