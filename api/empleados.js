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
            
            // Transformar datos de BD al formato del frontend
            const empleadosFormateados = (data || []).map(emp => {
                const datosPersonales = typeof emp.datos_personales === 'string' 
                    ? JSON.parse(emp.datos_personales || '{}') 
                    : (emp.datos_personales || {});
                const datosLaborales = typeof emp.datos_laborales === 'string'
                    ? JSON.parse(emp.datos_laborales || '{}')
                    : (emp.datos_laborales || {});
                const datosAdicionales = typeof emp.datos_adicionales === 'string'
                    ? JSON.parse(emp.datos_adicionales || '{}')
                    : (emp.datos_adicionales || {});

                return {
                    id: emp.id,
                    nombreCompleto: datosPersonales.nombreCompleto || `${emp.nombre} ${emp.apellido}`.trim(),
                    cuil: emp.cuit || emp.dni,
                    fechaNacimiento: emp.fecha_nacimiento,
                    documento: emp.dni,
                    estadoCivil: datosPersonales.estadoCivil || '',
                    integracionFamiliar: emp.integracion_familiar || '',
                    escolaridadFamiliar: datosPersonales.escolaridadFamiliar || '',
                    nivelEducativo: emp.nivel_educativo || '',
                    problemasSalud: emp.problemas_salud || '',
                    esExtranjero: emp.es_extranjero || 'no',
                    paisOrigen: emp.pais_origen || '',
                    fechaEntradaPais: datosAdicionales.fechaEntradaPais || '',
                    tipoResidencia: datosAdicionales.tipoResidencia || '',
                    entradasSalidasPais: datosAdicionales.entradasSalidasPais || '',
                    experienciaLaboral: datosLaborales.experienciaLaboral || '',
                    fechaIngreso: emp.fecha_ingreso,
                    puesto: emp.puesto || '',
                    antecedentesPenales: emp.antecedentes_penales || 'no',
                    observacionesAntecedentes: emp.observaciones_antecedentes || '',
                    observaciones: emp.observaciones || '',
                    laboral: {
                        fechaIngreso: emp.fecha_ingreso,
                        puesto: emp.puesto,
                        area: emp.area,
                        salario: emp.salario
                    }
                };
            });
            
            return res.json(empleadosFormateados);

        } else if (req.method === 'POST') {
            const d = req.body;

            // Separar nombre completo en nombre y apellido
            const nombreParts = (d.nombreCompleto || '').trim().split(' ');
            const apellido = nombreParts.length > 1 ? nombreParts.pop() : '';
            const nombre = nombreParts.join(' ') || d.nombreCompleto;

            // Mapear los campos del frontend a los nombres de la BD
            const empleadoData = {
                nombre: nombre || 'Sin Nombre',
                apellido: apellido || 'Sin Apellido',
                dni: d.documento || d.cuil || '',
                cuit: d.cuil || null,
                fecha_nacimiento: d.fechaNacimiento || null,
                es_extranjero: d.esExtranjero || 'no',
                pais_origen: d.paisOrigen || null,
                fecha_ingreso: d.fechaIngreso || null,
                puesto: d.puesto || null,
                nivel_educativo: d.nivelEducativo || null,
                problemas_salud: d.problemasSalud || null,
                antecedentes_penales: d.antecedentesPenales || 'no',
                observaciones_antecedentes: d.observacionesAntecedentes || null,
                integracion_familiar: d.integracionFamiliar || null,
                observaciones: d.observaciones || null,
                // Guardar datos adicionales en JSONB
                datos_personales: JSON.stringify({
                    nombreCompleto: d.nombreCompleto,
                    estadoCivil: d.estadoCivil,
                    escolaridadFamiliar: d.escolaridadFamiliar
                }),
                datos_laborales: JSON.stringify({
                    experienciaLaboral: d.experienciaLaboral
                }),
                datos_adicionales: JSON.stringify({
                    fechaEntradaPais: d.fechaEntradaPais,
                    tipoResidencia: d.tipoResidencia,
                    entradasSalidasPais: d.entradasSalidasPais
                })
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
