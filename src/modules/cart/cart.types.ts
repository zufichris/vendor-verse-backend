import z from "zod";
import { size } from "zod/v4";
import { SupportedSizes } from "../product";

export const CartSchema = z.object({
    id: z.string(),
    userId: z.string(),
    productId: z.string(),
    productName: z.string(),
    unitPrice: z.number().positive(),
    quantity: z.number().positive(),
    productImageurl: z.string().url(),
    size: z.nativeEnum(SupportedSizes)
})

// in mongoose, make userId&productId a unique constraint

export type Cart = z.infer<typeof CartSchema>;