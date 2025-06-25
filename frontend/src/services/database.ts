import mongoose from "mongoose";

// TODO: Replace with your MongoDB connection string
// Format: mongodb://username:password@host:port/database
const MONGODB_URI =
  import.meta.env.VITE_MONGODB_URI || "mongodb://localhost:27017/saveapp";

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) {
    return;
  }

  await mongoose.connect(MONGODB_URI);
  isConnected = true;
}

export async function disconnectFromDatabase() {
  if (!isConnected) {
    return;
  }

  await mongoose.disconnect();
  isConnected = false;
}

// Database connection status
export function getConnectionStatus() {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
  };
}

// Note: The @saveapp-org/shared models are designed for Node.js backend use
// For the frontend dashboard, we'll use simple MongoDB operations or API calls
// The models can be imported in a backend API service instead

// Re-exportar collections desde el archivo shared
export { collections } from "../../../shared/models-config.ts";

export interface DatabaseModels {
  // Define interfaces for the data structures
  // These will be used for type safety in the frontend
}
