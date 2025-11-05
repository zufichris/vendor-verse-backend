import mongoose, { Document, Schema } from "mongoose";
import { Cart } from "./cart.types";
import { SupportedSizes } from "../product";

export type CartDocument = Document & Omit<Cart, 'id' | 'variantId' | 'userId'> & {
    variantId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
}

export const CartSchemaMongoose = new Schema<CartDocument>({
    productName: { type: String, required: true },
    variantId: { type: Schema.Types.ObjectId, ref: "ProductVariant", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    quantity: {
        type: Number, required: true, validate: {
            validator(val) {
                return typeof val === 'number' && val > 0
            },
            message: "quantity must be greater than 0"
        }
    },
    unitPrice: {
        type: Number, required: true, validate: {
            validator(val) {
                return typeof val === 'number' && val > 0
            },
            message: "Price must be greater than 0"
        }
    },
    productImageurl: { type: String, required: true },
    size: { type: String, enum: SupportedSizes, required: true }
}, {
    timestamps: true,
    toJSON: {
        transform: function (_, ret: any) {
            ret.id = ret._id.toString();
            return ret;
        },
    },
    toObject: {
        transform: function (_, ret: any) {
            ret.id = ret._id.toString();
            return ret;
        },
    },
})

// Create an index for userId in order to make queries faster
CartSchemaMongoose.index({ userId: 1 })

// Create unique index to ensure a user does not duplicate products in their cart (userId__productId = unique)
CartSchemaMongoose.index({
    userId: 1,
    variantId: 1
}, { unique: true }) // creates a unique index for userId__productId


export const CartModel = mongoose.models.Cart || mongoose.model("Cart", CartSchemaMongoose)