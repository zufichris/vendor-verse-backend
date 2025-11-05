import { Request, Response } from "express";
import { ApiHandler } from "../../util/api-handler";
import { CreateBlogDto, CreateBlogDtoSchema, GetBlogsDto, UpdateBlogDtoSchema } from "./blog.dtos";
import { BlogService } from "./blog.service";
import { AppError } from "../../core/middleware";

export class BlogController {
    constructor(
        private readonly service: BlogService
    ) { }

    query = ApiHandler(async (req: Request, res: Response) => {
        const filter = req.query as unknown as GetBlogsDto;

        const result = await this.service.query(filter);

        return res.json({
            success: true,
            status: 200,
            message: "Blog posts fetched successfully",
            data: result,
        });
    });

    getBySlug = ApiHandler(async (req: Request, res: Response) => {
        const slug = req.params.slug;
        if (!slug) {
            throw AppError.badRequest("Blog slug is required")
        }

        const result = await this.service.getBySlug(slug);

        return res.json({
            success: true,
            status: 200,
            message: "Blog post fetched successfully",
            data: result,
        });
    });

    getById = ApiHandler(async (req: Request, res: Response) => {
        const id = req.params.id;

        if (!id) {
            throw AppError.badRequest("Blog ID is required")
        }

        const result = await this.service.getById(id);

        return res.json({
            success: true,
            status: 200,
            message: "Blog post fetched successfully",
            data: result,
        });
    });

    create = ApiHandler(async (req: Request, res: Response) => {
        const data = req.body as unknown as CreateBlogDto;
        const user = req.user;

        // if (!user) {
        //     throw AppError.forbidden("Only admins can create blog posts");
        // }

        data.author = '687079ca427278c033a8d8ed' //user.id.toString();

        const result = await this.service.create(CreateBlogDtoSchema.parse(data));

        return res.json({
            success: true,
            status: 201,
            message: "Blog post created successfully",
            data: result,
        });
    });

    update = ApiHandler(async (req: Request, res: Response) => {
        const id = req.params.id;
        const data = req.body;
        const user = req.user;

        if (!user) {
            throw AppError.forbidden("Only admins can update blog posts");
        }

        const result = await this.service.update(id, UpdateBlogDtoSchema.parse(data));

        return res.json({
            success: true,
            status: 200,
            message: "Blog post updated successfully",
            data: result,
        });
    });

    delete = ApiHandler(async (req: Request, res: Response) => {
        const id = req.params.id;
        const user = req.user;
        if (!user) {
            throw AppError.forbidden("Only admins can delete blog posts");
        }
        const result = await this.service.delete(id);

        return res.json({
            success: true,
            status: 200,
            message: "Blog post deleted successfully",
            data: result,
        });
    });
}
