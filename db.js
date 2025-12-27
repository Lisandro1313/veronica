require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// Detectar si usar Supabase o PostgreSQL directo
const useSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_KEY;
const usePg = process.env.DATABASE_URL;

let supabaseClient = null;
let pgPool = null;

// Inicializar Supabase si está configurado
if (useSupabase) {
    console.log('🌐 Iniciando conexión a Supabase...');
    supabaseClient = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_KEY
    );
    console.log('✅ Supabase cliente inicializado');
}

// Inicializar PostgreSQL pool si está configurado
if (usePg) {
    console.log('🐘 Iniciando conexión a PostgreSQL...');
    pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' 
            ? { rejectUnauthorized: false } 
            : false
    });

    pgPool.on('connect', () => {
        console.log('✅ Conectado a PostgreSQL');
    });

    pgPool.on('error', (err) => {
        console.error('❌ Error en PostgreSQL:', err);
    });
}

// Helper function para queries - soporta ambas bases de datos
const query = async (text, params) => {
    const start = Date.now();
    try {
        if (useSupabase) {
            // Convertir query SQL a llamada Supabase RPC si es necesario
            // Para ahora, usaremos la conexión directa mediante el pool de PostgreSQL de Supabase
            const res = await pgPool.query(text, params);
            const duration = Date.now() - start;
            console.log('✅ Query (Supabase) ejecutado', { duration, rows: res.rowCount });
            return res;
        } else if (usePg) {
            const res = await pgPool.query(text, params);
            const duration = Date.now() - start;
            console.log('✅ Query (PostgreSQL) ejecutado', { duration, rows: res.rowCount });
            return res;
        } else {
            throw new Error('No database configured. Set SUPABASE_URL+SUPABASE_KEY or DATABASE_URL');
        }
    } catch (error) {
        console.error('❌ Error en query:', error);
        throw error;
    }
};

// Función para conectarse a la base de datos Supabase
const connectToSupabase = async () => {
    if (!useSupabase) {
        throw new Error('Supabase no está configurado');
    }
    
    // Crear pool desde la URL de Supabase (que es un PostgreSQL)
    const supabaseDbUrl = process.env.SUPABASE_URL.replace('https://', 'postgresql://postgres:') + '/postgres';
    
    pgPool = new Pool({
        connectionString: supabaseDbUrl,
        ssl: { rejectUnauthorized: false }
    });
    
    return pgPool;
};

module.exports = {
    query,
    pool: pgPool || supabaseClient,
    supabaseClient,
    pgPool,
    connectToSupabase
};
