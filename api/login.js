const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Crear pool de conexión
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

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

        const result = await pool.query(
            'SELECT id, nombre, username, password, rol FROM usuarios WHERE username = $1',
            [usuario]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            const match = await bcrypt.compare(password, user.password);

            if (match) {
                return res.json({
                    success: true,
                    usuario: { id: user.id, nombre: user.nombre, rol: user.rol }
                });
            } else {
                return res.status(401).json({ success: false, mensaje: 'Usuario o contraseña incorrectos' });
            }
        } else {
            return res.status(401).json({ success: false, mensaje: 'Usuario o contraseña incorrectos' });
        }
    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({ success: false, mensaje: error.message });
    }
};
