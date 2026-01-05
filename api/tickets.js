const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .order('id', { ascending: false });

            if (error) throw error;
            return res.json(data || []);

        } else if (req.method === 'POST') {
            const d = req.body;
            
            const ticketData = {
                empleado_id: d.empleadoId,
                tipo: d.tipo,
                prioridad: d.prioridad,
                descripcion: d.descripcion,
                estado: d.estado || 'pendiente',
                fecha_creacion: new Date().toISOString(),
                creado_por: d.creadoPor || 'admin'
            };

            const { data, error } = await supabase
                .from('tickets')
                .insert([ticketData])
                .select()
                .single();

            if (error) throw error;
            return res.json({ success: true, ticket: data });

        } else if (req.method === 'PUT') {
            const id = req.url.split('/').pop();
            const d = req.body;
            
            const updateData = {
                estado: d.estado,
                notas: d.notas
            };

            const { data, error } = await supabase
                .from('tickets')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return res.json({ success: true, ticket: data });

        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error en tickets:', error);
        return res.status(500).json({ success: false, mensaje: error.message });
    }
};
