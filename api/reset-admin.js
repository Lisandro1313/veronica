const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Hashear la contraseña "admin123" con bcrypt
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        console.log('Hash generado:', hashedPassword);

        // Actualizar todos los usuarios admin
        const { data, error } = await supabase
            .from('usuarios')
            .update({ password: hashedPassword })
            .eq('username', 'admin')
            .select();

        if (error) {
            console.error('Error al actualizar:', error);
            return res.status(500).json({ success: false, error: error.message });
        }

        console.log('Usuarios actualizados:', data);

        return res.json({ 
            success: true, 
            mensaje: 'Contraseña actualizada',
            hash: hashedPassword,
            usuarios: data.length
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, mensaje: error.message });
    }
};
