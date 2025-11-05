import { Router } from "express";
import { NewsletterController } from "./newsletter.controller";

export function createNewsletterRouter(
    ctrl: NewsletterController,
) {
    const router = Router();

    router
        .route("/")
        .post(ctrl.subscribe)
        .get(ctrl.getSubs);

    router.route("/unsubscribe").post(ctrl.unsubscribe).put(ctrl.unsubscribe).get(ctrl.unsubscribe);

    router.route("/unsubscribe-bulk").post(ctrl.unsubscribeBulk).put(ctrl.unsubscribeBulk).get(ctrl.unsubscribeBulk);

    return router;
}
