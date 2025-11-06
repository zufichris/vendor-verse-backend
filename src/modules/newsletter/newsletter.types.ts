import { z } from "zod";

export const NewsLetterSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    isSubscribed: z.boolean().default(true)
});



export type NewsLetter = z.infer<typeof NewsLetterSchema>;
