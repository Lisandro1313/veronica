# 🎫 Sistema de Tickets - Historial de Empleados

## 📋 Descripción

El sistema de tickets permite registrar **eventos, cambios y solicitudes** relacionadas con los empleados. Cada ticket representa un evento en la vida laboral de la persona.

## 🎯 Tipos de Tickets

### 1. **Vacaciones** (`vacaciones`)

Registra períodos de vacaciones programadas

```javascript
{
  tipo: "vacaciones",
  titulo: "Vacaciones de verano",
  descripcion: "Vacaciones anuales",
  fechaDesde: "2026-02-01",
  fechaHasta: "2026-02-15",
  estado: "aprobado"
}
```

### 2. **Viaje** (`viaje`)

Registra viajes laborales o personales que afectan la disponibilidad

```javascript
{
  tipo: "viaje",
  titulo: "Conferencia en Buenos Aires",
  descripcion: "Asistencia a evento tecnológico",
  fechaDesde: "2026-03-10",
  fechaHasta: "2026-03-12",
  datosAdicionales: {
    destino: "Buenos Aires",
    proposito: "Capacitación"
  }
}
```

### 3. **Cambio de Puesto** (`cambio_puesto`)

Registra promociones o cambios de posición laboral

```javascript
{
  tipo: "cambio_puesto",
  titulo: "Promoción a Senior Developer",
  valorAnterior: "Desarrollador",
  valorNuevo: "Senior Developer",
  fechaEvento: "2026-01-01",
  actualizaEmpleado: true  // Actualiza automáticamente el empleado
}
```

### 4. **Cambio de Área** (`cambio_area`)

Registra traslados entre departamentos

```javascript
{
  tipo: "cambio_area",
  titulo: "Traslado a IT",
  valorAnterior: "Ventas",
  valorNuevo: "IT",
  fechaEvento: "2026-02-01",
  actualizaEmpleado: true
}
```

### 5. **Cambio de Salario** (`cambio_salario`)

Registra ajustes salariales

```javascript
{
  tipo: "cambio_salario",
  titulo: "Aumento anual 2026",
  valorAnterior: "50000",
  valorNuevo: "60000",
  fechaEvento: "2026-01-01",
  observaciones: "Ajuste por inflación y desempeño",
  actualizaEmpleado: true
}
```

### 6. **Desvinculación** (`desvinculacion`)

Registra fin de relación laboral

```javascript
{
  tipo: "desvinculacion",
  titulo: "Renuncia voluntaria",
  descripcion: "El empleado presentó renuncia",
  fechaEvento: "2026-02-28",
  observaciones: "Cumplió preaviso de 30 días"
}
```

### 7. **Cambio Personal** (`cambio_personal`)

Registra eventos personales importantes (hijos, matrimonio, mudanza)

```javascript
{
  tipo: "cambio_personal",
  titulo: "Nacimiento de hijo",
  fechaEvento: "2025-12-15",
  datosAdicionales: {
    tipoCambio: "hijo",
    nombreHijo: "Martín Pérez",
    actualizarObraSocial: true
  }
}
```

### 8. **Licencia Médica** (`licencia_medica`)

Registra ausencias por problemas de salud

```javascript
{
  tipo: "licencia_medica",
  titulo: "Licencia por cirugía",
  fechaDesde: "2026-03-01",
  fechaHasta: "2026-03-15",
  observaciones: "Presenta certificado médico"
}
```

### 9. **Licencia Maternidad/Paternidad** (`licencia_maternidad`)

Registra licencias por nacimiento o adopción

```javascript
{
  tipo: "licencia_maternidad",
  titulo: "Licencia por paternidad",
  fechaDesde: "2025-12-15",
  fechaHasta: "2025-12-29",
  descripcion: "Licencia legal por nacimiento de hijo"
}
```

### 10. **Capacitación** (`capacitacion`)

Registra cursos, formación o certificaciones

```javascript
{
  tipo: "capacitacion",
  titulo: "Curso de React Avanzado",
  fechaDesde: "2026-03-01",
  fechaHasta: "2026-03-05",
  datosAdicionales: {
    institucion: "Udemy",
    costo: 150,
    certificacion: true
  }
}
```

### 11. **Reconocimiento** (`reconocimiento`)

Registra premios, menciones o logros

```javascript
{
  tipo: "reconocimiento",
  titulo: "Empleado del mes",
  fechaEvento: "2026-01-31",
  descripcion: "Reconocimiento por desempeño excepcional"
}
```

### 12. **Otros tipos:**

- `permiso` - Permisos temporales
- `suspension` - Suspensión temporal
- `reincorporacion` - Regreso después de licencia
- `amonestacion` - Amonestación disciplinaria
- `otro` - Otros eventos no categorizados

## 🔄 Estados del Ticket

| Estado       | Descripción                       |
| ------------ | --------------------------------- |
| `pendiente`  | Esperando aprobación              |
| `aprobado`   | Aprobado por autoridad competente |
| `rechazado`  | Rechazado                         |
| `en_proceso` | En proceso de gestión             |
| `completado` | Completado exitosamente           |
| `cancelado`  | Cancelado                         |

## 🔧 Campos del Ticket

```javascript
{
  id: 1,                          // ID único
  empleado_id: 5,                 // ID del empleado
  tipo: "vacaciones",             // Tipo de ticket (ver lista arriba)
  titulo: "Vacaciones de verano", // Título descriptivo
  descripcion: "...",             // Descripción detallada
  estado: "pendiente",            // Estado actual

  // Fechas
  fecha_evento: "2026-01-15",     // Fecha del evento puntual
  fecha_desde: "2026-02-01",      // Inicio del período
  fecha_hasta: "2026-02-15",      // Fin del período

  // Para cambios (puesto, salario, área)
  valor_anterior: "Desarrollador", // Valor antes del cambio
  valor_nuevo: "Senior Dev",       // Valor después del cambio

  // Información adicional
  observaciones: "...",            // Observaciones generales
  documento_adjunto: "url/path",   // Referencia a documento
  datos_adicionales: {},           // JSON con info específica

  // Flags
  actualiza_empleado: true,        // Si actualiza datos del empleado

  // Auditoría
  creado_por: 1,                   // Usuario que creó el ticket
  aprobado_por: 2,                 // Usuario que aprobó
  fecha_aprobacion: "2026-01-20",  // Fecha de aprobación
  created_at: "2026-01-15",        // Fecha de creación
  updated_at: "2026-01-20"         // Última actualización
}
```

## 📊 Vistas y Consultas Útiles

### Ver empleados ausentes hoy

```sql
SELECT * FROM v_empleados_ausentes;
```

### Ver historial completo de un empleado

```sql
SELECT * FROM v_historial_empleados WHERE empleado_id = 5;
```

### Ver tickets pendientes de aprobación

```sql
SELECT * FROM v_tickets_pendientes;
```

### Estadísticas de tickets por tipo

```sql
SELECT tipo, COUNT(*) as total,
       COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes
FROM tickets
GROUP BY tipo;
```

## 🚀 API Endpoints

### Crear ticket

```http
POST /api/tickets
Content-Type: application/json

{
  "empleadoId": 5,
  "tipo": "vacaciones",
  "titulo": "Vacaciones de verano",
  "descripcion": "Vacaciones anuales",
  "fechaDesde": "2026-02-01",
  "fechaHasta": "2026-02-15",
  "creadoPor": 1,
  "estado": "pendiente"
}
```

### Obtener tickets de un empleado

```http
GET /api/tickets/5
```

### Obtener todos los tickets

```http
GET /api/tickets
GET /api/tickets?tipo=vacaciones
GET /api/tickets?estado=pendiente
```

### Actualizar ticket (aprobar/rechazar)

```http
PUT /api/tickets/1
Content-Type: application/json

{
  "estado": "aprobado",
  "aprobadoPor": 2,
  "observaciones": "Aprobado"
}
```

### Eliminar ticket

```http
DELETE /api/tickets/1
```

### Obtener empleados ausentes

```http
GET /api/empleados/ausentes
```

### Obtener historial completo

```http
GET /api/empleados/5/historial
```

## 🔄 Actualización Automática

Cuando un ticket tiene `actualiza_empleado: true` y es **aprobado**, el sistema actualiza automáticamente los datos del empleado:

- **cambio_puesto**: Actualiza el campo `puesto`
- **cambio_area**: Actualiza el campo `area`
- **cambio_salario**: Actualiza el campo `salario`

### Ejemplo de flujo:

1. Se crea ticket de cambio de salario (pendiente)
2. Manager aprueba el ticket
3. Sistema actualiza automáticamente el salario del empleado
4. Se mantiene historial del cambio en el ticket

## 💡 Casos de Uso

### Caso 1: Empleado solicita vacaciones

```javascript
// 1. Crear ticket
await fetch("/api/tickets", {
  method: "POST",
  body: JSON.stringify({
    empleadoId: 5,
    tipo: "vacaciones",
    titulo: "Vacaciones de verano",
    fechaDesde: "2026-02-01",
    fechaHasta: "2026-02-15",
    creadoPor: 5,
    estado: "pendiente",
  }),
});

// 2. Manager aprueba
await fetch("/api/tickets/123", {
  method: "PUT",
  body: JSON.stringify({
    estado: "aprobado",
    aprobadoPor: 2,
  }),
});
```

### Caso 2: Registrar que empleado tuvo un hijo

```javascript
await fetch("/api/tickets", {
  method: "POST",
  body: JSON.stringify({
    empleadoId: 5,
    tipo: "cambio_personal",
    titulo: "Nacimiento de hijo",
    descripcion: "Nació su segundo hijo",
    fechaEvento: "2026-01-15",
    datosAdicionales: {
      tipoCambio: "hijo",
      nombreHijo: "María Pérez",
      actualizarObraSocial: true,
    },
    creadoPor: 1,
    estado: "completado",
  }),
});
```

### Caso 3: Promoción con aumento

```javascript
// 1. Cambio de puesto
await fetch("/api/tickets", {
  method: "POST",
  body: JSON.stringify({
    empleadoId: 5,
    tipo: "cambio_puesto",
    titulo: "Promoción a Team Lead",
    valorAnterior: "Senior Developer",
    valorNuevo: "Team Lead",
    fechaEvento: "2026-02-01",
    actualizaEmpleado: true,
    creadoPor: 1,
    estado: "aprobado",
  }),
});

// 2. Cambio de salario
await fetch("/api/tickets", {
  method: "POST",
  body: JSON.stringify({
    empleadoId: 5,
    tipo: "cambio_salario",
    titulo: "Aumento por promoción",
    valorAnterior: "60000",
    valorNuevo: "75000",
    fechaEvento: "2026-02-01",
    actualizaEmpleado: true,
    creadoPor: 1,
    estado: "aprobado",
  }),
});
```

## 🎨 Integración Frontend

Próximamente se agregará interfaz visual para:

- ✅ Ver historial de empleado en timeline
- ✅ Crear nuevos tickets desde el perfil
- ✅ Dashboard de tickets pendientes
- ✅ Lista de empleados ausentes hoy
- ✅ Filtros por tipo y estado
- ✅ Aprobación/rechazo rápido

## 📝 Notas

- Los tickets mantienen **historial completo** de todos los eventos
- Campos JSONB permiten **flexibilidad** para datos específicos
- Vistas SQL facilitan **consultas frecuentes**
- Sistema de **aprobación** con auditoría
- **Actualización automática** opcional de datos del empleado
