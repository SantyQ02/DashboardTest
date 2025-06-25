# Mejoras de Animaciones de Modales

## Problemas Resueltos

### 1. Animaciones Inconsistentes

- **Problema**: Diferentes componentes de modal usaban animaciones diferentes
- **Solución**: Sistema unificado de animaciones en `tailwind.config.js`

### 2. Efecto de "Aparece Grande y Se Achica"

- **Problema**: Las animaciones de zoom causaban un efecto visual desagradable
- **Solución**: Animaciones de escala más suaves con `modal-scale-in` y `modal-scale-out`

### 3. Recarga de Página en Navegación

- **Problema**: `navigate()` causaba recarga completa de la página
- **Solución**: Hook `useInternalNavigation` para navegación sin recarga

## Animaciones Implementadas

### Fade (Overlay)

```css
modal-fade-in: 0.15s ease-out
modal-fade-out: 0.15s ease-out
```

### Scale (Contenido del Modal)

```css
modal-scale-in: 0.2s ease-out
modal-scale-out: 0.15s ease-out
```

### Slide (Alternativa)

```css
modal-slide-in: 0.2s ease-out
modal-slide-out: 0.15s ease-out
```

## Componentes Actualizados

1. **Dialog** (`src/components/ui/layout/dialog.tsx`)
2. **Dialog** (`@/components/ui/dialog.tsx`)
3. **Sheet** (`src/components/ui/layout/sheet.tsx`)
4. **RecordDetailView** (`src/components/record-detail-view.tsx`)
5. **GenericCrudView** (`src/components/crud/GenericCrudView.tsx`)
6. **CrudTable** (`src/components/crud-table.tsx`)

## Hook de Navegación Interna

```typescript
import { useInternalNavigation } from "../hooks/use-internal-navigation";

const { navigate, goBack, goForward } = useInternalNavigation();

// Navegar sin recarga
navigate("/users/123/profile");
```

## Beneficios

1. **Experiencia de Usuario Mejorada**: Animaciones más suaves y consistentes
2. **Navegación Fluida**: Sin recargas de página al navegar entre objetos anidados
3. **Rendimiento**: Menos re-renders y mejor performance
4. **Consistencia**: Todas las ventanas modales usan las mismas animaciones
5. **Accesibilidad**: Animaciones respetan las preferencias del usuario

## Mejores Prácticas Implementadas

- **Duración Óptima**: 150-200ms para animaciones rápidas pero perceptibles
- **Easing Consistente**: `ease-out` para todas las animaciones
- **Transformaciones Optimizadas**: Uso de `transform` en lugar de propiedades que causan reflow
- **Navegación SPA**: Uso de `history.pushState` para navegación sin recarga
