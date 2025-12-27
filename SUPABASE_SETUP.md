# 🚀 Guía de Configuración - Supabase

## Paso 1: Crear una cuenta en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Click en "Start your project" o "Sign Up"
3. Regístrate con GitHub, Google o correo electrónico

## Paso 2: Crear un nuevo proyecto

1. En el dashboard, click en "New project"
2. Completa los datos:
   - **Name**: `veronica-rrhh` (o el nombre que prefieras)
   - **Database Password**: Crea una contraseña fuerte
   - **Region**: Selecciona la región más cercana a ti
3. Click en "Create new project"
4. Espera a que se cree (tarda ~2 minutos)

## Paso 3: Obtener las credenciales

1. En el dashboard, ve a **Settings** → **API** (o **Configuration** en algunas versiones)
2. Encontrarás:
   - **Project URL**: `https://your-project.supabase.co`
   - **Anon/Public Key**: `eyJhbGc...` (llave pública)
   - **Service Role Key**: `eyJhbGc...` (llave privada - solo para el backend)

## Paso 4: Configurar variables de entorno

1. Copia `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edita `.env` y reemplaza:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=eyJhbGc...
   ```

   ⚠️ **IMPORTANTE**: 
   - Usa el **Anon Key** (public) para el cliente/frontend
   - Usa el **Service Role Key** (privada) en el backend si necesitas permisos especiales

## Paso 5: Crear las tablas en Supabase

### Opción A: Usar la interfaz SQL de Supabase

1. En el dashboard, ve a **SQL Editor**
2. Click en "New Query"
3. Copia y pega el contenido de `init-db.sql`
4. Click en "Run"

### Opción B: Ejecutar el script de inicialización

```bash
npm install
npm run dev
```

El servidor ejecutará automáticamente la inicialización de la BD.

## Paso 6: Verificar la conexión

1. Inicia el servidor:
   ```bash
   npm start
   ```

2. Deberías ver:
   ```
   ✅ Supabase cliente inicializado
   ✅ Conectado a PostgreSQL
   ✅ Servidor ejecutándose en puerto 3000
   ```

3. Abre [http://localhost:3000](http://localhost:3000) en tu navegador

## 📚 Estructura de Tablas en Supabase

El sistema creará automáticamente:

- **usuarios**: Credenciales y datos de usuarios
  - id (PK)
  - usuario (unique)
  - password
  - nombre
  - rol
  - estado

- **empleados**: Información de empleados
  - id (PK)
  - usuario_id (FK)
  - nombre
  - email
  - telefono
  - puesto
  - departamento
  - fecha_ingreso

- **tickets**: Sistema de tickets/tareas
  - id (PK)
  - usuario_id (FK)
  - titulo
  - descripcion
  - estado
  - prioridad
  - fecha_creacion

## 🔐 Políticas de Seguridad (RLS)

Para habilitarr Row Level Security en Supabase:

1. Ve a **Authentication** → **Policies**
2. Crea políticas según necesites (próxima fase)

## 🌐 Desplegar en Producción

### Opción 1: Render.com (Recomendado)
1. Ve a [render.com](https://render.com)
2. Click en "New +"
3. Selecciona "Web Service"
4. Conecta tu repositorio GitHub
5. Configura:
   - **Name**: `veronica-rrhh`
   - **Runtime**: Node
   - **Build**: `npm install`
   - **Start**: `npm start`
6. Agrega variables de entorno:
   ```
   PORT=3000
   NODE_ENV=production
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key
   ```

### Opción 2: Vercel/Netlify (para frontend)
- Estos servicios son ideales solo si tomas el frontend como aplicación separada
- El backend debe estar en Render o similar

## 🧪 Testing

Para verificar que todo funciona:

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Probar login en http://localhost:3000
# Usuario: admin
# Contraseña: admin123
```

## 📖 Recursos Útiles

- [Documentación de Supabase](https://supabase.com/docs)
- [PostgreSQL en Supabase](https://supabase.com/docs/guides/database)
- [REST API de Supabase](https://supabase.com/docs/guides/api)
- [Realtime de Supabase](https://supabase.com/docs/guides/realtime)

## ❓ Solucionar Problemas

### Error: "SUPABASE_URL is required"
- Verifica que `.env` tenga las variables correctas
- Reinicia el servidor: `npm run dev`

### Error: "Cannot find module '@supabase/supabase-js'"
```bash
npm install
```

### La BD no se inicializa
- Abre la SQL Editor en Supabase
- Ejecuta manualmente el contenido de `init-db.sql`
- Verifica que la contraseña sea correcta en las variables de entorno

### Conexión rechazada en producción
- Verifica que las variables de entorno estén configuradas
- Comprueba que tu IP esté en la lista blanca (si aplica)
- Revisa los logs de Render: Dashboard → Logs
