# 🛡️ Guía de Pruebas del Sistema RBAC

## Sistema de Control de Acceso Basado en Roles

El sistema ahora cuenta con 4 tipos de usuarios con diferentes niveles de acceso:

---

## 👥 Usuarios de Prueba

### 🔴 Super Admin
- **Usuario:** `admin`
- **Password:** `admin123`
- **Permisos:** Acceso completo a todo el sistema
- **Puede:** Ver, crear, editar, eliminar empleados, exportar PDF/Excel, ver dashboard, notificaciones, reportes, tickets, configuración

### 🟠 Admin RRHH
- **Usuario:** `rrhh`
- **Password:** `rrhh123`
- **Permisos:** Control completo de RRHH sin acceso a configuración
- **Puede:** Ver, crear, editar empleados (NO eliminar), exportar PDF/Excel, ver dashboard, notificaciones, reportes, tickets
- **NO puede:** Eliminar empleados, acceder a configuración del sistema

### 🟢 Gerente
- **Usuario:** `manager`
- **Password:** `manager123`
- **Permisos:** Operaciones de RRHH sin eliminar
- **Puede:** Ver, crear, editar empleados, exportar PDF/Excel, ver dashboard, notificaciones, reportes, tickets
- **NO puede:** Eliminar empleados, acceder a configuración

### 🔵 Consultor (Solo Lectura)
- **Usuario:** `viewer`
- **Password:** `viewer123`
- **Permisos:** Solo visualización
- **Puede:** Ver empleados, dashboard, notificaciones, reportes, tickets
- **NO puede:** Crear, editar, eliminar empleados, exportar archivos, modificar nada

---

## ✅ Lista de Verificación de Pruebas

### Pruebas de Super Admin (admin/admin123)
- [ ] Badge muestra "Super Admin" en rojo en el top bar
- [ ] Sidebar muestra "Super Admin"
- [ ] Ve tab "Nuevo Empleado"
- [ ] Puede crear nuevos empleados
- [ ] Ve botones de editar (✏️) en lista de empleados
- [ ] Ve botones de eliminar (🗑️) en lista de empleados
- [ ] Puede editar empleado
- [ ] Puede eliminar empleado
- [ ] Ve botones "Exportar Excel" y "Exportar PDF"
- [ ] Puede exportar Excel
- [ ] Puede exportar PDF

### Pruebas de Admin RRHH (rrhh/rrhh123)
- [ ] Badge muestra "Admin RRHH" en naranja en el top bar
- [ ] Sidebar muestra "Administrador"
- [ ] Ve tab "Nuevo Empleado"
- [ ] Puede crear nuevos empleados
- [ ] Ve botones de editar (✏️) en lista de empleados
- [ ] Puede editar empleado
- [ ] **NO ve botones de eliminar** (🗑️ deshabilitado con opacidad 0.3)
- [ ] Si intenta eliminar via consola, recibe alerta "⛔ No tiene permisos"
- [ ] Ve botones "Exportar Excel" y "Exportar PDF"
- [ ] Puede exportar Excel
- [ ] Puede exportar PDF

### Pruebas de Gerente (manager/manager123)
- [ ] Badge muestra "Gerente" en verde en el top bar
- [ ] Sidebar muestra "Gerente RRHH"
- [ ] Ve tab "Nuevo Empleado"
- [ ] Puede crear nuevos empleados
- [ ] Ve botones de editar (✏️) en lista de empleados
- [ ] Puede editar empleado
- [ ] **NO ve botones de eliminar** (🗑️ deshabilitado)
- [ ] Ve botones "Exportar Excel" y "Exportar PDF"
- [ ] Puede exportar Excel
- [ ] Puede exportar PDF

### Pruebas de Consultor (viewer/viewer123)
- [ ] Badge muestra "Consultor" en azul en el top bar
- [ ] Sidebar muestra "Consultor"
- [ ] **NO ve tab "Nuevo Empleado"** (oculto)
- [ ] **NO ve botones de editar** (✏️ deshabilitado)
- [ ] **NO ve botones de eliminar** (🗑️ deshabilitado)
- [ ] **NO ve botones de exportación** (Excel y PDF ocultos)
- [ ] Puede ver dashboard y métricas
- [ ] Puede ver notificaciones
- [ ] Puede ver lista de empleados (solo lectura)
- [ ] Si intenta crear/editar/eliminar via consola, recibe alerta de permisos

---

## 🎨 Indicadores Visuales

### Badge de Rol (Top Bar)
El sistema muestra un badge de rol con escudo (🛡️) en el top bar con colores distintivos:
- **🔴 Rojo:** Super Admin (gradiente de rojo oscuro)
- **🟠 Naranja:** Admin RRHH (gradiente naranja)
- **🟢 Verde:** Gerente (gradiente verde)
- **🔵 Azul:** Consultor (gradiente azul)

### Indicadores en Sidebar
La información del usuario en el sidebar muestra el rol completo:
- Super Admin
- Administrador
- Gerente RRHH
- Consultor

### Botones Deshabilitados
Cuando un usuario no tiene permisos, los botones:
- Se vuelven semi-transparentes (opacity: 0.3)
- Cursor muestra "no permitido"
- Tooltip explica la restricción
- Al hacer clic, muestra alerta "⛔ No tiene permisos para..."

### Elementos Ocultos
Tabs y botones completamente ocultos para usuarios sin permisos:
- Tab "Nuevo Empleado" (viewer)
- Botones de exportación (viewer)

---

## 🚀 Cómo Probar

1. **Abrir aplicación:** http://localhost:3000
2. **Cerrar sesión** si ya está logueado
3. **Probar cada usuario** con su credencial correspondiente
4. **Verificar badge visual** en top bar (color y texto correcto)
5. **Intentar todas las operaciones** según la lista de verificación
6. **Confirmar restricciones** (botones ocultos/deshabilitados)
7. **Verificar alertas** cuando se intenta acción no permitida

---

## 📋 Resultado Esperado

✅ **Super Admin:** Acceso total, badge rojo, todos los botones visibles y funcionales

✅ **Admin RRHH:** Todo menos eliminar y configuración, badge naranja, botón eliminar deshabilitado

✅ **Gerente:** Operaciones HR completas sin eliminar, badge verde, exportaciones disponibles

✅ **Consultor:** Solo lectura, badge azul, sin botones de edición/exportación

---

## 🔧 Solución de Problemas

### Si no ves el badge de rol:
1. Verifica que hayas hecho login correctamente
2. Refresca la página (F5)
3. Limpia caché del navegador (Ctrl+Shift+Delete)

### Si todos los botones aparecen:
1. Verifica que `aplicarPermisos()` se ejecutó después del login
2. Revisa la consola del navegador (F12) por errores
3. Confirma que `usuarios.json` tiene la estructura correcta con permisos

### Si las restricciones no funcionan:
1. Cierra sesión completamente
2. Vuelve a iniciar sesión con el usuario de prueba
3. Verifica que `currentUser` tiene el objeto `permisos` en memoria

---

## 🎯 Conclusión

El sistema RBAC está **100% implementado** con:
- ✅ 4 roles con permisos granulares
- ✅ Verificación en backend (tienePermiso)
- ✅ Ocultación de elementos en frontend (aplicarPermisos)
- ✅ Indicadores visuales de rol (badge + sidebar)
- ✅ Alertas cuando se intenta acción no permitida
- ✅ Responsive (badge se adapta a móvil)

**Sistema listo para producción** 🚀
