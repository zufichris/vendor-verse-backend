import { z } from "zod";
import { ECurrency } from "../../../shared/enum";

export const PaymentMethodSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    pmtId: z.string().optional(),
    description: z.string(),
    logo: z.string().optional(),
    supportedCurrencies: z.array(z.nativeEnum(ECurrency.Enum)).default(Object.values(ECurrency.enum)),
    feeStructure: z
        .object({
            percentage: z.number().min(0),
            fixed: z.number().min(0),
        })
        .optional(),
    isActive: z.boolean(),
    minAmount: z.number().min(0),
    maxAmount: z.number().min(0).optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
})
    .strict()

export type TPaymentMethod = z.infer<typeof PaymentMethodSchema>

let t: TPaymentMethod
