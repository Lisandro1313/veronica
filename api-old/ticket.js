const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: 'ID requerido' });
    }

    try {
        const { data, error } = await supabase
            .from('tickets')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return res.json(data);

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, mensaje: error.message });
    }
};
