import { ApiError } from "./api";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const API_AUTH_URL = `${API_BASE_URL}/auth`;

// Función helper para hacer requests a endpoints de auth (no requieren autenticación previa)
async function authRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_AUTH_URL}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    headers,
    ...options,
  });

  if (!response.ok) {
    throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

interface AuthResponse {
  success: boolean;
  data: {
    user: {
      uid: string;
      email: string | null;
      name?: string;
      picture?: string;
      emailVerified?: boolean;
    };
    customToken: string;
    message?: string;
  };
}

interface VerifyResponse {
  success: boolean;
  data: {
    user: {
      uid: string;
      email: string | null;
      name?: string;
      picture?: string;
      emailVerified?: boolean;
    };
  };
}

export const authService = {
  async signin(email: string, password: string): Promise<AuthResponse> {
    try {
      return await authRequest<AuthResponse>("/signin", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    } catch (error: any) {
      // Handle API errors more gracefully
      if (error instanceof ApiError) {
        throw new Error(error.message || "Authentication failed");
      }
      throw error;
    }
  },

  async verify(token: string): Promise<VerifyResponse> {
    try {
      return await authRequest<VerifyResponse>("/verify", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error: any) {
      // Handle API errors more gracefully
      if (error instanceof ApiError) {
        throw new Error(error.message || "Token verification failed");
      }
      throw error;
    }
  },

  async refreshToken(
    refreshToken: string,
  ): Promise<{ success: boolean; data: { customToken: string } }> {
    try {
      return await authRequest<{ success: boolean; data: { customToken: string } }>(
        "/refresh",
        {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        },
      );
    } catch (error: any) {
      // Handle API errors more gracefully
      if (error instanceof ApiError) {
        throw new Error(error.message || "Token refresh failed");
      }
      throw error;
    }
  },
};
