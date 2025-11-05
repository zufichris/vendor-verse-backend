import z from "zod";

export const createPaginatedResponseData = <T extends z.ZodTypeAny>(data: T) => z.object({
    totalCount: z.number().default(0),
    data: z.array(data).optional().default([]),
    page: z.number().default(1),
    limit: z.number().default(20),
    filterCount: z.number().default(0),
    totalPages: z.number().default(1),
    hasNextPage: z.boolean().default(false),
    hasPreviousPage: z.boolean().default(false)
})

export const createResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
        success: z.boolean().default(true),
        message: z.string().optional().default("Operation completed successfully"),
        status: z.number().default(200),
        data: dataSchema.optional(), // The data can be optional for some responses (e.g., deletions)
    });

export const createErrorResponse = ({ status = 500, message = 'Unexpected error', error = null }: { status?: number; message?: string, error?: any }) => ({
    status,
    error,
    message,
    data: null
})

export const PaginationOptionsDtoSchema = z.object({
    page: z.coerce.number().positive().optional(),
    limit: z.coerce.number().positive().optional()
})

export const DEFAULT_SORT_FIELDS = ['createdAt', 'updatedAt'] as const;

type DefaultSortFields = typeof DEFAULT_SORT_FIELDS[number];

export const SortOptionsDtoSchema = <T extends Record<string, any>>(keys: (keyof T)[]) => z.object({
    sortBy: z.enum([...DEFAULT_SORT_FIELDS, ...keys] as [string, ...string[]]).optional().default('createdAt'),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc")
});

export const DateQueryDtoSchema = z.object({
    min: z.date(),
    max: z.date()
}).partial().refine((arg) => {
    if (arg.max && arg.min) {
        return arg.max >= arg.min
    }
}, { message: 'Min date must be less than max date' })

export const NumberQueryDtoSchema = z.object({
    min: z.coerce.number().positive(),
    max: z.coerce.number().positive()
}).partial().refine((arg) => {
    if (arg.max && arg.min) {
        return arg.max >= arg.min
    }
}, { message: 'min value must be less than max value' })

export type PaginationOptionsDto = z.infer<typeof PaginationOptionsDtoSchema>
export type SortOptionsDto<T extends Record<string, any>> = z.infer<ReturnType<typeof SortOptionsDtoSchema<T>>>
export type DateQueryDto = z.infer<typeof DateQueryDtoSchema>
export type NumberQueryDto = z.infer<typeof NumberQueryDtoSchema>