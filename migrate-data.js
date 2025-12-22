// Script para migrar datos de JSON a PostgreSQL
// Ejecutar: node migrate-data.js

const fs = require('fs');
const db = require('./db');

async function migrateData() {
    console.log('🔄 Iniciando migración de datos JSON a PostgreSQL...\n');

    try {
        // 1. Verificar archivos JSON
        const usuariosFile = './data/usuarios.json';
        const empleadosFile = './data/empleados.json';
        const ticketsFile = './data/tickets.json';

        // 2. Migrar Usuarios (si existen y si no están ya en la BD)
        if (fs.existsSync(usuariosFile)) {
            console.log('📋 Migrando usuarios...');
            const usuarios = JSON.parse(fs.readFileSync(usuariosFile, 'utf8'));
            
            for (const user of usuarios) {
                try {
                    await db.query(
                        `INSERT INTO usuarios (nombre, usuario, password, rol) 
                         VALUES ($1, $2, $3, $4) 
                         ON CONFLICT (usuario) DO NOTHING`,
                        [user.nombre, user.usuario, user.password, user.rol]
                    );
                    console.log(`  ✅ Usuario migrado: ${user.usuario}`);
                } catch (error) {
                    console.log(`  ⚠️  Usuario ya existe: ${user.usuario}`);
                }
            }
        } else {
            console.log('ℹ️  No hay archivo de usuarios para migrar');
        }

        // 3. Migrar Empleados
        if (fs.existsSync(empleadosFile)) {
            console.log('\n📋 Migrando empleados...');
            const empleados = JSON.parse(fs.readFileSync(empleadosFile, 'utf8'));
            
            for (const emp of empleados) {
                try {
                    const datosPersonales = emp.datosPersonales || {};
                    const datosLaborales = emp.laboral || {};
                    const educacionData = emp.educacion || {};

                    await db.query(
                        `INSERT INTO empleados (
                            nombre, apellido, dni, cuit, fecha_nacimiento, nacionalidad,
                            es_extranjero, pais_origen, telefono, email, direccion, ciudad,
                            provincia, codigo_postal, fecha_ingreso, puesto, area, salario,
                            tipo_contrato, nivel_educativo, titulo, institucion,
                            emergencia_nombre, emergencia_telefono, emergencia_relacion,
                            obra_social, numero_afiliado, problemas_salud,
                            antecedentes_penales, observaciones_antecedentes,
                            integracion_familiar, observaciones,
                            datos_personales, datos_laborales, educacion, datos_adicionales
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                            $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26,
                            $27, $28, $29, $30, $31, $32, $33, $34, $35, $36
                        ) ON CONFLICT (dni) DO NOTHING`,
                        [
                            emp.nombre || datosPersonales.nombre,
                            emp.apellido || datosPersonales.apellido,
                            emp.dni || datosPersonales.dni,
                            emp.cuit || datosPersonales.cuit,
                            emp.fechaNacimiento || datosPersonales.fechaNacimiento,
                            emp.nacionalidad || datosPersonales.nacionalidad,
                            emp.esExtranjero,
                            emp.paisOrigen,
                            emp.telefono || datosPersonales.telefono,
                            emp.email || datosPersonales.email,
                            emp.direccion || datosPersonales.direccion,
                            emp.ciudad || datosPersonales.ciudad,
                            emp.provincia || datosPersonales.provincia,
                            emp.codigoPostal || datosPersonales.codigoPostal,
                            emp.fechaIngreso || datosLaborales.fechaIngreso,
                            emp.puesto || datosLaborales.puesto,
                            emp.area || datosLaborales.area,
                            emp.salario || datosLaborales.salario,
                            emp.tipoContrato || datosLaborales.tipoContrato,
                            emp.nivelEducativo || educacionData.nivelMaximo,
                            emp.titulo || educacionData.titulo,
                            emp.institucion || educacionData.institucion,
                            emp.emergenciaNombre,
                            emp.emergenciaTelefono,
                            emp.emergenciaRelacion,
                            emp.obraSocial,
                            emp.numeroAfiliado,
                            emp.problemasSalud,
                            emp.antecedentesPenales,
                            emp.observacionesAntecedentes,
                            emp.integracionFamiliar,
                            emp.observaciones,
                            JSON.stringify(emp.datosPersonales || null),
                            JSON.stringify(emp.laboral || null),
                            JSON.stringify(emp.educacion || null),
                            JSON.stringify(emp.datosAdicionales || null)
                        ]
                    );
                    console.log(`  ✅ Empleado migrado: ${emp.nombre || datosPersonales.nombre} ${emp.apellido || datosPersonales.apellido}`);
                } catch (error) {
                    if (error.code === '23505') { // Duplicate key
                        console.log(`  ⚠️  Empleado ya existe (DNI duplicado)`);
                    } else {
                        console.log(`  ❌ Error migrando empleado: ${error.message}`);
                    }
                }
            }
        } else {
            console.log('ℹ️  No hay archivo de empleados para migrar');
        }

        // 4. Migrar Tickets
        if (fs.existsSync(ticketsFile)) {
            console.log('\n📋 Migrando tickets...');
            const tickets = JSON.parse(fs.readFileSync(ticketsFile, 'utf8'));
            
            for (const ticket of tickets) {
                try {
                    await db.query(
                        `INSERT INTO tickets (empleado_id, tipo, descripcion, fecha, estado) 
                         VALUES ($1, $2, $3, $4, $5)`,
                        [
                            ticket.empleadoId,
                            ticket.tipo,
                            ticket.descripcion,
                            ticket.fecha,
                            ticket.estado || 'pendiente'
                        ]
                    );
                    console.log(`  ✅ Ticket migrado: ${ticket.tipo} - Empleado ${ticket.empleadoId}`);
                } catch (error) {
                    console.log(`  ❌ Error migrando ticket: ${error.message}`);
                }
            }
        } else {
            console.log('ℹ️  No hay archivo de tickets para migrar');
        }

        console.log('\n✅ Migración completada exitosamente!\n');
        
        // 5. Mostrar resumen
        const usersCount = await db.query('SELECT COUNT(*) FROM usuarios');
        const empleadosCount = await db.query('SELECT COUNT(*) FROM empleados');
        const ticketsCount = await db.query('SELECT COUNT(*) FROM tickets');
        
        console.log('📊 Resumen de datos en PostgreSQL:');
        console.log(`   Usuarios: ${usersCount.rows[0].count}`);
        console.log(`   Empleados: ${empleadosCount.rows[0].count}`);
        console.log(`   Tickets: ${ticketsCount.rows[0].count}`);
        
    } catch (error) {
        console.error('\n❌ Error durante la migración:', error);
    } finally {
        // Cerrar conexión
        await db.pool.end();
        console.log('\n🔌 Conexión cerrada');
    }
}

// Ejecutar migración
migrateData();
