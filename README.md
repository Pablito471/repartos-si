# Repartos SI 🚚

Sistema integral de gestión de repartos para clientes, depósitos y transportistas con soporte para empleados, escáner de códigos de barras y estadísticas en tiempo real.

## 🚀 Características

### Usuarios Principales

- **Clientes**: Gestión de pedidos, seguimiento en tiempo real, contabilidad, relaciones con depósitos
- **Depósitos**: Inventario, preparación de pedidos, envíos, gestión de productos
- **Fletes**: Rutas, entregas, ganancias, seguimiento GPS

### Sistema de Empleados

- **Empleados de Depósito**: Acceso exclusivo por escáner para ventas y gestión de stock
- **Empleados de Cliente**: Acceso exclusivo por escáner para ventas y gestión de stock
- **Estadísticas**: Panel de rendimiento por empleado con filtros de fecha
- **Multisesión**: Múltiples empleados pueden usar el sistema simultáneamente

### Escáner de Códigos de Barras

- **Modos de operación**: Vender, Agregar Stock, Consultar Precio
- **Formatos soportados**: EAN-13, EAN-8, UPC-A, UPC-E, CODE-128, CODE-39, QR
- **Creación de productos**: Al escanear un código no existente, permite crear el producto
- **Debounce**: Evita lecturas duplicadas (2 segundos entre lecturas del mismo código)

### Funcionalidades Adicionales

- **Admin**: Panel de administración oculto, gestión de usuarios, calificaciones
- **Chat en tiempo real**: Comunicación entre usuarios (Pusher/WebSockets)
- **Notificaciones**: Alertas en tiempo real de pedidos, envíos y stock bajo
- **Tema oscuro/claro**: Soporte completo para ambos temas

## 🛠️ Tecnologías

### Frontend

- **Next.js 14** - Framework de React
- **Tailwind CSS** - Estilos
- **SweetAlert2** - Alertas elegantes
- **Socket.io Client** - WebSockets

### Backend

- **Express.js** - API REST
- **PostgreSQL** - Base de datos
- **Sequelize** - ORM
- **Socket.io** - WebSockets
- **JWT** - Autenticación

## 📦 Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/repartos-si.git
cd repartos-si

# Instalar dependencias del frontend
cd frontend
npm install

# Instalar dependencias del backend
cd ../backend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar el archivo .env con tus credenciales

# Ejecutar backend
npm run dev

# En otra terminal, ejecutar frontend
cd ../frontend
npm run dev
```

## 🌐 Deploy en Vercel

Este proyecto está configurado para deployar **Frontend y Backend por separado** en Vercel.

### Requisitos previos

1. **Base de datos PostgreSQL en la nube** (recomendados):
   - [Neon](https://neon.tech) - Gratis, muy rápido
   - [Supabase](https://supabase.com) - Gratis, con extras
   - [Railway](https://railway.app) - Simple, escalable

2. **Cuenta en Vercel**: https://vercel.com

### Paso 1: Deploy del Backend

```bash
# Instalar Vercel CLI
npm i -g vercel

# Ir a la carpeta del backend
cd backend

# Login en Vercel
vercel login

# Deploy (seguir instrucciones)
vercel

# Deploy a producción
vercel --prod
```

**Variables de entorno a configurar en Vercel (Settings > Environment Variables):**

| Variable         | Descripción                 | Ejemplo                                               |
| ---------------- | --------------------------- | ----------------------------------------------------- |
| `DATABASE_URL`   | URL completa de PostgreSQL  | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `DB_HOST`        | Host de la BD (alternativo) | `your-db.neon.tech`                                   |
| `DB_PORT`        | Puerto de la BD             | `5432`                                                |
| `DB_NAME`        | Nombre de la BD             | `repartos_si`                                         |
| `DB_USER`        | Usuario de la BD            | `your_user`                                           |
| `DB_PASSWORD`    | Contraseña de la BD         | `your_password`                                       |
| `JWT_SECRET`     | Clave secreta para JWT      | `tu-clave-super-secreta-larga`                        |
| `FRONTEND_URL`   | URL del frontend desplegado | `https://tu-frontend.vercel.app`                      |
| `NODE_ENV`       | Entorno                     | `production`                                          |
| `PUSHER_APP_ID`  | ID de app Pusher            | `123456`                                              |
| `PUSHER_KEY`     | Key pública de Pusher       | `abc123def456`                                        |
| `PUSHER_SECRET`  | Secret de Pusher            | `secret123`                                           |
| `PUSHER_CLUSTER` | Cluster de Pusher           | `us2`                                                 |

### Paso 2: Deploy del Frontend

```bash
# Ir a la carpeta del frontend
cd frontend

# Deploy
vercel

# Deploy a producción
vercel --prod
```

**Variables de entorno a configurar en Vercel:**

| Variable                     | Descripción            | Ejemplo                             |
| ---------------------------- | ---------------------- | ----------------------------------- |
| `NEXT_PUBLIC_API_URL`        | URL del backend + /api | `https://tu-backend.vercel.app/api` |
| `NEXT_PUBLIC_PUSHER_KEY`     | Key pública de Pusher  | `abc123def456`                      |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Cluster de Pusher      | `us2`                               |

### Paso 3: Actualizar URLs cruzadas

1. En el proyecto del **Backend**, actualiza `FRONTEND_URL` con la URL real del frontend
2. En el proyecto del **Frontend**, actualiza `NEXT_PUBLIC_API_URL` con la URL real del backend
3. Redeploya ambos proyectos

### Paso 4: Inicializar Base de Datos

```bash
# Desde el backend local conectado a la BD de producción
cd backend
npm run db:seed
```

## 🔌 WebSockets con Pusher

Este proyecto usa **Pusher** para WebSockets en modo serverless. Pusher tiene un **tier gratuito** generoso (200K mensajes/día).

### Configurar Pusher

1. Crea una cuenta en [pusher.com](https://pusher.com)
2. Crea una nueva app (Channels)
3. Copia las credenciales (App ID, Key, Secret, Cluster)
4. Configura las variables de entorno en Vercel (backend y frontend)

### Funcionalidades en tiempo real

- ✅ Chat entre usuarios y admin
- ✅ Notificaciones de nuevos pedidos
- ✅ Actualizaciones de estado de pedidos
- ✅ Notificaciones de envíos
- ✅ Alertas de stock bajo

## 🔐 Usuarios de prueba

### Usuarios Principales

| Tipo     | Email              | Contraseña |
| -------- | ------------------ | ---------- |
| Cliente  | cliente@test.com   | 123456     |
| Depósito | deposito@test.com  | 123456     |
| Flete    | flete@test.com     | 123456     |
| Admin    | admin@repartos.com | admin123   |

### Empleados

| Tipo              | Email              | Contraseña |
| ----------------- | ------------------ | ---------- |
| Empleado Depósito | empleado1@test.com | 123456     |
| Empleado Depósito | empleado2@test.com | 123456     |
| Empleado Cliente  | empleado3@test.com | 123456     |
| Empleado Cliente  | empleado4@test.com | 123456     |

## 📱 Flujos de Trabajo

### Flujo de Empleado (Escáner)

```
1. Empleado inicia sesión → Redirigido a /empleado
2. Selecciona modo: Vender | Agregar Stock | Consultar Precio
3. Inicia escáner de cámara o ingresa código manual
4. Si producto existe → Muestra info y permite operación
5. Si producto NO existe → Formulario para crear producto
6. Confirma operación → Se registra con empleado_id
```

### Flujo de Venta (Depósito/Cliente)

```
1. Cliente crea pedido a depósito
2. Depósito prepara pedido (o empleado vía escáner)
3. Depósito asigna flete
4. Flete recoge y entrega
5. Cliente confirma recepción
6. Se pueden calificar mutuamente
```

## 🔌 API Endpoints Principales

### Autenticación

```
POST /api/auth/login          # Iniciar sesión
POST /api/auth/registro       # Registrar usuario
GET  /api/auth/me             # Obtener usuario actual
PUT  /api/auth/perfil         # Actualizar perfil
```

### Empleados (Escáner)

```
POST /api/empleados/escaner/buscar          # Buscar producto por código
POST /api/empleados/escaner/venta           # Registrar venta
POST /api/empleados/escaner/agregar-stock   # Agregar stock
POST /api/empleados/escaner/crear-producto  # Crear nuevo producto
GET  /api/empleados/estadisticas            # Estadísticas generales
GET  /api/empleados/:id/estadisticas        # Estadísticas por empleado
```

### Productos y Stock

```
GET    /api/productos              # Listar productos
POST   /api/productos              # Crear producto
GET    /api/productos/:id          # Obtener producto
PUT    /api/productos/:id          # Actualizar producto
DELETE /api/productos/:id          # Eliminar producto
GET    /api/stock                  # Obtener stock
POST   /api/movimientos            # Registrar movimiento
```

### Pedidos y Envíos

```
GET    /api/pedidos                # Listar pedidos
POST   /api/pedidos                # Crear pedido
PUT    /api/pedidos/:id            # Actualizar pedido
GET    /api/envios                 # Listar envíos
POST   /api/envios                 # Crear envío
PUT    /api/envios/:id             # Actualizar envío
```

## 📁 Estructura del proyecto

```
repartos-si/
├── frontend/                 # Aplicación Next.js
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   │   ├── layouts/      # Layouts por tipo de usuario
│   │   │   ├── CalificarModal.jsx
│   │   │   ├── ChatWidget.jsx
│   │   │   └── ...
│   │   ├── context/          # Contextos de React
│   │   │   ├── AuthContext.jsx    # Autenticación (multisesión)
│   │   │   ├── ChatContext.jsx
│   │   │   └── ...
│   │   ├── pages/            # Páginas de la aplicación
│   │   │   ├── empleado/     # Panel del empleado (escáner)
│   │   │   ├── clientes/     # Panel de clientes
│   │   │   ├── depositos/    # Panel de depósitos
│   │   │   ├── fletes/       # Panel de fletes
│   │   │   ├── admin/        # Panel de administración
│   │   │   └── auth/         # Login, registro, etc.
│   │   ├── services/         # Servicios API
│   │   │   └── api.js        # Cliente HTTP con interceptores
│   │   └── utils/            # Utilidades
│   └── vercel.json           # Config Vercel frontend
│
├── backend/                  # API Express.js
│   ├── api/
│   │   └── index.js          # Entry point serverless
│   ├── src/
│   │   ├── controllers/      # Controladores
│   │   │   ├── authController.js
│   │   │   ├── empleadosController.js  # Lógica del escáner
│   │   │   ├── productosController.js
│   │   │   └── ...
│   │   ├── models/           # Modelos Sequelize
│   │   │   ├── Usuario.js    # Incluye tipo 'empleado'
│   │   │   ├── Producto.js
│   │   │   ├── Movimiento.js # Incluye empleado_id
│   │   │   └── ...
│   │   ├── routes/           # Rutas API
│   │   │   ├── empleados.js  # Rutas del escáner
│   │   │   └── ...
│   │   ├── middleware/       # Middlewares
│   │   │   └── auth.js       # JWT + verificación de empleado
│   │   ├── services/         # Servicios
│   │   │   └── pusherService.js
│   │   └── scripts/          # Scripts de BD
│   │       ├── seed.js
│   │       └── limpiarDatosYActualizarEmpleados.js
│   └── vercel.json           # Config Vercel backend
│
└── README.md
```

## ⚡ Multisesión

El sistema soporta **múltiples sesiones simultáneas** usando `sessionStorage` en lugar de `localStorage`:

- Cada pestaña del navegador tiene su propia sesión independiente
- Un depósito puede tener varios empleados trabajando al mismo tiempo
- No hay conflictos entre usuarios en el mismo navegador
- Tokens JWT independientes por sesión

```
Ejemplo:
├── Pestaña 1: Depósito (deposito@test.com)
├── Pestaña 2: Empleado 1 (empleado1@test.com)
├── Pestaña 3: Empleado 2 (empleado2@test.com)
└── Pestaña 4: Cliente (cliente@test.com)
→ Todas funcionando simultáneamente sin conflictos
```

## 📄 Scripts

### Frontend

```bash
npm run dev      # Desarrollo
npm run build    # Build de producción
npm run start    # Iniciar servidor de producción
npm run lint     # Verificar código
```

### Backend

```bash
npm run dev      # Desarrollo con nodemon
npm run start    # Producción
npm run db:sync  # Sincronizar BD
npm run db:seed  # Poblar BD con datos iniciales
```

## 🎨 Temas de colores

- **Clientes**: Azul (#3B82F6)
- **Depósitos**: Verde (#22C55E)
- **Fletes**: Naranja (#F97316)
- **Admin**: Rojo (#DC2626)
- **Empleados**: Púrpura (#8B5CF6)

## 📊 Estadísticas de Empleados

Los depósitos y clientes pueden ver estadísticas de sus empleados:

| Métrica            | Descripción                         |
| ------------------ | ----------------------------------- |
| Total ventas       | Número de ventas realizadas         |
| Monto total        | Suma de todos los montos vendidos   |
| Productos vendidos | Cantidad total de unidades vendidas |

**Filtros disponibles:**

- Hoy
- Esta semana
- Este mes
- Rango personalizado

## 🔧 Scripts de Mantenimiento

```bash
# Limpiar base de datos (conserva usuarios)
cd backend
node src/scripts/limpiarDatosYActualizarEmpleados.js

# Sincronizar modelos con BD
npm run db:sync

# Poblar con datos de prueba
npm run db:seed
```

## 📝 Licencia

## MIT

## © Copyright

**© 2026 Rubiño Pablo Hernán. Todos los derechos reservados.**

Este software y su documentación están protegidos por las leyes de derechos de autor.
Queda prohibida su reproducción, distribución o uso sin autorización expresa del autor.
