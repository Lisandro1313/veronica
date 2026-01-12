-- ========================================
-- CREAR VISTA DE EMPLEADOS AUSENTES
-- ========================================

-- Vista de empleados actualmente de vacaciones o licencia
CREATE OR REPLACE VIEW v_empleados_ausentes AS
SELECT 
    e.id,
    e.nombre_completo as empleado,
    e.puesto,
    t.tipo as motivo_ausencia,
    t.fecha_desde,
    t.fecha_hasta,
    CURRENT_DATE - t.fecha_desde as dias_ausente,
    t.fecha_hasta - CURRENT_DATE as dias_restantes
FROM empleados e
INNER JOIN tickets t ON t.empleado_id = e.id
WHERE t.estado = 'aprobado'
  AND t.fecha_desde <= CURRENT_DATE
  AND t.fecha_hasta >= CURRENT_DATE
  AND t.tipo IN ('vacaciones', 'licencia', 'enfermedad');

-- Verificación
SELECT * FROM v_empleados_ausentes;

-- ========================================
-- FIN DEL SCRIPT
-- ========================================
