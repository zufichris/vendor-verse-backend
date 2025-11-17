import { z } from "zod";

export const CouponSchema = z.object({
    code: z.string(),
    discountPercent: z.number().positive().max(100),
    userEmail: z.string().email().optional().nullable(),
    used: z.boolean().default(false),
    maxUses: z.number().int().min(0).default(0),
    usesCount: z.number().int().min(0).default(0),
    expiresAt: z.date().optional().nullable(),
    minOrderAmount: z.number().min(0).optional().nullable(),
    createdAt: z.date(),
    id: z.string()
})




export type Coupon = z.infer<typeof CouponSchema>



