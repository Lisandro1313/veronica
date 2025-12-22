# 🚀 Sistema RRHH - Listo para Producción

Sistema de gestión de Recursos Humanos con **PostgreSQL**, preparado para deployment en **Render.com**.

## ✨ Características

- ✅ **Dark Mode** - Tema oscuro con persistencia
- ✅ **Print Profile** - Impresión profesional
- ✅ **Estadísticas Comparativas** - Tendencias mes a mes
- ✅ **RBAC** - 4 roles de acceso
- ✅ **Dashboard Avanzado** - KPIs y gráficos
- ✅ **PostgreSQL** - Base de datos robusta

## 🚀 Deploy Rápido en Render

### 1. Crear PostgreSQL en Render
```
Dashboard → New + → PostgreSQL → Free Plan
Guardar: Internal Database URL
```

### 2. Inicializar Base de Datos
```bash
# En Shell de Render, ejecutar:
\i init-db.sql
```

### 3. Crear Web Service
```
New + → Web Service → Conectar GitHub
Build: npm install
Start: npm start
Environment Variables:
  - DATABASE_URL: (tu Internal Database URL)
  - NODE_ENV: production
```

**📖 Guía completa:** [RENDER_DEPLOY.md](./RENDER_DEPLOY.md)

## 👤 Login

| Usuario | Password | Rol |
|---------|----------|-----|
| admin | admin123 | Admin |
| rrhh | rrhh123 | RRHH |
| manager | manager123 | Manager |
| usuario | usuario123 | Usuario |

## 📁 Archivos Importantes

- `server.js` - API REST con PostgreSQL
- `db.js` - Conexión a BD
- `init-db.sql` - Script de inicialización
- `migrate-data.js` - Migración de datos JSON
- `RENDER_DEPLOY.md` - Guía de deployment

## 🔌 API

```
POST   /api/login
GET    /api/empleados
POST   /api/empleados
PUT    /api/empleados/:id
DELETE /api/empleados/:id
GET    /api/tickets
POST   /api/tickets
GET    /health
```

## 💰 Costo

**Render Free:** $0/mes (Web Service + PostgreSQL)

## 📚 Documentación

- [RENDER_DEPLOY.md](./RENDER_DEPLOY.md) - Guía completa
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Comparación plataformas
- [README_DESARROLLO.md](./README_DESARROLLO.md) - Doc completa de desarrollo

---

**Versión 2.0.0** - PostgreSQL  
**Stack:** Node.js + Express + PostgreSQL + Vanilla JS

