import mongoose, { Schema, model, Document, models } from "mongoose";
import {
    Banner,
    ImageMeta,
    Product,
    ProductCategory,
    ProductVariant,
} from "./product.types";

const ImageSchema = new Schema<ImageMeta>(
    { url: { type: String, required: true }, altText: String },
    { _id: false, versionKey: false },
);

const SeoSchema = new Schema(
    { title: String, description: String, metaKeywords: [String] },
    { _id: false, versionKey: false },
);

export type ProductCategoryDocument = ProductCategory & Document;
const ProductCategorySchema = new Schema<ProductCategoryDocument>(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true },
        description: String,
        parentId: { type: Schema.Types.ObjectId, ref: "ProductCategory" },
        image: ImageSchema,
        seo: SeoSchema,
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            virtuals: true,
            transform: (_, ret) => {
                ret.id = ret._id;
                delete ret._id;
            },
        },
    },
);

type BannerDocument = Banner & Document;

const BannerSchema = new Schema<BannerDocument>(
    {
        title: { type: String, required: true, trim: true },
        subtitle: { type: String, required: true, unique: true, lowercase: true },
        slug: { type: String, required: true, unique: true, lowercase: true },
        description: String,
        cta: { type: String },
        image: { type: String },
        color: { type: String },
        link: { type: String },
        video: { type: String }
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            virtuals: true,
            transform: (_, ret) => {
                ret.id = ret._id;
                delete ret._id;
            },
        },
    },
);

export const BannerModel = models.Banner || model("Banner", BannerSchema);

export const ProductCategoryModel =
    models.ProductCategory ||
    model<ProductCategoryDocument>("ProductCategory", ProductCategorySchema);

export type ProductVariantDocument = Omit<ProductVariant, 'productId'> & { productId: Schema.Types.ObjectId } & Document;
const ProductVariantSchema = new Schema<ProductVariantDocument>(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true,
        },
        sku: { type: String, required: true, unique: true },
        slug: { type: String, required: true, unique: true },
        name: String,
        colorCode: { type: String, required: true }, // valid hex color code
        price: { type: Number, required: true, min: 0 },
        currency: { type: String, required: true },
        stockQuantity: { type: Number, required: true, min: 0 },
        isInStock: { type: Boolean, required: true, default: false },
        attributes: { type: Map, of: String },
        images: [ImageSchema],
        thumbnail: ImageSchema,
        weight: Number,
        sizes: { type: [String], required: true, default: [] },
        dimensions: {
            length: Number,
            width: Number,
            height: Number,
            unit: String,
        },
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: Date,
        deletedById: String,
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            virtuals: true,
            transform: (_, ret) => {
                ret.id = ret._id;
                delete ret._id;
            },
        },
    },
);

export const ProductVariantModel =
    models.ProductVariant ||
    model<ProductVariantDocument>("ProductVariant", ProductVariantSchema);

export type ProductDocument = Product & Document;
const ProductSchema = new Schema<ProductDocument>(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        slug: { type: String, required: true, unique: true, lowercase: true },
        sku: { type: String, required: true, unique: true },
        price: { type: Number, required: true, min: 0 },
        currency: { type: String, required: true },
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
        featured: { type: Boolean, default: false },
        stockQuantity: { type: Number, required: true, min: 0 },
        isInStock: { type: Boolean, required: true, default: false },
        categoryId: {
            type: String,
            ref: "ProductCategory",
            required: true,
        },
        brand: String,
        tags: [String],
        images: [ImageSchema],
        thumbnail: ImageSchema,
        weight: Number,
        dimensions: {
            length: Number,
            width: Number,
            height: Number,
            unit: String,
        },
        seo: SeoSchema,
        createdById: { type: String, required: true },
        updatedById: String,
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: Date,
        deletedById: String,
        variantIds: [{ type: Schema.Types.ObjectId, ref: "ProductVariant" }],
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            virtuals: true,
            transform: (_, ret) => {
                ret.id = ret._id;
                delete ret._id;
            },
        },
    },
);

ProductSchema.virtual("variants", {
    ref: "ProductVariant",
    localField: "variantIds",
    foreignField: "_id",
    applyToArray: true,
});

ProductSchema.virtual("category", {
    ref: "ProductCategory",
    localField: "categoryId",
    foreignField: "_id",
    justOne: true,
});

export const ProductModel =
    models.Product || model<ProductDocument>("Product", ProductSchema);
