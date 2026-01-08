-- ========================================
-- CREAR TABLA DE AUDITORÍA
-- ========================================

CREATE TABLE IF NOT EXISTS auditoria (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    usuario_nombre VARCHAR(100),
    accion VARCHAR(50) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    descripcion TEXT NOT NULL,
    entidad VARCHAR(50),
    entidad_id INTEGER,
    datos_antes JSONB,
    datos_despues JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_id ON auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_accion ON auditoria(accion);
CREATE INDEX IF NOT EXISTS idx_auditoria_tipo ON auditoria(tipo);
CREATE INDEX IF NOT EXISTS idx_auditoria_created_at ON auditoria(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidad ON auditoria(entidad, entidad_id);

-- Insertar datos de ejemplo
INSERT INTO auditoria (usuario_id, usuario_nombre, accion, tipo, descripcion, entidad, entidad_id) VALUES
(1, 'Admin', 'crear', 'empleado', 'Creó el empleado "Juan Pérez"', 'empleados', 1),
(1, 'Admin', 'crear', 'ticket', 'Creó ticket de vacaciones para "Juan Pérez"', 'tickets', 1),
(1, 'Admin', 'aprobar', 'ticket', 'Aprobó ticket de vacaciones #1', 'tickets', 1),
(1, 'Admin', 'editar', 'empleado', 'Editó datos del empleado "Juan Pérez"', 'empleados', 1);

-- Verificación
SELECT * FROM auditoria ORDER BY created_at DESC LIMIT 10;

-- ========================================
-- FIN DEL SCRIPT
-- ========================================
