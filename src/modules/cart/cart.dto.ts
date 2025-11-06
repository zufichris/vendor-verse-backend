import z from "zod";
import { ImageSchema, ProductStatusSchema, ProductVariantSchema, SupportedSizes } from "../product";

export const UpsertCartSchema = z.object({
    size: z.nativeEnum(SupportedSizes),
    variantId: z.string(),
    userId: z.string(),
    quantity: z.number() //can be 0 if we want to remove the item from cart
})

const userSchema = z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string().optional()
})

const productSchema = z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    thumbnail: ImageSchema,
    images: z.array(ImageSchema).optional(),
    slug: z.string(),
    status: ProductStatusSchema,
    currency: z.string()
})

export const RemoveFromCartSchema = z.object({
    variantId: z.string().optional(),
    userId: z.string()
})

export const CartResponseSchema = z.object({
    id: z.string(),
    userId: z.union([z.string(), userSchema]),
    variantId: z.union([z.string(), ProductVariantSchema]),
    productName: z.string(),
    unitPrice: z.number().positive(),
    quantity: z.number().positive(),
    productImageurl: z.string().url(),
    variant: ProductVariantSchema.optional().nullable(),
    user: userSchema.optional().nullable(),
    size: z.nativeEnum(SupportedSizes)
}).transform(data => {
    const { variantId, userId } = data;

    if (variantId && typeof variantId === 'object') {
        data.variant = variantId;
        data.variantId = variantId?.id || (variantId as any)?._id?.toString();
    } else {
        data.variant = null;
        data.variantId = variantId;
    }

    if (userId && typeof userId === 'object') {
        data.user = userId;
        data.userId = userId?.id || (userId as any)?._id?.toString();
    } else {
        data.user = null;
        data.userId = userId;
    }

    return data;
})

export type UpsertCartDTO = z.infer<typeof UpsertCartSchema>;
export type RemoveFromCartDTO = z.infer<typeof RemoveFromCartSchema>