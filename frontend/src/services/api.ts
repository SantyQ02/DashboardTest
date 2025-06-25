import type { AnyModel, ApiResponse } from "../types/models";
import { auth } from "../lib/firebase";

// Separate URLs for different endpoints
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const API_DATA_URL = `${API_BASE_URL}/api`;

// Clase base para manejar errores de API
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Función helper para hacer requests a endpoints de datos (requieren autenticación)
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_DATA_URL}${endpoint}`;

  // Get auth token - try Firebase first, then localStorage as fallback
  let authToken: string | null = null;

  try {
    if (auth.currentUser) {
      authToken = await auth.currentUser.getIdToken();
    } else {
      // Fallback to stored token
      authToken = localStorage.getItem("auth-token");
    }
  } catch (error) {
    console.warn("Error getting auth token:", error);
    // Fallback to stored token
    authToken = localStorage.getItem("auth-token");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Add Authorization header if we have a token
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    headers,
    ...options,
  });

  // Handle 401 errors by clearing stored auth data
  if (response.status === 401) {
    localStorage.removeItem("auth-token");
    localStorage.removeItem("user-data");
    localStorage.removeItem("refresh-token");
    window.location.reload(); // Force re-authentication
    throw new ApiError(response.status, "Authentication required");
  }

  if (!response.ok) {
    throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// NOTA: authRequest está ahora en auth.ts para evitar dependencias circulares

// Generic API functions that work with any model
export const genericApi = {
  // Get all records with pagination and filters
  async getAll<T = AnyModel>(
    modelName: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      [key: string]: any; // Dynamic filters
    } = {},
  ): Promise<{
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const searchParams = new URLSearchParams();

    // Add all parameters dynamically
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, value.toString());
      }
    });

    const response = await apiRequest<
      ApiResponse<{
        data: T[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    >(`/${modelName}?${searchParams}`);

    // La respuesta debe incluir tanto data como pagination
    return {
      data: (response.data || []) as T[],
      total: response.pagination?.total || 0,
      page: response.pagination?.page || 1,
      limit: response.pagination?.limit || 10,
      totalPages: response.pagination?.totalPages || 0,
    };
  },

  // Get deleted records (trash)
  async getDeleted<T = AnyModel>(
    modelName: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      [key: string]: any; // Dynamic filters
    } = {},
  ): Promise<{
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const searchParams = new URLSearchParams();

    // Add all parameters dynamically
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, value.toString());
      }
    });

    const response = await apiRequest<
      ApiResponse<{
        data: T[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    >(`/${modelName}/deleted?${searchParams}`);

    // La respuesta debe incluir tanto data como pagination
    return {
      data: (response.data || []) as T[],
      total: response.pagination?.total || 0,
      page: response.pagination?.page || 1,
      limit: response.pagination?.limit || 10,
      totalPages: response.pagination?.totalPages || 0,
    };
  },

  // Get single record by ID
  async getById<T = AnyModel>(modelName: string, id: string): Promise<T | null> {
    const response = await apiRequest<ApiResponse<T>>(`/${modelName}/${id}`);
    return response.data || null;
  },

  // Create new record
  async create<T = AnyModel>(modelName: string, data: any): Promise<T> {
    const response = await apiRequest<ApiResponse<T>>(`/${modelName}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data!;
  },

  // Update existing record
  async update<T = AnyModel>(
    modelName: string,
    id: string,
    data: any,
  ): Promise<T | null> {
    const response = await apiRequest<ApiResponse<T>>(`/${modelName}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response.data || null;
  },

  // Delete record (soft delete)
  async delete(modelName: string, id: string): Promise<boolean> {
    await apiRequest(`/${modelName}/${id}`, { method: "DELETE" });
    return true;
  },

  // Restore deleted record
  async restore<T = AnyModel>(modelName: string, id: string): Promise<T | null> {
    const response = await apiRequest<ApiResponse<T>>(`/${modelName}/${id}/restore`, {
      method: "PATCH",
    });
    return response.data || null;
  },

  // Bulk create records
  async bulkCreate<T = AnyModel>(modelName: string, data: any[]): Promise<T[]> {
    const response = await apiRequest<ApiResponse<T[]>>(`/${modelName}/bulk`, {
      method: "POST",
      body: JSON.stringify({ data }),
    });
    return response.data!;
  },

  // Validate bulk data before import
  async validateBulkData(
    modelName: string,
    data: any[],
  ): Promise<{ valid: boolean; errors: string[] }> {
    const response = await apiRequest<
      ApiResponse<{ valid: boolean; errors: string[] }>
    >(`/${modelName}/validate`, {
      method: "POST",
      body: JSON.stringify({ data }),
    });
    return response.data!;
  },

  // Export data
  async export(
    modelName: string,
    format: string,
    useFilters: boolean,
    filters: any = {},
  ): Promise<{ data: any; headers: Record<string, string> }> {
    const params = new URLSearchParams({
      format,
      useFilters: useFilters.toString(),
    });

    // Add filters if using them
    if (useFilters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${API_DATA_URL}/${modelName}/export?${params}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
      },
    });

    if (!response.ok) {
      throw new ApiError(response.status, `Export failed: ${response.status}`);
    }

    const data = await response.blob();
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return { data, headers };
  },
};

// Legacy APIs for backward compatibility (they now use genericApi internally)
export const userApi = {
  getUsers: (params: any, filters?: any) =>
    genericApi.getAll("users", { ...params, ...filters }),
  getUserById: (id: string) => genericApi.getById("users", id),
  createUser: (data: any) => genericApi.create("users", data),
  updateUser: (id: string, data: any) => genericApi.update("users", id, data),
  deleteUser: (id: string) => genericApi.delete("users", id),
};

export const bankApi = {
  getBanks: (params: any = {}) => genericApi.getAll("banks", params),
  getDeletedBanks: (params: any = {}) => genericApi.getDeleted("banks", params),
  getBankById: (id: string) => genericApi.getById("banks", id),
  createBank: (data: any) => genericApi.create("banks", data),
  updateBank: (id: string, data: any) => genericApi.update("banks", id, data),
  deleteBank: (id: string) => genericApi.delete("banks", id),
  restoreBank: (id: string) => genericApi.restore("banks", id),
  bulkCreate: (data: any[]) => genericApi.bulkCreate("banks", data),
  validateBulkData: (data: any[]) => genericApi.validateBulkData("banks", data),
  exportBanks: (format: string, useFilters: boolean, filters?: any) =>
    genericApi.export("banks", format, useFilters, filters),
};

// Similar simplified APIs for other models
export const categoryApi = {
  getCategories: (params: any = {}) => genericApi.getAll("categories", params),
  getCategoryById: (id: string) => genericApi.getById("categories", id),
  createCategory: (data: any) => genericApi.create("categories", data),
  updateCategory: (id: string, data: any) => genericApi.update("categories", id, data),
  deleteCategory: (id: string) => genericApi.delete("categories", id),
  restoreCategory: (id: string) => genericApi.restore("categories", id),
};

export const cardApi = {
  getCards: (params: any = {}) => genericApi.getAll("cards", params),
  getCardById: (id: string) => genericApi.getById("cards", id),
  createCard: (data: any) => genericApi.create("cards", data),
  updateCard: (id: string, data: any) => genericApi.update("cards", id, data),
  deleteCard: (id: string) => genericApi.delete("cards", id),
  restoreCard: (id: string) => genericApi.restore("cards", id),
};

export const brandApi = {
  getBrands: (params: any = {}) => genericApi.getAll("brands", params),
  getBrandById: (id: string) => genericApi.getById("brands", id),
  createBrand: (data: any) => genericApi.create("brands", data),
  updateBrand: (id: string, data: any) => genericApi.update("brands", id, data),
  deleteBrand: (id: string) => genericApi.delete("brands", id),
  restoreBrand: (id: string) => genericApi.restore("brands", id),
};

export const commentApi = {
  getComments: (params: any = {}) => genericApi.getAll("comments", params),
  getCommentById: (id: string) => genericApi.getById("comments", id),
  createComment: (data: any) => genericApi.create("comments", data),
  updateComment: (id: string, data: any) => genericApi.update("comments", id, data),
  deleteComment: (id: string) => genericApi.delete("comments", id),
  restoreComment: (id: string) => genericApi.restore("comments", id),
};

export const offerApi = {
  getOffers: (params: any, filters?: any) =>
    genericApi.getAll("offers", { ...params, ...filters }),
  getOfferById: (id: string) => genericApi.getById("offers", id),
  createOffer: (data: any) => genericApi.create("offers", data),
  updateOffer: (id: string, data: any) => genericApi.update("offers", id, data),
  deleteOffer: (id: string) => genericApi.delete("offers", id),
  restoreOffer: (id: string) => genericApi.restore("offers", id),
};

export const storeApi = {
  getStores: (params: any, filters?: any) =>
    genericApi.getAll("stores", { ...params, ...filters }),
  getStoreById: (id: string) => genericApi.getById("stores", id),
  createStore: (data: any) => genericApi.create("stores", data),
  updateStore: (id: string, data: any) => genericApi.update("stores", id, data),
  deleteStore: (id: string) => genericApi.delete("stores", id),
  restoreStore: (id: string) => genericApi.restore("stores", id),
};

export const trackingApi = {
  getTrackings: (params: any = {}) => genericApi.getAll("trackings", params),
  getTrackingById: (id: string) => genericApi.getById("trackings", id),
  createTracking: (data: any) => genericApi.create("trackings", data),
  updateTracking: (id: string, data: any) => genericApi.update("trackings", id, data),
  deleteTracking: (id: string) => genericApi.delete("trackings", id),
  restoreTracking: (id: string) => genericApi.restore("trackings", id),
};

export const poiApi = {
  getPois: (params: any = {}) => genericApi.getAll("pois", params),
  getPoiById: (id: string) => genericApi.getById("pois", id),
  createPoi: (data: any) => genericApi.create("pois", data),
  updatePoi: (id: string, data: any) => genericApi.update("pois", id, data),
  deletePoi: (id: string) => genericApi.delete("pois", id),
  restorePoi: (id: string) => genericApi.restore("pois", id),
};

// Stats API
export const statsApi = {
  async getStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalOffers: number;
    activeOffers: number;
    totalStores: number;
    activeStores: number;
  }> {
    return apiRequest("/stats");
  },
};

// Schema API
export const schemaApi = {
  async getModelSchema(modelName: string) {
    return apiRequest(`/schemas/${modelName}`);
  },
  async getAllSchemas() {
    return apiRequest("/schemas");
  },
  async getModelNames() {
    return apiRequest("/schemas/models");
  },
};
