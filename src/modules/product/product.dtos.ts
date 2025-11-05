import { z } from "zod";
import {
    DimensionsSchema,
    ImageSchema,
    ProductCategorySchema,
    ProductConditionSchema,
    ProductSchema,
    ProductStatusSchema,
    ProductTypeSchema,
    ProductVisibilitySchema,
    SeoSchema,
} from "./product.types";

export enum SupportedSizes {
    XXS = "XXS",
    XS = "XS",
    S = "S",
    M = "M",
    L = "L",
    XL = "XL",
    XXL = "XXL",
    XXXL = "XXXL"
}

export const CreateProductDtoSchema = z
    .object({
        name: z.string().min(1).describe("product name"),
        description: z.string().min(1).describe("product description"),
        slug: z
            .string()
            .min(1)
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
            .optional(),
        sku: z.string().min(1).max(50).optional(),
        price: z.number().positive(),
        currency: z.string().length(3),
        discountPercentage: z.number().min(0).max(100).optional(),
        discountFixedAmount: z.number().positive().optional(),
        discountStartDate: z.string().datetime().optional(),
        discountEndDate: z.string().datetime().optional(),
        categoryId: z.string(),
        brand: z.string().min(1).optional(),
        tags: z.array(z.string()).optional(),
        images: z.array(ImageSchema).default([]),
        thumbnail: ImageSchema,
        type: ProductTypeSchema,
        status: ProductStatusSchema,
        visibility: ProductVisibilitySchema,
        condition: ProductConditionSchema.optional(),
        featured: z.boolean(),
        stockQuantity: z.number().int().min(0),
        variants: z
            .array(
                z.object({
                    sku: z.string().min(1).max(50),
                    name: z.string().optional(),
                    price: z.number().positive(),
                    currency: z.string().length(3),
                    discountPrice: z.number().positive().optional(),
                    discountPercentage: z.number().min(0).max(100).optional(),
                    discountFixedAmount: z.number().positive().optional(),
                    attributes: z.record(z.string(), z.string()).optional(),
                    stockQuantity: z.number().int().min(0),
                    images: z.array(ImageSchema).optional(),
                    thumbnail: ImageSchema.optional(),
                    weight: z.number().positive().optional(),
                    weightUnit: z.string().optional(),
                    dimensions: DimensionsSchema.optional(),
                }),
            )
            .optional(),
        weight: z.number().positive().optional(),
        weightUnit: z.string().optional(),
        dimensions: DimensionsSchema.optional(),
        seo: SeoSchema.optional(),
        createdById: z.string(),
        updatedById: z.string().optional(),
    })
    .superRefine((data: any, ctx: any) => {
        if (
            data.type === "configurable" &&
            (!data.variants || data.variants.length === 0)
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    "Configurable products require at least one variant when being created.",
                path: ["variants"],
            });
        }
    });

export const UpdateProductDtoSchema = z
    .object({
        name: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        slug: z
            .string()
            .min(1)
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
            .optional(),
        price: z.number().positive().optional(),
        currency: z.string().length(3).optional(),
        discountPercentage: z.number().min(0).max(100).optional(),
        discountFixedAmount: z.number().positive().optional(),
        discountStartDate: z.string().datetime().optional(),
        discountEndDate: z.string().datetime().optional(),
        categoryId: z.string().optional(),
        brand: z.string().min(1).optional(),
        tags: z.array(z.string()).optional(),
        images: z.array(ImageSchema).optional(),
        thumbnail: ImageSchema.optional(),
        type: ProductTypeSchema.optional(),
        status: ProductStatusSchema.optional(),
        visibility: ProductVisibilitySchema.optional(),
        condition: ProductConditionSchema.optional(),
        featured: z.boolean().optional(),
        stockQuantity: z.number().int().min(0).optional(),
        isInStock: z.boolean().default(true),
        variants: z
            .array(
                z
                    .object({
                        id: z.string().optional(),
                        sku: z.string().min(1).max(50).optional(),
                        name: z.string().optional(),
                        price: z.number().positive().optional(),
                        currency: z.string().length(3).optional(),
                        discountPrice: z.number().positive().optional(),
                        discountPercentage: z.number().min(0).max(100).optional(),
                        discountFixedAmount: z.number().positive().optional(),
                        attributes: z.record(z.string(), z.string()).optional(),
                        stockQuantity: z.number().int().min(0).optional(),
                        images: z.array(ImageSchema).optional(),
                        thumbnail: ImageSchema.optional(),
                        weight: z.number().positive().optional(),
                        weightUnit: z.string().optional(),
                        dimensions: DimensionsSchema.optional(),
                        createdAt: z.string().datetime().optional(),
                        updatedAt: z.string().datetime().optional(),
                    })
                    .partial(),
            )
            .optional(),
        weight: z.number().positive().optional(),
        weightUnit: z.string().optional(),
        dimensions: DimensionsSchema.optional(),
        seo: SeoSchema.optional(),
        updatedById: z.string().optional(),
    })
    .superRefine((data: any, ctx: any) => {
        if (data.type && data.type === "configurable") {
            if (data.variants && data.variants.length === 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Configurable products must retain at least one variant.",
                    path: ["variants"],
                });
            }
        }
    });

export const ProductResponseDtoSchema = ProductSchema;

export const CreateProductCategoryDtoSchema = z.object({
    name: z.string().min(1),
    slug: z
        .string()
        .min(1)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().optional(),
    parentId: z.string().optional(),
    image: ImageSchema.optional(),
    seo: SeoSchema.optional(),
});

export const UpdateProductCategoryDtoSchema = z.object({
    name: z.string().min(1).optional(),
    slug: z
        .string()
        .min(1)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .optional(),
    description: z.string().optional(),
    parentId: z.string().optional(),
    image: ImageSchema.optional(),
    seo: SeoSchema.optional(),
    updatedAt: z.string().datetime().optional(),
});

export const CreateProductVariantSchema = z.object({
    productId: z.string(),
    sku: z.string().min(1).max(50),
    name: z.string().optional(),
    colorCode: z.string(), // hex color code
    price: z.coerce.number().positive(),
    currency: z.string().length(3),
    discountPrice: z.coerce.number().min(0).optional(),
    discountPercentage: z.coerce.number().min(0).max(100).optional(),
    discountFixedAmount: z.coerce.number().min(0).optional(),
    attributes: z.record(z.string(), z.string()).optional(),
    stockQuantity: z.coerce.number().int().min(0).default(100000000),
    isInStock: z.boolean().default(true),
    images: z.array(ImageSchema),
    thumbnail: ImageSchema,
    sizes: z.array(z.nativeEnum(SupportedSizes)).min(1),
    weight: z.coerce.number().min(0).optional(),
    weightUnit: z.string().optional(),
    dimensions: DimensionsSchema.optional(),
    isDeleted: z.boolean().default(false),
    deletedAt: z.date().optional(),
    deletedById: z.string().optional(),
    createdAt: z.string().datetime().default(new Date().toISOString()),
    updatedAt: z.string().datetime().optional(),
});

export type CreateProductDto = z.infer<typeof CreateProductDtoSchema>;
export type UpdateProductDto = z.infer<typeof UpdateProductDtoSchema>;
export type ProductResponseDto = z.infer<typeof ProductResponseDtoSchema>;
export type CreateProductCategoryDto = z.infer<
    typeof CreateProductCategoryDtoSchema
>;

export type CreateProductVariantDto = z.infer<typeof CreateProductVariantSchema>;
export type UpdateProductCategoryDto = z.infer<
    typeof UpdateProductCategoryDtoSchema
>;
export type ProductCategoryResponseDto = z.infer<typeof ProductCategorySchema>;
