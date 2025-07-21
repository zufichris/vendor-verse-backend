import mongoose, { Schema, model, Document, models } from "mongoose";
import { Address, OrderItem, Payment, FulfillmentStatus } from "./order.types";

const AddressSchema = new Schema<Address>(
    {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true },
    },
    { _id: false, versionKey: false },
);

const OrderItemSchema = new Schema<OrderItem>(
    {
        productId: { type: String, ref: "Product", required: true },
        variantId: { type: Schema.Types.ObjectId, ref: "ProductVariant" },
        name: { type: String, required: true },
        sku: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        total: { type: Number, required: true },
    },
    { _id: false, versionKey: false },
);

const PaymentSchema = new Schema<Payment>(
    {
        method: {
            type: String,
            enum: ["stripe", "paypal", "cod", "bank-transfer"],
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "paid", "failed", "refunded", "partially-refunded"],
            required: true,
        },
        transactionId: String,
        paidAt: Date,
        refundedAt: Date,
        refundAmount: Number,
    },
    { _id: false, versionKey: false },
);

export type OrderDocument = Document & {
    orderNumber: string;
    userId: mongoose.Types.ObjectId;
    items: OrderItem[];
    subTotal: number;
    tax: number;
    shipping: number;
    discount: number;
    grandTotal: number;
    currency: string;
    shippingAddress: Address;
    billingAddress?: Address;
    payment: Payment;
    fulfillmentStatus: FulfillmentStatus;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
};

const OrderSchema = new Schema<OrderDocument>(
    {
        orderNumber: { type: String, required: true, unique: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        items: [OrderItemSchema],
        subTotal: { type: Number, required: true },
        tax: { type: Number, required: true, default: 0 },
        shipping: { type: Number, required: true, default: 0 },
        discount: { type: Number, default: 0 },
        grandTotal: { type: Number, required: true },
        currency: { type: String, required: true, length: 3 },
        shippingAddress: { type: AddressSchema, required: true },
        billingAddress: AddressSchema,
        payment: { type: PaymentSchema, required: true },
        fulfillmentStatus: {
            type: String,
            enum: [
                "pending",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
                "returned",
            ],
            default: "pending",
        },
        notes: String,
        isDeleted: { type: Boolean, default: false },
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            virtuals: true,
            transform(_, ret) {
                ret.id = ret._id;
                delete ret._id;
            },
        },
    },
);

OrderSchema.index({ userId: 1, orderNumber: 1 });

export const OrderModel =
    models.Order || model<OrderDocument>("Order", OrderSchema);
