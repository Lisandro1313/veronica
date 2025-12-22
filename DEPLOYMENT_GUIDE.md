# 🚀 Guía de Deployment - Sistema RRHH

## 📋 Estado Actual del Sistema

### ✅ Listo para Producción
El sistema está **funcionalmente completo** con:
- ✅ 6 mejoras enterprise
- ✅ Sistema RBAC con 4 roles
- ✅ 3 funciones premium (Dark Mode, Print, Estadísticas)
- ✅ Sin errores de compilación
- ✅ Código limpio y documentado

### ⚠️ Base de Datos Actual
**Sistema:** Archivos JSON (File System)
- `data/usuarios.json` - Usuarios y credenciales
- `data/empleados.json` - Empleados
- `data/tickets.json` - Tickets/solicitudes

**Limitaciones:**
- ❌ No escala para alto tráfico
- ❌ Sin transacciones ACID
- ❌ Riesgo de pérdida de datos
- ❌ No soporta concurrencia

---

## 🎯 Opciones de Deployment

### Opción 1: 🟢 Render.com (Recomendado - GRATIS)

**Ventajas:**
- ✅ GRATIS (Free Tier generoso)
- ✅ Deployment automático desde GitHub
- ✅ HTTPS incluido
- ✅ Base de datos PostgreSQL gratis
- ✅ Muy fácil de usar
- ✅ No requiere tarjeta de crédito

**Limitaciones:**
- ⚠️ Se duerme después de 15 minutos de inactividad (tarda ~50s en despertar)
- ⚠️ 750 horas/mes de uso (suficiente para 1 app)

**Costo:** $0/mes

---

### Opción 2: 🔵 Railway.app (Más Rápido)

**Ventajas:**
- ✅ $5 gratis al registrarte
- ✅ No se duerme (siempre activo)
- ✅ Deployment desde GitHub
- ✅ PostgreSQL/MySQL incluido
- ✅ Más rápido que Render
- ✅ Interface moderna

**Limitaciones:**
- ⚠️ Requiere tarjeta de crédito después del crédito inicial
- ⚠️ Costo aproximado: $5-10/mes después del trial

**Costo:** $5 gratis, luego ~$8/mes

---

### Opción 3: 🟣 Vercel (Frontend) + Supabase (Backend)

**Ventajas:**
- ✅ Vercel es gratis para frontend
- ✅ Supabase tiene tier gratis generoso
- ✅ Base de datos PostgreSQL + API REST automática
- ✅ Autenticación integrada
- ✅ Tiempo real (WebSockets)
- ✅ Backups automáticos

**Limitaciones:**
- ⚠️ Requiere migrar de Node.js a Next.js o Serverless Functions
- ⚠️ Mayor complejidad inicial

**Costo:** $0/mes (Hobby plan)

---

### Opción 4: ☁️ Azure App Service (Empresa)

**Ventajas:**
- ✅ Escalabilidad profesional
- ✅ Integración con Azure SQL
- ✅ Backups automáticos
- ✅ Alta disponibilidad
- ✅ Soporte empresarial
- ✅ Certificados SSL incluidos

**Limitaciones:**
- ⚠️ Más costoso
- ⚠️ Mayor complejidad de configuración

**Costo:** Desde $13/mes (Basic B1)

---

## 🏆 Recomendación por Caso de Uso

| Caso | Plataforma | Razón |
|------|------------|-------|
| **Prueba/Demo** | Render.com | Gratis, fácil, suficiente |
| **Startup/Pequeña empresa** | Railway.app | Siempre activo, rápido |
| **Empresa mediana** | Azure App Service | Profesional, escalable |
| **Proyecto personal** | Vercel + Supabase | Gratis, moderno |

---

## 🔧 Implementación para Producción

### 🎯 MI RECOMENDACIÓN: Render.com + PostgreSQL

Es **GRATIS**, fácil y cumple con tus necesidades.

### Paso 1: Migrar de JSON a PostgreSQL

Necesitamos cambiar el sistema de archivos JSON por una base de datos real.

**Archivos a modificar:**
1. `server.js` - Cambiar fs.readFile/writeFile por queries SQL
2. `package.json` - Agregar dependencia `pg` (PostgreSQL)
3. Crear `db.js` - Configuración de conexión a BD

**Beneficios:**
- ✅ Los datos se guardan permanentemente
- ✅ Soporta múltiples usuarios simultáneos
- ✅ Backups automáticos
- ✅ Más seguro

---

## 📦 Archivos Necesarios para Deploy

### 1. `.gitignore`
```
node_modules/
data/
.env
*.log
.DS_Store
```

### 2. `.env.example` (Variables de entorno)
```
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/dbname
NODE_ENV=production
```

### 3. `render.yaml` (Configuración Render)
```yaml
services:
  - type: web
    name: sistema-rrhh
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

---

## 🗄️ Estructura de Base de Datos PostgreSQL

### Tabla: usuarios
```sql
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: empleados
```sql
CREATE TABLE empleados (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    dni VARCHAR(20) UNIQUE NOT NULL,
    cuit VARCHAR(20),
    fecha_nacimiento DATE,
    nacionalidad VARCHAR(50),
    es_extranjero VARCHAR(2),
    pais_origen VARCHAR(50),
    
    -- Datos de contacto
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    
    -- Datos laborales
    fecha_ingreso DATE,
    puesto VARCHAR(100),
    area VARCHAR(100),
    salario DECIMAL(12,2),
    
    -- Educación
    nivel_educativo VARCHAR(50),
    
    -- Salud
    problemas_salud TEXT,
    
    -- Antecedentes
    antecedentes_penales VARCHAR(2),
    observaciones_antecedentes TEXT,
    
    -- Datos adicionales (JSON para flexibilidad)
    datos_adicionales JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: tickets
```sql
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER REFERENCES empleados(id),
    tipo VARCHAR(50),
    descripcion TEXT,
    estado VARCHAR(20) DEFAULT 'pendiente',
    fecha DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🚀 Guía Paso a Paso - Deploy en Render.com

### Paso 1: Preparar el Proyecto

1. **Asegúrate de que todo esté en GitHub:**
```powershell
git status
git add .
git commit -m "Preparar para deployment en Render"
git push origin main
```

### Paso 2: Crear Cuenta en Render

1. Ve a https://render.com
2. Click en "Get Started" (gratis)
3. Conecta con tu cuenta de GitHub

### Paso 3: Crear Base de Datos PostgreSQL

1. En Render Dashboard, click "New +"
2. Selecciona "PostgreSQL"
3. Configuración:
   - **Name:** `rrhh-database`
   - **Database:** `rrhh_db`
   - **User:** (automático)
   - **Region:** Oregon (US West) - más cercano
   - **Plan:** Free
4. Click "Create Database"
5. **IMPORTANTE:** Guarda la URL de conexión (Internal Database URL)

### Paso 4: Crear Web Service

1. En Render Dashboard, click "New +"
2. Selecciona "Web Service"
3. Conecta tu repositorio de GitHub
4. Configuración:
   - **Name:** `sistema-rrhh`
   - **Region:** Oregon (US West)
   - **Branch:** main
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

5. **Variables de Entorno:**
   - Click "Add Environment Variable"
   - `DATABASE_URL` = (pega la Internal Database URL de tu BD)
   - `NODE_ENV` = `production`
   - `PORT` = `3000`

6. Click "Create Web Service"

### Paso 5: Esperar Deployment

- Render automáticamente:
  1. Clona tu repo
  2. Instala dependencias
  3. Inicia el servidor
  4. Te da una URL: `https://sistema-rrhh.onrender.com`

**Tiempo:** ~5-10 minutos

---

## ⚡ Cambios Necesarios en el Código

Para que funcione con PostgreSQL, necesito modificar 3 archivos:

### 1. `package.json` - Agregar dependencia
```json
"dependencies": {
  "express": "^4.18.2",
  "body-parser": "^1.20.2",
  "cors": "^2.8.5",
  "pg": "^8.11.3"  ← NUEVO
}
```

### 2. `db.js` (NUEVO) - Conexión a BD
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false
});

module.exports = pool;
```

### 3. `server.js` - Cambiar fs.readFile por SQL

**Antes (JSON):**
```javascript
const usuarios = JSON.parse(fs.readFileSync(usuariosFile, 'utf8'));
```

**Después (PostgreSQL):**
```javascript
const result = await pool.query('SELECT * FROM usuarios');
const usuarios = result.rows;
```

---

## 🛠️ ¿Quieres que yo haga la migración ahora?

Puedo:
1. ✅ Crear archivo `db.js` con conexión PostgreSQL
2. ✅ Migrar `server.js` de JSON a SQL
3. ✅ Crear archivo `init-db.sql` con estructura de tablas
4. ✅ Actualizar `package.json` con dependencias
5. ✅ Crear `.gitignore` y `.env.example`
6. ✅ Crear script de migración de datos JSON → PostgreSQL
7. ✅ Preparar todo para Render deployment

**Tiempo estimado:** 15-20 minutos

---

## 💰 Resumen de Costos

| Plataforma | Costo Inicial | Costo Mensual | Base de Datos | Mejor Para |
|------------|---------------|---------------|---------------|------------|
| **Render.com** | $0 | $0 | PostgreSQL gratis | Demos, startups |
| **Railway.app** | $5 gratis | $8 | Incluido | Producción pequeña |
| **Vercel + Supabase** | $0 | $0 | PostgreSQL gratis | Proyectos modernos |
| **Azure** | $0 (trial) | $13+ | Desde $5/mes | Empresas |

---

## 📊 Comparativa Rápida

**Para TU caso (Sistema RRHH pequeño/mediano):**

🏆 **Render.com** es la mejor opción:
- ✅ Completamente gratis
- ✅ Base de datos incluida
- ✅ Deploy automático
- ✅ HTTPS gratis
- ✅ Fácil de usar

**Única limitación:** Se duerme después de 15 min sin uso (normal para tier gratis)

---

## 🎯 Próximos Pasos Recomendados

1. **YO te ayudo a migrar el código a PostgreSQL** (15 min)
2. **TÚ creas cuenta en Render.com** (5 min)
3. **TÚ creas base de datos PostgreSQL en Render** (3 min)
4. **YO genero el script SQL para crear tablas** (5 min)
5. **TÚ ejecutas el script en Render** (2 min)
6. **TÚ creas Web Service conectando GitHub** (5 min)
7. **Render hace deploy automático** (10 min)

**Total: ~45 minutos** y tendrás tu sistema en producción 🚀

---

## ❓ Preguntas Frecuentes

### ¿Necesito tarjeta de crédito?
**Render:** NO (completamente gratis sin tarjeta)
**Railway:** SÍ (pero $5 gratis al inicio)

### ¿Se pierden los datos?
Con PostgreSQL en Render: **NO**, son permanentes (con backups diarios)

### ¿Puedo cambiar de plataforma después?
**SÍ**, es fácil migrar porque usarás PostgreSQL estándar

### ¿Qué pasa si se duerme (Render free)?
Al recibir una request, despierta en ~50 segundos
**Solución:** Usar un servicio de "ping" gratis cada 10 min

### ¿Cuántos usuarios soporta?
**Render Free:** ~100 usuarios simultáneos (suficiente para empresa pequeña)

---

## 📞 Soporte

Si tienes problemas durante el deployment:
- **Render:** https://render.com/docs
- **Railway:** https://railway.app/help
- **PostgreSQL:** https://www.postgresql.org/docs/

---

**¿Quieres que proceda con la migración a PostgreSQL ahora? 🚀**

Responde "sí" y en 15 minutos tendrás todo listo para hacer deploy en Render.
