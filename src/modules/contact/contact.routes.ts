import { Router } from "express";
import { ContactsController } from "./controllers";

export function initContactRoutes(ctrl: ContactsController) {
    const router = Router()

    router.post('/', ctrl.contactUs)

    return router;
}