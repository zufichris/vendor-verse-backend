export * from "./product.controller";
export * from "./product.service";
export * from "./product.routes";
export * from "./product.types";
export * from "./product.models";
export * from "./product.repository";

import { AuthMiddleware } from "../../core/middleware/auth.middleware";
import { BaseRepository } from "../../core/repository";
import { logger } from "../../logger";
import { UserModel, UserRepository } from "../user";
import { ProductController } from "./product.controller";
import {
    BannerModel,
    ProductCategoryModel,
    ProductModel,
    ProductVariantModel,
} from "./product.models";
import { ProductRepository } from "./product.repository";
import { createProductRouter } from "./product.routes";
import { ProductService } from "./product.service";

export function initProductModule() {
    const controllers = new ProductController(
        new ProductService(
            new ProductRepository(ProductModel),
            new BaseRepository(ProductVariantModel),
            new BaseRepository(ProductCategoryModel),
            new BaseRepository(BannerModel),
        ),
    );
    const authMw = new AuthMiddleware(new UserRepository(UserModel));
    const roouter = createProductRouter(controllers, authMw);
    logger.info("product module intitialized");
    return roouter;
}
