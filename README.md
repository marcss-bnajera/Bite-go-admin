# 👑 Bite&Go Admin Service (`Bite-go-admin`)

API administrativa de la plataforma Bite&Go. CRUD completo de restaurantes, usuarios staff, productos, inventario, pedidos, reservas, recetas y eventos.

![Node](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js)
![Express](https://img.shields.io/badge/Express-5.2-000000?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?logo=mongodb)
![JWT](https://img.shields.io/badge/Auth-JWT_HS256-000000?logo=jsonwebtokens)

---

## 📋 Descripción

Microservicio Node.js que expone la API administrativa del ecosistema Bite&Go. Es consumido exclusivamente por el frontend `client-admin-bite-go`. Gestiona 12 módulos CRUD, con control de acceso basado en roles (SuperAdmin, Admin_Restaurante, Mesero, Cocinero, Repartidor) e incluye un sistema de sucursales con inventario independiente.

---

## 🏗️ Arquitectura

```
Bite-go-admin/
├── configs/                      # Configuración del servidor
│   ├── app.js                    # Express setup, middleware, routes, server init
│   ├── db.js                     # Conexión MongoDB + graceful shutdown
│   ├── cors-configuration.js     # CORS (ALLOWED_ORIGIN)
│   └── helmet-configuration.js   # Seguridad HTTP headers
│
├── middlewares/                  # 19 middlewares
│   ├── validate-jwt.js           # Verifica JWT del auth-service .NET
│   ├── validate-roles.js         # hasRole(), checkRestaurantOwnership()
│   ├── validate-inter-service.js # API key para endpoints internos
│   ├── check-validators.js       # express-validator result checker
│   ├── handle-errors.js          # Error handler global
│   ├── request-limit.js          # Rate limiter (2k req/15min)
│   ├── file-uploader.js          # Multer + Cloudinary (productos/restaurantes)
│   ├── delete-file-on-error.js   # Cleanup Cloudinary
│   ├── enrich-user-from-db.js    # Obtiene id_restaurante del usuario
│   ├── categories-validator.js
│   ├── inventory-validators.js
│   ├── items-validators.js
│   ├── order-validator.js
│   ├── order-logic-validators.js
│   ├── product-validators.js
│   ├── recipes-validator.js
│   ├── reservations-validator.js
│   ├── restaurants-validator.js
│   └── suppliesInventory-validators.js
│
├── scripts/                      # Scripts de utilería
│   └── migrate-sucursales.js     # Migración backward-compatible de sucursales
│
├── src/                          # Módulos de la aplicación
│   ├── users/                    # CRUD usuarios staff
│   ├── restaurants/              # CRUD restaurantes + sucursales + mesas
│   ├── orders/                   # CRUD pedidos + filtros
│   ├── reservations/             # CRUD reservas + check-in
│   ├── products/                 # CRUD productos
│   ├── categories/               # CRUD categorías
│   ├── suppliesInventory/        # Inventario de suministros + alertas stock bajo
│   ├── items/                    # Items de pedidos
│   ├── recipes/                  # Recetas (ingredientes de productos)
│   ├── tables/                   # Gestión de mesas
│   ├── gastronomicEvents/        # Eventos gastronómicos
│   └── inter-service/            # Endpoints internos (sin JWT, con API key)
│
├── index.js                      # Entry point
├── Dockerfile                    # node:18-alpine
└── .env.example                  # Template de variables de entorno
```

---

## ⚙️ Stack

| Dependencia | Versión | Propósito |
|-------------|---------|-----------|
| `express` | ^5.2.1 | Framework HTTP |
| `mongoose` | ^9.2.1 | ODM MongoDB |
| `jsonwebtoken` | ^9.0.3 | Validación JWT |
| `bcryptjs` | ^3.0.3 | Hashing de contraseñas staff |
| `express-validator` | ^7.3.1 | Validación de requests |
| `cors` | ^2.8.6 | CORS |
| `helmet` | ^8.1.0 | Seguridad headers |
| `morgan` | ^1.10.1 | Logging HTTP |
| `express-rate-limit` | ^8.2.1 | Rate limiting |
| `multer` + `cloudinary` | — | Upload de fotos a Cloudinary |
| `uuid` | ^13.0.0 | Generación de IDs |

---

## 📡 Endpoints

Base URL: **`/bite-and-go/v1`** | Puerto: **`3002`**

### 👤 Usuarios Staff (Solo SuperAdmin)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/users` | Listar usuarios (paginado, filtro activo) |
| `POST` | `/users/register` | Crear usuario staff |
| `PUT` | `/users/:id` | Actualizar usuario |
| `DELETE` | `/users/:id` | Desactivar (soft-delete) |
| `PATCH` | `/users/:id/activate` | Reactivar usuario |

### 🏪 Restaurantes

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| `GET` | `/restaurants` | Authenticated | Listar (paginado) |
| `POST` | `/restaurants` | SuperAdmin | Crear restaurante |
| `PUT` | `/restaurants/:id` | SuperAdmin, Admin_Rest | Actualizar |
| `DELETE` | `/restaurants/:id` | SuperAdmin | Desactivar (soft-delete) |
| `PATCH` | `/restaurants/:id/activate` | SuperAdmin | Reactivar |
| `POST` | `/restaurants/:id/foto` | SuperAdmin, Admin_Rest | Subir foto (Cloudinary) |

#### 🏙️ Sucursales

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/restaurants/:id/sucursales` | Listar sucursales |
| `POST` | `/restaurants/:id/sucursales` | Agregar sucursal |
| `PUT` | `/restaurants/:id/sucursales/:sucursalId` | Actualizar sucursal |
| `DELETE` | `/restaurants/:id/sucursales/:sucursalId` | Eliminar sucursal |
| `POST` | `/restaurants/:id/sucursales/:sucursalId/mesas` | Agregar mesa a sucursal |
| `PUT` | `/restaurants/:id/sucursales/:sucursalId/mesas/:mesaId` | Actualizar mesa de sucursal |
| `DELETE` | `/restaurants/:id/sucursales/:sucursalId/mesas/:mesaId` | Eliminar mesa de sucursal |

### 🪑 Mesas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/tables/:id` | Mesas del restaurante (raíz) |
| `POST` | `/tables/:id` | Agregar mesa raíz |
| `PUT` | `/tables/:restId/:mesaId` | Actualizar mesa |
| `DELETE` | `/tables/:restId/:mesaId` | Eliminar mesa |

### 📦 Pedidos

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/orders` | Listar (filtros: activo, id_sucursal) |
| `GET` | `/orders/:id` | Detalle del pedido |
| `GET` | `/orders/user/:id_user` | Pedidos por usuario (auth_id) |
| `GET` | `/orders/restaurant/:id_restaurante` | Pedidos por restaurante |
| `POST` | `/orders` | Crear pedido (valida stock) |
| `PUT` | `/orders/:id` | Actualizar estado/asignaciones |
| `DELETE` | `/orders/:id` | Cancelar (soft-delete) |

### 🪑 Reservas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/reservations` | Listar (paginado, filtrable) |
| `POST` | `/reservations` | Crear (valida capacidad, solapamiento, horario) |
| `PUT` | `/reservations/:id` | Actualizar |
| `DELETE` | `/reservations/:id` | Cancelar (soft-delete) |
| `PUT` | `/reservations/:id/check-in` | Marcar como atendida |

### 🍽️ Productos

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| `GET` | `/products` | Authenticated | Listar (paginado, búsqueda) |
| `GET` | `/products/:id` | Authenticated | Detalle |
| `GET` | `/products/restaurant/:id_restaurante` | Authenticated | Productos por restaurante |
| `POST` | `/products` | SuperAdmin, Admin_Rest | Crear (con foto, receta, variaciones) |
| `PUT` | `/products/:id` | SuperAdmin, Admin_Rest | Actualizar |
| `DELETE` | `/products/:id` | SuperAdmin, Admin_Rest | Desactivar |

### 📂 Otros Módulos (CRUD completo)

| Módulo | Endpoints | Descripción |
|--------|-----------|-------------|
| `categories` | `GET/POST /categories`, `PUT/DELETE /categories/:id` | Categorías de productos |
| `suppliesInventory` | `GET/POST /suppliesInventory`, `PUT/DELETE /suppliesInventory/:id` | Inventario + alertas stock bajo |
| `items` | `GET/POST /items/:id`, `PUT/DELETE /items/:orderId/:itemId` | Items dentro de pedidos |
| `recipes` | `GET/POST /recipes/:id`, `PUT/DELETE /recipes/:productId/:recipeId` | Ingredientes de productos |
| `gastronomicEvents` | `GET/POST /gastronomicEvents/:id`, `PUT/DELETE /gastronomicEvents/:restId/:eventoId` | Eventos del restaurante |

### 🔒 Inter-service (red interna Docker)

| Método | Ruta | Headers | Descripción |
|--------|------|---------|-------------|
| `POST` | `/inventory/check` | `X-Internal-Secret` | Verificar disponibilidad de stock |
| `POST` | `/inventory/reduce` | `X-Internal-Secret` | Reducir stock al crear pedido |
| `POST` | `/inventory/restore` | `X-Internal-Secret` | Restaurar stock al cancelar pedido |

### 🩺 Health

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/bite-and-go/v1/prueba` | Health check con versión |
| `GET` | `/health` | Health check para Render |

---

## 🔧 Variables de Entorno

| Variable | Default | Obligatoria | Descripción |
|----------|---------|:-----------:|-------------|
| `PORT` | `3002` | ✅ | Puerto del servidor |
| `URL_MONGODB` | — | ✅ | Conexión a MongoDB |
| `JWT_SECRET` | — | ✅ | Mismo que auth-service |
| `JWT_ISSUER` | `BiteGoAuthService` | ✅ | Mismo que auth-service |
| `JWT_AUDIENCE` | `BiteGoServices` | ✅ | Mismo que auth-service |
| `AUTH_SERVICE_URL` | — | ✅ | URL del auth-service |
| `INTER_SERVICE_SECRET` | — | ✅ | API key para inter-service |
| `ALLOWED_ORIGIN` | `*` | — | Orígenes CORS permitidos |
| `CLOUDINARY_CLOUD_NAME` | — | ✅ | Cloud name |

---

## 🚀 Inicio Rápido

### Local

```bash
# 1. Clonar e instalar
cd Bite-go-admin
cp .env.example .env

# 2. Editar .env — valores requeridos
npm install
npm run dev    # nodemon con autoreload
npm start      # producción
```

### Docker

```bash
# Desde la raíz del monorepo:
docker compose up --build admin-service
```

---

## 🚢 Despliegue (Render)

```yaml
# Render Dashboard:
# - Runtime: Docker
# - Puerto: 3002
# - Health Check Path: /health
# - Environment Variables: todas las del .env
```

---

## ❓ Troubleshooting

| Problema | Causa | Solución |
|----------|-------|----------|
| `403 Forbidden` | Rol no autorizado | Verificar el claim `role` del JWT |
| Admin_Restaurante ve datos de otro restaurante | `checkRestaurantOwnership` no ejecutándose | Revisar que `enrichUserFromDB` se ejecute |
| Stock no se reduce al crear pedido | Inter-service secret incorrecto | Verificar `INTER_SERVICE_SECRET` coincide |
