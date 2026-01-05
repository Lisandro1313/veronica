const { createClient } = require('@supabase/supabase-js');

// Crear cliente de Supabase
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
                .from('empleados')
                .select('*')
                .order('id', { ascending: false });

            if (error) throw error;
            return res.json(data || []);

        } else if (req.method === 'POST') {
            const empleadoData = req.body;
            
            const { data, error } = await supabase
                .from('empleados')
                .insert([empleadoData])
                .select()
                .single();

            if (error) throw error;
            return res.json({ success: true, empleado: data });

        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error en empleados:', error);
        return res.status(500).json({ success: false, mensaje: error.message });
    }
};
