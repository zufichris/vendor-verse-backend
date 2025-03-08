import mongoose from 'mongoose';

export class DB {
  private static instance: DB;
  private connection: mongoose.Connection | null = null;
  private constructor() { }

  /**
   * Gets or creates the singleton instance of the DB class.
   * @returns DB instance
   */
  public static getInstance(): DB {
    if (!DB.instance) {
      DB.instance = new DB();
    }
    return DB.instance;
  }

  /**
   * Establishes a connection to the MongoDB database using Mongoose.
   * @param uri MongoDB connection string
   * @returns Mongoose connection instance
   * @throws Error if connection fails
   */
  public async connect(uri: string): Promise<mongoose.Connection> {
    if (this.connection) {
      return this.connection; // Return existing connection if already connected
    }

    try {
      await mongoose.connect(uri);
      this.connection = mongoose.connection;
      console.log('Connected to MongoDB with Mongoose');
      return this.connection;
    } catch (error) {
      console.error('Failed to connect to MongoDB with Mongoose:', error);
      throw error;
    }
  }

  /**
   * Closes the Mongoose connection.
   */
  public async close(): Promise<void> {
    if (this.connection) {
      await mongoose.disconnect();
      this.connection = null;
      console.log('MongoDB connection closed');
    }
  }

  /**
   * Retrieves the Mongoose connection instance.
   * @returns Mongoose connection instance
   * @throws Error if not connected
   */
  public getConnection(): mongoose.Connection {
    if (!this.connection) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.connection;
  }
}