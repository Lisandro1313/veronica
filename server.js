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
                res.json({
                    success: true,
                    usuario: { id: user.id, nombre: user.nombre, rol: user.rol }
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

// Obtener un empleado específico
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
        const educacionData = data.educacion || {};

        const result = await db.query(
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
            ) RETURNING *`,
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
                JSON.stringify(data.datosAdicionales || null)
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
                educacion = $35, datos_adicionales = $36
            WHERE id = $37 RETURNING *`,
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
        const result = await db.query(
            `SELECT t.*, u1.nombre as creado_por_nombre, u2.nombre as aprobado_por_nombre
             FROM tickets t
             LEFT JOIN usuarios u1 ON t.creado_por = u1.id
             LEFT JOIN usuarios u2 ON t.aprobado_por = u2.id
             WHERE t.empleado_id = $1 
             ORDER BY t.created_at DESC`,
            [req.params.empleadoId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener tickets:', error);
        res.status(500).json({ success: false, mensaje: 'Error al obtener tickets' });
    }
});

// Crear nuevo ticket
app.post('/api/tickets', async (req, res) => {
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
        console.error('Error al crear ticket:', error);
        res.status(500).json({ success: false, mensaje: 'Error al crear ticket', error: error.message });
    }
});

// Obtener todos los tickets
app.get('/api/tickets', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT t.*, e.nombre, e.apellido 
            FROM tickets t 
            LEFT JOIN empleados e ON t.empleado_id = e.id 
            ORDER BY t.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener tickets:', error);
        res.status(500).json({ success: false, mensaje: 'Error al obtener tickets' });
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
app.get('/api/empleados/ausentes', async (req, res) => {
    try {
        const result = await db.query(`SELECT * FROM v_empleados_ausentes`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener empleados ausentes:', error);
        res.status(500).json({ success: false, mensaje: 'Error al obtener empleados ausentes' });
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
        res.status(500).json({ status: 'error', database: 'disconnected' });
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
