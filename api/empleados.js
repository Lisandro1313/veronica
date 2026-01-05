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
            return res.json(data || []);

        } else if (req.method === 'POST') {
            const d = req.body;

            // Mapear los campos del frontend a los nombres de la BD
            const empleadoData = {
                nombre_completo: d.nombreCompleto,
                cuil: d.cuil,
                fecha_nacimiento: d.fechaNacimiento,
                documento: d.documento,
                estado_civil: d.estadoCivil,
                integracion_familiar: d.integracionFamiliar,
                escolaridad_familiar: d.escolaridadFamiliar,
                nivel_educativo: d.nivelEducativo,
                problemas_salud: d.problemasSalud,
                es_extranjero: d.esExtranjero === 'si',
                pais_origen: d.paisOrigen || null,
                fecha_entrada_pais: d.fechaEntradaPais || null,
                tipo_residencia: d.tipoResidencia || null,
                entradas_salidas_pais: d.entradasSalidasPais || null,
                experiencia_laboral: d.experienciaLaboral,
                fecha_ingreso: d.fechaIngreso,
                puesto: d.puesto,
                antecedentes_penales: d.antecedentesPenales === 'si',
                observaciones_antecedentes: d.observacionesAntecedentes || null,
                observaciones: d.observaciones || null
            };

            const { data, error } = await supabase
                .from('empleados')
                .insert([empleadoData])
                .select()
                .single();

            if (error) throw error;
            return res.json({ success: true, empleado: data });

        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error en empleados:', error);
        return res.status(500).json({ success: false, mensaje: error.message });
    }
};
