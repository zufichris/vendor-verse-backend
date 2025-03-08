import { Router } from 'express';
import { orderControllers } from '../../controller/order';
import { authMiddleware } from '../../middleware/auth';

const router = Router();
router.use(authMiddleware.requireAuth, authMiddleware.requirePermission("order", "manage"),)
router.route("/")
    .post(orderControllers.createOrder)
    .get(orderControllers.queryOrders);
router.use(authMiddleware.requirePermission("order", "manage")).route("/:orderId")
    .get(orderControllers.getOrder)
    .put(orderControllers.updateOrder)
    .post(orderControllers.cancelOrder);

export default router;