import { Router } from "express";
import { OrderController } from "./order.controllers";
import { AuthMiddleware } from "../../core/middleware/auth.middleware";

export function createOrderRouter(
  ctrl: OrderController,
  authMw: AuthMiddleware,
) {
  const router = Router();
  router
    .route("/")
    .post(ctrl.createOrder)
    .get(authMw.requireAuth, ctrl.getMyOrders);

  router.route("/:id").patch(authMw.requireAuth, ctrl.updateOrder);

  return router;
}
