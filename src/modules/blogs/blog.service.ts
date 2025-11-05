import { FilterQuery } from "mongoose";
import { AppError } from "../../core/middleware";
import { sanitizeHtml } from "../../core/utils/sanitizeHtml.util";
import { CreateBlogDto, CreateBlogDtoSchema, GetBlogsDto, GetBlogsDtoSchema, UpdateBlogDto, UpdateBlogDtoSchema } from "./blog.dtos";
import { BlogRepository } from "./blog.repository";

export class BlogService {
    constructor(
        private readonly repo: BlogRepository
    ) { }

    query(filter: GetBlogsDto) {
        const parseResult = GetBlogsDtoSchema.safeParse(filter);

        if (!parseResult.success) {
            throw AppError.unprocessableEntity("Invalid query parameters", parseResult.error.format());
        }

        const { page: pg, limit: lm, sortBy, sortOrder: sortorder, search, ...filters } = parseResult.data;

        const page = Math.max(pg || 1, 1);
        const limit = Math.min(Math.max(lm || 20, 1), 100);
        const sortField = sortBy || 'createdAt';
        const sortOrder = sortorder === 'desc' ? -1 : 1;
        const offset = (page - 1) * limit;

        const query: FilterQuery<any> = filters;

        if (search && search.length) {
            query.$or = [{
                title: {
                    $regex: search.trim(),
                    $options: 'i'
                }
            }, {
                tags: {
                    $regex: search.trim(),
                    $options: 'i'
                }
            }]
        }

        return this.repo.paginate({
            filter: query,
            projection: {},
            options: {
                skip: offset,
                limit,
                sort: {
                    [sortField]: sortOrder
                },
                populate: ['author']
            }
        });
    }

    getBySlug(slug: string) {
        return this.repo.findBySlug(slug);
    }

    getById(id: string) {
        return this.repo.findById(id, undefined, { populate: ['author'] });
    }

    create(data: CreateBlogDto) {
        const parsed = CreateBlogDtoSchema.safeParse(data);

        if (!parsed.success) {
            throw AppError.unprocessableEntity("Invalid data", parsed.error.format());
        }

        // Sanitize html content here if needed
        const sanitizedHtmlContent = sanitizeHtml(parsed.data.htmlContent);

        return this.repo.create({ ...parsed.data, htmlContent: sanitizedHtmlContent });
    }

    update(id: string, data: UpdateBlogDto) {
        const parsed = UpdateBlogDtoSchema.safeParse(data);

        if (!parsed.success) {
            throw AppError.unprocessableEntity("Invalid data", parsed.error.format());
        }

        // Sanitize html content here if needed
        if (parsed.data.htmlContent) {
            parsed.data.htmlContent = sanitizeHtml(parsed.data.htmlContent);
        }

        return this.repo.updateById(id, parsed.data);
    }

    delete(id: string) {
        return this.repo.deleteById(id);
    }
}