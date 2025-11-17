export * from "./coupon.types";
export * from "./coupon.dtos";
export * from "./coupon.models";
export * from "./coupon.repository";
export * from "./coupon.service";
export * from "./coupon.controllers";
export * from "./coupon.routes";

import { UserRepository, UserModel } from "../user";
import { AuthMiddleware } from "../../core/middleware/auth.middleware";
import { logger } from "../../logger";
import { CouponController } from "./coupon.controllers";
import { CouponService } from "./coupon.service";
import { CouponModel } from "./coupon.models";
import { CouponRepository } from "./coupon.repository";
import { createCouponRouter } from "./coupon.routes";

export function initCouponModule() {
  const ctrl = new CouponController(new CouponService(new CouponRepository(CouponModel)));
  const authMw = new AuthMiddleware(new UserRepository(UserModel));

  logger.info("coupon module initialized");

  return createCouponRouter(ctrl, authMw);
}
