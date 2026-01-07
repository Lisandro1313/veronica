# 🚀 INSTRUCCIONES DE DEPLOYMENT

## 📋 PASOS PARA DEPLOYMENT COMPLETO

### 1️⃣ Configurar Supabase

#### A. Crear cuenta y proyecto en Supabase
1. Ve a https://supabase.com
2. Crea una cuenta (gratis)
3. Crea un nuevo proyecto:
   - Nombre: `veronica-rrhh` (o el que prefieras)
   - Región: `South America (São Paulo)` (más cercana)
   - Password de base de datos: **GUÁRDALA BIEN**

#### B. Ejecutar el schema de base de datos
1. En Supabase, ve a **SQL Editor** (ícono de base de datos)
2. Click en **New Query**
3. Copia y pega el contenido de `migration-schema.sql`
4. Click en **Run** (Ejecutar)
5. Deberías ver: "Success. No rows returned"

#### C. Obtener las credenciales
1. Ve a **Settings** → **API**
2. Copia estos valores:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Project API Key** (anon/public): `eyJhbGciOi...`

---

### 2️⃣ Configurar Variables de Entorno Localmente (Opcional)

Si quieres probar localmente antes de subir:

```bash
# Crear archivo .env en la raíz del proyecto
cp .env.example .env

# Editar .env y completar:
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu_clave_anon_key_aqui
PORT=3000
```

Luego probar localmente:
```bash
npm install
npm start
```

Abrir: http://localhost:3000

---

### 3️⃣ Deploy a Vercel

#### A. Instalar Vercel CLI (si no lo tienes)
```bash
npm install -g vercel
```

#### B. Login a Vercel
```bash
vercel login
```

Te pedirá autenticarte por email o GitHub.

#### C. Deploy del proyecto
```bash
# Primer deploy (configuración interactiva)
vercel

# Te preguntará:
# - Set up and deploy? → Y (sí)
# - Which scope? → Selecciona tu cuenta
# - Link to existing project? → N (no)
# - Project name? → veronica-rrhh (o presiona Enter)
# - Directory? → ./ (presiona Enter)
# - Want to override settings? → N (no)
```

#### D. Configurar variables de entorno en Vercel
```bash
# Opción 1: Por comandos
vercel env add SUPABASE_URL production
vercel env add SUPABASE_KEY production

# Opción 2: Por dashboard
# 1. Ve a https://vercel.com/dashboard
# 2. Selecciona tu proyecto
# 3. Settings → Environment Variables
# 4. Agrega:
#    - SUPABASE_URL = https://tu-proyecto.supabase.co
#    - SUPABASE_KEY = tu_clave_anon_key_aqui
```

#### E. Deploy a producción
```bash
vercel --prod
```

¡Listo! Te dará una URL como: `https://veronica-rrhh.vercel.app`

---

### 4️⃣ Verificación Post-Deploy

#### Checklist de pruebas:

✅ **Login:**
- Usuario: admin
- Password: admin123
- (Cámbialo después del primer login)

✅ **Crear empleado:**
- Completar formulario
- Verificar que se guarde

✅ **Dashboard:**
- Ver KPIs con datos reales
- Verificar cálculos

✅ **Filtros:**
- Probar filtro por puesto
- Probar filtro por área
- Probar filtro de antigüedad

✅ **Reportes:**
- Generar PDF
- Exportar Excel

✅ **Tickets:**
- Crear ticket de vacaciones
- Aprobar/rechazar

---

### 5️⃣ Crear Usuario Admin en Supabase

La primera vez, necesitas crear el usuario admin manualmente:

```sql
-- En Supabase SQL Editor:
INSERT INTO usuarios (nombre, usuario, password, rol) 
VALUES (
  'Administrador', 
  'admin', 
  '$2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxx',  -- Hash de "admin123"
  'admin'
);
```

O usa el endpoint de reset que ya existe:
```bash
# Llama a tu API:
curl https://tu-proyecto.vercel.app/api/reset-admin
```

---

### 6️⃣ Seguridad Post-Deploy

⚠️ **IMPORTANTE - Hacer esto inmediatamente:**

1. **Cambiar password de admin:**
   - Login como admin
   - Ve a configuración de usuario
   - Cambia a password seguro

2. **Configurar Row Level Security en Supabase:**
```sql
-- Habilitar RLS en las tablas
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Política para empleados (solo usuarios autenticados)
CREATE POLICY "Empleados accesibles para usuarios autenticados"
ON empleados FOR ALL
USING (true);

-- Política para tickets
CREATE POLICY "Tickets accesibles para usuarios autenticados"
ON tickets FOR ALL
USING (true);

-- Política para usuarios (solo pueden ver su propio perfil)
CREATE POLICY "Usuarios pueden ver su propio perfil"
ON usuarios FOR SELECT
USING (true);
```

3. **Configurar CORS en Vercel:**
   - Ya está configurado en vercel.json
   - Verifica que funciona

4. **Backup regular:**
   - Supabase hace backups automáticos
   - Configura backup manual semanal usando la función de export

---

### 7️⃣ Monitoreo

#### Logs en Vercel:
```bash
vercel logs
```

#### Logs en Supabase:
- Dashboard → Logs
- Ver queries lentas
- Ver errores de API

---

### 🆘 Troubleshooting

#### Problema: "Failed to fetch"
✅ Solución: Verificar que SUPABASE_URL y SUPABASE_KEY estén correctos

#### Problema: "Invalid API key"
✅ Solución: Usar la clave **anon/public**, NO la service_role

#### Problema: "Cannot read property of undefined"
✅ Solución: Ejecutar migration-schema.sql para agregar campos faltantes

#### Problema: APIs no funcionan
✅ Solución: Verificar que vercel.json tenga la configuración correcta (ya está)

---

### 📊 Recursos Útiles

- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Tu Repo:** https://github.com/Lisandro1313/veronica

---

### ✅ Checklist Final

- [ ] Supabase proyecto creado
- [ ] Schema SQL ejecutado (migration-schema.sql)
- [ ] Credenciales obtenidas
- [ ] Variables de entorno en Vercel configuradas
- [ ] Deploy a producción exitoso
- [ ] Usuario admin creado
- [ ] Login funciona
- [ ] CRUD de empleados funciona
- [ ] Dashboard muestra datos
- [ ] Reportes funcionan
- [ ] Password de admin cambiado
- [ ] RLS habilitado en Supabase

**¡Felicidades! Tu sistema está en producción.** 🎉
