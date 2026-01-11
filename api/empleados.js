const { createClient } = require('@supabase/supabase-js');

// Crear cliente de Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Función para convertir snake_case a camelCase
function toCamelCase(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const camelObj = {};
    for (const key in obj) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        camelObj[camelKey] = obj[key];
    }
    return camelObj;
}

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
            
            // Convertir todos los empleados a camelCase
            const empleadosCamelCase = (data || []).map(emp => toCamelCase(emp));
            return res.json(empleadosCamelCase);

        } else if (req.method === 'POST') {
            const d = req.body;

            // Mapear los campos del frontend a los nombres de la BD
            const empleadoData = {
                nombre_completo: d.nombreCompleto,
                cuil: d.cuil,
                fecha_nacimiento: d.fechaNacimiento || null,
                documento: d.documento || null,
                estado_civil: d.estadoCivil || null,
                
                // Composición Familiar
                tiene_pareja: d.tienePareja === 'si',
                cantidad_hijos: d.cantidadHijos || 0,
                hijos_a_cargo: d.hijosACargo || 0,
                hijos_conviven: d.hijosConviven || 0,
                familiares_a_cargo: d.familiaresACargo || 0,
                escolaridad_familiar: d.escolaridadFamiliar || null,
                
                nivel_educativo: d.nivelEducativo || null,
                problemas_salud: d.problemasSalud || null,
                es_extranjero: d.esExtranjero === 'si',
                pais_origen: d.paisOrigen || null,
                fecha_entrada_pais: d.fechaEntradaPais || null,
                tipo_residencia: d.tipoResidencia || null,
                entradas_salidas_pais: d.entradasSalidasPais || null,
                experiencia_laboral: d.experienciaLaboral || null,
                fecha_ingreso: d.fechaIngreso || null,
                puesto: d.puesto || null,
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
            return res.json({ success: true, data: toCamelCase(data) });

        } else if (req.method === 'PUT') {
            // Extraer ID de la URL (formato: /api/empleados/123)
            const urlParts = req.url.split('/');
            const id = urlParts[urlParts.length - 1];

            if (!id || isNaN(id)) {
                return res.status(400).json({ success: false, mensaje: 'ID inválido' });
            }

            const d = req.body;

            // Mapear los campos del frontend a los nombres de la BD
            const empleadoData = {
                nombre_completo: d.nombreCompleto,
                cuil: d.cuil,
                fecha_nacimiento: d.fechaNacimiento || null,
                documento: d.documento || null,
                estado_civil: d.estadoCivil || null,
                
                // Composición Familiar
                tiene_pareja: d.tienePareja === 'si',
                cantidad_hijos: d.cantidadHijos || 0,
                hijos_a_cargo: d.hijosACargo || 0,
                hijos_conviven: d.hijosConviven || 0,
                familiares_a_cargo: d.familiaresACargo || 0,
                escolaridad_familiar: d.escolaridadFamiliar || null,
                
                nivel_educativo: d.nivelEducativo || null,
                problemas_salud: d.problemasSalud || null,
                es_extranjero: d.esExtranjero === 'si',
                pais_origen: d.paisOrigen || null,
                fecha_entrada_pais: d.fechaEntradaPais || null,
                tipo_residencia: d.tipoResidencia || null,
                entradas_salidas_pais: d.entradasSalidasPais || null,
                experiencia_laboral: d.experienciaLaboral || null,
                fecha_ingreso: d.fechaIngreso || null,
                puesto: d.puesto || null,
                antecedentes_penales: d.antecedentesPenales === 'si',
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
            return res.json({ success: true, data: toCamelCase(data) });

        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error en empleados:', error);
        return res.status(500).json({ success: false, mensaje: error.message });
    }
};
