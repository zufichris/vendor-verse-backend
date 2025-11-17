import { Router } from "express";
import { AuthMiddleware } from "../../core/middleware/auth.middleware";
import { UserRole } from "../user";
import { CouponController } from "./coupon.controllers";

function createAdminCouponRouter(ctrl: CouponController, authMw: AuthMiddleware) {
    const router = Router()
    router.use(authMw.requireAuth);
    router.use(authMw.authorize([UserRole.ADMIN, UserRole.MODERATOR, UserRole.SUPPORT, UserRole.VENDOR]));

    router.route('/').get(ctrl.getCoupons).post(ctrl.creatCoupon)

    router.route('/:id').get(ctrl.getCoupon)
    return router
}

export function createCouponRouter(
    ctrl: CouponController,
    authMw: AuthMiddleware,
) {
    const router = Router();

    router.get('/validate', authMw.requireAuth, ctrl.validateCoupon);
    router.get('/welcome', authMw.requireAuth, ctrl.getFirstOrderCoupon)

    router.use('/admin', createAdminCouponRouter(ctrl, authMw))

    return router;
}
