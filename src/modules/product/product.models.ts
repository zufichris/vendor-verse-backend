import { Schema, model, Document, Types, models } from "mongoose";
import {
    ImageMeta,
    Product,
    ProductCategory,
    ProductVariant,
} from "./product.types";

export type ProductCategoryDocument = ProductCategory &
    Document<ProductCategory>;
export type ProductVariantDocument = ProductVariant & Document<ProductVariant>;
export type ProductDocument = Product & Document<Product>;

const ImageSchema = new Schema<ImageMeta>(
    {
        url: { type: String, required: true },
        altText: { type: String },
    },
    { timestamps: false, _id: false, versionKey: false },
);

const DimensionsSchema = new Schema(
    {
        length: { type: Number, required: true, min: 0 },
        width: { type: Number, required: true, min: 0 },
        height: { type: Number, required: true, min: 0 },
        unit: { type: String },
    },
    { timestamps: false, _id: false, versionKey: false },
);

const SeoSchema = new Schema(
    {
        title: { type: String, maxlength: 70 },
        description: { type: String, maxlength: 160 },
        metaKeywords: [{ type: String }],
    },
    { timestamps: false, _id: false, versionKey: false },
);

const ProductCategorySchema = new Schema<ProductCategoryDocument>(
    {
        name: { type: String, required: true, minlength: 1 },
        slug: {
            type: String,
            required: true,
            minlength: 1,
            match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        },
        description: { type: String },
        parentId: { type: String },
        image: { type: ImageSchema },
        seo: { type: SeoSchema },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_, ret) => {
                ret.id = ret._id;
                delete ret._id;
            },
            versionKey: false,
        },
    },
);

const ProductVariantSchema = new Schema<ProductVariantDocument>(
    {
        productId: { type: String, required: true },
        sku: { type: String, required: true, minlength: 1, maxlength: 50 },
        name: { type: String },
        price: { type: Number, required: true, min: 0 },
        currency: { type: String, required: true, length: 3 },
        discountPrice: { type: Number, min: 0 },
        discountPercentage: { type: Number, min: 0, max: 100 },
        discountFixedAmount: { type: Number, min: 0 },
        attributes: { type: Map, of: String },
        stockQuantity: { type: Number, required: true, min: 0, default: 0 },
        isInStock: { type: Boolean, required: true, default: false },
        images: [{ type: ImageSchema }],
        thumbnail: { type: ImageSchema },
        weight: { type: Number, min: 0 },
        weightUnit: { type: String },
        dimensions: { type: DimensionsSchema },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_, ret) => {
                ret.id = ret._id;
                delete ret._id;
            },
            versionKey: false,
        },
    },
);

const ProductSchema = new Schema<ProductDocument>(
    {
        name: { type: String, required: true, minlength: 1 },
        description: { type: String, required: true, minlength: 1 },
        slug: {
            type: String,
            required: true,
            minlength: 1,
            match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        },
        sku: { type: String, required: true, minlength: 1, maxlength: 50 },
        price: { type: Number, required: true, min: 0 },
        currency: { type: String, required: true, length: 3 },
        discountPercentage: { type: Number, min: 0, max: 100 },
        discountFixedAmount: { type: Number, min: 0 },
        discountStartDate: { type: Date },
        discountEndDate: { type: Date },
        categoryId: { type: String, required: true },
        category: { type: ProductCategorySchema },
        brand: { type: String, minlength: 1 },
        tags: [{ type: String }],
        images: [{ type: ImageSchema, required: true }],
        thumbnail: { type: ImageSchema, required: true },
        type: {
            type: String,
            enum: ["simple", "configurable", "virtual", "downloadable"],
            required: true,
        },
        status: {
            type: String,
            enum: ["active", "inactive", "draft", "archived", "deleted"],
            required: true,
        },
        visibility: {
            type: String,
            enum: ["public", "private", "hidden"],
            required: true,
        },
        condition: { type: String, enum: ["new", "used", "refurbished"] },
        featured: { type: Boolean, required: true, default: false },
        stockQuantity: { type: Number, required: true, min: 0, default: 0 },
        isInStock: { type: Boolean, required: true, default: false },
        variants: [{ type: ProductVariantSchema }],
        weight: { type: Number, min: 0 },
        weightUnit: { type: String },
        dimensions: { type: DimensionsSchema },
        seo: { type: SeoSchema },
        createdById: { type: String, required: true },
        updatedById: { type: String },
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date },
        deletedById: { type: String },
    },
    {
        toJSON: {
            transform: (_, ret) => {
                ret.id = ret._id;
                delete ret._id;
            },
            versionKey: false,
        },
        timestamps: true,
    },
);

export const ProductCategoryModel =
    models.ProductCategory ||
    model<ProductCategoryDocument>("ProductCategory", ProductCategorySchema);
export const ProductVariantModel =
    models.ProductVariant ||
    model<ProductVariantDocument>("ProductVariant", ProductVariantSchema);
export const ProductModel =
    models.Product || model<ProductDocument>("Product", ProductSchema);
