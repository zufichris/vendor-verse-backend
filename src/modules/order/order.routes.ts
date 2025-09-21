import { Router } from "express";
import express from "express";
import { OrderController } from "./order.controllers";
import { AuthMiddleware } from "../../core/middleware/auth.middleware";

export function createOrderRouter(
    ctrl: OrderController,
    authMw: AuthMiddleware,
) {
    const router = Router();

    router
        .route("/")
        .post(authMw.requireAuth, ctrl.createOrder)
        .get(authMw.requireAuth, ctrl.getMyOrders);

    router.route("/webhooks/stripe").post(express.raw({ type: 'application/json' }), ctrl.stripeWebhook);
    router.route("/:id").patch(authMw.requireAuth, ctrl.updateOrder);

    return router;
}
