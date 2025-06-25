import { Request, Response } from "express";

export const getStats = async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      totalUsers: Math.floor(Math.random() * 1000) + 100,
      activeUsers: Math.floor(Math.random() * 800) + 50,
      totalOffers: Math.floor(Math.random() * 500) + 200,
      activeOffers: Math.floor(Math.random() * 400) + 150,
      totalStores: Math.floor(Math.random() * 100) + 20,
      activeStores: Math.floor(Math.random() * 80) + 15,
    },
  });
};
