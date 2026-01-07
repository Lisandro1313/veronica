-- ========================================
-- SCRIPT DE MIGRACIÓN DE SCHEMA
-- Sistema RRHH - Actualización de campos
-- ========================================
-- EJECUTAR ESTE SCRIPT EN SUPABASE SQL EDITOR
-- ========================================

-- ===== 1. AGREGAR NUEVOS CAMPOS =====

-- Datos personales adicionales
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS documento VARCHAR(50);
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS estado_civil VARCHAR(50);
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS nombre_completo VARCHAR(200);

-- Datos migratorios (extranjeros)
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS fecha_entrada_pais DATE;
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS tipo_residencia VARCHAR(50);

-- Dirección detallada
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS calle VARCHAR(200);
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS numero VARCHAR(20);
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS localidad VARCHAR(100);

-- Información adicional
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS experiencia_laboral TEXT;
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS escolaridad_familiar TEXT;
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS entradas_salidas_pais TEXT;

-- ===== 2. CAMBIAR CUIT A CUIL (si existe) =====
-- En Argentina el término correcto es CUIL (Código Único de Identificación Laboral)
-- Comentar estas líneas si ya existe como 'cuil'

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'empleados' 
        AND column_name = 'cuit'
    ) THEN
        ALTER TABLE empleados RENAME COLUMN cuit TO cuil;
        RAISE NOTICE 'Columna cuit renombrada a cuil correctamente';
    ELSE
        RAISE NOTICE 'La columna cuil ya existe, no se requiere cambio';
    END IF;
END $$;

-- ===== 3. ACTUALIZAR CONSTRAINTS (solo si las columnas existen) =====
DO $$ 
BEGIN
    -- Hacer nombre opcional si existe
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'empleados' AND column_name = 'nombre') THEN
        ALTER TABLE empleados ALTER COLUMN nombre DROP NOT NULL;
    END IF;
    
    -- Hacer apellido opcional si existe
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'empleados' AND column_name = 'apellido') THEN
        ALTER TABLE empleados ALTER COLUMN apellido DROP NOT NULL;
    END IF;
    
    -- Hacer DNI opcional si existe
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'empleados' AND column_name = 'dni') THEN
        ALTER TABLE empleados ALTER COLUMN dni DROP NOT NULL;
    END IF;
END $$;

-- ===== 4. MIGRAR DATOS EXISTENTES (solo si las columnas existen) =====
DO $$ 
BEGIN
    -- Si existen nombre y apellido pero no nombre_completo, crear nombre_completo
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'empleados' AND column_name = 'nombre')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'empleados' AND column_name = 'apellido')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'empleados' AND column_name = 'nombre_completo') THEN
        
        UPDATE empleados 
        SET nombre_completo = COALESCE(
            CASE 
                WHEN nombre IS NOT NULL AND apellido IS NOT NULL THEN CONCAT(nombre, ' ', apellido)
                WHEN nombre IS NOT NULL THEN nombre
                WHEN apellido IS NOT NULL THEN apellido
                ELSE 'Sin Nombre'
            END,
            'Sin Nombre'
        )
        WHERE nombre_completo IS NULL;
        
        RAISE NOTICE 'Datos migrados de nombre+apellido a nombre_completo';
    ELSE
        RAISE NOTICE 'No se requiere migración de datos (columnas nombre/apellido no existen o nombre_completo ya tiene datos)';
    END IF;
END $$;

-- ===== 5. HACER nombre_completo OBLIGATORIO (si existe) =====
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'empleados' AND column_name = 'nombre_completo') THEN
        ALTER TABLE empleados ALTER COLUMN nombre_completo SET NOT NULL;
        RAISE NOTICE 'Campo nombre_completo configurado como NOT NULL';
    END IF;
END $$;

-- ===== 6. AGREGAR ÍNDICES PARA PERFORMANCE =====

CREATE INDEX IF NOT EXISTS idx_empleados_nombre_completo ON empleados(nombre_completo);
CREATE INDEX IF NOT EXISTS idx_empleados_estado_civil ON empleados(estado_civil);
CREATE INDEX IF NOT EXISTS idx_empleados_localidad ON empleados(localidad);
CREATE INDEX IF NOT EXISTS idx_empleados_cuil ON empleados(cuil);

-- ===== 7. VERIFICACIÓN =====
-- Consulta para verificar que todo está correcto

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'empleados'
ORDER BY ordinal_position;

-- ===== 8. CONTAR EMPLEADOS CON DATOS =====

SELECT 
    COUNT(*) as total_empleados,
    COUNT(nombre_completo) as con_nombre_completo,
    COUNT(cuil) as con_cuil,
    COUNT(documento) as con_documento,
    COUNT(telefono) as con_telefono,
    COUNT(email) as con_email
FROM empleados;

-- ========================================
-- FIN DEL SCRIPT DE MIGRACIÓN
-- ========================================

-- NOTAS:
-- 1. Este script es idempotente (se puede ejecutar múltiples veces)
-- 2. Usa IF NOT EXISTS para evitar errores si las columnas ya existen
-- 3. Preserva los datos existentes durante la migración
-- 4. Agrega índices para mejorar el rendimiento de las consultas
