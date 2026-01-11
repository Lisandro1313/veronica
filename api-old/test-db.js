const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    try {
        // Test 1: Ver estructura de la tabla - obtener un registro existente
        const { data: testData, error: testError } = await supabase
            .from('empleados')
            .select('*')
            .limit(1);

        if (testError) {
            return res.json({
                success: false,
                error: 'Error al leer tabla empleados',
                detalles: testError,
                mensaje: testError.message
            });
        }

        // Mostrar estructura de la tabla
        if (testData && testData.length > 0) {
            return res.json({
                success: true,
                mensaje: 'Estructura de la tabla empleados',
                columnasExistentes: Object.keys(testData[0]),
                ejemploDatos: testData[0]
            });
        }

        // Si no hay datos, intentar obtener info del schema
        return res.json({
            success: true,
            mensaje: 'Tabla vacía - no se puede determinar estructura',
            nota: 'Necesitas crear al menos un registro manualmente en Supabase para ver las columnas'
        });

    } catch (error) {
        return res.json({
            success: false,
            error: 'Error general',
            mensaje: error.message,
            stack: error.stack
        });
    }
};
