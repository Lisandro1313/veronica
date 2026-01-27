const { createClient } = require('@supabase/supabase-js');

// Crear cliente de Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // GET - Obtener todas las empresas activas
        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('empresas')
                .select('*')
                .eq('activo', true)
                .order('nombre', { ascending: true });

            if (error) throw error;

            return res.json(data || []);
        }

        // POST - Crear nueva empresa
        if (req.method === 'POST') {
            const { nombre, descripcion, logo } = req.body;

            if (!nombre) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'El nombre de la empresa es obligatorio'
                });
            }

            const { data, error } = await supabase
                .from('empresas')
                .insert([{
                    nombre,
                    descripcion: descripcion || null,
                    logo: logo || '🏢',
                    activo: true
                }])
                .select()
                .single();

            if (error) throw error;

            return res.json({
                success: true,
                mensaje: 'Empresa creada correctamente',
                empresa: data
            });
        }

        // PUT - Actualizar empresa
        if (req.method === 'PUT') {
            const { id, nombre, descripcion, logo, activo } = req.body;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'ID de empresa es requerido'
                });
            }

            const updateData = {};
            if (nombre !== undefined) updateData.nombre = nombre;
            if (descripcion !== undefined) updateData.descripcion = descripcion;
            if (logo !== undefined) updateData.logo = logo;
            if (activo !== undefined) updateData.activo = activo;

            const { data, error } = await supabase
                .from('empresas')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return res.json({
                success: true,
                mensaje: 'Empresa actualizada correctamente',
                empresa: data
            });
        }

        // DELETE - Eliminar (desactivar) empresa
        if (req.method === 'DELETE') {
            const id = req.query.id || req.body.id;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'ID de empresa es requerido'
                });
            }

            // En lugar de eliminar, desactivamos la empresa
            const { data, error } = await supabase
                .from('empresas')
                .update({ activo: false })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return res.json({
                success: true,
                mensaje: 'Empresa eliminada correctamente'
            });
        }

        return res.status(405).json({
            success: false,
            mensaje: 'Método no permitido'
        });

    } catch (error) {
        console.error('Error en API empresas:', error);
        return res.status(500).json({
            success: false,
            mensaje: 'Error en el servidor',
            error: error.message
        });
    }
};
