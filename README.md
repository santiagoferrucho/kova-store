# kova. Store 🌱
## Tienda de Productos Artesanales en Línea

**Caso Práctico 6.13** — Desarrollo de Aplicaciones Web (DAWeb 2026-10)  
Universidad Pontificia Bolivariana · Seccional Bucaramanga  
Docente: MSc. Lenin Javier Serrano Gil

---

## 📦 Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js 22 + Express.js |
| Base de datos | SQLite (`node:sqlite` — nativo Node 22) |
| Autenticación | JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`) |
| API Docs | Swagger UI (`swagger-ui-express`) |
| Seguridad | XSS sanitizer + protección por roles |
| Frontend | HTML5 + CSS3 + JavaScript Vanilla |
| CSS Framework | Bootstrap 5 (CDN) + Design System KOVA |
| Tests | Jest + Supertest |

---

## 🎨 Identidad de Marca KOVA

Paleta de colores conforme al Manual de Identidad KOVA v1.0:

| Nombre | Hex | Uso |
|--------|-----|-----|
| Azul Cosecha (Primario) | `#2A4D69` | Titulares, botones, navbar |
| Azul Cielo (Secundario) | `#4B86B4` | Acentos, hover |
| Azul Niebla (Acento) | `#ADCBE3` | Etiquetas, tag-line |
| Blanco Azulado (Texto) | `#E7EFF6` | Texto sobre fondos oscuros |
| Niebla Clara (Fondo) | `#F0F4F8` | Background general |

Tipografía: **Montserrat** (títulos) · **Lato** (cuerpo)

---

## 🚀 Instalación y ejecución

### Requisitos
- Node.js **v22+** (incluye `node:sqlite` nativo)
- npm v10+

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Edita JWT_SECRET en .env

# 3. Cargar datos de prueba (productos KOVA, usuarios, cupones)
npm run seed

# 4. Iniciar el servidor
npm start
```

Abre: **http://localhost:3000**  
API Docs: **http://localhost:3000/api-docs**

### Credenciales de prueba

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Admin | admin@kova.co | Admin2026! |
| Cliente | maria@example.com | Cliente123 |

### Cupones de descuento disponibles

| Código | Tipo | Valor |
|--------|------|-------|
| `COSECHA10` | Porcentaje | 10% |
| `BIENVENIDO5` | Monto fijo | $5.000 |
| `VOLUMEN15` | Por volumen (≥$80k) | 15% |

---

## 🧪 Tests

```bash
# Todos los tests
npm test

# Solo unitarios (Patrón Strategy)
node --experimental-sqlite node_modules/.bin/jest tests/unit --forceExit

# Solo integración
node --experimental-sqlite node_modules/.bin/jest tests/integration --runInBand --forceExit
```

**Resultados:**
```
PASS tests/unit/discountStrategy.test.js   (12 tests)
PASS tests/integration/app.test.js         (22 tests)
────────────────────────────────────────────────────
Test Suites: 2 passed · Tests: 34 passed, 0 failed
```

---

## 🏗 Arquitectura

```
kova-store/
├── server.js                    # Entry point — Express app
├── seed.js                      # Datos iniciales KOVA
├── src/
│   ├── config/
│   │   ├── database.js          # node:sqlite — init + runTransaction()
│   │   └── swagger.js           # OpenAPI 3.0 spec
│   ├── middleware/
│   │   ├── auth.js              # JWT: authenticate, optionalAuth, requireRole
│   │   └── xss.js              # Sanitización XSS recursiva
│   ├── services/
│   │   ├── DiscountStrategy.js  # ★ Patrón Strategy (descuentos)
│   │   └── EmailService.js      # Notificaciones simuladas → logs/email.log
│   ├── controllers/             # authController, productController,
│   │   └── ...                  #   categoryController, cartController,
│   │                            #   orderController, reviewController
│   └── routes/
│       └── index.js             # Todas las rutas con JSDoc @openapi
├── public/                      # Frontend estático
│   ├── index.html               # Catálogo con filtros y paginación
│   ├── product.html             # Detalle del producto + valoraciones
│   ├── cart.html                # Carrito de compras
│   ├── checkout.html            # Proceso de pago (simulado)
│   ├── login.html / register.html
│   ├── profile.html             # Historial de pedidos
│   ├── admin/                   # Panel de administración
│   │   ├── index.html           # Dashboard con estadísticas
│   │   ├── products.html        # CRUD de productos
│   │   ├── orders.html          # Gestión de pedidos
│   │   └── categories.html      # CRUD de categorías
│   ├── css/kova.css             # Design system KOVA completo
│   └── js/
│       ├── api.js               # Cliente HTTP centralizado con JWT
│       ├── cart.js              # ★ Patrón Observer (CartSubject/CartBadgeObserver)
│       └── utils.js             # toast, formatPrice, renderNavUser
└── tests/
    ├── unit/discountStrategy.test.js    # 12 pruebas unitarias
    └── integration/app.test.js         # 22 pruebas de integración
```

---

## 📐 Patrones de Diseño (RF 6.13.5)

### Backend — Patrón Strategy (Descuentos)

```
DiscountContext ──uses──▶ IDiscountStrategy
                               ▲
               ┌───────────────┼───────────────┐
    CouponDiscount   PercentDiscount   VolumeDiscount   NoDiscount
```

El contexto `CarritoDeCompras/Pedido` delega el cálculo del descuento
a la estrategia concreta, **intercambiable en tiempo de ejecución**.

### Frontend — Patrón Observer (Carrito)

```
CartSubject (Sujeto observado)
    │  subscribe(observer)
    │  notify() ────────────▶ CartBadgeObserver.update({ itemCount })
    │                              └── Actualiza badge sin recargar página
    └── addItem / removeItem / updateItem / clear
```

El ícono del carrito en el navbar se actualiza automáticamente desde
**cualquier parte de la aplicación** sin recargar la página.

---

## 🔒 Seguridad

- Contraseñas hasheadas con **bcrypt** (10 salt rounds)
- Tokens **JWT** firmados con clave secreta configurable
- Middleware **XSS** sanitiza todos los inputs (body + query)
- Protección por **roles** (client / admin) en cada endpoint sensible
- SQL parametrizado — sin concatenación directa (prevención SQL injection)
- Cabeceras CORS configuradas

---

## 📋 Criterios de Aceptación (6.13.7) — Estado

| Criterio | Estado |
|---------|--------|
| Admin gestiona ciclo de vida completo del producto | ✅ |
| Cliente puede registrarse, iniciar sesión y hacer checkout | ✅ |
| Listado con paginación, filtrado y búsqueda de texto | ✅ |
| Ícono del carrito actualiza sin recargar página (Observer) | ✅ |
| Solo compradores pueden valorar productos | ✅ |
| API RESTful documentada en Swagger UI | ✅ |
| Pruebas unitarias (lógica de negocio) e integración (casos de uso) | ✅ |
| API transaccional (checkout atómico) | ✅ |

---

## 📡 Endpoints principales

| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| POST | `/api/auth/register` | Registro de cliente | Público |
| POST | `/api/auth/login` | Inicio de sesión | Público |
| GET | `/api/products` | Listar con filtros y paginación | Público |
| GET | `/api/products/:id` | Detalle del producto | Público |
| POST | `/api/products` | Crear producto | Admin |
| PUT | `/api/products/:id` | Actualizar producto/stock | Admin |
| DELETE | `/api/products/:id` | Eliminar (soft delete) | Admin |
| GET | `/api/categories` | Listar categorías | Público |
| GET | `/api/cart` | Ver carrito | Cliente |
| POST | `/api/cart/items` | Agregar al carrito | Cliente |
| POST | `/api/cart/sync` | Sincronizar carrito guest→DB | Cliente |
| POST | `/api/orders/checkout` | Crear pedido (transaccional) | Cliente |
| GET | `/api/orders/my` | Mis pedidos | Cliente |
| GET | `/api/orders` | Todos los pedidos | Admin |
| PUT | `/api/orders/:id/status` | Cambiar estado | Admin |
| GET | `/api/products/:id/reviews` | Valoraciones | Público |
| POST | `/api/products/:id/reviews` | Valorar (solo compradores) | Cliente |

Documentación completa interactiva: `http://localhost:3000/api-docs`

---

*KOVA · «Lo bueno se siembra, se cuida y se comparte.»*
