<p align="center">
  <img src="https://img.icons8.com/color/96/delivery-truck.png" alt="Repartos SI Logo"/>
</p>

<h1 align="center">🚚 Repartos SI</h1>

<p align="center">
  <strong>Sistema integral de gestión de repartos para clientes, depósitos y transportistas</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version"/>
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License"/>
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node"/>
  <img src="https://img.shields.io/badge/next.js-14-black.svg" alt="Next.js"/>
  <img src="https://img.shields.io/badge/express-4.x-lightgrey.svg" alt="Express"/>
  <img src="https://img.shields.io/badge/PostgreSQL-15-blue.svg" alt="PostgreSQL"/>
</p>

<p align="center">
  <a href="#-características">Características</a> •
  <a href="#-tecnologías">Tecnologías</a> •
  <a href="#-instalación">Instalación</a> •
  <a href="#-deploy">Deploy</a> •
  <a href="#-documentación">Documentación</a>
</p>

---

## ✨ Características

<table>
<tr>
<td width="50%">

### 👥 Usuarios Principales

| Rol              | Funcionalidades                    |
| ---------------- | ---------------------------------- |
| 🔵 **Clientes**  | Pedidos, seguimiento, contabilidad |
| 🟢 **Depósitos** | Inventario, envíos, productos      |
| 🟠 **Fletes**    | Rutas, entregas, ganancias         |
| 🔴 **Admin**     | Panel oculto, gestión total        |

</td>
<td width="50%">

### 👷 Sistema de Empleados

| Característica      | Descripción                           |
| ------------------- | ------------------------------------- |
| 📱 **Escáner**      | Acceso exclusivo por código de barras |
| 📊 **Estadísticas** | Rendimiento con filtros de fecha      |
| 🔄 **Multisesión**  | Múltiples empleados simultáneos       |
| 💼 **Tipos**        | Empleados de depósito y cliente       |

</td>
</tr>
</table>

### 📷 Escáner de Códigos de Barras

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 MODOS DE OPERACIÓN                                      │
├─────────────────────────────────────────────────────────────┤
│  💰 Vender          │  Registrar venta de producto          │
│  📦 Agregar Stock   │  Añadir productos al inventario       │
│  💲 Consultar Precio│  Ver información del producto         │
└─────────────────────────────────────────────────────────────┘
```

**Formatos soportados:** `EAN-13` `EAN-8` `UPC-A` `UPC-E` `CODE-128` `CODE-39` `QR`

### 🔔 Funcionalidades en Tiempo Real

- ✅ Chat entre usuarios y admin
- ✅ Notificaciones de nuevos pedidos
- ✅ Actualizaciones de estado
- ✅ Alertas de stock bajo
- ✅ Tema oscuro/claro

---

## 🛠️ Tecnologías

<table>
<tr>
<td align="center" width="50%">

### 🎨 Frontend

<p>
<img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js"/>
<img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
<img src="https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind"/>
</p>

| Librería     | Uso             |
| ------------ | --------------- |
| Next.js 14   | Framework React |
| Tailwind CSS | Estilos         |
| SweetAlert2  | Alertas         |
| html5-qrcode | Escáner         |

</td>
<td align="center" width="50%">

### ⚙️ Backend

<p>
<img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express"/>
<img src="https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
<img src="https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white" alt="Sequelize"/>
</p>

| Librería   | Uso           |
| ---------- | ------------- |
| Express.js | API REST      |
| PostgreSQL | Base de datos |
| Sequelize  | ORM           |
| JWT        | Autenticación |

</td>
</tr>
</table>

---

## 📦 Instalación

### Requisitos Previos

- **Node.js** >= 18.0.0
- **PostgreSQL** >= 14
- **npm** o **yarn**

### ⚡ Inicio Rápido

```bash
# 1️⃣ Clonar el repositorio
git clone https://github.com/tu-usuario/repartos-si.git
cd repartos-si

# 2️⃣ Instalar dependencias
cd frontend && npm install
cd ../backend && npm install

# 3️⃣ Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4️⃣ Ejecutar en desarrollo
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

---

## 🌐 Deploy

### 🔷 Vercel (Recomendado)

<details>
<summary><b>📋 Variables de Entorno - Backend</b></summary>

| Variable         | Descripción       | Ejemplo                               |
| ---------------- | ----------------- | ------------------------------------- |
| `DATABASE_URL`   | URL PostgreSQL    | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET`     | Clave secreta JWT | `tu-clave-super-secreta`              |
| `FRONTEND_URL`   | URL del frontend  | `https://tu-frontend.vercel.app`      |
| `PUSHER_APP_ID`  | ID de Pusher      | `123456`                              |
| `PUSHER_KEY`     | Key de Pusher     | `abc123`                              |
| `PUSHER_SECRET`  | Secret de Pusher  | `secret123`                           |
| `PUSHER_CLUSTER` | Cluster de Pusher | `us2`                                 |

</details>

<details>
<summary><b>📋 Variables de Entorno - Frontend</b></summary>

| Variable                     | Descripción     | Ejemplo                             |
| ---------------------------- | --------------- | ----------------------------------- |
| `NEXT_PUBLIC_API_URL`        | URL del backend | `https://tu-backend.vercel.app/api` |
| `NEXT_PUBLIC_PUSHER_KEY`     | Key de Pusher   | `abc123`                            |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Cluster         | `us2`                               |

</details>

### 🗄️ Base de Datos Recomendadas

| Servicio                         | Tier Gratuito | Características        |
| -------------------------------- | ------------- | ---------------------- |
| [Neon](https://neon.tech)        | ✅            | Muy rápido, serverless |
| [Supabase](https://supabase.com) | ✅            | Con extras incluidos   |
| [Railway](https://railway.app)   | ✅            | Simple, escalable      |

---

## 🔐 Usuarios de Prueba

<table>
<tr>
<td>

### 👤 Principales

| Tipo        | Email                | Pass       |
| ----------- | -------------------- | ---------- |
| 🔵 Cliente  | `cliente@test.com`   | `123456`   |
| 🟢 Depósito | `deposito@test.com`  | `123456`   |
| 🟠 Flete    | `flete@test.com`     | `123456`   |
| 🔴 Admin    | `admin@repartos.com` | `admin123` |

</td>
<td>

### 👷 Empleados

| Tipo        | Email                | Pass     |
| ----------- | -------------------- | -------- |
| 🟣 Depósito | `empleado1@test.com` | `123456` |
| 🟣 Depósito | `empleado2@test.com` | `123456` |
| 🟣 Cliente  | `empleado3@test.com` | `123456` |
| 🟣 Cliente  | `empleado4@test.com` | `123456` |

</td>
</tr>
</table>

---

## 📱 Flujos de Trabajo

### 🔄 Flujo de Empleado (Escáner)

```mermaid
graph LR
    A[👷 Login] --> B[📱 /empleado]
    B --> C{Seleccionar Modo}
    C -->|Vender| D[💰 Registrar Venta]
    C -->|Stock| E[📦 Agregar Stock]
    C -->|Precio| F[💲 Consultar]
    D --> G[✅ Confirmar]
    E --> G
```

### 📦 Flujo de Venta

```
Cliente ──────► Depósito ──────► Flete ──────► Cliente
  │               │               │             │
  └─ Crea pedido  └─ Prepara      └─ Entrega    └─ Confirma
                     y asigna                      y califica
```

---

## 🔌 API Endpoints

<details>
<summary><b>🔑 Autenticación</b></summary>

```http
POST   /api/auth/login          # Iniciar sesión
POST   /api/auth/registro       # Registrar usuario
GET    /api/auth/me             # Usuario actual
PUT    /api/auth/perfil         # Actualizar perfil
```

</details>

<details>
<summary><b>👷 Empleados (Escáner)</b></summary>

```http
POST   /api/empleados/escaner/buscar          # Buscar producto
POST   /api/empleados/escaner/venta           # Registrar venta
POST   /api/empleados/escaner/agregar-stock   # Agregar stock
POST   /api/empleados/escaner/crear-producto  # Crear producto
GET    /api/empleados/estadisticas            # Estadísticas
GET    /api/empleados/:id/estadisticas        # Stats por empleado
```

</details>

<details>
<summary><b>📦 Productos y Stock</b></summary>

```http
GET    /api/productos              # Listar productos
POST   /api/productos              # Crear producto
GET    /api/productos/:id          # Obtener producto
PUT    /api/productos/:id          # Actualizar
DELETE /api/productos/:id          # Eliminar
GET    /api/stock                  # Obtener stock
POST   /api/movimientos            # Registrar movimiento
```

</details>

<details>
<summary><b>📋 Pedidos y Envíos</b></summary>

```http
GET    /api/pedidos                # Listar pedidos
POST   /api/pedidos                # Crear pedido
PUT    /api/pedidos/:id            # Actualizar pedido
GET    /api/envios                 # Listar envíos
POST   /api/envios                 # Crear envío
PUT    /api/envios/:id             # Actualizar envío
```

</details>

---

## 📁 Estructura del Proyecto

```
repartos-si/
│
├── 🎨 frontend/                    # Next.js App
│   ├── src/
│   │   ├── components/            # Componentes UI
│   │   │   ├── layouts/           # Layouts por usuario
│   │   │   ├── ChatWidget.jsx
│   │   │   └── CalificarModal.jsx
│   │   ├── context/               # Estado global
│   │   │   ├── AuthContext.jsx    # Autenticación
│   │   │   └── ChatContext.jsx
│   │   ├── pages/                 # Páginas
│   │   │   ├── empleado/          # 👷 Panel escáner
│   │   │   ├── clientes/          # 🔵 Panel cliente
│   │   │   ├── depositos/         # 🟢 Panel depósito
│   │   │   ├── fletes/            # 🟠 Panel flete
│   │   │   └── admin/             # 🔴 Panel admin
│   │   └── services/api.js        # Cliente HTTP
│   └── vercel.json
│
├── ⚙️ backend/                     # Express API
│   ├── src/
│   │   ├── controllers/           # Lógica de negocio
│   │   ├── models/                # Modelos Sequelize
│   │   ├── routes/                # Rutas API
│   │   ├── middleware/            # Auth, errors
│   │   └── services/              # Pusher, email
│   └── vercel.json
│
├── 📄 LICENSE
└── 📖 README.md
```

---

## ⚡ Multisesión

El sistema usa `sessionStorage` para soportar **múltiples sesiones simultáneas**:

```
┌─────────────────────────────────────────────────────┐
│  🖥️ MISMO NAVEGADOR - DIFERENTES PESTAÑAS          │
├─────────────────────────────────────────────────────┤
│  Pestaña 1  │  🟢 Depósito (deposito@test.com)     │
│  Pestaña 2  │  🟣 Empleado 1 (empleado1@test.com)  │
│  Pestaña 3  │  🟣 Empleado 2 (empleado2@test.com)  │
│  Pestaña 4  │  🔵 Cliente (cliente@test.com)       │
├─────────────────────────────────────────────────────┤
│  ✅ Todas funcionando simultáneamente sin conflictos │
└─────────────────────────────────────────────────────┘
```

---

## 🎨 Temas de Colores

| Usuario      | Color   | Hex       |
| ------------ | ------- | --------- |
| 🔵 Clientes  | Azul    | `#3B82F6` |
| 🟢 Depósitos | Verde   | `#22C55E` |
| 🟠 Fletes    | Naranja | `#F97316` |
| 🔴 Admin     | Rojo    | `#DC2626` |
| 🟣 Empleados | Púrpura | `#8B5CF6` |

---

## 📊 Estadísticas de Empleados

| Métrica         | Descripción                   |
| --------------- | ----------------------------- |
| 📈 Total ventas | Número de ventas realizadas   |
| 💰 Monto total  | Suma de todos los montos      |
| 📦 Productos    | Cantidad de unidades vendidas |

**Filtros:** `Hoy` `Esta semana` `Este mes` `Rango personalizado`

---

## 📄 Scripts

| Comando           | Descripción         |
| ----------------- | ------------------- |
| `npm run dev`     | 🔧 Desarrollo       |
| `npm run build`   | 📦 Build producción |
| `npm run start`   | 🚀 Iniciar servidor |
| `npm run db:sync` | 🔄 Sincronizar BD   |
| `npm run db:seed` | 🌱 Poblar datos     |

---

## 📝 Licencia

Este proyecto está bajo la licencia **MIT**. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

<p align="center">
  <b>© 2026 Rubiño Pablo Hernán. Todos los derechos reservados.</b>
</p>

<p align="center">
  <sub>Hecho con ❤️ en Argentina 🇦🇷</sub>
</p>

<p align="center">
  <a href="#-repartos-si">⬆️ Volver arriba</a>
</p>
