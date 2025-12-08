import { Router } from "express";
import express from "express";
import { OrderController } from "./order.controllers";
import { AuthMiddleware } from "../../core/middleware/auth.middleware";
import { UserRole } from "../user";

function createAdminOrderRouter(ctrl: OrderController, authMw: AuthMiddleware) {
    const router = Router()
    router.use(authMw.requireAuth);
    router.use(authMw.authorize([UserRole.ADMIN, UserRole.MODERATOR, UserRole.SUPPORT, UserRole.VENDOR]));

    router.route('/').get(ctrl.queryOrders).post(ctrl.initOrderForUser).post(ctrl.initOrderForUser)
    router.get('/analytics', ctrl.getAnalytics)

    router.route('/:id').get(ctrl.getOrder).put(ctrl.updateOrder).delete(ctrl.deleteOrder)

    router.route('/:id/refund').post(ctrl.initRefund)
    return router
}

export function createOrderRouter(
    ctrl: OrderController,
    authMw: AuthMiddleware,
) {
    const router = Router();

    router
        .route("/")
        .post(authMw.alloAnonmous, ctrl.createOrder)
        .get(authMw.requireAuth, ctrl.getMyOrders);
    router.get('/count', authMw.requireAuth, ctrl.getMyOrdersCount);

    router.delete('/cancel/:id', authMw.requireAuth, ctrl.cancelMyOrder)

    router.route("/webhooks/stripe").post(express.raw({ type: 'application/json' }), ctrl.stripeWebhook);
    router.route("/webhooks/quiqup").post(ctrl.quiqupWebhook);

    router.use('/admin', createAdminOrderRouter(ctrl, authMw))

    router.get('/tracking/:id', ctrl.getOrderTrackingInfo)

    router.route("/:id").patch(authMw.requireAuth, ctrl.updateMyOrder).get(authMw.requireAuth, ctrl.getMyOrder);


    return router;
}
