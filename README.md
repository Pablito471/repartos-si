# Repartos SI 🚚

Sistema integral de gestión de repartos para clientes, depósitos y transportistas.

## 🚀 Características

- **Clientes**: Gestión de pedidos, seguimiento en tiempo real, contabilidad
- **Depósitos**: Inventario, preparación de pedidos, envíos
- **Fletes**: Rutas, entregas, ganancias
- **Admin**: Panel de administración oculto, gestión de usuarios, calificaciones

## 🛠️ Tecnologías

- **Next.js 14** - Framework de React
- **Tailwind CSS** - Estilos
- **SweetAlert2** - Alertas elegantes
- **LocalStorage** - Persistencia de datos (demo)

## 📦 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/repartos-si.git

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

## 🌐 Deploy en Vercel

### Opción 1: Deploy automático

1. Conecta tu repositorio de GitHub a [Vercel](https://vercel.com)
2. Vercel detectará automáticamente que es un proyecto Next.js
3. Click en "Deploy"

### Opción 2: Deploy manual con CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login en Vercel
vercel login

# Deploy
vercel

# Deploy a producción
vercel --prod
```

## 🔐 Usuarios de prueba

| Tipo     | Email              | Contraseña |
| -------- | ------------------ | ---------- |
| Cliente  | cliente@test.com   | 123456     |
| Depósito | deposito@test.com  | 123456     |
| Flete    | flete@test.com     | 123456     |
| Admin    | admin@repartos.com | admin123   |

## 📁 Estructura del proyecto

```
src/
├── components/       # Componentes reutilizables
│   ├── layouts/      # Layouts por tipo de usuario
│   ├── Logo.jsx      # Logo del sistema
│   └── ...
├── context/          # Contextos de React
│   ├── AuthContext   # Autenticación
│   ├── ClienteContext
│   ├── DepositoContext
│   └── FleteContext
├── pages/            # Páginas de la aplicación
│   ├── admin/        # Panel de administración
│   ├── auth/         # Login y registro
│   ├── clientes/     # Dashboard de clientes
│   ├── depositos/    # Dashboard de depósitos
│   └── fletes/       # Dashboard de fletes
└── utils/            # Utilidades y helpers
```

## 📄 Scripts

```bash
npm run dev      # Desarrollo
npm run build    # Build de producción
npm run start    # Iniciar servidor de producción
npm run lint     # Verificar código
```

## 🎨 Temas de colores

- **Clientes**: Azul (#3B82F6)
- **Depósitos**: Verde (#22C55E)
- **Fletes**: Naranja (#F97316)
- **Admin**: Rojo (#DC2626)

## 📝 Licencia

MIT
