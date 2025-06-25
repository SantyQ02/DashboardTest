import { useState, useEffect } from "react";
import { onAuthStateChanged, signInWithCustomToken, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { authService } from "../services/auth";

interface User {
  uid: string;
  email: string | null;
  name?: string;
  picture?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(() => {
    // Initialize from localStorage immediately
    const storedUser = localStorage.getItem("user-data");
    const storedToken = localStorage.getItem("auth-token");

    if (storedUser && storedToken) {
      try {
        return JSON.parse(storedUser);
      } catch {
        localStorage.removeItem("user-data");
        localStorage.removeItem("auth-token");
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(true); // Start with true to check initial auth state
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    let warnTimeoutId: NodeJS.Timeout | null = null;

    // Timeout de seguridad para evitar loading infinito
    timeoutId = setTimeout(() => {
      if (mounted) {
        setLoading(false);
        setError("Authentication timeout. Please try again.");
      }
    }, 10000); // 10 segundos

    // Log de advertencia si tarda más de 5 segundos
    warnTimeoutId = setTimeout(() => {
      if (mounted && loading) {
        // warning opcional
      }
    }, 5000);

    const resolveLoading = () => {
      if (mounted) {
        setLoading(false);
        if (timeoutId) clearTimeout(timeoutId);
        if (warnTimeoutId) clearTimeout(warnTimeoutId);
      }
    };

    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;

      if (firebaseUser) {
        try {
          // Get the ID token from Firebase
          const token = await firebaseUser.getIdToken();

          // Verify token with our backend
          const response = await authService.verify(token);

          if (mounted && response.success) {
            const userData = {
              uid: response.data.user.uid,
              email: response.data.user.email,
              name: response.data.user.name,
              picture: response.data.user.picture,
            };

            setUser(userData);
            localStorage.setItem("user-data", JSON.stringify(userData));
            localStorage.setItem("auth-token", token);
          } else {
            // Si la verificación falla, limpiar datos
            if (mounted) {
              setUser(null);
              localStorage.removeItem("user-data");
              localStorage.removeItem("auth-token");
            }
          }
        } catch {
          if (mounted) {
            setUser(null);
            localStorage.removeItem("user-data");
            localStorage.removeItem("auth-token");
          }
        }
      } else {
        // No hay usuario de Firebase, limpiar datos
        if (mounted) {
          setUser(null);
          localStorage.removeItem("user-data");
          localStorage.removeItem("auth-token");
        }
      }

      // Siempre resolver el loading después del listener
      resolveLoading();
    });

    // Si no hay usuario de Firebase y hay datos almacenados, verificar en background
    // pero solo si el listener no se ha resuelto aún
    const storedToken = localStorage.getItem("auth-token");
    const storedUser = localStorage.getItem("user-data");

    if (storedToken && storedUser && !auth.currentUser) {
      // Solo verificar si después de 2 segundos no hay usuario de Firebase
      setTimeout(() => {
        if (mounted && !auth.currentUser) {
          authService
            .verify(storedToken)
            .then((response) => {
              if (mounted && response.success && !auth.currentUser) {
                const userData = {
                  uid: response.data.user.uid,
                  email: response.data.user.email,
                  name: response.data.user.name,
                  picture: response.data.user.picture,
                };
                setUser(userData);
                localStorage.setItem("user-data", JSON.stringify(userData));
              }
            })
            .catch(() => {
              if (mounted) {
                setUser(null);
                localStorage.removeItem("user-data");
                localStorage.removeItem("auth-token");
              }
            });
        }
      }, 2000);
    }

    return () => {
      mounted = false;
      unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
      if (warnTimeoutId) clearTimeout(warnTimeoutId);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      // First, authenticate with our backend
      const response = await authService.signin(email, password);

      if (!response.success) {
        throw new Error("Backend authentication failed");
      }

      // Get the custom token from backend response
      const customToken = response.data.customToken;

      // Sign in to Firebase with the custom token
      const userCredential = await signInWithCustomToken(auth, customToken);
      const firebaseToken = await userCredential.user.getIdToken();

      // Set user data from backend response
      const userData = {
        uid: response.data.user.uid,
        email: response.data.user.email,
        name: response.data.user.name,
        picture: response.data.user.picture,
      };

      setUser(userData);
      localStorage.setItem("user-data", JSON.stringify(userData));
      localStorage.setItem("auth-token", firebaseToken);
    } catch (error: any) {
      setError(error.message || "Login failed");

      // Clean up on error
      setUser(null);
      localStorage.removeItem("user-data");
      localStorage.removeItem("auth-token");

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);

    try {
      await signOut(auth);
      setUser(null);
      localStorage.removeItem("user-data");
      localStorage.removeItem("auth-token");
    } catch (error: any) {
      setError(error.message || "Logout failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
  };
}
