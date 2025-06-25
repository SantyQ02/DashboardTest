import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { getVisibleModels } from "../../../../shared/models-config.ts";
import { GenericCrudView } from "../crud/GenericCrudView";
import { DashboardContent } from "../dashboard-content";

function GenericCrudViewWrapper() {
  const { model } = useParams();
  if (!model) return <Navigate to="/dashboard" replace />;
  return <GenericCrudView modelName={model} className="max-w-7xl mx-auto" />;
}

/**
 * Router automático que genera rutas reales basadas en la configuración de modelos
 */
export function AutoRouter() {
  const visibleModels = getVisibleModels();

  return (
    <Routes>
      {/* Ruta del Dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardContent />} />

      {/* Rutas automáticas para todos los modelos */}
      {visibleModels.map((model) => [
        <Route
          key={model.name}
          path={`/${model.name}`}
          element={
            <GenericCrudView modelName={model.name} className="max-w-7xl mx-auto" />
          }
        />,
        <Route
          key={model.name + "-details"}
          path={`/${model.name}/:id`}
          element={
            <GenericCrudView modelName={model.name} className="max-w-7xl mx-auto" />
          }
        />,
        <Route
          key={model.name + "-nested"}
          path={`/${model.name}/:id/*splat`}
          element={
            <GenericCrudView modelName={model.name} className="max-w-7xl mx-auto" />
          }
        />,
      ])}

      {/* Ruta wildcard general para máxima robustez */}
      <Route path="/:model/:id/*" element={<GenericCrudViewWrapper />} />

      {/* Rutas especiales */}
      <Route
        path="/settings"
        element={<div className="p-6">Settings Page (Coming Soon)</div>}
      />

      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

/**
 * Componente para mostrar información de rutas disponibles (útil para debugging)
 */
export function RoutesDebugInfo() {
  const visibleModels = getVisibleModels();

  return (
    <div className="p-4 bg-muted rounded-lg">
      <h3 className="font-semibold mb-2">Available Routes:</h3>
      <ul className="space-y-1 text-sm">
        <li>• /dashboard - Dashboard</li>
        {visibleModels.map((model) => (
          <li key={model.name}>
            • /{model.name} - {model.ui.pluralName} Management
          </li>
        ))}
        <li>• /settings - Settings</li>
      </ul>

      <h3 className="font-semibold mt-4 mb-2">Model Features:</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleModels.map((model) => (
          <div key={model.name} className="p-3 bg-background rounded border">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium">{model.ui.displayName}</h4>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                {model.ui.group}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{model.ui.description}</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(model.features)
                .filter(([, enabled]) => enabled)
                .map(([feature]) => (
                  <span
                    key={feature}
                    className="inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-1.5 py-0.5 rounded text-xs"
                  >
                    {feature}
                  </span>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
