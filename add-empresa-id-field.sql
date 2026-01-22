-- ========================================
-- AGREGAR CAMPO empresa_id A LA TABLA empleados
-- ========================================
-- Ejecutar este script en Supabase SQL Editor
-- ========================================

-- 1. Agregar campo empresa_id con referencia a la tabla empresas
ALTER TABLE empleados 
ADD COLUMN IF NOT EXISTS empresa_id INTEGER;

-- 2. Crear índice para mejorar performance en búsquedas
CREATE INDEX IF NOT EXISTS idx_empleados_empresa_id ON empleados(empresa_id);

-- 3. Agregar foreign key si la tabla empresas existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'empresas') THEN
        ALTER TABLE empleados 
        ADD CONSTRAINT fk_empleados_empresa 
        FOREIGN KEY (empresa_id) 
        REFERENCES empresas(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Foreign key agregada correctamente';
    ELSE
        RAISE NOTICE 'Tabla empresas no existe - foreign key no agregada';
    END IF;
END $$;

-- 4. Verificación
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'empleados' AND column_name = 'empresa_id';

-- ========================================
-- TABLA EMPRESAS (si no existe)
-- ========================================
-- Si la tabla empresas no existe, ejecutar esto primero:

CREATE TABLE IF NOT EXISTS empresas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    razon_social VARCHAR(200),
    cuit VARCHAR(20),
    direccion TEXT,
    telefono VARCHAR(50),
    email VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agregar columna activo si no existe (para tablas empresas existentes)
ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;

-- Agregar columnas de timestamp si no existen
ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Índices para empresas
CREATE INDEX IF NOT EXISTS idx_empresas_nombre ON empresas(nombre);
CREATE INDEX IF NOT EXISTS idx_empresas_activo ON empresas(activo);

-- Actualizar registros existentes sin valor de activo
UPDATE empresas SET activo = TRUE WHERE activo IS NULL;

-- Agregar empresa por defecto si no hay ninguna (solo con campos que existen)
DO $$
BEGIN
    -- Verificar si razon_social existe para decidir qué insertar
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'empresas' AND column_name = 'razon_social') THEN
        -- Insertar con razon_social
        INSERT INTO empresas (nombre, razon_social, activo)
        SELECT 'NAIRDA', 'NAIRDA S.A.', TRUE
        WHERE NOT EXISTS (SELECT 1 FROM empresas WHERE nombre = 'NAIRDA');
    ELSE
        -- Insertar sin razon_social
        INSERT INTO empresas (nombre, activo)
        SELECT 'NAIRDA', TRUE
        WHERE NOT EXISTS (SELECT 1 FROM empresas WHERE nombre = 'NAIRDA');
    END IF;
END $$;

-- ========================================
-- ACTUALIZAR USUARIOS PARA RELACIONAR CON EMPRESAS
-- ========================================
-- Los usuarios también pueden tener una empresa asociada

ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS empresa_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_id ON usuarios(empresa_id);

-- Agregar foreign key
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'empresas') THEN
        ALTER TABLE usuarios 
        ADD CONSTRAINT fk_usuarios_empresa 
        FOREIGN KEY (empresa_id) 
        REFERENCES empresas(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Foreign key para usuarios agregada correctamente';
    END IF;
END $$;

-- ========================================
-- FIN DEL SCRIPT
-- ========================================
