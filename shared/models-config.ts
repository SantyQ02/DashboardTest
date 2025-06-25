// Import del nuevo objeto collections de saveapp-org/shared
// Nota: Este import debe apuntar al paquete real cuando esté disponible
// Por ahora definimos la estructura aquí como referencia
export const collections = Object.freeze({
  user: {
    collectionName: "users",
    modelName: "User",
    model: {} as any, // UserModel,
  },
  tracking: {
    collectionName: "trackings",
    modelName: "Tracking",
    model: {} as any, // TrackingModel,
  },
  poi: {
    collectionName: "pois",
    modelName: "Poi",
    model: {} as any, // PoiModel,
  },
  category: {
    collectionName: "categories",
    modelName: "Category",
    model: {} as any, // CategoryModel,
  },
  store: {
    collectionName: "stores",
    modelName: "Store",
    model: {} as any, // StoreModel,
  },
  offer: {
    collectionName: "offers",
    modelName: "Offer",
    model: {} as any, // OfferModel,
  },
  comment: {
    collectionName: "comments",
    modelName: "Comment",
    model: {} as any, // CommentModel,
  },
  card: {
    collectionName: "cards",
    modelName: "Card",
    model: {} as any, // CardModel,
  },
  brand: {
    collectionName: "brands",
    modelName: "Brand",
    model: {} as any, // BrandModel,
  },
  bank: {
    collectionName: "banks",
    modelName: "Bank",
    model: {} as any, // BankModel,
  },
} as const);

export interface ModelFeatures {
  create?: boolean
  read?: boolean
  update?: boolean
  delete?: boolean
  restore?: boolean
  export?: boolean
  import?: boolean
  bulkOperations?: boolean
  search?: boolean
  filters?: boolean
  sort?: boolean
  viewTrash?: boolean
}

export interface ModelUIConfig {
  icon: string
  color?: string
  group?: string
  description?: string
  displayName?: string
  pluralName?: string
}

export interface ModelConfig {
  name: string
  displayName: string
  pluralName: string
  collectionName: string
  modelName: string
  features: ModelFeatures
  ui: ModelUIConfig
  searchFields: string[]
  priority?: number
  hidden?: boolean
  adminOnly?: boolean
}

// Configuración por defecto para todos los modelos
const defaultFeatures: ModelFeatures = {
  create: true,
  read: true,
  update: true,
  delete: true,
  restore: true,
  export: true,
  import: true,
  bulkOperations: true,
  search: true,
  filters: true,
  sort: true,
  viewTrash: true
}

// Configuración específica por modelo basada en modelName
const modelSpecificConfig: Record<string, Partial<ModelConfig>> = {
  User: {
    features: { ...defaultFeatures },
    searchFields: ['name', 'email', 'phone'],
    ui: {
      icon: 'Users',
      color: 'blue',
      group: 'Core',
      description: 'Manage application users',
    },
    priority: 1
  },
  Bank: {
    features: { ...defaultFeatures },
    searchFields: ['name', 'logo'],
    ui: {
      icon: 'Building2',
      color: 'green',
      group: 'Financial',
      description: 'Manage partner banks and financial institutions',
    },
    priority: 2
  },
  Category: {
    features: { ...defaultFeatures },
    searchFields: ['name', 'description'],
    ui: {
      icon: 'Tags',
      color: 'purple',
      group: 'Core',
      description: 'Manage offer categories',
    },
    priority: 3
  },
  Brand: {
    features: { ...defaultFeatures },
    searchFields: ['name', 'logo'],
    ui: {
      icon: 'Award',
      color: 'orange',
      group: 'Financial',
      description: 'Manage card brands',
    },
    priority: 4
  },
  Card: {
    features: { ...defaultFeatures },
    searchFields: ['name', 'brand', 'bank'],
    ui: {
      icon: 'CreditCard',
      color: 'indigo',
      group: 'Financial',
      description: 'Manage credit and debit cards',
    },
    priority: 5
  },
  Store: {
    features: { ...defaultFeatures },
    searchFields: ['name', 'address', 'phone', 'url'],
    ui: {
      icon: 'Store',
      color: 'teal',
      group: 'Business',
      description: 'Manage partner stores',
    },
    priority: 6
  },
  Offer: {
    features: { ...defaultFeatures },
    searchFields: ['title', 'description', 'store', 'category'],
    ui: {
      icon: 'Gift',
      color: 'red',
      group: 'Business',
      description: 'Manage offers and promotions',
    },
    priority: 7
  },
  Comment: {
    features: {
      ...defaultFeatures,
      import: false,
      bulkOperations: false
    },
    searchFields: ['content', 'author'],
    ui: {
      icon: 'MessageCircle',
      color: 'gray',
      group: 'Content',
      description: 'Manage user comments and reviews',
    },
    priority: 8
  },
  Tracking: {
    features: {
      ...defaultFeatures,
      create: false,
      update: false,
      import: false,
      bulkOperations: false
    },
    searchFields: ['action', 'userId', 'resource'],
    ui: {
      icon: 'Activity',
      color: 'cyan',
      group: 'Analytics',
      description: 'View user activity tracking',
    },
    priority: 9,
    adminOnly: true
  },
  Poi: {
    features: { ...defaultFeatures },
    searchFields: ['name', 'address', 'description', 'category'],
    ui: {
      icon: 'MapPin',
      color: 'emerald',
      group: 'Location',
      description: 'Manage points of interest',
    },
    priority: 10
  }
}

// Generar configuración completa basada en collections
function generateModelConfig(): Record<string, ModelConfig> {
  const config: Record<string, ModelConfig> = {}
  
  Object.entries(collections).forEach(([_, collectionInfo]) => {
    const { collectionName, modelName } = collectionInfo
    const specificConfig = modelSpecificConfig[modelName] || {}
    
    // Generar displayName y pluralName a partir del modelName
    const displayName = modelName
    const pluralName = specificConfig.ui?.pluralName || 
                      (modelName.endsWith('y') ? modelName.slice(0, -1) + 'ies' : 
                       modelName.endsWith('s') ? modelName + 'es' : 
                       modelName + 's')
    
    config[collectionName] = {
      name: collectionName,
      displayName,
      pluralName,
      collectionName,
      modelName,
      features: specificConfig.features || defaultFeatures,
      searchFields: specificConfig.searchFields || ['name'],
      ui: {
        icon: specificConfig.ui?.icon || 'Circle',
        color: specificConfig.ui?.color || 'gray',
        group: specificConfig.ui?.group || 'Other',
        description: specificConfig.ui?.description || `Manage ${pluralName.toLowerCase()}`,
        displayName,
        pluralName,
        ...specificConfig.ui
      },
      priority: specificConfig.priority || 999,
      hidden: specificConfig.hidden || false,
      adminOnly: specificConfig.adminOnly || false,
    }
  })
  
  return config
}

// Configuración generada automáticamente
export const MODELS_CONFIG = generateModelConfig()

// Utilidades para trabajar con la configuración
export function getModelConfig(modelName: string): ModelConfig | undefined {
  return MODELS_CONFIG[modelName.toLowerCase()]
}

export function getModelConfigByModelName(modelName: string): ModelConfig | undefined {
  return Object.values(MODELS_CONFIG).find(config => config.modelName === modelName)
}

export function getCollectionInfo(modelName: string) {
  return Object.values(collections).find(col => col.modelName === modelName)
}

export function getVisibleModels(): ModelConfig[] {
  return Object.values(MODELS_CONFIG)
    .filter(config => !config.hidden)
    .sort((a, b) => (a.priority || 0) - (b.priority || 0))
}

export function getModelsByGroup(): Record<string, ModelConfig[]> {
  const grouped: Record<string, ModelConfig[]> = {}
  
  Object.values(MODELS_CONFIG).forEach(config => {
    if (config.hidden) return
    
    const group = config.ui.group || 'Other'
    if (!grouped[group]) {
      grouped[group] = []
    }
    grouped[group].push(config)
  })
  
  // Ordenar cada grupo por prioridad
  Object.keys(grouped).forEach(group => {
    grouped[group].sort((a, b) => (a.priority || 0) - (b.priority || 0))
  })
  
  return grouped
}

export function getEnabledFeatures(modelName: string): ModelFeatures {
  const config = getModelConfig(modelName)
  return config?.features || {}
}

export function isFeatureEnabled(modelName: string, feature: keyof ModelFeatures): boolean {
  const features = getEnabledFeatures(modelName)
  return features[feature] === true
}

// ==========================================
// TIPOS ESPECIALES
// ==========================================

export interface Weekdays {
  mon: boolean;
  tue: boolean;
  wed: boolean;
  thu: boolean;
  fri: boolean;
  sat: boolean;
  sun: boolean;
}

// ==========================================
// UTILIDADES PARA TRABAJAR CON LA CONFIGURACIÓN
// ========================================== 