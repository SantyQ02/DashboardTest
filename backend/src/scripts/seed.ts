import { connectDB } from "../services/db.js";
import { seedData } from "../seeders/seedData.js";

const runSeeder = async () => {
  try {
    console.log("🌱 Starting database seeder...");

    // Conectar a la base de datos
    await connectDB();

    // Ejecutar seeder
    await seedData();

    console.log("✅ Seeder completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeder failed:", error);
    process.exit(1);
  }
};

runSeeder();
