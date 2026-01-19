# Script de prueba de endpoints
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  PRUEBA DE ENDPOINTS - Sistema Verapp" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

try {
    # Test 1: GET /api/empleados
    Write-Host "[TEST 1] GET /api/empleados" -ForegroundColor Yellow
    $empleados = Invoke-RestMethod -Uri "http://localhost:3000/api/empleados" -Method GET
    Write-Host "  ✓ Total empleados: $($empleados.Count)" -ForegroundColor Green
    
    if ($empleados.Count -gt 0) {
        $emp = $empleados[0]
        Write-Host "  ✓ Primer empleado:" -ForegroundColor Green
        Write-Host "    - ID: $($emp.id) (Tipo: $($emp.id.GetType().Name))" -ForegroundColor White
        Write-Host "    - Nombre: $($emp.nombreCompleto)" -ForegroundColor White
        Write-Host "    - CUIL: $($emp.cuil)" -ForegroundColor White
        Write-Host "    - Teléfono: $($emp.telefono)" -ForegroundColor White
        Write-Host "    - Provincia: $($emp.provincia)" -ForegroundColor White
        Write-Host "    - Fecha Ingreso: $($emp.fechaIngreso)" -ForegroundColor White
        Write-Host "    - Vivienda: $($emp.vivienda)" -ForegroundColor White
        Write-Host "    - Dirección: $($emp.direccion)" -ForegroundColor White
        Write-Host ""
        
        # Test 2: GET /api/empleados/:id
        Write-Host "[TEST 2] GET /api/empleados/$($emp.id)" -ForegroundColor Yellow
        $empById = Invoke-RestMethod -Uri "http://localhost:3000/api/empleados/$($emp.id)" -Method GET
        Write-Host "  ✓ Empleado obtenido: $($empById.nombreCompleto)" -ForegroundColor Green
        Write-Host "  ✓ ID coincide: $($empById.id -eq $emp.id)" -ForegroundColor Green
        Write-Host ""
        
        # Test 3: Verificar todos los campos están presentes
        Write-Host "[TEST 3] Verificación de campos obligatorios" -ForegroundColor Yellow
        $camposRequeridos = @('id', 'nombreCompleto', 'cuil')
        $todosCamposPresentes = $true
        
        foreach ($campo in $camposRequeridos) {
            if ($null -eq $empById.$campo) {
                Write-Host "  ✗ Campo '$campo' faltante" -ForegroundColor Red
                $todosCamposPresentes = $false
            } else {
                Write-Host "  ✓ Campo '$campo': OK" -ForegroundColor Green
            }
        }
        
        if ($todosCamposPresentes) {
            Write-Host "`n  ✓ TODOS LOS CAMPOS OBLIGATORIOS PRESENTES" -ForegroundColor Green
        }
        Write-Host ""
        
        # Test 4: GET /api/tickets
        Write-Host "[TEST 4] GET /api/tickets" -ForegroundColor Yellow
        $tickets = Invoke-RestMethod -Uri "http://localhost:3000/api/tickets" -Method GET
        Write-Host "  ✓ Total tickets: $($tickets.Count)" -ForegroundColor Green
        Write-Host ""
    }
    
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "  TODAS LAS PRUEBAS COMPLETADAS" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Cyan
    
} catch {
    Write-Host ""
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Asegurate de que el servidor este corriendo en http://localhost:3000" -ForegroundColor Yellow
}
