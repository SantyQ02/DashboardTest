# SaveApp Dashboard Architecture

This document describes the architecture and technical decisions for the SaveApp Admin Dashboard.

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **TailwindCSS** for styling
- **shadcn/ui** for UI components
- **React Hook Form** with Zod validation
- **React Router** for navigation

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **Firebase Admin SDK** for authentication

## Architecture Overview

The SaveApp Dashboard follows a **modular, factory-based architecture** that automatically generates CRUD operations, routes, and UI components based on a centralized configuration. This approach significantly reduces code duplication and makes adding new data models extremely simple.

### Core Design Principles

1. **Configuration-Driven Development**: All models are defined in a single shared configuration file
2. **Automatic Code Generation**: Controllers, routes, and UI components are generated automatically
3. **Feature Toggles**: Each model can have features (create, read, update, delete, etc.) enabled/disabled independently
4. **Type Safety**: Full TypeScript support throughout the application
5. **Modularity**: Clean separation between generated and custom code

## Project Structure

```
SaveApp-Dashboard/
├── shared/                    # Shared configuration between frontend and backend
│   └── models-config.ts       # Central model configuration
├── frontend/                  # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/            # Organized UI components
│   │   │   │   ├── base/      # Basic components (buttons, dropdowns)
│   │   │   │   ├── forms/     # Form-related components
│   │   │   │   ├── layout/    # Layout components (cards, dialogs)
│   │   │   │   ├── data-display/ # Data visualization components
│   │   │   │   └── feedback/  # User feedback components
│   │   │   ├── crud/          # Generic CRUD components
│   │   │   └── features/      # Feature-specific components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API and external services
│   │   ├── types/             # TypeScript type definitions
│   │   └── lib/               # Utility functions
│   └── public/                # Static assets
├── backend/                   # Express backend API
│   ├── src/
│   │   ├── factories/         # Auto-generation factories
│   │   ├── controllers/       # Request handlers (manual + generated)
│   │   ├── models/            # Database models
│   │   ├── routes/            # API routes (manual + generated)
│   │   ├── middleware/        # Express middleware
│   │   ├── services/          # Business logic
│   │   └── config/            # Configuration files
│   └── scripts/               # Database scripts
└── docs/                      # Documentation
```

## Auto-Generation System

### 1. Model Configuration (`shared/models-config.ts`)

The heart of the system is a centralized configuration that defines:

```typescript
export interface ModelConfig {
  name: string                 // URL path and API endpoint
  mongooseModel: string        // Mongoose model name
  features: ModelFeatures      // Enabled/disabled features
  ui: ModelUIConfig           // UI configuration
  priority?: number           // Sidebar ordering
  hidden?: boolean            // Hide from sidebar
  adminOnly?: boolean         // Admin-only access
}
```

**Features that can be toggled:**
- `create`: Add new records
- `read`: View records
- `update`: Edit records
- `delete`: Soft delete records
- `restore`: Restore deleted records
- `export`: Export data
- `import`: Import data
- `bulkOperations`: Bulk create/update
- `search`: Text search
- `filters`: Advanced filtering
- `sort`: Column sorting
- `viewTrash`: View deleted records

### 2. Backend Auto-Generation

#### CrudControllerFactory
Automatically generates all CRUD operations for any Mongoose model:

```typescript
// Auto-generates these endpoints based on enabled features:
GET    /api/{model}              // List with pagination
GET    /api/{model}/deleted      // List deleted records
GET    /api/{model}/export       // Export data
GET    /api/{model}/:id          // Get by ID
POST   /api/{model}              // Create new
POST   /api/{model}/bulk         // Bulk create
POST   /api/{model}/validate-bulk // Validate import data
PUT    /api/{model}/:id          // Update
DELETE /api/{model}/:id          // Soft delete
PATCH  /api/{model}/:id/restore  // Restore
```

#### CrudRouterFactory
Automatically registers all routes with proper middleware:

```typescript
// Single line registers all CRUD routes for all models
CrudRouterFactory.registerAllRoutes(app, models, MODELS_CONFIG, authenticateToken)
```

### 3. Frontend Auto-Generation

#### GenericCrudView
A single component that provides full CRUD functionality for any model:

```typescript
// One component handles all models
<GenericCrudView modelName="banks" />
<GenericCrudView modelName="users" />
// etc.
```

#### DynamicSidebar
Automatically generates navigation based on model configuration:

```typescript
// Sidebar is built automatically from MODELS_CONFIG
// Groups models by category
// Shows proper icons and labels
// Handles active states
```

## Authentication Flow

### Secure Token Exchange Process

1. **User Submits Credentials**
   ```
   Frontend: authService.signin(email, password)
   ```

2. **Backend Validates with Firebase**
   ```
   Backend: POST /auth/signin
   • Validates credentials with Firebase REST API
   • Creates custom token with Firebase Admin SDK
   • Returns custom token + user data
   ```

3. **Frontend Signs in with Custom Token**
   ```
   Frontend: signInWithCustomToken(customToken)
   • Firebase generates ID token
   • Stores token and user data
   • Sets up automatic token refresh
   ```

4. **API Requests**
   ```
   Frontend: apiRequest() with Bearer token
   Backend: authenticateToken middleware verifies token
   ```

### Token Management

- **ID Tokens**: Short-lived, used for API requests
- **Custom Tokens**: Generated by backend, used for Firebase sign-in
- **Automatic Refresh**: Firebase handles token renewal
- **Secure Storage**: Tokens stored in localStorage with cleanup on errors

## Adding New Models

Adding a new data model is extremely simple:

1. **Add to shared configuration:**
   ```typescript
   // shared/models-config.ts
   newModel: {
     name: 'newmodel',
     mongooseModel: 'NewModel',
     features: { ...defaultFeatures },
     ui: {
       icon: 'Database',
       displayName: 'New Model',
       pluralName: 'New Models',
       group: 'Business'
     }
   }
   ```

2. **Backend automatically generates:**
   - Full CRUD controller
   - All API routes
   - Input validation
   - Export/import functionality

3. **Frontend automatically generates:**
   - Sidebar navigation item
   - CRUD interface
   - Forms with validation
   - Data tables with pagination

4. **Optional customization:**
   - Override generated components if needed
   - Add custom business logic
   - Implement model-specific features

## Key Benefits

### 🚀 **Rapid Development**
- New models can be added in minutes, not hours
- No repetitive CRUD code to write
- Automatic API generation

### 🔧 **Maintainability**
- Single source of truth for model configuration
- Consistent patterns across all models
- Easy to update features globally

### 🎯 **Flexibility**
- Features can be enabled/disabled per model
- Easy to customize specific models when needed
- Clean separation between generated and custom code

### 🛡️ **Type Safety**
- Full TypeScript support
- Shared types between frontend and backend
- Compile-time error checking

### 📊 **Consistency**
- Uniform UI/UX across all models
- Consistent API patterns
- Standardized error handling

## Security

- **JWT-based authentication** with Firebase
- **Role-based access control** (in development)
- **Input validation** and sanitization
- **CORS protection**
- **Environment-based configuration**
- **Feature-level permissions** per model

## Performance

- **Lazy loading** of components
- **Optimized bundle splitting**
- **Efficient database queries** with pagination
- **Caching** of model schemas
- **Parallel API requests** where possible

## Deployment

The application supports multiple deployment strategies:
- **Development**: Local development with hot reload
- **Staging**: Preview deployments for testing
- **Production**: Optimized builds with environment-specific configs

## Future Enhancements

- **Role-based permissions** per model feature
- **Real-time updates** with WebSockets
- **Advanced reporting** and analytics
- **API versioning** support
- **Plugin system** for custom extensions 