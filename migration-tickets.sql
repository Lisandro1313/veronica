-- ============================================
-- MIGRACIÓN: Actualizar tabla tickets
-- Fecha: 2026-01-07
-- Propósito: Agregar columnas faltantes a la tabla tickets
-- ============================================

-- 1. Agregar columna titulo si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' AND column_name = 'titulo'
    ) THEN 
        ALTER TABLE tickets ADD COLUMN titulo VARCHAR(200);
        RAISE NOTICE 'Columna titulo agregada';
    ELSE
        RAISE NOTICE 'Columna titulo ya existe';
    END IF; 
END $$;

-- 2. Agregar columna descripcion si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' AND column_name = 'descripcion'
    ) THEN 
        ALTER TABLE tickets ADD COLUMN descripcion TEXT;
        RAISE NOTICE 'Columna descripcion agregada';
    ELSE
        RAISE NOTICE 'Columna descripcion ya existe';
    END IF; 
END $$;

-- 3. Agregar columna fecha_evento si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' AND column_name = 'fecha_evento'
    ) THEN 
        ALTER TABLE tickets ADD COLUMN fecha_evento DATE;
        RAISE NOTICE 'Columna fecha_evento agregada';
    ELSE
        RAISE NOTICE 'Columna fecha_evento ya existe';
    END IF; 
END $$;

-- 4. Agregar columna fecha_desde si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' AND column_name = 'fecha_desde'
    ) THEN 
        ALTER TABLE tickets ADD COLUMN fecha_desde DATE;
        RAISE NOTICE 'Columna fecha_desde agregada';
    ELSE
        RAISE NOTICE 'Columna fecha_desde ya existe';
    END IF; 
END $$;

-- 5. Agregar columna fecha_hasta si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' AND column_name = 'fecha_hasta'
    ) THEN 
        ALTER TABLE tickets ADD COLUMN fecha_hasta DATE;
        RAISE NOTICE 'Columna fecha_hasta agregada';
    ELSE
        RAISE NOTICE 'Columna fecha_hasta ya existe';
    END IF; 
END $$;

-- 6. Agregar columna observaciones si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' AND column_name = 'observaciones'
    ) THEN 
        ALTER TABLE tickets ADD COLUMN observaciones TEXT;
        RAISE NOTICE 'Columna observaciones agregada';
    ELSE
        RAISE NOTICE 'Columna observaciones ya existe';
    END IF; 
END $$;

-- 7. Agregar columna valor_anterior si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' AND column_name = 'valor_anterior'
    ) THEN 
        ALTER TABLE tickets ADD COLUMN valor_anterior VARCHAR(255);
        RAISE NOTICE 'Columna valor_anterior agregada';
    ELSE
        RAISE NOTICE 'Columna valor_anterior ya existe';
    END IF; 
END $$;

-- 8. Agregar columna valor_nuevo si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' AND column_name = 'valor_nuevo'
    ) THEN 
        ALTER TABLE tickets ADD COLUMN valor_nuevo VARCHAR(255);
        RAISE NOTICE 'Columna valor_nuevo agregada';
    ELSE
        RAISE NOTICE 'Columna valor_nuevo ya existe';
    END IF; 
END $$;

-- 9. Agregar columna datos_adicionales si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' AND column_name = 'datos_adicionales'
    ) THEN 
        ALTER TABLE tickets ADD COLUMN datos_adicionales JSONB;
        RAISE NOTICE 'Columna datos_adicionales agregada';
    ELSE
        RAISE NOTICE 'Columna datos_adicionales ya existe';
    END IF; 
END $$;

-- 10. Agregar columna actualiza_empleado si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' AND column_name = 'actualiza_empleado'
    ) THEN 
        ALTER TABLE tickets ADD COLUMN actualiza_empleado BOOLEAN DEFAULT false;
        RAISE NOTICE 'Columna actualiza_empleado agregada';
    ELSE
        RAISE NOTICE 'Columna actualiza_empleado ya existe';
    END IF; 
END $$;

-- 11. Agregar columna estado si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' AND column_name = 'estado'
    ) THEN 
        ALTER TABLE tickets ADD COLUMN estado VARCHAR(20) DEFAULT 'pendiente';
        RAISE NOTICE 'Columna estado agregada';
    ELSE
        RAISE NOTICE 'Columna estado ya existe';
    END IF; 
END $$;

-- 12. Agregar columna creado_por si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' AND column_name = 'creado_por'
    ) THEN 
        ALTER TABLE tickets ADD COLUMN creado_por INTEGER;
        RAISE NOTICE 'Columna creado_por agregada';
    ELSE
        RAISE NOTICE 'Columna creado_por ya existe';
    END IF; 
END $$;

-- 13. Agregar columna created_at si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' AND column_name = 'created_at'
    ) THEN 
        ALTER TABLE tickets ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Columna created_at agregada';
    ELSE
        RAISE NOTICE 'Columna created_at ya existe';
    END IF; 
END $$;

-- 14. Agregar columna updated_at si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' AND column_name = 'updated_at'
    ) THEN 
        ALTER TABLE tickets ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Columna updated_at agregada';
    ELSE
        RAISE NOTICE 'Columna updated_at ya existe';
    END IF; 
END $$;

-- 15. Verificar estructura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets'
ORDER BY ordinal_position;

-- 16. Mensaje de confirmación
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Migración de tabla tickets completada';
END $$;
