require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const db = require('./db'); // Usar db.js con Supabase

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static('public'));

// Ruta raíz de prueba
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// ===== RUTAS DE AUTENTICACIÓN =====

app.post('/api/login', async (req, res) => {
    try {
        const { usuario, password } = req.body;

        const result = await db.query(
            'SELECT id, nombre, username, password, rol FROM usuarios WHERE username = $1',
            [usuario]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            const match = await bcrypt.compare(password, user.password);

            if (match) {
                // Definir permisos según rol
                const permisos = {
                    superadmin: {
                        empleados: { crear: true, editar: true, eliminar: true, ver: true },
                        usuarios: { crear: true, editar: true, eliminar: true, ver: true },
                        tickets: { crear: true, editar: true, eliminar: true, ver: true },
                        exportar: { pdf: true, excel: true },
                        reportes: { ver: true, avanzados: true },
                        alertas: { ver: true, configurar: true }
                    },
                    admin: {
                        empleados: { crear: true, editar: true, eliminar: true, ver: true },
                        usuarios: { crear: false, editar: false, eliminar: false, ver: true },
                        tickets: { crear: true, editar: true, eliminar: false, ver: true },
                        exportar: { pdf: true, excel: true },
                        reportes: { ver: true, avanzados: true },
                        alertas: { ver: true, configurar: false }
                    },
                    manager: {
                        empleados: { crear: true, editar: true, eliminar: false, ver: true },
                        usuarios: { crear: false, editar: false, eliminar: false, ver: false },
                        tickets: { crear: true, editar: true, eliminar: false, ver: true },
                        exportar: { pdf: true, excel: true },
                        reportes: { ver: true, avanzados: false },
                        alertas: { ver: true, configurar: false }
                    },
                    viewer: {
                        empleados: { crear: false, editar: false, eliminar: false, ver: true },
                        usuarios: { crear: false, editar: false, eliminar: false, ver: false },
                        tickets: { crear: false, editar: false, eliminar: false, ver: true },
                        exportar: { pdf: false, excel: false },
                        reportes: { ver: true, avanzados: false },
                        alertas: { ver: true, configurar: false }
                    }
                };

                const rol = user.rol || 'viewer';
                const userPermisos = permisos[rol] || permisos.viewer;

                res.json({
                    success: true,
                    usuario: { id: user.id, nombre: user.nombre, rol: rol, permisos: userPermisos }
                });
            } else {
                res.status(401).json({ success: false, mensaje: 'Usuario o contraseña incorrectos' });
            }
        } else {
            res.status(401).json({ success: false, mensaje: 'Usuario o contraseña incorrectos' });
        }
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ success: false, mensaje: 'Error en el servidor' });
    }
});

// ===== RUTAS DE EMPLEADOS =====

// Obtener todos los empleados
app.get('/api/empleados', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM empleados ORDER BY id DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener empleados:', error);
        res.status(500).json({ success: false, mensaje: 'Error al obtener empleados' });
    }
});

// IMPORTANTE: Rutas específicas ANTES de rutas con parámetros
// Obtener empleados ausentes (debe estar ANTES de /api/empleados/:id)
app.get('/api/empleados/ausentes', async (req, res) => {
    try {
        // Intentar usar la vista si existe, sino calcular manualmente
        let result;
        try {
            result = await db.query(`SELECT * FROM v_empleados_ausentes`);
        } catch (viewError) {
            // Si la vista no existe, calcular ausentes desde tickets
            console.log('Vista v_empleados_ausentes no existe, calculando manualmente');
            result = await db.query(`
                SELECT 
                    e.nombre_completo as empleado,
                    e.puesto,
                    '' as area,
                    t.tipo as motivo_ausencia,
                    t.fecha_desde as fecha_inicio,
                    t.fecha_hasta as fecha_fin
                FROM tickets t
                JOIN empleados e ON t.empleado_id = e.id
                WHERE t.tipo IN ('vacaciones', 'licencia_medica', 'licencia_maternidad', 'permiso', 'suspension')
                  AND t.estado = 'aprobado'
                  AND t.fecha_desde <= CURRENT_DATE
                  AND t.fecha_hasta >= CURRENT_DATE
                ORDER BY t.fecha_desde DESC
            `);
        }
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener empleados ausentes:', error);
        res.json([]); // Devolver array vacío en lugar de error
    }
});

// Obtener un empleado específico (DEBE estar DESPUÉS de rutas específicas)
app.get('/api/empleados/:id', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM empleados WHERE id = $1', [req.params.id]);

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ success: false, mensaje: 'Empleado no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener empleado:', error);
        res.status(500).json({ success: false, mensaje: 'Error al obtener empleado' });
    }
});

// Crear nuevo empleado
app.post('/api/empleados', async (req, res) => {
    try {
        const data = req.body;

        // Extraer datos de objetos anidados si existen
        const datosPersonales = data.datosPersonales || {};
        const datosLaborales = data.laboral || {};

        // Helper para convertir strings vacíos a null
        const toNullIfEmpty = (val) => val === '' || val === undefined ? null : val;

        const result = await db.query(
            `INSERT INTO empleados (
                nombre_completo, cuil, documento, fecha_nacimiento, 
                estado_civil, es_extranjero, pais_origen, 
                fecha_ingreso, puesto, nivel_educativo, 
                problemas_salud, antecedentes_penales, 
                integracion_familiar, escolaridad_familiar, experiencia_laboral,
                fecha_entrada_pais, tipo_residencia, entradas_salidas_pais,
                calle, numero, localidad, observaciones, sueldo
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
            ) RETURNING *`,
            [
                data.nombreCompleto || datosPersonales.nombreCompleto,
                toNullIfEmpty(data.cuil || datosPersonales.cuil),
                toNullIfEmpty(data.documento || datosPersonales.documento),
                toNullIfEmpty(data.fechaNacimiento || datosPersonales.fechaNacimiento),
                toNullIfEmpty(data.estadoCivil || datosPersonales.estadoCivil),
                data.esExtranjero || 'no',
                toNullIfEmpty(data.paisOrigen),
                toNullIfEmpty(data.fechaIngreso || datosLaborales.fechaIngreso),
                toNullIfEmpty(data.puesto || datosLaborales.puesto),
                toNullIfEmpty(data.nivelEducativo),
                toNullIfEmpty(data.problemasSalud),
                data.antecedentesPenales || 'no',
                toNullIfEmpty(data.integracionFamiliar),
                toNullIfEmpty(data.escolaridadFamiliar),
                toNullIfEmpty(data.experienciaLaboral),
                toNullIfEmpty(data.fechaEntradaPais),
                toNullIfEmpty(data.tipoResidencia),
                toNullIfEmpty(data.entradasSalidasPais),
                toNullIfEmpty(data.calle),
                toNullIfEmpty(data.numero),
                toNullIfEmpty(data.localidad),
                toNullIfEmpty(data.observaciones),
                toNullIfEmpty(data.sueldo || datosLaborales.sueldo)
            ]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error al crear empleado:', error);
        res.status(500).json({ success: false, mensaje: 'Error al crear empleado', error: error.message });
    }
});

// Actualizar empleado
app.put('/api/empleados/:id', async (req, res) => {
    try {
        const data = req.body;
        const datosPersonales = data.datosPersonales || {};
        const datosLaborales = data.laboral || {};
        const educacionData = data.educacion || {};

        const result = await db.query(
            `UPDATE empleados SET
                nombre = $1, apellido = $2, dni = $3, cuit = $4, 
                fecha_nacimiento = $5, nacionalidad = $6, es_extranjero = $7, 
                pais_origen = $8, telefono = $9, email = $10, direccion = $11, 
                ciudad = $12, provincia = $13, codigo_postal = $14, 
                fecha_ingreso = $15, puesto = $16, area = $17, salario = $18, 
                tipo_contrato = $19, nivel_educativo = $20, titulo = $21, 
                institucion = $22, emergencia_nombre = $23, emergencia_telefono = $24, 
                emergencia_relacion = $25, obra_social = $26, numero_afiliado = $27, 
                problemas_salud = $28, antecedentes_penales = $29, 
                observaciones_antecedentes = $30, integracion_familiar = $31, 
                observaciones = $32, datos_personales = $33, datos_laborales = $34, 
                educacion = $35, datos_adicionales = $36, sueldo = $37
            WHERE id = $38 RETURNING *`,
            [
                data.nombre || datosPersonales.nombre,
                data.apellido || datosPersonales.apellido,
                data.dni || datosPersonales.dni,
                data.cuit || datosPersonales.cuit,
                data.fechaNacimiento || datosPersonales.fechaNacimiento,
                data.nacionalidad || datosPersonales.nacionalidad,
                data.esExtranjero,
                data.paisOrigen,
                data.telefono || datosPersonales.telefono,
                data.email || datosPersonales.email,
                data.direccion || datosPersonales.direccion,
                data.ciudad || datosPersonales.ciudad,
                data.provincia || datosPersonales.provincia,
                data.codigoPostal || datosPersonales.codigoPostal,
                data.fechaIngreso || datosLaborales.fechaIngreso,
                data.puesto || datosLaborales.puesto,
                data.area || datosLaborales.area,
                data.salario || datosLaborales.salario,
                data.tipoContrato || datosLaborales.tipoContrato,
                data.nivelEducativo || educacionData.nivelMaximo,
                data.titulo || educacionData.titulo,
                data.institucion || educacionData.institucion,
                data.emergenciaNombre,
                data.emergenciaTelefono,
                data.emergenciaRelacion,
                data.obraSocial,
                data.numeroAfiliado,
                data.problemasSalud,
                data.antecedentesPenales,
                data.observacionesAntecedentes,
                data.integracionFamiliar,
                data.observaciones,
                JSON.stringify(data.datosPersonales || null),
                JSON.stringify(data.laboral || null),
                JSON.stringify(data.educacion || null),
                JSON.stringify(data.datosAdicionales || null),
                data.sueldo || datosLaborales.sueldo,
                req.params.id
            ]
        );

        if (result.rows.length > 0) {
            res.json({ success: true, data: result.rows[0] });
        } else {
            res.status(404).json({ success: false, mensaje: 'Empleado no encontrado' });
        }
    } catch (error) {
        console.error('Error al actualizar empleado:', error);
        res.status(500).json({ success: false, mensaje: 'Error al actualizar empleado' });
    }
});

// Eliminar empleado
app.delete('/api/empleados/:id', async (req, res) => {
    try {
        const result = await db.query('DELETE FROM empleados WHERE id = $1 RETURNING id', [req.params.id]);

        if (result.rows.length > 0) {
            res.json({ success: true, mensaje: 'Empleado eliminado' });
        } else {
            res.status(404).json({ success: false, mensaje: 'Empleado no encontrado' });
        }
    } catch (error) {
        console.error('Error al eliminar empleado:', error);
        res.status(500).json({ success: false, mensaje: 'Error al eliminar empleado' });
    }
});

// ===== RUTAS DE TICKETS =====

// Obtener tickets de un empleado
app.get('/api/tickets/:empleadoId', async (req, res) => {
    try {
        console.log('📋 Obteniendo tickets para empleado:', req.params.empleadoId);
        const result = await db.query(
            `SELECT t.*, 
                    COALESCE(u1.nombre, u1.username) as creado_por_nombre, 
                    COALESCE(u2.nombre, u2.username) as aprobado_por_nombre
             FROM tickets t
             LEFT JOIN usuarios u1 ON t.creado_por = u1.id
             LEFT JOIN usuarios u2 ON t.aprobado_por = u2.id
             WHERE t.empleado_id = $1 
             ORDER BY t.created_at DESC`,
            [req.params.empleadoId]
        );
        console.log('✅ Tickets encontrados:', result.rows.length);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error al obtener tickets:', error);
        res.status(500).json({ success: false, mensaje: 'Error al obtener tickets', error: error.message });
    }
});

// Crear nuevo ticket
app.post('/api/tickets', async (req, res) => {
    try {
        console.log('📝 POST /api/tickets - Datos recibidos:', req.body);
        
        const {
            empleadoId, tipo, titulo, descripcion,
            fechaEvento, fechaDesde, fechaHasta,
            valorAnterior, valorNuevo, observaciones,
            datosAdicionales, creadoPor, actualizaEmpleado, estado
        } = req.body;

        // Validar campos requeridos
        if (!empleadoId || !tipo) {
            return res.status(400).json({ 
                success: false, 
                mensaje: 'Faltan campos requeridos: empleadoId y tipo son obligatorios' 
            });
        }

        // Helper para convertir undefined/empty a null
        const toNull = (val) => (val === undefined || val === '' || val === null) ? null : val;

        const result = await db.query(
            `INSERT INTO tickets (
                empleado_id, tipo, titulo, descripcion, 
                fecha_evento, fecha_desde, fecha_hasta,
                valor_anterior, valor_nuevo, observaciones,
                datos_adicionales, creado_por, actualiza_empleado, estado
             ) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
             RETURNING *`,
            [
                parseInt(empleadoId),
                tipo,
                toNull(titulo),
                toNull(descripcion),
                toNull(fechaEvento),
                toNull(fechaDesde),
                toNull(fechaHasta),
                toNull(valorAnterior),
                toNull(valorNuevo),
                toNull(observaciones),
                datosAdicionales ? JSON.stringify(datosAdicionales) : null,
                creadoPor || 1,  // Default a 1 si no se proporciona
                actualizaEmpleado || false,
                estado || 'pendiente'
            ]
        );

        console.log('✅ Ticket creado exitosamente:', result.rows[0].id);
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('❌ Error al crear ticket:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ success: false, mensaje: 'Error al crear ticket', error: error.message });
    }
});

// Obtener todos los tickets
app.get('/api/tickets', async (req, res) => {
    try {
        console.log('📋 GET /api/tickets - Obteniendo todos los tickets');
        const result = await db.query(`
            SELECT t.*, e.nombre_completo as nombre_completo
            FROM tickets t 
            LEFT JOIN empleados e ON t.empleado_id = e.id 
            ORDER BY t.created_at DESC
        `);
        console.log(`✅ ${result.rows.length} tickets encontrados`);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error al obtener tickets:', error.message);
        res.status(500).json({ success: false, mensaje: 'Error al obtener tickets', error: error.message });
    }
});

// Actualizar ticket
app.put('/api/tickets/:id', async (req, res) => {
    try {
        const { estado, observaciones, aprobadoPor } = req.body;

        const result = await db.query(
            `UPDATE tickets SET
                estado = COALESCE($1, estado),
                observaciones = COALESCE($2, observaciones),
                aprobado_por = COALESCE($3, aprobado_por),
                fecha_aprobacion = CASE WHEN $1 IN ('aprobado', 'rechazado') AND fecha_aprobacion IS NULL 
                                        THEN CURRENT_TIMESTAMP ELSE fecha_aprobacion END,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
             RETURNING *`,
            [estado, observaciones, aprobadoPor, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, mensaje: 'Ticket no encontrado' });
        }

        // Si el ticket actualiza el empleado y fue aprobado
        if (result.rows[0].actualiza_empleado && estado === 'aprobado') {
            await actualizarEmpleadoDesdeTicket(result.rows[0]);
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error al actualizar ticket:', error);
        res.status(500).json({ success: false, mensaje: 'Error al actualizar ticket' });
    }
});

// Eliminar ticket
app.delete('/api/tickets/:id', async (req, res) => {
    try {
        const result = await db.query('DELETE FROM tickets WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, mensaje: 'Ticket no encontrado' });
        }
        res.json({ success: true, mensaje: 'Ticket eliminado' });
    } catch (error) {
        console.error('Error al eliminar ticket:', error);
        res.status(500).json({ success: false, mensaje: 'Error al eliminar ticket' });
    }
});

// Obtener empleados ausentes actualmente
// Obtener un ticket por ID (query param)
app.get('/api/ticket', async (req, res) => {
    try {
        const ticketId = req.query.id;
        if (!ticketId) {
            return res.status(400).json({ success: false, mensaje: 'ID de ticket requerido' });
        }
        
        const result = await db.query(`
            SELECT t.*, e.nombre_completo as empleado_nombre, e.puesto
            FROM tickets t
            LEFT JOIN empleados e ON t.empleado_id = e.id
            WHERE t.id = $1
        `, [ticketId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, mensaje: 'Ticket no encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener ticket:', error);
        res.status(500).json({ success: false, mensaje: 'Error al obtener ticket' });
    }
});

// Obtener historial completo de un empleado
app.get('/api/empleados/:id/historial', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT * FROM v_historial_empleados WHERE empleado_id = $1`,
            [req.params.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ success: false, mensaje: 'Error al obtener historial' });
    }
});

// Función auxiliar para actualizar empleado desde ticket
async function actualizarEmpleadoDesdeTicket(ticket) {
    try {
        switch (ticket.tipo) {
            case 'cambio_puesto':
                if (ticket.valor_nuevo) {
                    await db.query(
                        'UPDATE empleados SET puesto = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                        [ticket.valor_nuevo, ticket.empleado_id]
                    );
                }
                break;
            case 'cambio_area':
                if (ticket.valor_nuevo) {
                    await db.query(
                        'UPDATE empleados SET area = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                        [ticket.valor_nuevo, ticket.empleado_id]
                    );
                }
                break;
            case 'cambio_salario':
                if (ticket.valor_nuevo) {
                    await db.query(
                        'UPDATE empleados SET salario = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                        [parseFloat(ticket.valor_nuevo), ticket.empleado_id]
                    );
                }
                break;
        }
    } catch (error) {
        console.error('Error al actualizar empleado desde ticket:', error);
    }
}

// ===== HEALTH CHECK =====
app.get('/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
        console.error('Health check failed:', error.message);
        res.status(500).json({ 
            status: 'error', 
            database: 'disconnected',
            error: error.message,
            hasEnv: {
                DATABASE_URL: !!process.env.DATABASE_URL,
                SUPABASE_URL: !!process.env.SUPABASE_URL,
                SUPABASE_KEY: !!process.env.SUPABASE_KEY
            }
        });
    }
});

// ===== RUTAS ALTERNATIVAS (COMPATIBILIDAD CON FRONTEND) =====

// Obtener empleado por query param (alternativa)
app.get('/api/empleado', async (req, res) => {
    try {
        const id = req.query.id;
        const result = await db.query('SELECT * FROM empleados WHERE id = $1', [id]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ success: false, mensaje: 'Empleado no encontrado' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, mensaje: 'Error al obtener empleado' });
    }
});

// Actualizar empleado (alternativa)
app.put('/api/actualizar-empleado', async (req, res) => {
    try {
        const id = req.query.id;
        const data = req.body;
        const datosPersonales = data.datosPersonales || {};
        const datosLaborales = data.laboral || {};

        // Helper para convertir strings vacíos a null
        const toNullIfEmpty = (val) => val === '' || val === undefined ? null : val;

        const result = await db.query(
            `UPDATE empleados SET
                nombre_completo = $1, cuil = $2, documento = $3,
                fecha_nacimiento = $4, estado_civil = $5, es_extranjero = $6, 
                pais_origen = $7, fecha_ingreso = $8, puesto = $9,
                nivel_educativo = $10, problemas_salud = $11,
                antecedentes_penales = $12, integracion_familiar = $13,
                escolaridad_familiar = $14, experiencia_laboral = $15,
                fecha_entrada_pais = $16, tipo_residencia = $17,
                entradas_salidas_pais = $18, calle = $19, numero = $20,
                localidad = $21, observaciones = $22
            WHERE id = $23 RETURNING *`,
            [
                data.nombreCompleto || datosPersonales.nombreCompleto,
                toNullIfEmpty(data.cuil || datosPersonales.cuil),
                toNullIfEmpty(data.documento || datosPersonales.documento),
                toNullIfEmpty(data.fechaNacimiento || datosPersonales.fechaNacimiento),
                toNullIfEmpty(data.estadoCivil || datosPersonales.estadoCivil),
                data.esExtranjero || 'no',
                toNullIfEmpty(data.paisOrigen),
                toNullIfEmpty(data.fechaIngreso || datosLaborales.fechaIngreso),
                toNullIfEmpty(data.puesto || datosLaborales.puesto),
                toNullIfEmpty(data.nivelEducativo),
                toNullIfEmpty(data.problemasSalud),
                data.antecedentesPenales || 'no',
                toNullIfEmpty(data.integracionFamiliar),
                toNullIfEmpty(data.escolaridadFamiliar),
                toNullIfEmpty(data.experienciaLaboral),
                toNullIfEmpty(data.fechaEntradaPais),
                toNullIfEmpty(data.tipoResidencia),
                toNullIfEmpty(data.entradasSalidasPais),
                toNullIfEmpty(data.calle),
                toNullIfEmpty(data.numero),
                toNullIfEmpty(data.localidad),
                toNullIfEmpty(data.observaciones),
                id
            ]
        );

        if (result.rows.length > 0) {
            res.json({ success: true, data: result.rows[0] });
        } else {
            res.status(404).json({ success: false, mensaje: 'Empleado no encontrado' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, mensaje: 'Error al actualizar empleado' });
    }
});

// Eliminar empleado (alternativa)
app.delete('/api/eliminar-empleado', async (req, res) => {
    try {
        const id = req.query.id;
        const result = await db.query('DELETE FROM empleados WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length > 0) {
            res.json({ success: true, mensaje: 'Empleado eliminado' });
        } else {
            res.status(404).json({ success: false, mensaje: 'Empleado no encontrado' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, mensaje: 'Error al eliminar empleado' });
    }
});

// Tickets de empleado
app.get('/api/tickets-empleado', async (req, res) => {
    try {
        const empleadoId = req.query.empleadoId;
        const result = await db.query(
            `SELECT t.*, u1.nombre as creado_por_nombre, u2.nombre as aprobado_por_nombre
             FROM tickets t
             LEFT JOIN usuarios u1 ON t.creado_por = u1.id
             LEFT JOIN usuarios u2 ON t.aprobado_por = u2.id
             WHERE t.empleado_id = $1 
             ORDER BY t.created_at DESC`,
            [empleadoId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, mensaje: 'Error al obtener tickets' });
    }
});

// Actualizar ticket
app.put('/api/actualizar-ticket', async (req, res) => {
    try {
        const id = req.query.id;
        const { estado, observaciones, aprobadoPor } = req.body;

        const result = await db.query(
            `UPDATE tickets SET
                estado = COALESCE($1, estado),
                observaciones = COALESCE($2, observaciones),
                aprobado_por = COALESCE($3, aprobado_por),
                fecha_aprobacion = CASE WHEN $1 IN ('aprobado', 'rechazado') AND fecha_aprobacion IS NULL 
                                        THEN CURRENT_TIMESTAMP ELSE fecha_aprobacion END,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
             RETURNING *`,
            [estado, observaciones, aprobadoPor, id]
        );

        if (result.rows.length > 0) {
            res.json({ success: true, data: result.rows[0] });
        } else {
            res.status(404).json({ success: false, mensaje: 'Ticket no encontrado' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, mensaje: 'Error al actualizar ticket' });
    }
});

// Eliminar ticket
app.delete('/api/eliminar-ticket', async (req, res) => {
    try {
        const id = req.query.id;
        const result = await db.query('DELETE FROM tickets WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length > 0) {
            res.json({ success: true, mensaje: 'Ticket eliminado' });
        } else {
            res.status(404).json({ success: false, mensaje: 'Ticket no encontrado' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, mensaje: 'Error al eliminar ticket' });
    }
});

// Crear ticket
app.post('/api/ticket', async (req, res) => {
    try {
        const {
            empleadoId, tipo, titulo, descripcion,
            fechaEvento, fechaDesde, fechaHasta,
            valorAnterior, valorNuevo, observaciones,
            datosAdicionales, creadoPor, actualizaEmpleado, estado
        } = req.body;

        const result = await db.query(
            `INSERT INTO tickets (
                empleado_id, tipo, titulo, descripcion, 
                fecha_evento, fecha_desde, fecha_hasta,
                valor_anterior, valor_nuevo, observaciones,
                datos_adicionales, creado_por, actualiza_empleado, estado
             ) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
             RETURNING *`,
            [
                empleadoId, tipo, titulo, descripcion,
                fechaEvento, fechaDesde, fechaHasta,
                valorAnterior, valorNuevo, observaciones,
                datosAdicionales ? JSON.stringify(datosAdicionales) : null,
                creadoPor, actualizaEmpleado || false, estado || 'pendiente'
            ]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, mensaje: 'Error al crear ticket' });
    }
});

// ===== INICIAR SERVIDOR =====

// Solo iniciar servidor si no está en Vercel (serverless)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        console.log(`📁 Frontend disponible en http://localhost:${PORT}`);
        console.log(`🗄️  Base de datos: PostgreSQL`);
        console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
    });
}

// Exportar para Vercel
module.exports = app;
