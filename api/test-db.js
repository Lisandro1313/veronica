const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    try {
        // Test 1: Verificar conexión
        const { data: testData, error: testError } = await supabase
            .from('empleados')
            .select('*')
            .limit(1);

        if (testError) {
            return res.json({
                success: false,
                error: 'Error al conectar con Supabase',
                detalles: testError,
                mensaje: testError.message,
                hint: testError.hint
            });
        }

        // Test 2: Intentar insertar un registro mínimo
        const { data: insertData, error: insertError } = await supabase
            .from('empleados')
            .insert([{
                nombre: 'TEST PRUEBA',
                dni: 'TEST' + Date.now()
            }])
            .select()
            .single();

        if (insertError) {
            return res.json({
                success: false,
                step: 'insert',
                error: 'Error al insertar',
                detalles: insertError,
                mensaje: insertError.message,
                code: insertError.code,
                hint: insertError.hint,
                details: insertError.details
            });
        }

        // Test 3: Eliminar el registro de prueba
        await supabase
            .from('empleados')
            .delete()
            .eq('id', insertData.id);

        return res.json({
            success: true,
            mensaje: 'Conexión a Supabase exitosa',
            estructura: insertData
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
