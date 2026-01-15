-- Script para agregar campos de vivienda a la tabla empleados
-- Fecha: 2026-01-15
-- Descripción: Agrega columnas para vivienda, dirección y número de lote/invernadero

-- Agregar columna de vivienda
ALTER TABLE empleados 
ADD COLUMN IF NOT EXISTS vivienda TEXT;

-- Agregar columna de dirección
ALTER TABLE empleados 
ADD COLUMN IF NOT EXISTS direccion TEXT;

-- Agregar columna de número de lote/invernadero
ALTER TABLE empleados 
ADD COLUMN IF NOT EXISTS numero_lote_invernaculo TEXT;

-- Crear comentarios para documentación
COMMENT ON COLUMN empleados.vivienda IS 'Tipo de vivienda del empleado';
COMMENT ON COLUMN empleados.direccion IS 'Dirección completa del empleado (calle, número, localidad)';
COMMENT ON COLUMN empleados.numero_lote_invernaculo IS 'Número de lote o invernadero asignado';
