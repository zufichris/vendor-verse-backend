import { Router } from 'express';
import { shippingControllers } from '../../controller/shipping';
import { authMiddleware } from '../../middleware/auth';

const router = Router();
router.use(authMiddleware.requireAuth, authMiddleware.requirePermission("shipping", "manage"))
router.route("/")
    .post(shippingControllers.createShipping)
    .get(shippingControllers.queryShippings);
router.route("/:shippingId")
    .get(shippingControllers.getShipping)
    .put(shippingControllers.updateShipping)
    .delete(shippingControllers.deleteShipping);

export default router;