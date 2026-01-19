const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

// Crear cliente de Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { usuario, password } = req.body;

        console.log('Intentando login para:', usuario);

        // Buscar usuario con Supabase
        const { data, error } = await supabase
            .from('usuarios')
            .select('id, nombre, username, password, rol')
            .eq('username', usuario)
            .single();

        console.log('Resultado Supabase:', { data: data ? 'encontrado' : 'no encontrado', error: error?.message });

        if (error || !data) {
            console.log('Usuario no encontrado o error:', error?.message);
            return res.status(401).json({ success: false, mensaje: 'Usuario o contraseña incorrectos' });
        }

        // Verificar contraseña
        const match = await bcrypt.compare(password, data.password);

        console.log('Contraseña match:', match);

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

            const rol = data.rol || 'viewer';
            const userPermisos = permisos[rol] || permisos.viewer;

            return res.json({
                success: true,
                usuario: {
                    id: data.id,
                    nombre: data.nombre,
                    username: data.username,
                    rol: rol,
                    permisos: userPermisos
                }
            });
        } else {
            return res.status(401).json({ success: false, mensaje: 'Usuario o contraseña incorrectos' });
        }
    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({ success: false, mensaje: error.message, stack: error.stack });
    }
};
