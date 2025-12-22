# 🚀 Instrucciones de Deploy en Render.com

## ✅ Checklist Pre-Deploy

- [x] Código migrado a PostgreSQL
- [x] Dependencia `pg` agregada al package.json
- [x] Variables de entorno configuradas (.env.example)
- [x] Script SQL de inicialización creado (init-db.sql)
- [x] .gitignore actualizado
- [ ] Código subido a GitHub
- [ ] Base de datos PostgreSQL creada en Render
- [ ] Web Service creado en Render

---

## 📦 Paso 1: Subir Código a GitHub

```powershell
# Instalar nueva dependencia
npm install

# Verificar que funciona localmente (opcional, requiere PostgreSQL local)
# npm start

# Agregar cambios a Git
git add .
git commit -m "Migración a PostgreSQL para deployment en Render"
git push origin main
```

---

## 🗄️ Paso 2: Crear Base de Datos PostgreSQL en Render

1. **Ir a Render Dashboard**: https://dashboard.render.com
2. **Click en "New +"** → Selecciona **"PostgreSQL"**
3. **Configurar la base de datos:**
   - **Name:** `rrhh-database` (o el nombre que prefieras)
   - **Database:** `rrhh_db`
   - **User:** (se genera automáticamente)
   - **Region:** Oregon (US West) o el más cercano a ti
   - **PostgreSQL Version:** 15 o la más reciente
   - **Plan:** **Free**
4. **Click "Create Database"**
5. **IMPORTANTE:** Guarda la **"Internal Database URL"** (aparece en la página de la BD)
   - Se ve así: `postgresql://user:pass@dpg-xxxxx/dbname`
   - La necesitarás en el siguiente paso

---

## 🔧 Paso 3: Inicializar la Base de Datos

Una vez creada la base de datos:

1. En la página de tu BD en Render, ve a la pestaña **"Connect"**
2. Copia el comando **"PSQL Command"**
3. Abre tu terminal local y pega ese comando (necesitas `psql` instalado)
   
   **O usa la Shell de Render:**
   - En la página de tu BD, click en **"Shell"** (arriba a la derecha)
   - Se abrirá una terminal web conectada a tu BD

4. **Ejecuta el script de inicialización:**
   ```bash
   # Copia todo el contenido de init-db.sql y pégalo en la shell
   # O si tienes psql local:
   psql "postgresql://user:pass@dpg-xxxxx/dbname" -f init-db.sql
   ```

5. **Verificar que se crearon las tablas:**
   ```sql
   \dt
   ```
   Deberías ver: usuarios, empleados, tickets

6. **Verificar datos iniciales:**
   ```sql
   SELECT * FROM usuarios;
   ```
   Deberías ver 4 usuarios (admin, rrhh, manager, usuario)

---

## 🌐 Paso 4: Crear Web Service en Render

1. **En Render Dashboard, click "New +"** → Selecciona **"Web Service"**
2. **Conecta tu repositorio de GitHub:**
   - Si es la primera vez, autoriza a Render a acceder a GitHub
   - Busca tu repositorio `veronica` (o como lo hayas llamado)
   - Click en "Connect"

3. **Configurar el Web Service:**
   
   **General:**
   - **Name:** `sistema-rrhh` (o el nombre que prefieras)
   - **Region:** Oregon (US West) - mismo que la BD
   - **Branch:** `main`
   - **Root Directory:** (dejar vacío)
   
   **Build & Deploy:**
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   
   **Plan:**
   - **Instance Type:** Free

4. **Agregar Variables de Entorno:**
   
   Scroll down hasta "Environment Variables" y agrega:
   
   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | (Pega la Internal Database URL de tu BD) |
   | `NODE_ENV` | `production` |
   
   **NO agregues PORT** (Render lo asigna automáticamente)

5. **Click "Create Web Service"**

---

## ⏳ Paso 5: Esperar el Deploy

Render automáticamente:
1. ✅ Clona tu repositorio
2. ✅ Ejecuta `npm install`
3. ✅ Ejecuta `npm start`
4. ✅ Asigna una URL pública

**Tiempo estimado:** 3-5 minutos

Puedes ver los logs en tiempo real en la pestaña "Logs" del Web Service.

---

## 🎉 Paso 6: Verificar que Funciona

Una vez que veas **"Live"** en verde:

1. **Click en la URL de tu servicio** (aparece arriba)
   - Se ve así: `https://sistema-rrhh-xxxx.onrender.com`

2. **Deberías ver tu sistema de RRHH** 🎊

3. **Probar login:**
   - Usuario: `admin`
   - Password: `admin123`

4. **Si todo funciona:** ¡Listo! 🚀

---

## 🔍 Troubleshooting (Si algo falla)

### Error: "Application failed to respond"
**Causa:** El servidor no arrancó correctamente
**Solución:**
1. Ve a "Logs" en Render
2. Busca el error específico
3. Posibles causas:
   - DATABASE_URL incorrecta → Verifica que copiaste la Internal URL completa
   - Tablas no creadas → Ejecuta init-db.sql en la BD

### Error: "Connection refused" en los logs
**Causa:** No puede conectar a PostgreSQL
**Solución:**
1. Verifica que DATABASE_URL esté configurada en Environment Variables
2. Asegúrate de usar la **Internal Database URL** (no la External)

### Error 500 al hacer login
**Causa:** Tablas no inicializadas o usuarios no creados
**Solución:**
1. Conéctate a la BD con la Shell de Render
2. Ejecuta: `SELECT * FROM usuarios;`
3. Si está vacío, ejecuta el init-db.sql

### El servicio se "duerme"
**Esto es NORMAL en el plan Free**
- Después de 15 minutos de inactividad, el servicio se suspende
- Al recibir la próxima request, despierta en ~50 segundos
- **Solución:** Upgrade a plan pagado ($7/mes) o usa un servicio de "ping" gratis

---

## 🔄 Auto-Deploy (Deploy Automático)

¡Buena noticia! Una vez configurado:

**Cada vez que hagas `git push origin main`:**
1. Render detecta el cambio automáticamente
2. Hace un nuevo deploy
3. En 2-3 minutos está actualizado

**No necesitas hacer nada más** 🎉

---

## 📊 Monitoreo y Mantenimiento

### Ver Logs en Tiempo Real
1. Ve a tu Web Service en Render
2. Click en "Logs"
3. Verás todos los console.log() de tu código

### Ver Métricas
1. Click en "Metrics"
2. Verás: CPU, RAM, requests/segundo

### Backups de BD
Render Free incluye:
- ✅ Backups diarios automáticos (retiene 7 días)
- ✅ Recuperación point-in-time

Para backups manuales:
```bash
# En la shell de Render o local con psql
pg_dump "postgresql://user:pass@host/db" > backup.sql
```

---

## 💰 Costos

**Plan Actual (Free):**
- Web Service: $0/mes
- PostgreSQL: $0/mes
- Límites:
  - 750 horas/mes (suficiente para 1 app)
  - Se duerme tras 15 min de inactividad
  - 1 GB RAM, 0.5 CPU
  - 1 GB storage en BD

**Upgrade Recomendado (Opcional):**
Si necesitas que esté siempre activo:
- Web Service: $7/mes (Starter plan)
- PostgreSQL: Sigue gratis (hasta 1 GB)
- **Total: $7/mes**

---

## 🔐 Seguridad - Cambiar Contraseñas

**IMPORTANTE:** Las contraseñas por defecto son de prueba.

Para cambiar en producción:
1. Conéctate a la BD con la Shell de Render
2. Ejecuta:
```sql
UPDATE usuarios SET password = 'nueva_contraseña_segura' WHERE usuario = 'admin';
UPDATE usuarios SET password = 'nueva_contraseña_segura' WHERE usuario = 'rrhh';
-- etc.
```

**Recomendación futura:** Implementar hash de contraseñas con bcrypt

---

## 📝 URLs Importantes

Después del deploy, guarda estas URLs:

- **Tu Aplicación:** `https://sistema-rrhh-xxxx.onrender.com`
- **Render Dashboard:** https://dashboard.render.com
- **Logs:** `https://dashboard.render.com/web/tu-servicio-id`

---

## ✅ Checklist Post-Deploy

- [ ] Sistema funciona en la URL de Render
- [ ] Login funciona con admin/admin123
- [ ] Se pueden crear empleados
- [ ] Se pueden ver empleados
- [ ] Dark mode funciona
- [ ] Print profile funciona
- [ ] Estadísticas se muestran
- [ ] Cambiar contraseñas de producción
- [ ] Guardar URL de la aplicación
- [ ] Compartir URL con usuarios

---

## 🎯 Próximos Pasos (Opcional)

1. **Dominio personalizado** (gratis):
   - En Render, ve a Settings → Custom Domain
   - Agrega tu dominio (ej: rrhh.tuempresa.com)
   
2. **Monitoreo:**
   - Configura alertas en Render
   - Usa UptimeRobot para ping cada 5 min (previene sleep)

3. **Mejoras de seguridad:**
   - Implementar bcrypt para contraseñas
   - Agregar JWT para sesiones
   - Rate limiting

4. **Backups adicionales:**
   - Exportar BD semanalmente
   - Guardar en Google Drive/Dropbox

---

**¿Listo para empezar? Sigue el Paso 1** 🚀

Si tienes problemas, revisa la sección de Troubleshooting o los logs en Render.
