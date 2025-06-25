# SaveApp Dashboard

Un panel de administración moderno para SaveApp construido con React, TypeScript, Tailwind CSS y shadcn/ui.

## 🏗️ Arquitectura

Este proyecto utiliza una arquitectura de monorepo con:

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript + MongoDB + Mongoose
- **Autenticación**: Firebase Authentication
- **Base de Datos**: MongoDB (local o Atlas)

## 📁 Estructura del Proyecto

```
SaveApp-Dashboard/
├── frontend/                 # Aplicación React
│   ├── src/
│   │   ├── components/      # Componentes de UI
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # Servicios de API
│   │   └── types/          # Tipos TypeScript
│   └── package.json
├── backend/                 # API Node.js
│   ├── src/
│   │   ├── controllers/    # Controladores de la API
│   │   ├── models/         # Modelos de Mongoose
│   │   ├── routes/         # Rutas de la API
│   │   ├── config/         # Configuración
│   │   └── seeders/        # Datos de ejemplo
│   └── package.json
└── README.md
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+ 
- MongoDB (local o Atlas)
- Firebase project (para autenticación)

### 1. Clonar y instalar dependencias

```bash
git clone <repository-url>
cd SaveApp-Dashboard

# Instalar dependencias del frontend
cd frontend
npm install

# Instalar dependencias del backend
cd ../backend
npm install
```

### 2. Configurar variables de entorno

#### Frontend (.env en frontend/)
```env
VITE_API_URL=http://localhost:3001/api
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

#### Backend (.env en backend/)
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/saveapp-dashboard
FRONTEND_URL=http://localhost:5173
```

### 3. Iniciar MongoDB

```bash
# Local MongoDB
mongod

# O usar Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Poblar la base de datos con datos de ejemplo

```bash
cd backend
npm run seed
```

### 5. Iniciar los servicios

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 📊 API Endpoints

### Base URL: `http://localhost:3001/api`

### Cards
- `GET /cards` - Obtener todas las tarjetas (con paginación, filtrado y ordenamiento)
- `GET /cards/:id` - Obtener una tarjeta específica
- `POST /cards` - Crear una nueva tarjeta
- `PUT /cards/:id` - Actualizar una tarjeta
- `DELETE /cards/:id` - Eliminar una tarjeta

### Banks
- `GET /banks` - Obtener todos los bancos
- `GET /banks/:id` - Obtener un banco específico
- `POST /banks` - Crear un nuevo banco
- `PUT /banks/:id` - Actualizar un banco
- `DELETE /banks/:id` - Eliminar un banco

### Categories
- `GET /categories` - Obtener todas las categorías
- `GET /categories/:id` - Obtener una categoría específica
- `POST /categories` - Crear una nueva categoría
- `PUT /categories/:id` - Actualizar una categoría
- `DELETE /categories/:id` - Eliminar una categoría

### Parámetros de consulta comunes
- `page` - Número de página (default: 1)
- `limit` - Elementos por página (default: 10)
- `sort` - Campo de ordenamiento (default: createdAt)
- `order` - Orden: "asc" o "desc" (default: desc)
- `search` - Término de búsqueda

### Ejemplo de uso
```bash
# Obtener tarjetas con paginación y búsqueda
curl "http://localhost:3001/api/cards?page=1&limit=5&search=santander&sort=name&order=asc"

# Crear una nueva tarjeta
curl -X POST http://localhost:3001/api/cards \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Card",
    "brand": "Visa",
    "category": "Travel",
    "bank": "Test Bank",
    "annualFee": 50,
    "interestRate": 15.5,
    "creditLimit": 5000,
    "rewards": "2% cashback on travel"
  }'
```

## 🛠️ Scripts Disponibles

### Frontend
```bash
npm run dev          # Desarrollo con hot reload
npm run build        # Build de producción
npm run preview      # Preview del build
```

### Backend
```bash
npm run dev          # Desarrollo con hot reload
npm run build        # Compilar TypeScript
npm run start        # Iniciar en producción
npm run seed         # Poblar base de datos con datos de ejemplo
```

## 🔧 Características

### Frontend
- ✅ Panel de administración responsive
- ✅ Autenticación con Firebase
- ✅ Dashboard personalizable con React Grid Layout
- ✅ CRUD completo para Cards, Banks y Categories
- ✅ Filtrado, ordenamiento y paginación
- ✅ Tema claro/oscuro
- ✅ Componentes de shadcn/ui
- ✅ TypeScript para type safety

### Backend
- ✅ API RESTful completa
- ✅ MongoDB con Mongoose
- ✅ Validación de datos
- ✅ Manejo de errores
- ✅ Paginación y búsqueda
- ✅ Logging de requests
- ✅ CORS configurado
- ✅ Datos de ejemplo incluidos

## 📚 Documentación

- [API Documentation](./backend/API_DOCUMENTATION.md) - Documentación completa de la API
- [Architecture](./ARCHITECTURE.md) - Detalles de la arquitectura
- [Setup](./SETUP.md) - Guía de configuración detallada

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC. Ver el archivo `LICENSE` para más detalles.
