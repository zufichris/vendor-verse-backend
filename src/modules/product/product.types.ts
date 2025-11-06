import { z } from "zod";

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
    length: z.coerce.number().min(0).default(0),
    width: z.coerce.number().min(0).default(0),
    height: z.coerce.number().min(0).default(0),
    unit: z.string().optional(),
});

export const SeoSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
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
    slug: z.string(),
    sku: z.string().min(1).max(50),
    name: z.string(),
    colorCode: z.string(), // valid hex color code
    price: z.coerce.number().positive(),
    currency: z.string().length(3),
    discountPrice: z.coerce.number().min(0).default(0),
    discountPercentage: z.coerce.number().min(0).max(100).optional(),
    discountFixedAmount: z.coerce.number().positive().optional(),
    attributes: z.record(z.string(), z.string()).optional(),
    stockQuantity: z.coerce.number().int().min(0),
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
        category: ProductCategorySchema,
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
        isInStock: z.boolean(),
        variantIds: z.array(z.string()),
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

export const BannerSchema = z.object({
    id: z.string(),
    slug: z.string().describe("banner unique slug"),
    title: z.string().describe("Banner Tittle"),
    subtitle: z.string().describe("banner subtitle"),
    description: z.string().describe("banner description"),
    image: z.string().describe("banner image"),
    cta: z.string().describe("banner cta"),
    link: z.string().describe("banner redirection link"),
    color: z.string().optional().describe("white").describe("banner main color"),
});

export type Banner = z.infer<typeof BannerSchema>;
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
