import mongoose from "mongoose";
import { OrderSchema, TOrder } from "../../../entity/order";
import { validateBeforeSave } from "../../../../util/functions";

const OrderItemDiscountSchema = new mongoose.Schema(
    {
        amount: { type: Number, required: true, min: 0 },
        code: { type: String },
    },
    { _id: false }
);

const OrderItemRefundSchema = new mongoose.Schema(
    {
        amount: { type: Number, required: true, min: 0 },
        reason: { type: String },
        processedAt: { type: Date, required: true },
        initiatedBy: {
            type: String,
            enum: ['VENDOR', 'CUSTOMER', 'SYSTEM'],
            required: true,
        },
    },
    { _id: false }
);

const OrderItemStatusHistorySchema = new mongoose.Schema(
    {
        status: {
            type: String,
            enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
            required: true,
        },
        changedAt: { type: Date, required: true },
        reason: { type: String },
    },
    { _id: false }
);

const ProductSnapshotSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        sku: { type: String },
        attributes: { type: mongoose.Schema.Types.Mixed },
        imageUrl: { type: String },
    },
    { _id: false }
);

const VendorSnapshotSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        contactEmail: { type: String, required: true },
        supportPhone: { type: String },
    },
    { _id: false }
);

const OrderItemSchema = new mongoose.Schema(
    {
        productId: { type: String, required: true },
        vendorId: { type: String, required: true },
        shippingId: { type: String },
        variantId: { type: String },
        status: {
            type: String,
            enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
            default: 'PENDING',
        },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        totalPrice: { type: Number, required: true, min: 0 },
        currency: { type: String, required: true },
        taxRate: { type: Number, min: 0, max: 1 },
        discounts: { type: [OrderItemDiscountSchema], default: [] },
        productSnapshot: { type: ProductSnapshotSchema, required: true },
        vendorSnapshot: { type: VendorSnapshotSchema, required: true },
        refunds: { type: [OrderItemRefundSchema], default: [] },
        statusHistory: { type: [OrderItemStatusHistorySchema], default: [] },
    },
    { _id: false }
);


const OrderStatusHistorySchema = new mongoose.Schema(
    {
        status: {
            type: String,
            enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
            required: true,
        },
        changedAt: { type: Date, required: true },
        reason: { type: String },
    },
    { _id: false }
);

export type OrderDocument = TOrder & mongoose.Document

const schema = new mongoose.Schema<OrderDocument>({
    userId: { type: String, required: true },
    ordId: String,
    items: { type: [OrderItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    totalDiscount: { type: Number, min: 0, default: 0 },
    currency: { type: String, required: true },
    paymentId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
    notes: { type: String },
    isGift: { type: Boolean, default: false },
    giftMessage: { type: String },
    status: {
        type: String,
        enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
        default: 'PENDING',
    },
    statusHistory: { type: [OrderStatusHistorySchema], default: [] },
});


validateBeforeSave(schema, OrderSchema.refine((data) => {
    const sumItems = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const expectedTotal = data.totalDiscount ? sumItems - data.totalDiscount : sumItems;
    return Math.abs(data.totalAmount - expectedTotal) < 0.01;
}, {
    message:
        "totalAmount must equal the sum of all item totalPrices minus totalDiscount (if provided)",
    path: ["totalAmount"],
}), "Order")


export const OrderModel: mongoose.Model<OrderDocument> = mongoose.models.Order || mongoose.model("Order", schema)