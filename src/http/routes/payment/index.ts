import { Router } from 'express';
import { paymentControllers } from '../../controller/payment';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

router.route("/")
    .post(paymentControllers.createPayment)
    .get(authMiddleware.requirePermission("vendor", "manage"), paymentControllers.queryPayments);
router.use(authMiddleware.requirePermission("vendor", "manage"),).route("/:paymentId")
    .get(paymentControllers.getPayment)
    .put(paymentControllers.updatePayment)
    .delete(paymentControllers.deletePayment);

export default router;