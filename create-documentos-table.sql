-- Crear tabla para documentos de empleados
CREATE TABLE IF NOT EXISTS documentos_empleado (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
    empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre_archivo VARCHAR(255) NOT NULL,
    tipo_archivo VARCHAR(100),
    tamano INTEGER,
    contenido_base64 TEXT,
    url_archivo TEXT,
    descripcion TEXT,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subido_por VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejor rendimiento
CREATE INDEX idx_documentos_empleado ON documentos_empleado(empleado_id);
CREATE INDEX idx_documentos_empresa ON documentos_empleado(empresa_id);
