-- ===== CREAR TABLA EMPRESAS =====
-- Script para agregar soporte multi-empresa al sistema

-- Tabla de empresas
CREATE TABLE IF NOT EXISTS empresas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    logo VARCHAR(500), -- URL o emoji del logo
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar empresa por defecto (migración de datos existentes)
INSERT INTO empresas (nombre, descripcion, logo, activa) 
VALUES ('Mi Empresa', 'Empresa principal', '🏢', true)
ON CONFLICT DO NOTHING;

-- Agregar columna empresa_id a tabla empleados
ALTER TABLE empleados 
ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE;

-- Agregar columna empresa_id a tabla tickets
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE;

-- Agregar columna empresa_id a tabla auditoria
ALTER TABLE auditoria 
ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE;

-- Agregar columna empresa_id a tabla usuarios (para restringir acceso)
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES empresas(id) ON DELETE SET NULL;

-- Actualizar registros existentes con la empresa por defecto (ID 1)
UPDATE empleados SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE tickets SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE auditoria SET empresa_id = 1 WHERE empresa_id IS NULL;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_empleados_empresa ON empleados(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tickets_empresa ON tickets(empresa_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_empresa ON auditoria(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON usuarios(empresa_id);

-- Trigger para actualizar updated_at en empresas
CREATE OR REPLACE FUNCTION update_empresas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_empresas_updated_at
    BEFORE UPDATE ON empresas
    FOR EACH ROW
    EXECUTE FUNCTION update_empresas_updated_at();

-- ===== FIN DEL SCRIPT =====
