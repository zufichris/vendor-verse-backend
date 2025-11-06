import { BaseRepository } from "../../core/repository";
import { BlogModel } from "./blog.model";
import { Blog } from "./blog.types";

export class BlogRepository extends BaseRepository<Blog> {
    constructor(protected readonly model: typeof BlogModel) {
        super(model);
    }

    findBySlug(slug: string) {
        return this.findOne({ slug }, undefined, { populate: ['author'] });
    }
}