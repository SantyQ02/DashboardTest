import models from "../models/index.js";

export const seedData = async (): Promise<void> => {
  try {
    console.log("📊 Starting data seeding...");

    // Limpiar datos existentes
    await Promise.all([
      models.Bank.deleteMany({}),
      models.Card.deleteMany({}),
      models.Category.deleteMany({}),
    ]);

    console.log("🧹 Cleaned existing data");

    // Crear categorías
    const categories = await models.Category.insertMany([
      {
        name: "Supermercados",
        description: "Descuentos en supermercados y tiendas de comestibles",
        type: "shopping",
        icon: "🛒",
        color: "#4CAF50",
      },
      {
        name: "Combustible",
        description: "Descuentos en gasolineras y estaciones de servicio",
        type: "transport",
        icon: "⛽",
        color: "#FF9800",
      },
      {
        name: "Entretenimiento",
        description: "Descuentos en cines, restaurantes y entretenimiento",
        type: "entertainment",
        icon: "🎬",
        color: "#9C27B0",
      },
      {
        name: "Viajes",
        description: "Descuentos en hoteles, vuelos y viajes",
        type: "travel",
        icon: "✈️",
        color: "#2196F3",
      },
      {
        name: "Tecnología",
        description: "Descuentos en electrónicos y tecnología",
        type: "technology",
        icon: "💻",
        color: "#607D8B",
      },
    ]);

    console.log("✅ Categories created");

    // Crear bancos
    const banks = await models.Bank.insertMany([
      {
        name: "Banco Santander",
        code: "SAN",
        country: "España",
        email: "contacto@santander.es",
        phone: "+34 900 100 000",
        website: "https://www.santander.es",
        logo: "https://example.com/santander-logo.png",
        isActive: true,
      },
      {
        name: "BBVA",
        code: "BBVA",
        country: "España",
        email: "info@bbva.com",
        phone: "+34 900 225 225",
        website: "https://www.bbva.es",
        logo: "https://example.com/bbva-logo.png",
        isActive: true,
      },
      {
        name: "CaixaBank",
        code: "CAIXA",
        country: "España",
        email: "atencion@caixabank.es",
        phone: "+34 900 224 466",
        website: "https://www.caixabank.es",
        logo: "https://example.com/caixabank-logo.png",
        isActive: true,
      },
      {
        name: "Bankia",
        code: "BANKIA",
        country: "España",
        email: "info@bankia.es",
        phone: "+34 900 224 466",
        website: "https://www.bankia.es",
        logo: "https://example.com/bankia-logo.png",
        isActive: false,
      },
    ]);

    console.log("✅ Banks created");

    // Crear tarjetas
    await models.Card.insertMany([
      {
        name: "Santander 123",
        cardNumber: "1234567890123456",
        bank: banks[0]._id,
        category: categories[0]._id,
        type: "credit",
        creditLimit: 5000,
        annualFee: 0,
        interestRate: 18.5,
        rewards: "2% en supermercados, 1% en todo lo demás",
        benefits: ["Seguro de viaje", "Protección de compras"],
        isActive: true,
      },
      {
        name: "BBVA Azul",
        cardNumber: "2345678901234567",
        bank: banks[1]._id,
        category: categories[1]._id,
        type: "credit",
        creditLimit: 8000,
        annualFee: 50,
        interestRate: 16.9,
        rewards: "3% en combustible, 1% en todo lo demás",
        benefits: ["Seguro de coche", "Asistencia en carretera"],
        isActive: true,
      },
      {
        name: "CaixaBank Rewards",
        cardNumber: "3456789012345678",
        bank: banks[2]._id,
        category: categories[2]._id,
        type: "credit",
        creditLimit: 12000,
        annualFee: 100,
        interestRate: 15.5,
        rewards: "4% en entretenimiento, 2% en restaurantes",
        benefits: ["Entradas VIP", "Reservas prioritarias"],
        isActive: true,
      },
      {
        name: "Bankia Travel",
        cardNumber: "4567890123456789",
        bank: banks[3]._id,
        category: categories[3]._id,
        type: "credit",
        creditLimit: 15000,
        annualFee: 150,
        interestRate: 14.9,
        rewards: "5% en viajes, 3% en hoteles",
        benefits: ["Seguro de viaje premium", "Lounge access"],
        isActive: false,
      },
    ]);

    console.log("✅ Cards created");
    console.log("🎉 All data seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    throw error;
  }
};
