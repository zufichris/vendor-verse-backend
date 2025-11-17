import { CouponModel, CouponRepository, CouponService } from "../coupon";
import { NewsletterController } from "./newsletter.controller";
import { NewsletterModel } from "./newsletter.model";
import { NewsletterRepository } from "./newsletter.repository";
import { createNewsletterRouter } from "./newsletter.routes";
import { NewsletterService } from "./newsletter.service";

export function initNewsletterModule() {
    const ctrl = new NewsletterController(
        new NewsletterService(
            new NewsletterRepository(
                NewsletterModel
            ),
            new CouponService(new CouponRepository(CouponModel))
        )
    );

    return createNewsletterRouter(ctrl);
}