require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db'); // Usar db.js con Supabase

// Secret para JWT (en producción debe estar en variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'verapp-secret-key-change-in-production';

const app = express();
const PORT = process.env.PORT || 3000;

// Función para convertir snake_case a camelCase
function toCamelCase(obj) {
    if (!obj || typeof obj !== 'object') return obj;

    const camelObj = {};
    for (const key in obj) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        let value = obj[key];

        // Convertir booleanos a 'si'/'no' para tiene_pareja
        if (key === 'tiene_pareja') {
            value = value ? 'si' : 'no';
        }

        camelObj[camelKey] = value;
    }
    return camelObj;
}

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

        // Buscar usuario
        const result = await db.query(
            `SELECT id, nombre, username, password_hash, rol_global, activo, 
                    debe_cambiar_password, intentos_fallidos, bloqueado_hasta 
             FROM usuarios WHERE username = $1`,
            [usuario]
        );

        if (result.rows.length === 0) {
            // Log de intento fallido
            await db.query(
                'INSERT INTO log_accesos (username, accion, ip_address) VALUES ($1, $2, $3)',
                [usuario, 'login_fallido', req.ip]
            );
            return res.status(401).json({ success: false, mensaje: 'Usuario o contraseña incorrectos' });
        }

        const user = result.rows[0];

        // Verificar si está bloqueado
        if (user.bloqueado_hasta && new Date(user.bloqueado_hasta) > new Date()) {
            const minutosRestantes = Math.ceil((new Date(user.bloqueado_hasta) - new Date()) / 60000);
            return res.status(403).json({
                success: false,
                mensaje: `Usuario bloqueado. Intente nuevamente en ${minutosRestantes} minutos`
            });
        }

        // Verificar si está activo
        if (!user.activo) {
            return res.status(403).json({
                success: false,
                mensaje: 'Usuario desactivado. Contacte al administrador'
            });
        }

        // Verificar contraseña
        const match = await bcryptjs.compare(password, user.password_hash);

        if (!match) {
            // Incrementar intentos fallidos
            const nuevoIntentos = (user.intentos_fallidos || 0) + 1;
            let bloqueadoHasta = null;

            // Bloquear después de 5 intentos fallidos
            if (nuevoIntentos >= 5) {
                bloqueadoHasta = new Date(Date.now() + 15 * 60000); // 15 minutos
                await db.query(
                    'UPDATE usuarios SET intentos_fallidos = $1, bloqueado_hasta = $2 WHERE id = $3',
                    [nuevoIntentos, bloqueadoHasta, user.id]
                );
            } else {
                await db.query(
                    'UPDATE usuarios SET intentos_fallidos = $1 WHERE id = $2',
                    [nuevoIntentos, user.id]
                );
            }

            // Log
            await db.query(
                'INSERT INTO log_accesos (usuario_id, username, accion, ip_address) VALUES ($1, $2, $3, $4)',
                [user.id, usuario, 'login_fallido', req.ip]
            );

            return res.status(401).json({
                success: false,
                mensaje: bloqueadoHasta
                    ? 'Demasiados intentos fallidos. Usuario bloqueado por 15 minutos'
                    : 'Usuario o contraseña incorrectos'
            });
        }

        // Login exitoso - resetear intentos fallidos
        await db.query(
            'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        // Obtener empresas asignadas con permisos
        const empresasResult = await db.query(`
            SELECT 
                e.id, e.nombre, e.descripcion, e.logo,
                ue.rol_empresa, ue.permisos
            FROM usuarios_empresas ue
            JOIN empresas e ON e.id = ue.empresa_id
            WHERE ue.usuario_id = $1
            ORDER BY e.nombre
        `, [user.id]);

        // Definir permisos globales según rol
        const permisosGlobales = {
            superadmin: {
                empleados: { crear: true, editar: true, eliminar: true, ver: true },
                usuarios: { crear: true, editar: true, eliminar: true, ver: true },
                tickets: { crear: true, editar: true, eliminar: true, ver: true },
                empresas: { crear: true, editar: true, eliminar: true, ver: true },
                exportar: { pdf: true, excel: true },
                reportes: { ver: true, avanzados: true },
                alertas: { ver: true, configurar: true }
            },
            admin: {
                empleados: { crear: true, editar: true, eliminar: true, ver: true },
                usuarios: { crear: true, editar: true, eliminar: false, ver: true },
                tickets: { crear: true, editar: true, eliminar: false, ver: true },
                empresas: { crear: false, editar: true, eliminar: false, ver: true },
                exportar: { pdf: true, excel: true },
                reportes: { ver: true, avanzados: true },
                alertas: { ver: true, configurar: false }
            },
            usuario: {
                empleados: { crear: false, editar: false, eliminar: false, ver: true },
                usuarios: { crear: false, editar: false, eliminar: false, ver: false },
                tickets: { crear: true, editar: true, eliminar: false, ver: true },
                empresas: { crear: false, editar: false, eliminar: false, ver: true },
                exportar: { pdf: true, excel: false },
                reportes: { ver: true, avanzados: false },
                alertas: { ver: true, configurar: false }
            }
        };

        const rol = user.rol_global || 'usuario';
        const userPermisos = permisosGlobales[rol] || permisosGlobales.usuario;

        // Generar token JWT (opcional)
        const token = jwt.sign(
            { id: user.id, username: user.username, rol: rol },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        // Guardar sesión
        await db.query(
            'INSERT INTO sesiones_usuarios (usuario_id, token, ip_address, user_agent, expira_en) VALUES ($1, $2, $3, $4, $5)',
            [user.id, token, req.ip, req.headers['user-agent'], new Date(Date.now() + 8 * 3600000)]
        );

        // Log de acceso exitoso
        await db.query(
            'INSERT INTO log_accesos (usuario_id, username, accion, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
            [user.id, usuario, 'login_exitoso', req.ip, req.headers['user-agent']]
        );

        res.json({
            success: true,
            usuario: {
                id: user.id,
                nombre: user.nombre,
                username: user.username,
                rol: rol,
                permisos: userPermisos,
                debe_cambiar_password: user.debe_cambiar_password,
                empresas: empresasResult.rows
            },
            token: token
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ success: false, mensaje: 'Error en el servidor' });
    }
});

// ===== RUTAS DE EMPLEADOS =====

// Obtener todos los empleados
app.get('/api/empleados', async (req, res) => {
    try {
        const empresaId = req.query.empresa_id || req.headers['x-empresa-id'];
        let query = 'SELECT * FROM empleados';
        let params = [];

        if (empresaId) {
            query += ' WHERE empresa_id = $1';
            params.push(empresaId);
        }

        query += ' ORDER BY id DESC';
        const result = await db.query(query, params);
        const empleadosCamelCase = result.rows.map(emp => toCamelCase(emp));
        res.json(empleadosCamelCase);
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
            res.json(toCamelCase(result.rows[0]));
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
        const empresaId = data.empresa_id || req.headers['x-empresa-id'] || 1; // Default a empresa 1

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
                calle, numero, localidad, observaciones, sueldo, empresa_id
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
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
                toNullIfEmpty(data.sueldo || datosLaborales.sueldo),
                empresaId
            ]
        );

        res.json({ success: true, data: toCamelCase(result.rows[0]) });
    } catch (error) {
        console.error('Error al crear empleado:', error);
        res.status(500).json({ success: false, mensaje: 'Error al crear empleado', error: error.message });
    }
});

// Actualizar empleado
app.put('/api/empleados/:id', async (req, res) => {
    try {
        const d = req.body;

        const result = await db.query(
            `UPDATE empleados SET
                nombre_completo = $1,
                cuil = $2,
                fecha_nacimiento = $3,
                documento = $4,
                estado_civil = $5,
                tiene_pareja = $6,
                cantidad_hijos = $7,
                hijos_a_cargo = $8,
                hijos_conviven = $9,
                familiares_a_cargo = $10,
                escolaridad_familiar = $11,
                vivienda = $12,
                direccion = $13,
                provincia = $14,
                telefono = $15,
                numero_lote_invernaculo = $16,
                nivel_educativo = $17,
                problemas_salud = $18,
                es_extranjero = $19,
                pais_origen = $20,
                fecha_entrada_pais = $21,
                tipo_residencia = $22,
                entradas_salidas_pais = $23,
                experiencia_laboral = $24,
                fecha_ingreso = $25,
                puesto = $26,
                sueldo = $27,
                antecedentes_penales = $28,
                observaciones_antecedentes = $29,
                observaciones = $30
            WHERE id = $31 RETURNING *`,
            [
                d.nombreCompleto,
                d.cuil,
                d.fechaNacimiento || null,
                d.documento || null,
                d.estadoCivil || null,
                d.tienePareja === 'si',
                d.cantidadHijos || 0,
                d.hijosACargo || 0,
                d.hijosConviven || 0,
                d.familiaresACargo || 0,
                d.escolaridadFamiliar || null,
                d.vivienda || null,
                d.direccion || null,
                d.provincia || null,
                d.telefono || null,
                d.numeroLoteInvernaculo || null,
                d.nivelEducativo || null,
                d.problemasSalud || null,
                d.esExtranjero || 'no',
                d.paisOrigen || null,
                d.fechaEntradaPais || null,
                d.tipoResidencia || null,
                d.entradasSalidasPais || null,
                d.experienciaLaboral || null,
                d.fechaIngreso || null,
                d.puesto || null,
                (d.sueldo || d.salario) ? parseFloat(d.sueldo || d.salario) : null,
                d.antecedentesPenales || 'no',
                d.observacionesAntecedentes || null,
                d.observaciones || null,
                req.params.id
            ]
        );

        if (result.rows.length > 0) {
            res.json({ success: true, data: toCamelCase(result.rows[0]) });
        } else {
            res.status(404).json({ success: false, mensaje: 'Empleado no encontrado' });
        }
    } catch (error) {
        console.error('Error al actualizar empleado:', error);
        res.status(500).json({ success: false, mensaje: 'Error al actualizar empleado', error: error.message });
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

// ===== RUTAS DE EMPRESAS =====

// Obtener todas las empresas activas
app.get('/api/empresas', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM empresas WHERE activa = true ORDER BY id ASC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener empresas:', error);
        res.status(500).json({ success: false, mensaje: 'Error al obtener empresas' });
    }
});

// Crear nueva empresa
app.post('/api/empresas', async (req, res) => {
    try {
        const { nombre, descripcion, logo } = req.body;

        const result = await db.query(
            'INSERT INTO empresas (nombre, descripcion, logo) VALUES ($1, $2, $3) RETURNING *',
            [nombre, descripcion || '', logo || '🏢']
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error al crear empresa:', error);
        res.status(500).json({ success: false, mensaje: 'Error al crear empresa' });
    }
});

// Actualizar empresa
app.put('/api/empresas', async (req, res) => {
    try {
        const { id, nombre, descripcion, logo } = req.body;

        const result = await db.query(
            'UPDATE empresas SET nombre = $1, descripcion = $2, logo = $3 WHERE id = $4 RETURNING *',
            [nombre, descripcion, logo, id]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error al actualizar empresa:', error);
        res.status(500).json({ success: false, mensaje: 'Error al actualizar empresa' });
    }
});

// Eliminar empresa (soft delete)
app.delete('/api/empresas', async (req, res) => {
    try {
        const { id } = req.body;

        await db.query(
            'UPDATE empresas SET activa = false WHERE id = $1',
            [id]
        );

        res.json({ success: true, mensaje: 'Empresa eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar empresa:', error);
        res.status(500).json({ success: false, mensaje: 'Error al eliminar empresa' });
    }
});

// ===== RUTAS DE DOCUMENTOS EMPLEADOS =====

// Obtener documentos de un empleado
app.get('/api/empleados/:empleadoId/documentos', async (req, res) => {
    try {
        const { empleadoId } = req.params;
        const result = await db.query(
            'SELECT id, nombre_archivo, tipo_archivo, tamano, descripcion, fecha_subida, subido_por FROM documentos_empleado WHERE empleado_id = $1 ORDER BY fecha_subida DESC',
            [empleadoId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener documentos:', error);
        res.status(500).json({ success: false, mensaje: 'Error al obtener documentos' });
    }
});

// Subir documento
app.post('/api/empleados/:empleadoId/documentos', async (req, res) => {
    try {
        const { empleadoId } = req.params;
        const { nombre_archivo, tipo_archivo, tamano, contenido_base64, descripcion, subido_por, empresa_id } = req.body;

        const result = await db.query(
            'INSERT INTO documentos_empleado (empleado_id, empresa_id, nombre_archivo, tipo_archivo, tamano, contenido_base64, descripcion, subido_por) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [empleadoId, empresa_id, nombre_archivo, tipo_archivo, tamano, contenido_base64, descripcion, subido_por]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error al subir documento:', error);
        res.status(500).json({ success: false, mensaje: 'Error al subir documento' });
    }
});

// Descargar documento
app.get('/api/documentos/:documentoId', async (req, res) => {
    try {
        const { documentoId } = req.params;
        const result = await db.query(
            'SELECT * FROM documentos_empleado WHERE id = $1',
            [documentoId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, mensaje: 'Documento no encontrado' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error al descargar documento:', error);
        res.status(500).json({ success: false, mensaje: 'Error al descargar documento' });
    }
});

// Eliminar documento
app.delete('/api/documentos/:documentoId', async (req, res) => {
    try {
        const { documentoId } = req.params;
        await db.query('DELETE FROM documentos_empleado WHERE id = $1', [documentoId]);
        res.json({ success: true, mensaje: 'Documento eliminado' });
    } catch (error) {
        console.error('Error al eliminar documento:', error);
        res.status(500).json({ success: false, mensaje: 'Error al eliminar documento' });
    }
});

// ===== RUTAS DE TICKETS =====

// Obtener tickets de un empleado
app.get('/api/tickets/:empleadoId', async (req, res) => {
    try {
        console.log('📋 Obteniendo tickets para empleado:', req.params.empleadoId);

        // Primero intentar sin JOIN para ver si el problema está ahí
        const result = await db.query(
            `SELECT t.* 
             FROM tickets t
             WHERE t.empleado_id = $1 
             ORDER BY t.created_at DESC`,
            [req.params.empleadoId]
        );

        // Agregar nombres de usuarios después si hay tickets
        if (result.rows && result.rows.length > 0) {
            // Intentar obtener nombres de usuarios si existen
            for (let ticket of result.rows) {
                try {
                    if (ticket.creado_por) {
                        const userResult = await db.query(
                            'SELECT COALESCE(nombre, username) as nombre FROM usuarios WHERE id = $1',
                            [ticket.creado_por]
                        );
                        ticket.creado_por_nombre = userResult.rows[0]?.nombre || 'Sistema';
                    }
                    if (ticket.aprobado_por) {
                        const userResult = await db.query(
                            'SELECT COALESCE(nombre, username) as nombre FROM usuarios WHERE id = $1',
                            [ticket.aprobado_por]
                        );
                        ticket.aprobado_por_nombre = userResult.rows[0]?.nombre || '';
                    }
                } catch (userError) {
                    console.log('⚠️ No se pudo obtener nombre de usuario:', userError.message);
                    ticket.creado_por_nombre = 'Sistema';
                    ticket.aprobado_por_nombre = '';
                }
            }
        }

        console.log('✅ Tickets encontrados:', result.rows.length);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error al obtener tickets:', error);
        console.error('❌ Stack:', error.stack);
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

        const empresaId = req.body.empresa_id || req.headers['x-empresa-id'] || 1;

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
                datos_adicionales, creado_por, actualiza_empleado, estado, empresa_id
             ) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
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
                estado || 'pendiente',
                empresaId
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
        const empresaId = req.query.empresa_id || req.headers['x-empresa-id'];

        let query = `
            SELECT t.*, e.nombre_completo as nombre_completo
            FROM tickets t 
            LEFT JOIN empleados e ON t.empleado_id = e.id`;
        let params = [];

        if (empresaId) {
            query += ' WHERE t.empresa_id = $1';
            params.push(empresaId);
        }

        query += ' ORDER BY t.created_at DESC';

        const result = await db.query(query, params);
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

// ===== RUTAS DE AUDITORÍA =====

// Obtener log de auditoría
app.get('/api/auditoria', async (req, res) => {
    try {
        // Crear tabla si no existe
        await db.query(`
            CREATE TABLE IF NOT EXISTS auditoria (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER,
                usuario_nombre VARCHAR(100),
                accion VARCHAR(50) NOT NULL,
                tipo VARCHAR(50) NOT NULL,
                descripcion TEXT NOT NULL,
                entidad VARCHAR(50),
                entidad_id INTEGER,
                datos_antes JSONB,
                datos_despues JSONB,
                ip_address VARCHAR(50),
                user_agent TEXT,
                empresa_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        const { usuario, accion, fecha, limite } = req.query;
        const empresaId = req.query.empresa_id || req.headers['x-empresa-id'];

        let query = 'SELECT * FROM auditoria WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (empresaId) {
            query += ` AND empresa_id = $${paramCount}`;
            params.push(empresaId);
            paramCount++;
        }

        if (usuario) {
            query += ` AND usuario_id = $${paramCount}`;
            params.push(usuario);
            paramCount++;
        }

        if (accion) {
            query += ` AND accion = $${paramCount}`;
            params.push(accion);
            paramCount++;
        }

        if (fecha) {
            query += ` AND DATE(created_at) = $${paramCount}`;
            params.push(fecha);
            paramCount++;
        }

        query += ' ORDER BY created_at DESC';

        if (limite) {
            query += ` LIMIT $${paramCount}`;
            params.push(parseInt(limite));
        } else {
            query += ' LIMIT 100';
        }

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener auditoría:', error);
        res.status(500).json({ success: false, mensaje: 'Error al obtener auditoría' });
    }
});

// Crear registro de auditoría
app.post('/api/auditoria', async (req, res) => {
    try {
        const {
            usuarioId, usuarioNombre, accion, tipo, descripcion,
            entidad, entidadId, datosAntes, datosDespues
        } = req.body;

        const empresaId = req.body.empresa_id || req.headers['x-empresa-id'] || 1;

        const result = await db.query(
            `INSERT INTO auditoria (
                usuario_id, usuario_nombre, accion, tipo, descripcion,
                entidad, entidad_id, datos_antes, datos_despues, empresa_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [
                usuarioId, usuarioNombre, accion, tipo, descripcion,
                entidad, entidadId,
                datosAntes ? JSON.stringify(datosAntes) : null,
                datosDespues ? JSON.stringify(datosDespues) : null,
                empresaId
            ]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error al crear registro de auditoría:', error);
        res.status(500).json({ success: false, mensaje: 'Error al crear registro de auditoría' });
    }
});

// ===== GESTIÓN DE USUARIOS Y PERMISOS =====

// Listar todos los usuarios (solo superadmin/admin)
app.get('/api/usuarios', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                u.id, u.username, u.email, u.nombre, u.rol_global, 
                u.activo, u.debe_cambiar_password, u.ultimo_login, 
                u.created_at,
                COUNT(DISTINCT ue.empresa_id) as empresas_asignadas
            FROM usuarios u
            LEFT JOIN usuarios_empresas ue ON u.id = ue.usuario_id
            GROUP BY u.id
            ORDER BY u.id
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ success: false, mensaje: 'Error al obtener usuarios' });
    }
});

// Obtener un usuario específico con sus empresas y permisos
app.get('/api/usuarios/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Datos del usuario
        const usuario = await db.query(
            'SELECT id, username, email, nombre, rol_global, activo, debe_cambiar_password, ultimo_login, created_at FROM usuarios WHERE id = $1',
            [id]
        );

        if (usuario.rows.length === 0) {
            return res.status(404).json({ success: false, mensaje: 'Usuario no encontrado' });
        }

        // Empresas asignadas con roles y permisos
        const empresas = await db.query(`
            SELECT 
                ue.id as relacion_id,
                e.id, e.nombre, e.descripcion,
                ue.rol_empresa, ue.permisos
            FROM usuarios_empresas ue
            JOIN empresas e ON e.id = ue.empresa_id
            WHERE ue.usuario_id = $1
            ORDER BY e.nombre
        `, [id]);

        res.json({
            success: true,
            data: {
                ...usuario.rows[0],
                empresas: empresas.rows
            }
        });
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ success: false, mensaje: 'Error al obtener usuario' });
    }
});

// Crear nuevo usuario
app.post('/api/usuarios', async (req, res) => {
    try {
        const { username, email, nombre, password, rol_global, empresas } = req.body;

        // Validar campos requeridos
        if (!username || !email || !nombre || !password) {
            return res.status(400).json({
                success: false,
                mensaje: 'Faltan campos requeridos'
            });
        }

        // Verificar si el usuario ya existe
        const existente = await db.query(
            'SELECT id FROM usuarios WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existente.rows.length > 0) {
            return res.status(400).json({
                success: false,
                mensaje: 'El usuario o email ya existe'
            });
        }

        // Hash de contraseña
        const password_hash = await bcryptjs.hash(password, 10);

        // Crear usuario
        const result = await db.query(
            `INSERT INTO usuarios (username, email, nombre, password, password_hash, rol, rol_global, activo, debe_cambiar_password) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, true, true) 
             RETURNING id, username, email, nombre, rol_global, activo`,
            [username, email, nombre, password_hash, password_hash, rol_global || 'usuario', rol_global || 'usuario']
        );

        const nuevoUsuario = result.rows[0];

        // Asignar empresas si se proporcionaron
        if (empresas && Array.isArray(empresas) && empresas.length > 0) {
            for (const emp of empresas) {
                await db.query(
                    `INSERT INTO usuarios_empresas (usuario_id, empresa_id, rol_empresa, permisos) 
                     VALUES ($1, $2, $3, $4)`,
                    [nuevoUsuario.id, emp.empresa_id, emp.rol_empresa || 'empleado', emp.permisos || {}]
                );
            }
        }

        // Log de auditoría
        await db.query(
            'INSERT INTO log_accesos (usuario_id, username, accion, detalles) VALUES ($1, $2, $3, $4)',
            [nuevoUsuario.id, username, 'usuario_creado', JSON.stringify({ por: 'admin' })]
        );

        res.json({ success: true, data: nuevoUsuario });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ success: false, mensaje: 'Error al crear usuario' });
    }
});

// Actualizar usuario
app.put('/api/usuarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, rol_global, activo, debe_cambiar_password } = req.body;

        const result = await db.query(
            `UPDATE usuarios 
             SET nombre = $1, email = $2, rol_global = $3, rol = $3, activo = $4, debe_cambiar_password = $5
             WHERE id = $6 
             RETURNING id, username, email, nombre, rol_global, activo`,
            [nombre, email, rol_global, activo, debe_cambiar_password, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, mensaje: 'Usuario no encontrado' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ success: false, mensaje: 'Error al actualizar usuario' });
    }
});

// Eliminar usuario
app.delete('/api/usuarios/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // No permitir eliminar usuario con id 1 (superadmin principal)
        if (id == 1) {
            return res.status(403).json({
                success: false,
                mensaje: 'No se puede eliminar el superadministrador principal'
            });
        }

        await db.query('DELETE FROM usuarios WHERE id = $1', [id]);
        res.json({ success: true, mensaje: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ success: false, mensaje: 'Error al eliminar usuario' });
    }
});

// Asignar/actualizar empresas de un usuario
app.post('/api/usuarios/:id/empresas', async (req, res) => {
    try {
        const { id } = req.params;
        const { empresas } = req.body; // Array de { empresa_id, rol_empresa, permisos }

        // Eliminar asignaciones actuales
        await db.query('DELETE FROM usuarios_empresas WHERE usuario_id = $1', [id]);

        // Insertar nuevas asignaciones
        for (const emp of empresas) {
            await db.query(
                `INSERT INTO usuarios_empresas (usuario_id, empresa_id, rol_empresa, permisos) 
                 VALUES ($1, $2, $3, $4)`,
                [id, emp.empresa_id, emp.rol_empresa || 'empleado', emp.permisos || {}]
            );
        }

        res.json({ success: true, mensaje: 'Empresas asignadas correctamente' });
    } catch (error) {
        console.error('Error al asignar empresas:', error);
        res.status(500).json({ success: false, mensaje: 'Error al asignar empresas' });
    }
});

// Cambiar contraseña
app.post('/api/usuarios/:id/cambiar-password', async (req, res) => {
    try {
        const { id } = req.params;
        const { password_actual, password_nueva } = req.body;

        if (!password_nueva || password_nueva.length < 6) {
            return res.status(400).json({
                success: false,
                mensaje: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Si hay password_actual, verificar que sea correcta
        if (password_actual) {
            const usuario = await db.query('SELECT password_hash FROM usuarios WHERE id = $1', [id]);
            const esCorrecta = await bcryptjs.compare(password_actual, usuario.rows[0].password_hash);

            if (!esCorrecta) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'La contraseña actual es incorrecta'
                });
            }
        }

        const password_hash = await bcryptjs.hash(password_nueva, 10);

        await db.query(
            'UPDATE usuarios SET password = $1, password_hash = $1, debe_cambiar_password = false WHERE id = $2',
            [password_hash, id]
        );

        // Log
        await db.query(
            'INSERT INTO log_accesos (usuario_id, accion) VALUES ($1, $2)',
            [id, 'cambio_password']
        );

        res.json({ success: true, mensaje: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({ success: false, mensaje: 'Error al cambiar contraseña' });
    }
});

// Obtener empresas disponibles para un usuario
app.get('/api/usuarios/:id/empresas-disponibles', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(`
            SELECT 
                e.id, e.nombre, e.descripcion,
                CASE WHEN ue.id IS NOT NULL THEN true ELSE false END as asignada,
                ue.rol_empresa, ue.permisos
            FROM empresas e
            LEFT JOIN usuarios_empresas ue ON e.id = ue.empresa_id AND ue.usuario_id = $1
            ORDER BY e.nombre
        `, [id]);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error al obtener empresas disponibles:', error);
        res.status(500).json({ success: false, mensaje: 'Error al obtener empresas' });
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
