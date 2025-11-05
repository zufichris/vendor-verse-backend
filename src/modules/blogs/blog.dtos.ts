import z from "zod";
import { PaginationOptionsDtoSchema, SortOptionsDtoSchema } from "../../core/dtos";

export const CreateBlogDtoSchema = z.object({
    title: z.string()
        .min(5)
        .max(150)
        .regex(/^[a-zA-Z0-9\s\-\.]+$/, 'Title can only contain letters, numbers, spaces, hyphens and dots'),
    mainImageUrl: z.string().url().optional(),
    htmlContent: z.string(),
    jsonContent: z.any().optional(),
    summary: z.string().max(300).optional(),
    tags: z.array(z.string()).optional(),
    author: z.string().min(2).max(100),
});

export const UpdateBlogDtoSchema = CreateBlogDtoSchema.partial();

export const GetBlogsDtoSchema = z.object({
    tag: z.string().optional(),
    author: z.string().optional(),
    search: z.string().optional(),
}).merge(PaginationOptionsDtoSchema).merge(SortOptionsDtoSchema(['title']));

export type CreateBlogDto = z.infer<typeof CreateBlogDtoSchema>;

export type UpdateBlogDto = z.infer<typeof UpdateBlogDtoSchema>;

export type GetBlogsDto = z.infer<typeof GetBlogsDtoSchema>;