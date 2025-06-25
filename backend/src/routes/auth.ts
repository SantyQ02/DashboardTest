import { Router, Request, Response, RequestHandler } from "express";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import { config } from "../config/config.js";

const router = Router();

// Firebase REST API URLs para validación de credenciales
const FIREBASE_SIGNIN_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${config.firebaseApiKey}`;
const FIREBASE_REFRESH_URL = `https://securetoken.googleapis.com/v1/token?key=${config.firebaseApiKey}`;

// POST /auth/signin - Login endpoint
const signinHandler = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (!config.firebaseApiKey) {
      return res.status(500).json({
        success: false,
        message: "Firebase API key not configured",
      });
    }

    // Check if Firebase Admin is initialized
    if (!getApps().length) {
      return res.status(500).json({
        success: false,
        message: "Firebase Admin not initialized. Please check your configuration.",
      });
    }

    // First, validate credentials with Firebase REST API
    const firebaseResponse = await fetch(FIREBASE_SIGNIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    });

    const firebaseData = await firebaseResponse.json();

    if (!firebaseResponse.ok) {
      // Handle Firebase auth errors
      let errorMessage = "Invalid email or password";

      if (firebaseData.error) {
        switch (firebaseData.error.message) {
          case "EMAIL_NOT_FOUND":
            errorMessage = "Email not found";
            break;
          case "INVALID_PASSWORD":
            errorMessage = "Invalid password";
            break;
          case "USER_DISABLED":
            errorMessage = "User account has been disabled";
            break;
          case "TOO_MANY_ATTEMPTS_TRY_LATER":
            errorMessage = "Too many failed attempts. Please try again later";
            break;
          default:
            errorMessage = firebaseData.error.message;
        }
      }

      return res.status(401).json({
        success: false,
        message: errorMessage,
      });
    }

    // Credentials are valid, now create a custom token using Firebase Admin SDK
    const uid = firebaseData.localId;
    const customToken = await getAuth().createCustomToken(uid);

    // Successfully authenticated
    res.json({
      success: true,
      data: {
        user: {
          uid: uid,
          email: firebaseData.email,
          name: firebaseData.displayName || firebaseData.email?.split("@")[0],
          emailVerified: firebaseData.emailVerified === "true",
        },
        customToken: customToken,
        message: "Authentication successful",
      },
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET /auth/verify - Simple session verification using Authorization header
const verifyHandler = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // Check if Firebase is initialized
    if (!getApps().length) {
      return res.status(500).json({
        success: false,
        message: "Firebase not initialized. Please check your configuration.",
      });
    }

    // Verify the ID token (this should be a Firebase ID token, not custom token)
    const decodedToken = await getAuth().verifyIdToken(token);

    res.json({
      success: true,
      data: {
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name || decodedToken.email?.split("@")[0],
          picture: decodedToken.picture,
          emailVerified: decodedToken.email_verified,
        },
      },
    });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// POST /auth/refresh - Refresh token endpoint
const refreshHandler = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    if (!config.firebaseApiKey) {
      return res.status(500).json({
        success: false,
        message: "Firebase API key not configured",
      });
    }

    // Refresh token with Firebase REST API
    const firebaseResponse = await fetch(FIREBASE_REFRESH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    const firebaseData = await firebaseResponse.json();

    if (!firebaseResponse.ok) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    res.json({
      success: true,
      data: {
        idToken: firebaseData.id_token,
        refreshToken: firebaseData.refresh_token,
        expiresIn: firebaseData.expires_in,
      },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({
      success: false,
      message: "Failed to refresh token",
    });
  }
};

// Register routes
// @ts-ignore - Express v5 compatibility
router.post("/signin", signinHandler);
// @ts-ignore - Express v5 compatibility
router.get("/verify", verifyHandler);
// @ts-ignore - Express v5 compatibility
router.post("/refresh", refreshHandler);

export default router;
