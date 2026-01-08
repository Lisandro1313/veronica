const { createClient } = require('@supabase/supabase-js');

// Crear cliente de Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('empleados')
                .select('*')
                .order('id', { ascending: false });

            if (error) throw error;
            
            // Los datos ya vienen en el formato correcto, solo devolver
            return res.json(data || []);

        } else if (req.method === 'POST') {
            const d = req.body;

            // Mapear campos usando la estructura REAL de Supabase
            const empleadoData = {
                nombre_completo: d.nombreCompleto || 'Sin Nombre',
                cuil: d.cuil || null,
                fecha_nacimiento: d.fechaNacimiento || null,
                documento: d.documento || null,
                estado_civil: d.estadoCivil || null,
                integracion_familiar: d.integracionFamiliar || null,
                escolaridad_familiar: d.escolaridadFamiliar || null,
                nivel_educativo: d.nivelEducativo || null,
                problemas_salud: d.problemasSalud || null,
                es_extranjero: d.esExtranjero || 'no',
                pais_origen: d.paisOrigen || null,
                fecha_entrada_pais: d.fechaEntradaPais || null,
                tipo_residencia: d.tipoResidencia || null,
                entradas_salidas_pais: d.entradasSalidasPais || null,
                experiencia_laboral: d.experienciaLaboral || null,
                fecha_ingreso: d.fechaIngreso || null,
                puesto: d.puesto || null,
                antecedentes_penales: d.antecedentesPenales || 'no',
                observaciones_antecedentes: d.observacionesAntecedentes || null,
                observaciones: d.observaciones || null
            };

            const { data, error } = await supabase
                .from('empleados')
                .insert([empleadoData])
                .select()
                .single();

            if (error) {
                console.error('ERROR SUPABASE:', JSON.stringify(error, null, 2));
                return res.status(500).json({ 
                    success: false, 
                    mensaje: error.message,
                    code: error.code
                });
            }
            return res.json({ success: true, empleado: data });

        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error en empleados:', error);
        return res.status(500).json({ success: false, mensaje: error.message });
    }
};
