import { AuthMiddleware } from "../../core/middleware";
import { UserModel, UserRepository } from "../user";
import { BlogController } from "./blog.controller";
import { BlogModel } from "./blog.model";
import { BlogRepository } from "./blog.repository";
import { createBlogRouter } from "./blog.routes";
import { BlogService } from "./blog.service";

export function initBlogModule() {
    const ctrl = new BlogController(
        new BlogService(
            new BlogRepository(BlogModel)
        )
    );

    const authMw = new AuthMiddleware(new UserRepository(UserModel));

    return createBlogRouter(ctrl, authMw);
}