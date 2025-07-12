import { z } from "zod";

export const ProductStatusSchema = z.enum([
    "active",
    "inactive",
    "draft",
    "archived",
    "deleted",
]);

export const ProductVisibilitySchema = z.enum(["public", "private", "hidden"]);

export const ProductConditionSchema = z.enum(["new", "used", "refurbished"]);

export const ProductTypeSchema = z.enum([
    "simple",
    "configurable",
    "virtual",
    "downloadable",
]);

export const ImageSchema = z.object({
    url: z.string().url(),
    altText: z.string().optional(),
});

export const DimensionsSchema = z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
    unit: z.string().optional(),
});

export const SeoSchema = z.object({
    title: z.string().max(70).optional(),
    description: z.string().max(160).optional(),
    metaKeywords: z.array(z.string()).optional(),
    canonicalUrl: z.string().url().optional(),
});

export const ProductCategorySchema = z.object({
    id: z.string(),
    name: z.string().min(1),
    slug: z
        .string()
        .min(1)
        .toLowerCase()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().optional(),
    parentId: z.string().optional(),
    image: ImageSchema.optional(),
    seo: SeoSchema.optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime().optional(),
});

export const ProductVariantSchema = z.object({
    id: z.string(),
    productId: z.string(),
    sku: z.string().min(1).max(50),
    name: z.string().optional(),
    price: z.number().positive(),
    currency: z.string().length(3),
    discountPrice: z.number().positive().optional(),
    discountPercentage: z.number().min(0).max(100).optional(),
    discountFixedAmount: z.number().positive().optional(),
    attributes: z.record(z.string(), z.string()).optional(),
    stockQuantity: z.number().int().min(0),
    isInStock: z.boolean(),
    images: z.array(ImageSchema).optional(),
    thumbnail: ImageSchema.optional(),
    weight: z.number().positive().optional(),
    weightUnit: z.string().optional(),
    dimensions: DimensionsSchema.optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime().optional(),
});

export const ProductSchema = z
    .object({
        id: z.string(),
        name: z.string().min(1),
        description: z.string().min(1),
        slug: z
            .string()
            .min(1)
            .toLowerCase()
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        sku: z.string().min(1).max(50),
        price: z.number().positive(),
        currency: z.string().length(3),
        discountPercentage: z.number().min(0).max(100).optional(),
        discountFixedAmount: z.number().positive().optional(),
        discountStartDate: z.string().datetime().optional(),
        discountEndDate: z.string().datetime().optional(),
        categoryId: z.string(),
        category: ProductCategorySchema.optional(),
        brand: z.string().min(1).optional(),
        tags: z.array(z.string()).optional(),
        images: z.array(ImageSchema).min(1),
        thumbnail: ImageSchema,
        type: ProductTypeSchema,
        status: ProductStatusSchema,
        visibility: ProductVisibilitySchema,
        condition: ProductConditionSchema.optional(),
        featured: z.boolean(),
        stockQuantity: z.number().int().min(0),
        isInStock: z.boolean(),
        variants: z.array(ProductVariantSchema).optional(),
        weight: z.number().positive().optional(),
        weightUnit: z.string().optional(),
        dimensions: DimensionsSchema.optional(),
        seo: SeoSchema.optional(),
        createdById: z.string(),
        updatedById: z.string().optional(),
        createdAt: z.string().datetime(),
        updatedAt: z.string().datetime().optional(),
        isDeleted: z.boolean().optional(),
        deletedAt: z.string().datetime().optional(),
        deletedById: z.string().optional(),
    })
    .superRefine((data: any, ctx: any) => {
        if (data.type === "configurable") {
            if (!data.variants || data.variants.length === 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Configurable products must have at least one variant.",
                    path: ["variants"],
                });
            }
        } else if (data.type === "simple") {
            if (data.variants && data.variants.length > 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Simple products cannot have variants.",
                    path: ["variants"],
                });
            }
        }
        if (
            (data.type === "virtual" || data.type === "downloadable") &&
            (data.weight !== undefined || data.dimensions !== undefined)
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    "Virtual/Downloadable products should not have weight or dimensions.",
                path: ["weight", "dimensions"],
            });
        }
    });

export const ProductCategoryResponseDtoSchema = ProductCategorySchema;
export type ProductStatus = z.infer<typeof ProductStatusSchema>;
export type ProductVisibility = z.infer<typeof ProductVisibilitySchema>;
export type ProductCondition = z.infer<typeof ProductConditionSchema>;
export type ProductType = z.infer<typeof ProductTypeSchema>;
export type ImageMeta = z.infer<typeof ImageSchema>;
export type Dimensions = z.infer<typeof DimensionsSchema>;
export type Seo = z.infer<typeof SeoSchema>;
export type ProductCategory = z.infer<typeof ProductCategorySchema>;
export type ProductVariant = z.infer<typeof ProductVariantSchema>;
export type Product = z.infer<typeof ProductSchema>;
