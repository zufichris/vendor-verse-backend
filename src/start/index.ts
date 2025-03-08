import { DB } from "../config/db-config";
import { env } from "../config/env";
import { RoleModel } from "../data/orm/model/role";
import { RoleRepositoryImpl } from "../data/orm/repository-implementation/role";
import RoleUseCase from "../domain/role/use-case";
import { logger } from "../util/logger";
import { setupApp } from "./express-app";

const roleUseCase = new RoleUseCase(new RoleRepositoryImpl(RoleModel));

async function connectToDatabase() {
    try {
        await DB.getInstance().connect(env.mongo_uri);
        logger.info("Database connected successfully");
    } catch (error) {
        logger.error("Database connection failed:", error);
        throw error;
    }
}

async function initializeRoles() {
    try {
        await roleUseCase.initializeRoles();
        logger.info("Roles initialized successfully");
    } catch (error) {
        logger.error("Failed to initialize roles:", error);
        throw error;
    }
}

export async function initializeApp() {
    await connectToDatabase();
    await initializeRoles();
    const app = setupApp()
    return app
}