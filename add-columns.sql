-- Script para agregar columnas faltantes en la tabla empleados
-- Ejecutar en Supabase SQL Editor

-- Agregar columnas de composición familiar
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS tiene_pareja BOOLEAN DEFAULT false;
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS cantidad_hijos INTEGER DEFAULT 0;
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS hijos_a_cargo INTEGER DEFAULT 0;
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS hijos_conviven INTEGER DEFAULT 0;
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS familiares_a_cargo INTEGER DEFAULT 0;

-- Verificar que todas las columnas existan
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'empleados'
ORDER BY ordinal_position;
