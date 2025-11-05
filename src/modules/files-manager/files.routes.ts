import { Router } from "express";
import { FilesManagerController } from "./files.controller";
import { AuthMiddleware } from "../../core/middleware";

export function createFilesManagerRoutes(ctrl: FilesManagerController, authMw: AuthMiddleware) {
    const router = Router();

    // bind controller method to preserve `this` context (so `this.service` is available)
    router.post("/upload", ctrl.uploadImage.bind(ctrl));

    return router;
}