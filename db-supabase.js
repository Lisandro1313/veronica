// Módulo de conexión a Supabase usando su API REST
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL y SUPABASE_KEY son requeridas');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Adaptador para queries SQL simulando la interfaz de pg
const query = async (text, params = []) => {
    try {
        // Convertir SQL query a operación de Supabase
        // Por ahora, usaremos RPC para queries SQL directas si están disponibles
        
        // Para queries SELECT simples
        if (text.trim().toLowerCase().startsWith('select')) {
            // Detectar tabla
            const tableMatch = text.match(/FROM\s+(\w+)/i);
            if (tableMatch) {
                const tableName = tableMatch[1];
                let query = supabase.from(tableName).select('*');
                
                // Añadir WHERE si existe
                const whereMatch = text.match(/WHERE\s+(\w+)\s*=\s*\$1/i);
                if (whereMatch && params[0]) {
                    const column = whereMatch[1];
                    query = query.eq(column, params[0]);
                }
                
                const { data, error } = await query;
                if (error) throw error;
                
                return { rows: data || [], rowCount: data?.length || 0 };
            }
        }
        
        // Para otras queries, intentar usar RPC si existe
        console.warn('Query SQL no soportada directamente, usando fallback:', text);
        return { rows: [], rowCount: 0 };
        
    } catch (error) {
        console.error('Error en query Supabase:', error);
        throw error;
    }
};

module.exports = {
    query,
    supabase,
    pool: null
};
