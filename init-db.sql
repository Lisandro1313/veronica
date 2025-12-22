-- ===== SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS =====
-- Ejecutar este script en Render PostgreSQL después de crear la base de datos

-- ===== TABLA: usuarios =====
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'rrhh', 'manager', 'usuario')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice para búsquedas rápidas por usuario
CREATE INDEX IF NOT EXISTS idx_usuarios_usuario ON usuarios(usuario);

-- ===== TABLA: empleados =====
CREATE TABLE IF NOT EXISTS empleados (
    id SERIAL PRIMARY KEY,
    
    -- Datos personales básicos
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    dni VARCHAR(20) UNIQUE NOT NULL,
    cuit VARCHAR(20),
    fecha_nacimiento DATE,
    nacionalidad VARCHAR(50),
    es_extranjero VARCHAR(2),
    pais_origen VARCHAR(50),
    
    -- Datos de contacto
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    ciudad VARCHAR(100),
    provincia VARCHAR(100),
    codigo_postal VARCHAR(10),
    
    -- Datos laborales
    fecha_ingreso DATE,
    puesto VARCHAR(100),
    area VARCHAR(100),
    salario DECIMAL(12,2),
    tipo_contrato VARCHAR(50),
    
    -- Educación
    nivel_educativo VARCHAR(100),
    titulo VARCHAR(200),
    institucion VARCHAR(200),
    
    -- Contacto de emergencia
    emergencia_nombre VARCHAR(100),
    emergencia_telefono VARCHAR(20),
    emergencia_relacion VARCHAR(50),
    
    -- Salud
    obra_social VARCHAR(100),
    numero_afiliado VARCHAR(50),
    problemas_salud TEXT,
    
    -- Antecedentes
    antecedentes_penales VARCHAR(2),
    observaciones_antecedentes TEXT,
    
    -- Integración familiar
    integracion_familiar TEXT,
    
    -- Observaciones generales
    observaciones TEXT,
    
    -- Datos adicionales (JSONB para flexibilidad)
    datos_personales JSONB,
    datos_laborales JSONB,
    educacion JSONB,
    datos_adicionales JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_empleados_dni ON empleados(dni);
CREATE INDEX IF NOT EXISTS idx_empleados_area ON empleados(area);
CREATE INDEX IF NOT EXISTS idx_empleados_puesto ON empleados(puesto);
CREATE INDEX IF NOT EXISTS idx_empleados_fecha_ingreso ON empleados(fecha_ingreso);

-- ===== TABLA: tickets =====
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER REFERENCES empleados(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'en_proceso')),
    fecha DATE,
    fecha_desde DATE,
    fecha_hasta DATE,
    observaciones TEXT,
    aprobado_por INTEGER REFERENCES usuarios(id),
    fecha_aprobacion TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para tickets
CREATE INDEX IF NOT EXISTS idx_tickets_empleado ON tickets(empleado_id);
CREATE INDEX IF NOT EXISTS idx_tickets_tipo ON tickets(tipo);
CREATE INDEX IF NOT EXISTS idx_tickets_estado ON tickets(estado);

-- ===== DATOS INICIALES =====

-- Insertar usuarios por defecto (solo si no existen)
INSERT INTO usuarios (nombre, usuario, password, rol) 
VALUES 
    ('Administrador', 'admin', 'admin123', 'admin'),
    ('Recursos Humanos', 'rrhh', 'rrhh123', 'rrhh'),
    ('Manager', 'manager', 'manager123', 'manager'),
    ('Usuario', 'usuario', 'usuario123', 'usuario')
ON CONFLICT (usuario) DO NOTHING;

-- ===== FUNCIONES Y TRIGGERS =====

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para usuarios
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON usuarios 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para empleados
DROP TRIGGER IF EXISTS update_empleados_updated_at ON empleados;
CREATE TRIGGER update_empleados_updated_at 
    BEFORE UPDATE ON empleados 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para tickets
DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at 
    BEFORE UPDATE ON tickets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ===== VISTAS ÚTILES =====

-- Vista de empleados con información resumida
CREATE OR REPLACE VIEW v_empleados_resumen AS
SELECT 
    e.id,
    e.nombre,
    e.apellido,
    e.dni,
    e.email,
    e.telefono,
    e.puesto,
    e.area,
    e.fecha_ingreso,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.fecha_ingreso)) as antiguedad_anos,
    e.salario,
    COUNT(t.id) as total_tickets,
    COUNT(CASE WHEN t.estado = 'pendiente' THEN 1 END) as tickets_pendientes
FROM empleados e
LEFT JOIN tickets t ON e.id = t.empleado_id
GROUP BY e.id, e.nombre, e.apellido, e.dni, e.email, e.telefono, 
         e.puesto, e.area, e.fecha_ingreso, e.salario;

-- Vista de estadísticas por área
CREATE OR REPLACE VIEW v_estadisticas_area AS
SELECT 
    area,
    COUNT(*) as total_empleados,
    AVG(salario) as salario_promedio,
    MIN(salario) as salario_minimo,
    MAX(salario) as salario_maximo,
    AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, fecha_ingreso))) as antiguedad_promedio
FROM empleados
WHERE area IS NOT NULL
GROUP BY area
ORDER BY total_empleados DESC;

-- ===== COMENTARIOS EN TABLAS =====
COMMENT ON TABLE usuarios IS 'Usuarios del sistema con roles de acceso';
COMMENT ON TABLE empleados IS 'Información completa de empleados';
COMMENT ON TABLE tickets IS 'Solicitudes y tickets de empleados (vacaciones, permisos, etc.)';

COMMENT ON COLUMN empleados.datos_adicionales IS 'Campo JSONB para datos flexibles adicionales';
COMMENT ON COLUMN empleados.salario IS 'Salario mensual bruto';

-- ===== VERIFICACIÓN =====
-- Ver tablas creadas
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Ver cantidad de registros
SELECT 'usuarios' as tabla, COUNT(*) as registros FROM usuarios
UNION ALL
SELECT 'empleados', COUNT(*) FROM empleados
UNION ALL
SELECT 'tickets', COUNT(*) FROM tickets;

-- ===== FIN DEL SCRIPT =====
-- ✅ Base de datos lista para usar
