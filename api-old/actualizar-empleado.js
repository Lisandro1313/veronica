const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: 'ID requerido' });
    }

    try {
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
            .update(empleadoData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return res.json({ success: true, empleado: data });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, mensaje: error.message });
    }
};
