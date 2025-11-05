import { AuthMiddleware } from "../../core/middleware";
import { ProductModel, ProductRepository } from "../product";
import { UserModel, UserRepository } from "../user";
import { CartControler } from "./cart.controller";
import { CartModel } from "./cart.model";
import { CartRepository } from "./cart.repository";
import { createCartRoutes } from "./cart.routes";
import { CartService } from "./cart.service";

export function initCartModule() {
    const userRepo = new UserRepository(UserModel);
    const ctrl = new CartControler(new CartService(new CartRepository(CartModel), new ProductRepository(ProductModel), userRepo))

    const authMw = new AuthMiddleware(userRepo)

    return createCartRoutes(authMw, ctrl)
}