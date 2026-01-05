module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    try {
        // Verificar variables de entorno
        const envCheck = {
            DATABASE_URL: process.env.DATABASE_URL ? '✅ Configurada' : '❌ NO configurada',
            SUPABASE_URL: process.env.SUPABASE_URL ? '✅ Configurada' : '❌ NO configurada',
            SUPABASE_KEY: process.env.SUPABASE_KEY ? '✅ Configurada' : '❌ NO configurada',
            NODE_ENV: process.env.NODE_ENV || 'not set'
        };
        
        // Intentar conectar a la base de datos
        let dbStatus = 'No probado';
        try {
            const { Pool } = require('pg');
            const pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: { rejectUnauthorized: false }
            });
            
            const result = await pool.query('SELECT NOW()');
            dbStatus = '✅ Conexión exitosa - ' + result.rows[0].now;
            await pool.end();
        } catch (dbError) {
            dbStatus = '❌ Error: ' + dbError.message;
        }
        
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            env: envCheck,
            database: dbStatus
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
            stack: error.stack
        });
    }
};
