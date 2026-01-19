-- =====================================================
-- SISTEMA DE USUARIOS Y PERMISOS MULTI-EMPRESA
-- =====================================================

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    rol_global VARCHAR(50) DEFAULT 'usuario', -- 'superadmin', 'admin', 'usuario'
    activo BOOLEAN DEFAULT true,
    debe_cambiar_password BOOLEAN DEFAULT true,
    ultimo_login TIMESTAMP,
    intentos_fallidos INTEGER DEFAULT 0,
    bloqueado_hasta TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación usuarios-empresas (muchos a muchos)
CREATE TABLE IF NOT EXISTS usuarios_empresas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    rol_empresa VARCHAR(50) DEFAULT 'empleado', -- 'admin', 'supervisor', 'empleado'
    permisos JSONB DEFAULT '{}', -- Permisos específicos por empresa
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, empresa_id)
);

-- Tabla de sesiones (opcional, para tracking)
CREATE TABLE IF NOT EXISTS sesiones_usuarios (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    expira_en TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de auditoría de accesos
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

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresas_usuario ON usuarios_empresas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresas_empresa ON usuarios_empresas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_token ON sesiones_usuarios(token);
CREATE INDEX IF NOT EXISTS idx_sesiones_expira ON sesiones_usuarios(expira_en);
CREATE INDEX IF NOT EXISTS idx_log_accesos_usuario ON log_accesos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_log_accesos_fecha ON log_accesos(created_at);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar usuario superadmin por defecto (password: Admin2024!)
-- Hash generado con bcrypt, salt rounds: 10
INSERT INTO usuarios (username, email, password_hash, nombre, rol_global, activo, debe_cambiar_password)
VALUES 
    ('admin', 'admin@verapp.com', '$2b$10$placeholder_hash_will_be_replaced', 'Administrador', 'superadmin', true, false),
    ('demo', 'demo@verapp.com', '$2b$10$placeholder_hash_will_be_replaced', 'Usuario Demo', 'usuario', true, true)
ON CONFLICT (username) DO NOTHING;

-- Comentarios explicativos
COMMENT ON TABLE usuarios IS 'Tabla principal de usuarios del sistema';
COMMENT ON TABLE usuarios_empresas IS 'Relación muchos-a-muchos entre usuarios y empresas con roles específicos';
COMMENT ON TABLE sesiones_usuarios IS 'Tracking de sesiones activas de usuarios';
COMMENT ON TABLE log_accesos IS 'Auditoría de intentos de acceso y acciones de seguridad';

COMMENT ON COLUMN usuarios.rol_global IS 'superadmin: acceso total | admin: administrador | usuario: acceso limitado';
COMMENT ON COLUMN usuarios_empresas.rol_empresa IS 'admin: administrador de empresa | supervisor: puede ver todo | empleado: acceso limitado';
COMMENT ON COLUMN usuarios_empresas.permisos IS 'JSON con permisos granulares: {"ver_empleados": true, "editar_empleados": false, ...}';
