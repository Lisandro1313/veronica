Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " PRUEBA DE ENDPOINTS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

try {
    Write-Host "[TEST 1] GET /api/empleados" -ForegroundColor Yellow
    $empleados = Invoke-RestMethod -Uri "http://localhost:3000/api/empleados" -Method GET
    Write-Host "  OK - Total: $($empleados.Count)" -ForegroundColor Green
    
    if ($empleados.Count -gt 0) {
        $emp = $empleados[0]
        Write-Host "  - ID: $($emp.id)" -ForegroundColor White
        Write-Host "  - Nombre: $($emp.nombreCompleto)" -ForegroundColor White
        Write-Host "  - CUIL: $($emp.cuil)" -ForegroundColor White
        Write-Host "  - Telefono: $($emp.telefono)" -ForegroundColor White
        Write-Host "  - Provincia: $($emp.provincia)" -ForegroundColor White
        Write-Host ""
        
        Write-Host "[TEST 2] GET /api/empleados/$($emp.id)" -ForegroundColor Yellow
        $empById = Invoke-RestMethod -Uri "http://localhost:3000/api/empleados/$($emp.id)" -Method GET
        Write-Host "  OK - Obtenido: $($empById.nombreCompleto)" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "[TEST 3] GET /api/tickets" -ForegroundColor Yellow
        $tickets = Invoke-RestMethod -Uri "http://localhost:3000/api/tickets" -Method GET
        Write-Host "  OK - Total tickets: $($tickets.Count)" -ForegroundColor Green
    }
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host " PRUEBAS COMPLETADAS" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan
    
} catch {
    Write-Host "`nERROR: $($_.Exception.Message)`n" -ForegroundColor Red
}
