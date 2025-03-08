import mongoose, { Schema, Document, Model } from "mongoose";
import { EDimensionUnit, EProductStatus, ProductSchema, TDimension, TImage, TInventory, TProduct, TSeo, TVariant } from "../../../entity/product";
import { ECurrency } from "../../../../shared/enum";
import { validateBeforeSave } from "../../../../util/functions";

const PriceSchema = new mongoose.Schema<Record<string, unknown> & Document>(
    {
        amount: { type: Number, required: true, min: 0 },
        compareAtPrice: { type: Number, min: 0 },
        costPrice: { type: Number, min: 0 },
        wholesalePrice: { type: Number, min: 0 },
    },
    { _id: false }
);

const TranslationsSchema = new Schema<Record<string, unknown> & Document>(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        shortDescription: { type: String },
    },
    { _id: false }
);


const InventorySchema = new Schema<TInventory & Document>(
    {
        quantity: { type: Number, required: true, min: 0 },
        lowStockThreshold: { type: Number, min: 0 },
        trackInventory: { type: Boolean, default: true },
        allowBackOrder: { type: Boolean, default: false },
    },
    { _id: false }
);


const ImageSchema = new Schema<TImage & Document>(
    {
        id: { type: String, required: true },
        url: { type: String, required: true },
        alt: { type: String },
        sortOrder: { type: Number, default: 0 },
    },
    { _id: false }
);


const VariantSchema = new Schema<TVariant & Document>(
    {
        id: { type: String, required: true },
        sku: { type: String },
        barcode: { type: String },
        prices: { type: Map, of: PriceSchema, required: true },
        inventory: { type: Number, required: true, min: 0 },
        attributes: { type: Map, of: String },
    },
    { _id: false }
);

const DimensionsSchema = new Schema<TDimension & Document>(
    {
        length: { type: Number, required: true, min: 0 },
        width: { type: Number, required: true, min: 0 },
        height: { type: Number, required: true, min: 0 },
        unit: { type: String, enum: Object.values(EDimensionUnit.Enum), required: true },
    },
    { _id: false }
);

const SeoSchema = new Schema<TSeo & Document>(
    {
        title: { type: String, maxlength: 60 },
        description: { type: String, maxlength: 160 },
        keywords: [{ type: String }],
    },
    { _id: false }
);




export type ProductDocument = TProduct & Document

const schema = new Schema<ProductDocument>(
    {
        vendorId: { type: String, required: true },
        name: { type: String, required: true, minlength: 2, maxlength: 200 },
        slug: { type: String, required: true, minlength: 2, maxlength: 200 },
        description: { type: String, required: true },
        shortDescription: { type: String, maxlength: 300 },
        sku: { type: String },
        barcode: { type: String },
        defaultPrice: { type: Number, required: true, min: 0 },
        defaultCurrency: { type: String, enum: Object.values(ECurrency.Enum), required: true },
        prices: { type: Map, of: PriceSchema, required: true },
        categories: [{ type: String, required: true }],
        tags: [{ type: String }],
        brand: { type: String },
        mainImage: { type: ImageSchema, required: true },
        images: { type: [ImageSchema], required: true },
        variants: { type: [VariantSchema] },
        attributes: { type: Map, of: Schema.Types.Mixed },
        status: { type: String, enum: Object.values(EProductStatus.Enum), required: true },
        inventory: { type: InventorySchema, required: true },
        seo: { type: SeoSchema },
        translations: { type: Map, of: TranslationsSchema },
        rating: { type: Number, default: 0, min: 0, max: 5 },
        reviewCount: { type: Number, default: 0, min: 0 },
        salesCount: { type: Number, default: 0, min: 0 },
        promotions: [{ type: String }],
        weight: { type: Number, min: 0 },
        dimensions: { type: DimensionsSchema },
        isFeatured: { type: Boolean, default: false },
        isBestSeller: { type: Boolean, default: false },
        isLimitedEdition: { type: Boolean, default: false },
        isPromoted: { type: Boolean, default: false },
        isNewProduct: { type: Boolean, default: false },
    },
    { timestamps: true }
);

validateBeforeSave(schema, ProductSchema, "Product")

export const ProductModel: Model<ProductDocument> = mongoose.models.Product || mongoose.model<ProductDocument>("Product", schema);

