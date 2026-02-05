# Repartos SI 🚚

Sistema integral de gestión de repartos para clientes, depósitos y transportistas.

## 🚀 Características

- **Clientes**: Gestión de pedidos, seguimiento en tiempo real, contabilidad
- **Depósitos**: Inventario, preparación de pedidos, envíos
- **Fletes**: Rutas, entregas, ganancias
- **Admin**: Panel de administración oculto, gestión de usuarios, calificaciones
- **Chat en tiempo real**: Comunicación entre usuarios (WebSockets)

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

| Tipo     | Email              | Contraseña |
| -------- | ------------------ | ---------- |
| Cliente  | cliente@test.com   | 123456     |
| Depósito | deposito@test.com  | 123456     |
| Flete    | flete@test.com     | 123456     |
| Admin    | admin@repartos.com | admin123   |

## 📁 Estructura del proyecto

```
repartos-si/
├── frontend/                 # Aplicación Next.js
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   ├── context/          # Contextos de React
│   │   ├── pages/            # Páginas de la aplicación
│   │   ├── services/         # Servicios API
│   │   └── utils/            # Utilidades
│   └── vercel.json           # Config Vercel frontend
│
├── backend/                  # API Express.js
│   ├── api/
│   │   └── index.js          # Entry point serverless
│   ├── src/
│   │   ├── controllers/      # Controladores
│   │   ├── models/           # Modelos Sequelize
│   │   ├── routes/           # Rutas API
│   │   ├── middleware/       # Middlewares
│   │   └── services/         # Servicios
│   └── vercel.json           # Config Vercel backend
│
└── README.md
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

## 📝 Licencia

MIT
