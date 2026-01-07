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
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    nombre_completo VARCHAR(200) NOT NULL,
    dni VARCHAR(20) UNIQUE,
    cuil VARCHAR(20),
    documento VARCHAR(50),
    fecha_nacimiento DATE,
    nacionalidad VARCHAR(50),
    estado_civil VARCHAR(50),
    es_extranjero VARCHAR(2),
    pais_origen VARCHAR(50),
    fecha_entrada_pais DATE,
    tipo_residencia VARCHAR(50),
    
    -- Datos de contacto
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    calle VARCHAR(200),
    numero VARCHAR(20),
    localidad VARCHAR(100),
    ciudad VARCHAR(100),
    provincia VARCHAR(100),
    codigo_postal VARCHAR(10),
    
    -- Datos laborales
    fecha_ingreso DATE,
    puesto VARCHAR(100),
    area VARCHAR(100),
    salario DECIMAL(12,2),
    tipo_contrato VARCHAR(50),
    experiencia_laboral TEXT,
    
    -- Educación
    nivel_educativo VARCHAR(100),
    titulo VARCHAR(200),
    institucion VARCHAR(200),
    escolaridad_familiar TEXT,
    
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
    
    -- Viajes internacionales
    entradas_salidas_pais TEXT,
    
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
-- Sistema de tickets para registrar eventos, cambios y solicitudes de empleados
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER REFERENCES empleados(id) ON DELETE CASCADE,
    
    -- Tipo de ticket con categorías específicas
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN (
        'vacaciones',           -- Vacaciones programadas
        'permiso',              -- Permiso temporal
        'licencia_medica',      -- Licencia por salud
        'licencia_maternidad',  -- Licencia por maternidad/paternidad
        'viaje',                -- Viaje laboral o personal
        'cambio_puesto',        -- Cambio de posición laboral
        'cambio_area',          -- Cambio de departamento
        'cambio_salario',       -- Ajuste salarial
        'suspension',           -- Suspensión temporal
        'desvinculacion',       -- Fin de relación laboral
        'reincorporacion',      -- Regreso después de licencia
        'cambio_personal',      -- Cambios personales (hijo, matrimonio, mudanza)
        'capacitacion',         -- Cursos o formación
        'amonestacion',         -- Amonestación disciplinaria
        'reconocimiento',       -- Premio o reconocimiento
        'otro'                  -- Otros eventos
    )),
    
    -- Información del ticket
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    
    -- Estado del ticket
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN (
        'pendiente',    -- Esperando aprobación
        'aprobado',     -- Aprobado
        'rechazado',    -- Rechazado
        'en_proceso',   -- En proceso
        'completado',   -- Completado
        'cancelado'     -- Cancelado
    )),
    
    -- Fechas del evento
    fecha_evento DATE,          -- Fecha del evento/cambio
    fecha_desde DATE,           -- Inicio del período
    fecha_hasta DATE,           -- Fin del período
    
    -- Información adicional
    observaciones TEXT,
    documento_adjunto TEXT,     -- URL o referencia al documento
    
    -- Datos del cambio (para cambios de puesto, salario, etc.)
    valor_anterior VARCHAR(255),  -- Valor antes del cambio
    valor_nuevo VARCHAR(255),     -- Valor después del cambio
    
    -- Datos flexibles en JSON
    datos_adicionales JSONB,    -- Información extra específica del tipo
    
    -- Aprobación y auditoría
    creado_por INTEGER REFERENCES usuarios(id),
    aprobado_por INTEGER REFERENCES usuarios(id),
    fecha_aprobacion TIMESTAMP,
    
    -- Indica si el ticket actualiza automáticamente datos del empleado
    actualiza_empleado BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para tickets
CREATE INDEX IF NOT EXISTS idx_tickets_empleado ON tickets(empleado_id);
CREATE INDEX IF NOT EXISTS idx_tickets_tipo ON tickets(tipo);
CREATE INDEX IF NOT EXISTS idx_tickets_estado ON tickets(estado);
CREATE INDEX IF NOT EXISTS idx_tickets_fecha_desde ON tickets(fecha_desde);
CREATE INDEX IF NOT EXISTS idx_tickets_creado_por ON tickets(creado_por);

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

-- Vista de historial completo de empleados con tickets
CREATE OR REPLACE VIEW v_historial_empleados AS
SELECT 
    e.id as empleado_id,
    e.nombre || ' ' || e.apellido as empleado_nombre,
    e.dni,
    e.puesto,
    e.area,
    t.id as ticket_id,
    t.tipo as tipo_evento,
    t.titulo,
    t.descripcion,
    t.estado,
    t.fecha_evento,
    t.fecha_desde,
    t.fecha_hasta,
    t.valor_anterior,
    t.valor_nuevo,
    t.created_at as fecha_creacion,
    u1.nombre as creado_por,
    u2.nombre as aprobado_por,
    t.fecha_aprobacion
FROM empleados e
LEFT JOIN tickets t ON e.id = t.empleado_id
LEFT JOIN usuarios u1 ON t.creado_por = u1.id
LEFT JOIN usuarios u2 ON t.aprobado_por = u2.id
ORDER BY e.id, t.created_at DESC;

-- Vista de tickets pendientes con información del empleado
CREATE OR REPLACE VIEW v_tickets_pendientes AS
SELECT 
    t.id,
    t.tipo,
    t.titulo,
    t.estado,
    t.fecha_desde,
    t.fecha_hasta,
    e.nombre || ' ' || e.apellido as empleado,
    e.puesto,
    e.area,
    u.nombre as solicitante,
    t.created_at
FROM tickets t
INNER JOIN empleados e ON t.empleado_id = e.id
LEFT JOIN usuarios u ON t.creado_por = u.id
WHERE t.estado = 'pendiente'
ORDER BY t.created_at ASC;

-- Vista de empleados actualmente de vacaciones o licencia
CREATE OR REPLACE VIEW v_empleados_ausentes AS
SELECT 
    e.id,
    e.nombre || ' ' || e.apellido as empleado,
    e.puesto,
    e.area,
    t.tipo as motivo_ausencia,
    t.fecha_desde,
    t.fecha_hasta,
    CURRENT_DATE - t.fecha_desde as dias_ausente,
    t.fecha_hasta - CURRENT_DATE as dias_restantes
FROM empleados e
INNER JOIN tickets t ON e.id = t.empleado_id
WHERE t.estado = 'aprobado'
  AND t.tipo IN ('vacaciones', 'licencia_medica', 'licencia_maternidad', 'viaje', 'suspension')
  AND t.fecha_desde <= CURRENT_DATE
  AND t.fecha_hasta >= CURRENT_DATE
ORDER BY t.fecha_hasta ASC;

-- ===== COMENTARIOS EN TABLAS =====
COMMENT ON TABLE usuarios IS 'Usuarios del sistema con roles de acceso';
COMMENT ON TABLE empleados IS 'Información completa de empleados';
COMMENT ON TABLE tickets IS 'Historial de eventos, cambios y solicitudes de empleados';

COMMENT ON COLUMN empleados.datos_adicionales IS 'Campo JSONB para datos flexibles adicionales';
COMMENT ON COLUMN empleados.salario IS 'Salario mensual bruto';
COMMENT ON COLUMN tickets.tipo IS 'Tipo de evento: vacaciones, viaje, cambio_puesto, etc.';
COMMENT ON COLUMN tickets.datos_adicionales IS 'Información extra en JSON según el tipo de ticket';
COMMENT ON COLUMN tickets.actualiza_empleado IS 'Si true, el ticket modifica datos del empleado automáticamente';

-- ===== EJEMPLOS DE DATOS =====
-- Descomentar para insertar datos de ejemplo

/*
-- Ejemplo: Empleado de prueba
INSERT INTO empleados (nombre, apellido, dni, email, fecha_ingreso, puesto, area, salario)
VALUES ('Juan', 'Pérez', '12345678', 'juan.perez@empresa.com', '2020-01-15', 'Desarrollador', 'IT', 50000);

-- Ejemplo 1: Ticket de vacaciones
INSERT INTO tickets (empleado_id, tipo, titulo, descripcion, fecha_desde, fecha_hasta, estado, creado_por)
VALUES (1, 'vacaciones', 'Vacaciones de verano', 'Vacaciones programadas para verano', '2026-02-01', '2026-02-15', 'aprobado', 1);

-- Ejemplo 2: Ticket de viaje
INSERT INTO tickets (empleado_id, tipo, titulo, descripcion, fecha_desde, fecha_hasta, estado, creado_por)
VALUES (1, 'viaje', 'Viaje a conferencia en Buenos Aires', 'Asistencia a conferencia de tecnología', '2026-03-10', '2026-03-12', 'aprobado', 1);

-- Ejemplo 3: Cambio de puesto (actualiza empleado)
INSERT INTO tickets (empleado_id, tipo, titulo, descripcion, valor_anterior, valor_nuevo, fecha_evento, estado, actualiza_empleado, creado_por)
VALUES (1, 'cambio_puesto', 'Promoción a Senior Developer', 'Ascenso por buen desempeño', 'Desarrollador', 'Senior Developer', '2026-01-01', 'aprobado', true, 1);

-- Ejemplo 4: Cambio de salario
INSERT INTO tickets (empleado_id, tipo, titulo, descripcion, valor_anterior, valor_nuevo, fecha_evento, estado, actualiza_empleado, creado_por)
VALUES (1, 'cambio_salario', 'Aumento salarial 2026', 'Ajuste por inflación y desempeño', '50000', '60000', '2026-01-01', 'aprobado', true, 1);

-- Ejemplo 5: Cambio personal (tuvo un hijo)
INSERT INTO tickets (empleado_id, tipo, titulo, descripcion, fecha_evento, estado, datos_adicionales, creado_por)
VALUES (1, 'cambio_personal', 'Nacimiento de hijo', 'Nació su primer hijo', '2025-12-15', 'completado', 
        '{"tipo_cambio": "hijo", "nombre_hijo": "Martín Pérez", "actualizar_obra_social": true}'::jsonb, 1);

-- Ejemplo 6: Licencia por paternidad
INSERT INTO tickets (empleado_id, tipo, titulo, descripcion, fecha_desde, fecha_hasta, estado, creado_por)
VALUES (1, 'licencia_maternidad', 'Licencia por paternidad', 'Licencia legal por nacimiento de hijo', '2025-12-15', '2025-12-29', 'completado', 1);

-- Ejemplo 7: Desvinculación
INSERT INTO tickets (empleado_id, tipo, titulo, descripcion, fecha_evento, estado, observaciones, creado_por)
VALUES (2, 'desvinculacion', 'Renuncia voluntaria', 'El empleado presentó renuncia', '2026-02-28', 'aprobado', 'Cumplió preaviso de 30 días', 1);

-- Ejemplo 8: Capacitación
INSERT INTO tickets (empleado_id, tipo, titulo, descripcion, fecha_desde, fecha_hasta, estado, datos_adicionales, creado_por)
VALUES (1, 'capacitacion', 'Curso de React Avanzado', 'Capacitación en framework React', '2026-03-01', '2026-03-05', 'aprobado',
        '{"institucion": "Udemy", "costo": 150, "certificacion": true}'::jsonb, 1);
*/

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
