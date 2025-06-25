import mongoose from "mongoose";
import { config } from "../config/config.js";

import {
  BankModel,
  BrandModel,
  CardModel,
  CommentModel,
  CategoryModel,
  OfferModel,
  PoiModel,
  StoreModel,
  TrackingModel,
  UserModel,
} from "@saveapp-org/shared/models";
import { logError, logSuccess } from "@saveapp-org/shared/logger";

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongoUri as string);
    logSuccess("✅ Connected to MongoDB");

    await OfferModel.collection.createIndex({
      title: "text",
      description: "text",
    });

    await Promise.all([
      BankModel.createIndexes(),
      BrandModel.createIndexes(),
      CardModel.createIndexes(),
      CategoryModel.createIndexes(),
      CommentModel.createIndexes(),
      OfferModel.createIndexes(),
      PoiModel.createIndexes(),
      StoreModel.createIndexes(),
      TrackingModel.createIndexes(),
      UserModel.createIndexes(),
    ]);
  } catch (err) {
    logError("❌ MongoDB connection failed =>", err);
    process.exit(1);
  }
};
