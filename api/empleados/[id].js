const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { id } = req.query;

    try {
        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('empleados')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return res.json(data);

        } else if (req.method === 'DELETE') {
            const { error } = await supabase
                .from('empleados')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return res.json({ success: true });

        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, mensaje: error.message });
    }
};
