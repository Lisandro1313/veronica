const { Pool } = require('pg');

// Crear pool de conexión
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            const result = await pool.query('SELECT * FROM empleados ORDER BY id DESC');
            return res.json(result.rows);
        } else if (req.method === 'POST') {
            const data = req.body;
            const result = await pool.query(
                `INSERT INTO empleados (
                    nombre_completo, cuil, fecha_nacimiento, documento, estado_civil,
                    integracion_familiar, escolaridad_familiar, nivel_educativo,
                    problemas_salud, es_extranjero, pais_origen, fecha_entrada_pais,
                    tipo_residencia, entradas_salidas_pais, experiencia_laboral,
                    fecha_ingreso, puesto, antecedentes_penales,
                    observaciones_antecedentes, observaciones
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                RETURNING *`,
                [
                    data.nombreCompleto, data.cuil, data.fechaNacimiento, data.documento,
                    data.estadoCivil, data.integracionFamiliar, data.escolaridadFamiliar,
                    data.nivelEducativo, data.problemasSalud, data.esExtranjero,
                    data.paisOrigen, data.fechaEntradaPais, data.tipoResidencia,
                    data.entradasSalidasPais, data.experienciaLaboral, data.fechaIngreso,
                    data.puesto, data.antecedentesPenales, data.observacionesAntecedentes,
                    data.observaciones
                ]
            );
            return res.json({ success: true, empleado: result.rows[0] });
        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error en empleados:', error);
        return res.status(500).json({ success: false, mensaje: error.message });
    }
};
