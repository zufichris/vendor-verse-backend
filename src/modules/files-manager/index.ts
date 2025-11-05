import { AuthMiddleware } from "../../core/middleware";
import { HttpClient } from "../../core/utils/httpclient.util";
import { UserModel, UserRepository } from "../user";
import { FilesManagerController } from "./files.controller";
import { createFilesManagerRoutes } from "./files.routes";
import { FilesManagerService } from "./files.service";
import { ImgbbProvider } from "./providers/imgbb.provider";

export function initFilesManagerModule() {
    const ctrl = new FilesManagerController(
        new FilesManagerService(
            new ImgbbProvider(new HttpClient())
        )
    )
    const authMw = new AuthMiddleware(new UserRepository(UserModel))

    return createFilesManagerRoutes(ctrl, authMw)
}