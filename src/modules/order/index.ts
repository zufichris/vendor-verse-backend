export * from "./order.types";
export * from "./order.dtos";
export * from "./order.models";
export * from "./order.repository";
export * from "./order.service";
export * from "./order.controllers";

import { UserService, UserRepository, UserModel } from "../user";
import { AuthMiddleware } from "../../core/middleware/auth.middleware";
import { logger } from "../../logger";
import { OrderController } from "./order.controllers";
import { OrderService } from "./order.service";
import { OrderModel } from "./order.models";
import { OrderRepository } from "./order.repository";
import { createOrderRouter } from "./order.routes";
import {
  ProductService,
  ProductRepository,
  ProductModel,
  ProductCategoryModel,
  BannerModel,
  ProductVariantModel,
} from "../product";
import { BaseRepository } from "../../core/repository";
import { PaymentService } from "./payment.service";
import { Stripe } from "stripe";
import { env } from "../../config";

export function initOrderModule() {
  const ctrl = new OrderController(
    new OrderService(
      new OrderRepository(OrderModel),
      new UserService(new UserRepository(UserModel)),
      new ProductService(
        new ProductRepository(ProductModel),
        new BaseRepository(ProductVariantModel),
        new BaseRepository(ProductCategoryModel),
        new BaseRepository(BannerModel),
      ),
      new PaymentService(
        new Stripe(env.stripe_apikey, {
          typescript: true,
          maxNetworkRetries: 3,
          timeout: 30000,
        }),
      ),
    ),
  );
  const authMw = new AuthMiddleware(new UserRepository(UserModel));
  logger.info("order module initialized");
  return createOrderRouter(ctrl, authMw);
}
