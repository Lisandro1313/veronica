# 🔧 Cómo Arreglar los Tickets

## Problema
La tabla `tickets` en Supabase no tiene las columnas necesarias:
- ❌ `titulo` no existe
- ❌ `created_at` no existe  
- ❌ Y probablemente faltan más columnas

## Solución: Ejecutar Migración SQL

### Opción 1: SQL Editor de Supabase (RECOMENDADO)

1. **Andá a Supabase Dashboard:**
   - https://supabase.com/dashboard/project/lccmoqylhvanevpcrwty

2. **Abrí el SQL Editor:**
   - Sidebar izquierdo → **SQL Editor**
   - O directo: https://supabase.com/dashboard/project/lccmoqylhvanevpcrwty/sql

3. **Creá una nueva query:**
   - Click en **"New query"**

4. **Copiá y pegá TODO el contenido de `migration-tickets.sql`** (el archivo que acabo de crear)

5. **Ejecutá el script:**
   - Click en **"Run"** o presioná `Ctrl+Enter`

6. **Verificá el resultado:**
   - Deberías ver mensajes como:
     ```
     Columna titulo agregada
     Columna descripcion agregada
     Columna fecha_evento agregada
     ...
     ✅ Migración de tabla tickets completada
     ```

7. **Mirá la estructura final:**
   - Al final del script se muestra una tabla con todas las columnas
   - Verificá que aparezcan: `titulo`, `descripcion`, `created_at`, etc.

### Opción 2: Desde tu aplicación local

Si tenés acceso directo a PostgreSQL:

```bash
psql "postgresql://postgres.lccmoqylhvanevpcrwty@aws-1-us-east-2.pooler.supabase.com:6543/postgres" -f migration-tickets.sql
```

---

## Después de la Migración

Una vez ejecutado el script:

1. **Refrescá la app:** https://veronica-flame.vercel.app
2. **Andá a Tickets → Nuevo Ticket**
3. **Creá un ticket de prueba**
4. **Debería funcionar sin errores** ✅

---

## ⚠️ IMPORTANTE

Este script es **idempotente** - podés ejecutarlo múltiples veces sin problemas. Cada columna verifica si ya existe antes de agregarla.

---

## Si seguís teniendo problemas

Después de ejecutar la migración, si aún hay errores, avisame y revisamos juntos los logs de Vercel para ver qué más falta.
