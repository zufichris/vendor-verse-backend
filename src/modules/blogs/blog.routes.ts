import { Router } from "express";
import { BlogController } from "./blog.controller";
import { AuthMiddleware } from "../../core/middleware";

export function createBlogRouter(
    ctrl: BlogController,
    authMw: AuthMiddleware
) {
    const router = Router();

    router
        .route("/")
        .get(ctrl.query)
        .post(authMw.requireAuth, ctrl.create);

    router
        .route("/slug/:slug")
        .get(ctrl.getBySlug);

    router
        .route("/:id")
        .get(ctrl.getById)
        .put(authMw.requireAuth, ctrl.update)
        .delete(authMw.requireAuth, ctrl.delete);

    return router;
}