// Tipos para los modelos de datos de SaveApp
// Nota: Los esquemas de @saveapp-org/shared son para el backend (Mongoose)
// Aquí definimos tipos TypeScript para el frontend que son compatibles con MongoDB

// Importar tipos especiales del archivo compartido
import type { Weekdays } from "../../../shared/models-config";

// Tipos para los modelos de SaveApp usando las clases reales de @saveapp-org/shared
import {
  Bank as BankClass,
  Brand as BrandClass,
  Card as CardClass,
  Category as CategoryClass,
  Comment as CommentClass,
  Offer as OfferClass,
  POI as POIClass,
  Store as StoreClass,
  Tracking as TrackingClass,
  User as UserClass,
} from "@saveapp-org/shared/schemas";

// Campos adicionales que Mongoose/MongoDB agrega automáticamente
interface MongooseFields {
  _id?: string;
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  deleted?: boolean;
}

// Tipos extraídos de las clases reales del paquete + campos de MongoDB
export type User = InstanceType<typeof UserClass> & MongooseFields;
export type Bank = InstanceType<typeof BankClass> & MongooseFields;
export type Category = InstanceType<typeof CategoryClass> & MongooseFields;
export type Brand = InstanceType<typeof BrandClass> & MongooseFields;
export type Card = InstanceType<typeof CardClass> & MongooseFields;
export type Store = InstanceType<typeof StoreClass> & MongooseFields;
export type Offer = InstanceType<typeof OfferClass> & MongooseFields;
export type Comment = InstanceType<typeof CommentClass> & MongooseFields;
export type Tracking = InstanceType<typeof TrackingClass> & MongooseFields;
export type POI = InstanceType<typeof POIClass> & MongooseFields;

// Alias para POI (Point of Interest)
export type Poi = InstanceType<typeof POIClass> & MongooseFields;

// Re-exportar las clases originales para uso en validaciones si es necesario
export {
  BankClass,
  BrandClass,
  CardClass,
  CategoryClass,
  CommentClass,
  OfferClass,
  POIClass,
  StoreClass,
  TrackingClass,
  UserClass,
};

// ==========================================
// FILTER TYPES - Generados automáticamente
// ==========================================

// Tipo genérico para filtros basado en cualquier modelo
type FilterableFields<T> = {
  [K in keyof T]?: T[K] extends string
    ? string | RegExp // Para campos string: búsqueda exacta o regex
    : T[K] extends number
      ? number | { $gte?: number; $lte?: number; $gt?: number; $lt?: number } // Para números: exacto o rangos
      : T[K] extends Date
        ? Date | { $gte?: Date; $lte?: Date; $gt?: Date; $lt?: Date } // Para fechas: exacto o rangos
        : T[K] extends boolean
          ? boolean // Para booleanos: exacto
          : T[K] extends (infer U)[]
            ? U | U[] // Para arrays: elemento único o múltiples
            : T[K]; // Para otros tipos: exacto
};

// Filtros específicos para cada modelo
export type BankFilters = FilterableFields<Omit<Bank, keyof MongooseFields>> & {
  search?: string; // Búsqueda general
  deleted?: boolean; // Soft delete filter
};

export type UserFilters = FilterableFields<Omit<User, keyof MongooseFields>> & {
  search?: string;
  deleted?: boolean;
};

export type BrandFilters = FilterableFields<Omit<Brand, keyof MongooseFields>> & {
  search?: string;
  deleted?: boolean;
};

export type CardFilters = FilterableFields<Omit<Card, keyof MongooseFields>> & {
  search?: string;
  deleted?: boolean;
  bankId?: string; // Filtro por banco
};

export type CategoryFilters = FilterableFields<Omit<Category, keyof MongooseFields>> & {
  search?: string;
  deleted?: boolean;
  parentId?: string; // Filtro por categoría padre
};

export type CommentFilters = FilterableFields<Omit<Comment, keyof MongooseFields>> & {
  search?: string;
  deleted?: boolean;
  userId?: string; // Filtro por usuario
  offerId?: string; // Filtro por oferta
  storeId?: string; // Filtro por tienda
};

export type OfferFilters = FilterableFields<Omit<Offer, keyof MongooseFields>> & {
  search?: string;
  deleted?: boolean;
  storeId?: string;
  categoryId?: string;
  brandId?: string;
  cardId?: string;
  isActive?: boolean;
  startDate?: Date | { $gte?: Date; $lte?: Date };
  endDate?: Date | { $gte?: Date; $lte?: Date };
};

export type StoreFilters = FilterableFields<Omit<Store, keyof MongooseFields>> & {
  search?: string;
  deleted?: boolean;
  brandId?: string;
  categoryId?: string;
  city?: string; // Para filtrar por ciudad en la dirección
};

export type TrackingFilters = FilterableFields<Omit<Tracking, keyof MongooseFields>> & {
  search?: string;
  deleted?: boolean;
  userId?: string;
  offerId?: string;
  storeId?: string;
  action?: "view" | "click" | "redeem" | "purchase";
};

export type PoiFilters = FilterableFields<Omit<Poi, keyof MongooseFields>> & {
  search?: string;
  deleted?: boolean;
  type?: "restaurant" | "store" | "service" | "entertainment" | "other";
  categoryId?: string;
};

// ==========================================
// INPUT TYPES - Para crear/actualizar
// ==========================================

// Tipo genérico para inputs de creación (omite campos auto-generados)
type CreateInput<T> = Omit<T, keyof MongooseFields>;

// Tipo genérico para inputs de actualización (todos los campos opcionales excepto _id)
type UpdateInput<T> = Omit<T, keyof MongooseFields>;

// Input types específicos para cada modelo
export type CreateBankInput = CreateInput<Bank>;
export type UpdateBankInput = UpdateInput<Bank>;

export type CreateUserInput = CreateInput<User>;
export type UpdateUserInput = UpdateInput<User>;

export type CreateBrandInput = CreateInput<Brand>;
export type UpdateBrandInput = UpdateInput<Brand>;

export type CreateCardInput = CreateInput<Card>;
export type UpdateCardInput = UpdateInput<Card>;

export type CreateCategoryInput = CreateInput<Category>;
export type UpdateCategoryInput = UpdateInput<Category>;

export type CreateCommentInput = CreateInput<Comment>;
export type UpdateCommentInput = UpdateInput<Comment>;

export type CreateOfferInput = CreateInput<Offer>;
export type UpdateOfferInput = UpdateInput<Offer>;

export type CreateStoreInput = CreateInput<Store>;
export type UpdateStoreInput = UpdateInput<Store>;

export type CreateTrackingInput = CreateInput<Tracking>;
export type UpdateTrackingInput = UpdateInput<Tracking>;

export type CreatePoiInput = CreateInput<Poi>;
export type UpdatePoiInput = UpdateInput<Poi>;

// ==========================================
// TIPOS DE PAGINACIÓN Y RESPUESTAS
// ==========================================

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

// ==========================================
// TIPOS LEGACY (mantener compatibilidad)
// ==========================================

// Mantenemos los tipos legacy para no romper el código existente
export interface UserFilters_Legacy {
  search?: string;
  isActive?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface OfferFilters_Legacy {
  search?: string;
  storeId?: string;
  categoryId?: string;
  brandId?: string;
  cardId?: string;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface StoreFilters_Legacy {
  search?: string;
  brandId?: string;
  categoryId?: string;
  isActive?: boolean;
  city?: string;
}

// Tipos de formularios legacy (mantener compatibilidad)
export interface CreateUserData {
  username: string; // Campo requerido en el esquema real
  email?: string;
  phone?: string;
}

export interface UpdateUserData extends Partial<CreateUserData> {
  isActive?: boolean;
}

export interface CreateBankData {
  name: string; // required en el esquema real
  logo?: string; // optional en el esquema real
}

export interface UpdateBankData extends Partial<CreateBankData> {}

export interface CreateBrandData {
  name: string;
  description?: string;
  logo?: string;
  website?: string;
}

export interface UpdateBrandData extends Partial<CreateBrandData> {}

export interface CreateCardData {
  name: string;
  bankId: string;
  cardType?: "credit" | "debit";
  benefits?: string[];
  annualFee?: number;
  cashbackRate?: number;
}

export interface UpdateCardData extends Partial<CreateCardData> {}

export interface CreateCategoryData {
  name: string;
  description?: string;
  icon?: string;
  parentId?: string;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {}

export interface CreateCommentData {
  content: string;
  rating?: number;
  userId: string;
  offerId?: string;
  storeId?: string;
}

export interface UpdateCommentData extends Partial<CreateCommentData> {
  isApproved?: boolean;
}

export interface CreateStoreData {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  brandId?: string;
  categoryId: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  openingHours?: {
    [key: string]: {
      open: string;
      close: string;
      closed?: boolean;
    };
  };
}

export interface UpdateStoreData extends Partial<CreateStoreData> {}

export interface CreateOfferData {
  title: string;
  description: string;
  discountType?: "percentage" | "fixed" | "cashback";
  discountValue?: number;
  startDate?: Date;
  endDate?: Date;
  storeId: string;
  categoryId: string;
  brandId?: string;
  cardId?: string;
  termsAndConditions?: string;
  imageUrl?: string;
  availability?: Weekdays;
}

export interface UpdateOfferData extends Partial<CreateOfferData> {
  isActive?: boolean;
}

export interface CreateTrackingData {
  userId: string;
  offerId: string;
  storeId?: string;
  action: "view" | "click" | "redeem" | "purchase";
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface UpdateTrackingData extends Partial<CreateTrackingData> {}

export interface CreatePoiData {
  name: string;
  description?: string;
  type?: "restaurant" | "store" | "service" | "entertainment" | "other";
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  phone?: string;
  email?: string;
  website?: string;
  categoryId?: string;
}

export interface UpdatePoiData extends Partial<CreatePoiData> {}

// Generic types for CRUD operations
export type AnyModel =
  | User
  | Bank
  | Category
  | Brand
  | Card
  | Store
  | Offer
  | Comment
  | Tracking
  | POI;

// Filters are dynamic and come from backend - no need to type them
export type ModelFilters = any;
