module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    try {
        const info = {
            status: 'Function is running',
            timestamp: new Date().toISOString(),
            method: req.method,
            env: {
                DATABASE_URL: !!process.env.DATABASE_URL,
                SUPABASE_URL: !!process.env.SUPABASE_URL,
                SUPABASE_KEY: !!process.env.SUPABASE_KEY,
                NODE_ENV: process.env.NODE_ENV || 'not set'
            }
        };
        
        return res.status(200).json(info);
    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
};
