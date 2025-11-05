import { Router } from "express";
import { AuthMiddleware } from "../../core/middleware";
import { CartControler } from "./cart.controller";

export function createCartRoutes(authMw: AuthMiddleware, ctrl: CartControler) {
    const router = Router()

    router.use(authMw.requireAuth)

    router.route('/').post(ctrl.upserCart).get(ctrl.getCart).delete(ctrl.removeFromCart) //add productId query string to delete a single item from cart else user's cart will be emptied.

    router.delete('/clear', ctrl.clearCart)

    router.delete('/:productId', ctrl.removeFromCart)

    return router;
}