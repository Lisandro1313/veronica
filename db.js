require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_URL y SUPABASE_SERVICE_KEY son requeridas');
}

const rpcUrl = `${supabaseUrl}/rest/v1/rpc/execute_sql_query`;
const headers = {
    'Content-Type': 'application/json',
    'apikey': supabaseServiceKey,
    'Authorization': `Bearer ${supabaseServiceKey}`
};

console.log('✅ Supabase HTTP client inicializado');

const query = async (text, params) => {
    const start = Date.now();
    try {
        const sql_params = (params || []).map(p =>
            (p === null || p === undefined) ? null : String(p)
        );

        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({ sql_query: text, sql_params })
        });

        const data = await response.json();

        if (!response.ok || data.code) {
            throw new Error(data.message || data.error || JSON.stringify(data));
        }

        const duration = Date.now() - start;
        console.log('✅ Query ejecutado', { duration, rows: data?.rowCount ?? 0 });

        return {
            rows: data?.rows ?? [],
            rowCount: data?.rowCount ?? 0
        };
    } catch (error) {
        console.error('❌ Error en query:', error.message || error);
        throw error;
    }
};

module.exports = {
    query,
    pool: null,
    supabaseClient: null
};
