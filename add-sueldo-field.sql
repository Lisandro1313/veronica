-- ========================================
-- AGREGAR CAMPO SUELDO A EMPLEADOS
-- ========================================

-- Agregar campo sueldo si no existe
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS sueldo NUMERIC(10, 2);

-- Copiar datos de 'salario' a 'sueldo' SOLO si la columna 'salario' existe
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'empleados' 
        AND column_name = 'salario'
    ) THEN
        UPDATE empleados 
        SET sueldo = salario 
        WHERE sueldo IS NULL AND salario IS NOT NULL;
        RAISE NOTICE 'Datos copiados de salario a sueldo';
    ELSE
        RAISE NOTICE 'La columna salario no existe, no se copian datos';
    END IF;
END $$;

-- Crear índice para reportes y análisis
CREATE INDEX IF NOT EXISTS idx_empleados_sueldo ON empleados(sueldo);

-- Verificación - Mostrar información de la columna sueldo
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'empleados'
AND column_name = 'sueldo';

-- ========================================
-- FIN DEL SCRIPT
-- ========================================
