import mongoose from "mongoose";
import { AppError } from "../core/middleware/error.middleware";
import { logger } from "../logger";

export class DB {
  private connection: mongoose.Connection | null = null;
  constructor(private readonly uri: string) {}
  public async connect(): Promise<mongoose.Connection> {
    if (this.connection) {
      return this.connection;
    }
    try {
      await mongoose.connect(this.uri);
      this.connection = mongoose.connection;
      logger.info("Database Connected");
      return this.connection;
    } catch (error) {
      logger.error("Failed to connect to MongoDB with Mongoose:", error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    if (this.connection) {
      await mongoose.disconnect();
      this.connection = null;
      logger.info("MongoDB connection closed");
    }
  }

  public getConnection(): mongoose.Connection {
    if (!this.connection) {
      throw AppError.internal("Database not connected");
    }
    return this.connection;
  }
}
