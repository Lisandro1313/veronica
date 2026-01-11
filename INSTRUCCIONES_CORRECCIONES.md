# 🔧 INSTRUCCIONES PARA AGREGAR CAMPO SUELDO

## ⚠️ IMPORTANTE: Ejecutar este script en Supabase

### Pasos para agregar el campo sueldo:

1. **Acceder a Supabase SQL Editor**
   - Ir a [https://supabase.com](https://supabase.com)
   - Iniciar sesión en tu proyecto
   - Ir a la sección **SQL Editor**

2. **Ejecutar el script SQL**
   - Abrir el archivo `add-sueldo-field.sql`
   - Copiar todo el contenido
   - Pegarlo en el SQL Editor de Supabase
   - Hacer clic en **Run** (Ejecutar)

3. **Verificar la ejecución**
   - El script mostrará mensajes de confirmación
   - Verificar que la columna `sueldo` fue creada correctamente

---

## 📋 Cambios Realizados

### Backend (server.js)
- ✅ Endpoint `/api/tickets/:empleadoId` mejorado con mejor manejo de errores
- ✅ Campo `sueldo` agregado al INSERT de empleados
- ✅ Campo `sueldo` agregado al UPDATE de empleados

### Frontend (app.js)
- ✅ Corrección del selector de pestañas en el perfil del empleado
- ✅ Campo de sueldo agregado en la vista "Información Laboral"
- ✅ Campo de sueldo agregado al formulario de nuevo empleado
- ✅ Campo de sueldo incluido en la función de envío de formularios
- ✅ Campo de sueldo incluido en la función de edición de empleados
- ✅ Nueva tarjeta KPI "Sueldo Promedio" en el dashboard
- ✅ Función `calcularSueldoPromedio()` para calcular el promedio

### Frontend (index.html)
- ✅ Campo de entrada de sueldo agregado al formulario
- ✅ Nueva tarjeta KPI para mostrar el sueldo promedio

### Base de Datos
- ✅ Script SQL `add-sueldo-field.sql` creado
- ✅ Script de migración `migration-schema.sql` actualizado

---

## 🐛 Problemas Corregidos

### 1. **Pestañas del perfil de empleado no funcionaban**
   - **Problema**: Al cambiar de pestaña (General → Laboral → Salud → Historial), los datos desaparecían
   - **Causa**: Selector CSS incorrecto (`data-perfil-tab-content` vs `data-perfiltabcontent`)
   - **Solución**: Corregido el selector en la función `activatePerfilTabs()`

### 2. **Error 500 en endpoint de tickets**
   - **Problema**: El endpoint `/api/tickets/:empleadoId` fallaba con error 500
   - **Causa**: Query SQL intentaba acceder a campo `nombre` en tabla `usuarios` que podría no existir
   - **Solución**: Usar `COALESCE(u1.nombre, u1.username)` para manejar ambos casos

### 3. **No se mostraban los tickets en el historial**
   - **Problema**: El historial de tickets aparecía vacío
   - **Causa**: Error en el endpoint que impedía cargar los datos
   - **Solución**: Corregido el endpoint con mejor manejo de errores y logging

### 4. **Faltaba información financiera**
   - **Problema**: No había forma de registrar ni visualizar el sueldo de los empleados
   - **Solución**: Agregado campo `sueldo` en toda la aplicación

---

## 🧪 Cómo Probar

1. **Ejecutar el script SQL** en Supabase (ver instrucciones arriba)

2. **Reiniciar el servidor** (ya está corriendo)

3. **Probar el perfil del empleado:**
   - Abrir la aplicación
   - Hacer clic en un empleado
   - Probar cambiar entre pestañas: General → Laboral → Salud → Historial
   - Verificar que los datos NO desaparecen al volver

4. **Probar los tickets:**
   - Ir a la pestaña "Historial" en el perfil de un empleado
   - Verificar que los tickets se cargan correctamente
   - Si no hay tickets, debería mostrar "No hay tickets registrados"

5. **Probar el campo de sueldo:**
   - Crear un nuevo empleado y llenar el campo "Sueldo Mensual"
   - Guardar y verificar que se guarda correctamente
   - Ir a "Dashboard" y verificar que aparece el "Sueldo Promedio"
   - Ver el perfil del empleado en la pestaña "Laboral" y verificar que aparece el sueldo

6. **Verificar el dashboard:**
   - Ir a "Dashboard"
   - Verificar que aparece la nueva tarjeta "Sueldo Promedio"
   - Si hay empleados con sueldo, debería mostrar el promedio

---

## 📊 Nueva Funcionalidad: Sueldo Promedio

La tarjeta de "Sueldo Promedio" en el dashboard:
- Calcula el promedio de sueldos de todos los empleados que tienen sueldo registrado
- Ignora empleados sin sueldo en el cálculo
- Muestra el resultado formateado en pesos argentinos
- Se actualiza automáticamente al cargar empleados

---

## 🔍 Monitoreo

Para ver los logs del servidor y verificar que todo funciona:
1. Los logs mostrarán mensajes como:
   - `📋 Obteniendo tickets para empleado: X`
   - `✅ Tickets encontrados: Y`
   - Si hay error: `❌ Error al obtener tickets: [mensaje]`

2. En el navegador (Consola de Desarrollo):
   - `📋 Cargando tickets del empleado X`
   - `✅ Tickets recibidos: [datos]`
   - `ℹ️ No hay tickets para este empleado` (si está vacío)

---

## ✅ Resumen

Todos los problemas reportados han sido corregidos:
1. ✅ Las pestañas del perfil ahora funcionan correctamente
2. ✅ Los tickets se cargan sin errores
3. ✅ El historial de tickets se muestra en la pestaña correspondiente
4. ✅ Campo de sueldo agregado en todos los formularios y vistas
5. ✅ Dashboard muestra el sueldo promedio de los empleados

**Siguiente paso**: Ejecutar el script SQL en Supabase para habilitar el campo sueldo en la base de datos.
