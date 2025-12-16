# Sistema RRHH Enterprise - Guía de Deployment 🚀

## 🌐 Plataformas Recomendadas para Producción

### **OPCIÓN 1: Render.com (RECOMENDADA) ⭐**

**¿Por qué Render?**
✅ **PostgreSQL gratuito** incluido
✅ Deploy automático desde GitHub
✅ SSL/HTTPS gratis
✅ Muy fácil de usar
✅ Plan gratuito generoso
✅ Soporte para Node.js nativo
✅ Variables de entorno seguras
✅ Auto-scaling disponible

**Plan Gratuito:**
- PostgreSQL: 1GB storage, 97 horas/mes
- Web Service: 750 horas/mes
- SSL automático
- 100GB bandwidth/mes

**Precio Pagado:**
- $7/mes Web Service
- $7/mes PostgreSQL 256MB
- Total: $14/mes profesional

---

### **OPCIÓN 2: Railway.app** 

**¿Por qué Railway?**
✅ Deploy desde GitHub instantáneo
✅ PostgreSQL integrado
✅ $5 crédito gratis/mes
✅ Muy developer-friendly
✅ Variables de entorno automáticas

**Precio:**
- $5/mes incluidos gratis
- Luego pay-as-you-go

---

### **OPCIÓN 3: Heroku (Clásico pero caro)**

**NO RECOMENDADO:**
❌ Ya no tiene plan gratuito
❌ $7/mes mínimo
❌ PostgreSQL $5/mes adicional
❌ Total: $12/mes vs $0 en Render

---

### **OPCIÓN 4: Vercel + Supabase**

**¿Por qué Vercel + Supabase?**
✅ Vercel: Frontend gratis ilimitado
✅ Supabase: PostgreSQL gratis 500MB
✅ Separación frontend/backend
✅ Muy escalable

**Requiere:**
- Convertir backend a API routes de Vercel
- O usar Supabase Edge Functions

---

## 🏆 **RECOMENDACIÓN FINAL: RENDER.COM**

Para este proyecto, **Render** es la mejor opción porque:
1. PostgreSQL incluido gratis
2. Deploy automático
3. Fácil configuración
4. SSL gratis
5. Perfecto para Node.js + Express
6. Sin tarjeta de crédito necesaria para empezar

---

## 📋 Pasos para Deploy en Render

### **Paso 1: Preparar el Proyecto**

1. Crear repositorio en GitHub:
```bash
git init
git add .
git commit -m "Initial commit - Sistema RRHH Enterprise"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/sistema-rrhh.git
git push -u origin main
```

### **Paso 2: Crear cuenta en Render**
1. Ve a https://render.com
2. Sign up con GitHub
3. Autoriza acceso a tus repositorios

### **Paso 3: Crear PostgreSQL Database**
1. En Render Dashboard → "New +"
2. Selecciona "PostgreSQL"
3. Name: `rrhh-database`
4. Database: `rrhh_db`
5. User: (auto-generado)
6. Region: Oregon (US West) o Frankfurt (Europe)
7. PostgreSQL Version: 15
8. Click "Create Database"
9. **Copia la "Internal Database URL"** (para conectar desde tu app)

### **Paso 4: Crear Web Service**
1. En Render Dashboard → "New +"
2. Selecciona "Web Service"
3. Conecta tu repositorio de GitHub
4. Name: `rrhh-system`
5. Environment: `Node`
6. Region: Mismo que la DB
7. Branch: `main`
8. Build Command: `npm install`
9. Start Command: `npm start`
10. Plan: Free

### **Paso 5: Variables de Entorno**
En la sección "Environment Variables" agrega:
```
NODE_ENV=production
PORT=3000
DATABASE_URL=[La Internal Database URL que copiaste]
SESSION_SECRET=tu_secreto_super_seguro_aqui_cambiar
CORS_ORIGIN=https://tu-app.onrender.com
```

### **Paso 6: Deploy**
1. Click "Create Web Service"
2. Render automáticamente:
   - Clona tu repo
   - Instala dependencias
   - Ejecuta `npm start`
   - Asigna URL pública

### **Paso 7: Verifica**
1. Ve a la URL proporcionada: `https://rrhh-system.onrender.com`
2. Tu app está en producción 🎉

---

## 🔧 Archivos Necesarios para Deploy

### 1. `.env.example` (ya incluido en el proyecto)
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://usuario:password@localhost:5432/rrhh_db
SESSION_SECRET=cambiar_en_produccion
CORS_ORIGIN=http://localhost:3000
```

### 2. `render.yaml` (para deploy automático)
Ya incluido en el proyecto.

### 3. `.gitignore`
Ya incluido en el proyecto.

### 4. Scripts en `package.json`
Ya configurados.

---

## 🔒 Seguridad en Producción

### Variables de Entorno
✅ Nunca subir `.env` a GitHub
✅ Usar variables de entorno en Render
✅ Cambiar `SESSION_SECRET` en producción
✅ Configurar `CORS_ORIGIN` correctamente

### Base de Datos
✅ Usar URL interna de Render (más rápida)
✅ Backups automáticos habilitados
✅ SSL habilitado por defecto

### HTTPS
✅ Render proporciona SSL gratis automático
✅ Forzar HTTPS en producción

---

## 📊 Monitoreo

### Render Dashboard
- Logs en tiempo real
- Métricas de CPU/RAM
- Tráfico de red
- Errores y crashes

### Configurar Alertas
1. Render → Tu servicio → Settings
2. Notifications
3. Agregar email para alertas

---

## 💰 Costos Estimados

### Plan Gratuito (Ideal para empezar)
- Web Service: Gratis (con limitaciones)
- PostgreSQL: Gratis (1GB, 97 horas/mes)
- **Total: $0/mes**

### Plan Profesional (Recomendado para producción)
- Web Service: $7/mes
- PostgreSQL: $7/mes (256MB)
- **Total: $14/mes**

### Plan Business (100+ empleados constantes)
- Web Service: $25/mes
- PostgreSQL: $20/mes (1GB)
- **Total: $45/mes**

---

## 🚀 Alternativas Gratuitas Completas

### **Opción Gratuita 100%:**

**Frontend:** Vercel (gratis ilimitado)
**Backend:** Render Web Service (gratis con sleep)
**Database:** Supabase PostgreSQL (gratis 500MB)

**Pros:**
- 100% gratis
- Muy escalable
- Separación de concerns

**Contras:**
- Requiere configuración de CORS
- Backend "duerme" después de 15 min de inactividad (despierta en 30 seg)

---

## 🔄 CI/CD Automático

Render hace deploy automático cuando:
1. Haces `git push` a `main`
2. Detecta cambios en el código
3. Ejecuta build
4. Deploy automático

**No necesitas hacer nada más** después del setup inicial.

---

## 📈 Escalabilidad

### Para 100-500 empleados:
- Plan Free o Starter ($7/mes)
- PostgreSQL Free o Starter ($7/mes)

### Para 500-1000 empleados:
- Plan Standard ($25/mes)
- PostgreSQL Standard ($20/mes)

### Para 1000+ empleados:
- Plan Pro ($85/mes)
- PostgreSQL Pro ($40/mes)
- Considerar migrar a AWS/Azure

---

## 🎯 Próximos Pasos

1. ✅ Revisar archivos de configuración creados
2. ✅ Crear repositorio en GitHub
3. ✅ Crear cuenta en Render
4. ✅ Seguir pasos de deploy
5. ✅ Configurar variables de entorno
6. ✅ Probar en producción
7. ✅ Compartir URL con cliente

---

## 🆘 Troubleshooting

### Error: Cannot find module
**Solución:** Verificar que `package.json` tenga todas las dependencias

### Error: Port already in use
**Solución:** Render asigna puerto automáticamente, usar `process.env.PORT`

### Error: Database connection failed
**Solución:** Verificar DATABASE_URL en variables de entorno

### App muy lenta
**Solución:** Plan gratuito duerme después de 15 min. Upgrade a plan pagado.

---

## 📞 Soporte

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- Este proyecto: [GitHub Issues]

---

**¡Tu sistema RRHH Enterprise está listo para producción! 🚀**
