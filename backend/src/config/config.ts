import dotenv from "dotenv-safe";

dotenv.config({
  allowEmptyValues: true,
  example: ".env.example",
});

export const config = Object.freeze({
  mongoUri: process.env.MONGODB_URI,
  firebaseApiKey: process.env.FIREBASE_API_KEY,
});
