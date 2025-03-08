import { z } from "zod";
import { ECurrency, ELanguageCode } from "../../../shared/enum";

export const EProductStatus = z.enum(["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"])
export const EDimensionUnit = z.enum(["CM", "INCH"]);

const PricesSchema = z.record(
    z.nativeEnum(ECurrency.Enum),
    z.object({
        amount: z.number().min(0),
        compareAtPrice: z.number().min(0).optional(),
        costPrice: z.number().min(0).optional(),
        wholesalePrice: z.number().min(0).optional(),
    }).strict()
);
const TranslationsSchema = z.record(
    z.nativeEnum(ELanguageCode.Enum),
    z.object({
        name: z.string(),
        description: z.string(),
        shortDescription: z.string().optional(),
    }).strict()
).optional();
const InventorySchema = z.object({
    quantity: z.number().min(0),
    lowStockThreshold: z.number().min(0).optional(),
    trackInventory: z.boolean().default(true),
    allowBackOrder: z.boolean().default(false),
}).strict();

const ImageSchema = z.object({
    id: z.string().uuid(),
    url: z.string().url(),
    alt: z.string().optional(),
    sortOrder: z.number().default(0),
}).strict();

const VariantSchema = z.object({
    id: z.string().uuid(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    prices: PricesSchema,
    inventory: z.number().min(0),
    attributes: z.record(z.string(), z.string()).optional(),
}).strict();

const DimensionsSchema = z.object({
    length: z.number().min(0),
    width: z.number().min(0),
    height: z.number().min(0),
    unit: EDimensionUnit,
}).strict().optional();

const SeoSchema = z.object({
    title: z.string().max(60).optional(),
    description: z.string().max(160).optional(),
    keywords: z.array(z.string()).optional(),
}).strict().optional();



export const ProductSchema = z.object({
    id: z.string().uuid().optional(),
    vendorId: z.string().uuid(),
    name: z.string().min(2).max(200),
    slug: z.string().min(2).max(200),
    description: z.string(),
    shortDescription: z.string().max(300).optional(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    defaultPrice: z.number().min(0),
    defaultCurrency: z.nativeEnum(ECurrency.Enum),
    prices: PricesSchema,
    categories: z.array(z.string().uuid()),
    tags: z.array(z.string()).optional(),
    brand: z.string().optional(),
    mainImage: ImageSchema.required().strict(),
    images: z.array(ImageSchema),
    variants: z.array(VariantSchema).optional(),
    attributes: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
    status: EProductStatus.optional().default(EProductStatus.enum.ACTIVE),
    inventory: InventorySchema,
    seo: SeoSchema,
    translations: TranslationsSchema,
    rating: z.number().min(0).max(5).default(0),
    reviewCount: z.number().min(0).default(0),
    salesCount: z.number().min(0).default(0),
    promotions: z.array(z.string()).default([]),
    weight: z.number().min(0).optional(),
    dimensions: DimensionsSchema,
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    isPromoted: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    isNewProduct: z.boolean().default(false),
    isBestSeller: z.boolean().default(false),
    isLimitedEdition: z.boolean().default(false),
}).strict();

export type TProduct = z.infer<typeof ProductSchema>;
export type TPrice = z.infer<typeof PricesSchema>;
export type TVariant = z.infer<typeof VariantSchema>;
export type TTranslations = z.infer<typeof TranslationsSchema>;
export type TInventory = z.infer<typeof InventorySchema>;
export type TImage = z.infer<typeof ImageSchema>;
export type TSeo = z.infer<typeof SeoSchema>;
export type TDimension = z.infer<typeof DimensionsSchema>;
