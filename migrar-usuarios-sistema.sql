-- =====================================================
-- MIGRACIÓN: Mejorar sistema de usuarios existente
-- =====================================================

-- 1. Agregar nuevas columnas a tabla usuarios existente
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS rol_global VARCHAR(50),
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS debe_cambiar_password BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ultimo_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS intentos_fallidos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 2. Migrar datos existentes
UPDATE usuarios SET 
    email = COALESCE(email, username || '@verapp.com'),
    password_hash = COALESCE(password_hash, password),
    rol_global = COALESCE(rol_global, rol),
    activo = COALESCE(activo, true),
    debe_cambiar_password = COALESCE(debe_cambiar_password, false)
WHERE email IS NULL OR password_hash IS NULL OR rol_global IS NULL;

-- 3. Crear constraint único para email (ignorar duplicados)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_email_key') THEN
        ALTER TABLE usuarios ADD CONSTRAINT usuarios_email_key UNIQUE (email);
    END IF;
END $$;

-- 4. Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);

-- 5. Crear tabla usuarios_empresas (relación muchos a muchos)
CREATE TABLE IF NOT EXISTS usuarios_empresas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    rol_empresa VARCHAR(50) DEFAULT 'empleado', -- 'admin', 'supervisor', 'empleado'
    permisos JSONB DEFAULT '{"ver_empleados": true, "editar_empleados": false, "ver_tickets": true, "editar_tickets": false, "ver_reportes": true}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, empresa_id)
);

-- 6. Crear tabla de sesiones
CREATE TABLE IF NOT EXISTS sesiones_usuarios (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    expira_en TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Crear tabla de log de accesos
CREATE TABLE IF NOT EXISTS log_accesos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    username VARCHAR(100),
    accion VARCHAR(100) NOT NULL, -- 'login_exitoso', 'login_fallido', 'logout', 'cambio_password'
    ip_address VARCHAR(50),
    user_agent TEXT,
    detalles JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_empresas_usuario ON usuarios_empresas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresas_empresa ON usuarios_empresas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_token ON sesiones_usuarios(token);
CREATE INDEX IF NOT EXISTS idx_sesiones_expira ON sesiones_usuarios(expira_en);
CREATE INDEX IF NOT EXISTS idx_log_accesos_usuario ON log_accesos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_log_accesos_fecha ON log_accesos(created_at);
CREATE INDEX IF NOT EXISTS idx_log_accesos_accion ON log_accesos(accion);

-- 9. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Asignar todos los usuarios actuales a todas las empresas existentes (temporal)
-- Esto permite que mantengan acceso hasta que se configure manualmente
INSERT INTO usuarios_empresas (usuario_id, empresa_id, rol_empresa, permisos)
SELECT 
    u.id, 
    e.id,
    CASE 
        WHEN u.rol_global = 'superadmin' THEN 'admin'
        WHEN u.rol_global = 'admin' THEN 'admin'
        ELSE 'supervisor'
    END,
    CASE 
        WHEN u.rol_global IN ('superadmin', 'admin') THEN 
            '{"ver_empleados": true, "editar_empleados": true, "eliminar_empleados": true, "ver_tickets": true, "editar_tickets": true, "eliminar_tickets": true, "ver_reportes": true, "ver_auditoria": true}'::jsonb
        ELSE 
            '{"ver_empleados": true, "editar_empleados": true, "ver_tickets": true, "editar_tickets": true, "ver_reportes": true}'::jsonb
    END
FROM usuarios u
CROSS JOIN empresas e
WHERE NOT EXISTS (
    SELECT 1 FROM usuarios_empresas ue 
    WHERE ue.usuario_id = u.id AND ue.empresa_id = e.id
);

-- Comentarios
COMMENT ON TABLE usuarios_empresas IS 'Relación muchos-a-muchos: un usuario puede acceder a múltiples empresas';
COMMENT ON TABLE sesiones_usuarios IS 'Tracking de sesiones activas de usuarios';
COMMENT ON TABLE log_accesos IS 'Auditoría de intentos de acceso y acciones de seguridad';
COMMENT ON COLUMN usuarios_empresas.permisos IS 'JSON con permisos granulares por empresa';
