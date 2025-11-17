import z from "zod"

export const CreateCouponSchema = z.object({
    code: z.string().optional().nullable(),
    discountPercent: z.number().positive().max(100),
    userEmail: z.string().email().optional().nullable(),
    maxUses: z.number().int().min(0).default(0),
    expiresAt: z.date().optional().nullable(),
    minOrderAmount: z.number().min(0).optional().nullable()
})

export const ValidateCouponSchema = z.object({
    code: z.string(),
    totalAmount: z.number().positive().optional().nullable(),
    userEmail: z.string().email()
})

export type CreateCouponDTO = z.infer<typeof CreateCouponSchema>
export type ValidateCouponDTO = z.infer<typeof ValidateCouponSchema>