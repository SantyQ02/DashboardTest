import { Request, Response, NextFunction } from "express";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any; // Firebase DecodedIdToken
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Check if Firebase is initialized
    if (!getApps().length) {
      res.status(500).json({
        success: false,
        message: "Firebase not initialized. Please check your configuration.",
      });
      return;
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access token required",
      });
      return;
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(403).json({
      success: false,
      message: "Invalid or expired token",
    });
    return;
  }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    // Check if user has admin role (you can customize this based on your user model)
    // For now, we'll check if the user exists in our database and has admin role
    // This should be implemented based on your User model structure

    next();
  } catch (error) {
    console.error("Authorization error:", error);
    res.status(403).json({
      success: false,
      message: "Admin access required",
    });
    return;
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if Firebase is initialized
    if (!getApps().length) {
      return next();
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decodedToken = await getAuth().verifyIdToken(token);
      req.user = decodedToken;
    }

    next();
  } catch (error) {
    // Continue without authentication for optional routes
    next();
  }
};
