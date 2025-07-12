import { AuthMiddleware } from "../../core/middleware/auth.middleware";
import { logger } from "../../logger";
import { UserController } from "./user.controllers";
import { UserModel } from "./user.models";
import { UserRepository } from "./user.repository";
import { CreateUserRouter } from "./user.routes";
import { UserService } from "./user.service";

export * from "./user.types";
export * from "./user.routes";
export * from "./user.dtos";
export * from "./user.models";
export * from "./user.repository";
export * from "./user.service";
export * from "./user.controllers";

export function intitUserModule() {
    const userRepository = new UserRepository(UserModel);
    const userService = new UserService(userRepository);
    const userControllers = new UserController(userService);
    const authMiddleware = new AuthMiddleware(userRepository);
    const userRoutes = CreateUserRouter(userControllers, authMiddleware);
    logger.info("user module initialized");
    return userRoutes;
}
