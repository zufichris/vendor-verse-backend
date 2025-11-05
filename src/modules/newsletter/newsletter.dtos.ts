import { z } from "zod";
import { PaginationOptionsDtoSchema, SortOptionsDtoSchema } from "../../core/dtos";

export const CreateNewsLetterDtoSchema = z.object({
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional()
});

export const QueryNewsLetterDtoSchema = z.object({
    email: z.string().email().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    isSubscribed: z.boolean().optional(),
}).merge(PaginationOptionsDtoSchema).merge(SortOptionsDtoSchema(['email', 'firstName', 'lastName', 'isSubscribed']));



export type CreateNewsLetterDto = z.infer<typeof CreateNewsLetterDtoSchema>;
export type QueryNewsLetterDto = z.infer<typeof QueryNewsLetterDtoSchema>;
