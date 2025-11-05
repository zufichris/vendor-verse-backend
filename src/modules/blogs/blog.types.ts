import z from "zod";

export const BlogSchema = z.object({
    id: z.string(),
    title: z.string()
        .min(5)
        .max(150)
        .regex(/^[a-zA-Z0-9\s\-\.]+$/, 'Title can only contain letters, numbers, spaces, hyphens and dots'),
    slug: z.string(),
    mainImageUrl: z.string().url().optional(),
    htmlContent: z.string(), //maybe markdown or rich text or html
    jsonContent: z.any().optional(), // structured content like JSON from a rich text editor
    summary: z.string().max(300).optional(),
    tags: z.array(z.string()).optional(),
    author: z.string().min(2).max(100),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type Blog = z.infer<typeof BlogSchema>;