# Despliegue en Vercel — KOVA Store

## Requisitos previos

- Cuenta en [vercel.com](https://vercel.com) (gratuita)
- [Vercel CLI](https://vercel.com/docs/cli) instalado: `npm i -g vercel`
- Node.js v22+ en tu máquina

---

## Opción A — Vercel CLI (recomendada)

```bash
# 1. Instalar dependencias y compilar
npm install
npm run build

# 2. Login en Vercel
vercel login

# 3. Desplegar (primera vez)
vercel

# Vercel preguntará:
#   Set up and deploy? → Y
#   Which scope?       → tu cuenta
#   Link to existing?  → N
#   Project name?      → kova-store (o el que quieras)
#   In which directory? → ./ (Enter)
#   Override settings? → N

# 4. Despliegue a producción
vercel --prod
```

El deploy genera una URL como: `https://kova-store-xxx.vercel.app`

---

## Opción B — GitHub + Vercel (auto-deploy)

1. Sube el proyecto a un repositorio en GitHub:
   ```bash
   git init
   git add .
   git commit -m "kova store inicial"
   git remote add origin https://github.com/TU_USUARIO/kova-store.git
   git push -u origin main
   ```

2. En [vercel.com/new](https://vercel.com/new):
   - Conecta tu cuenta de GitHub
   - Importa el repositorio `kova-store`
   - **Framework Preset:** Other
   - **Build Command:** `npm run vercel-build`
   - **Output Directory:** `.` (punto)
   - **Install Command:** `npm install`
   - Click **Deploy**

3. Cada `git push` despliega automáticamente.

---

## Variables de entorno en Vercel

En el dashboard de Vercel → Settings → Environment Variables, agrega:

| Variable | Valor | Entorno |
|---|---|---|
| `NODE_OPTIONS` | `--experimental-sqlite` | Production, Preview, Development |
| `JWT_SECRET` | un valor seguro aleatorio | Production |
| `NODE_ENV` | `production` | Production |

> **Nota:** `NODE_OPTIONS` ya está en `vercel.json`, pero puedes sobreescribirlo desde el dashboard.

---

## Comportamiento en Vercel

### Base de datos
Vercel usa funciones serverless con sistema de archivos **efímero**. La BD SQLite se crea en `/tmp/kova.db` y se **auto-siembra** en cada arranque frío con:
- 4 categorías
- 14 productos KOVA
- 2 usuarios demo
- 3 cupones de descuento

> Los datos se **reinician** en cada cold start (normal en entornos demo/académicos).
> Para persistencia en producción real: usar [Turso](https://turso.tech) (SQLite serverless) o [Neon](https://neon.tech) (Postgres).

### Credenciales demo
```
Admin:   admin@kova.co    / Admin2026!
Cliente: maria@example.com / Cliente123
Cupones: COSECHA10 · BIENVENIDO5 · VOLUMEN15
```

### URLs disponibles
- `/` → Tienda (catálogo)
- `/admin/` → Panel administrador
- `/api-docs` → Documentación Swagger
- `/login.html`, `/register.html`, `/cart.html`, etc.

---

## Verificar el despliegue

```bash
# Probar la API
curl https://TU-URL.vercel.app/api/categories

# Probar login
curl -X POST https://TU-URL.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kova.co","password":"Admin2026!"}'
```

---

## Notas técnicas

- Runtime: **Node.js 22.x** (requerido para `node:sqlite`)
- El flag `--experimental-sqlite` se inyecta via `NODE_OPTIONS` en `vercel.json`
- Función serverless con 1024 MB de memoria y 30s de timeout
- Los archivos de `public/` se incluyen en el bundle via `includeFiles`
