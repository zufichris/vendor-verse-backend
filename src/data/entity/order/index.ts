import { z } from "zod";
import { ECurrency } from "../../../shared/enum";
import { PaymentSchema } from "../payment";
import { ShippingSchema } from "../shipping";

export const OrderItemStatusEnum = z.enum([
    "PENDING",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED"
]);
export const OrderStatusEnum = z.enum([
    "PENDING",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED"
]);

const ProductSnapshotSchema = z.object({
    name: z.string(),
    price: z.number().min(0),
    sku: z.string().optional(),
    attributes: z.record(z.string(), z.unknown()).optional(),
    imageUrl: z.string().url().optional(),
});

const VendorSnapshotSchema = z.object({
    name: z.string(),
    contactEmail: z.string().email(),
    supportPhone: z.string().optional(),
});

const OrderItemRefundSchema = z.object({
    amount: z.number().min(0),
    reason: z.string().optional(),
    processedAt: z.string().datetime(),
    initiatedBy: z.enum(["VENDOR", "CUSTOMER", "SYSTEM"]),
});

const OrderItemDiscountSchema = z.object({
    amount: z.number().min(0),
    code: z.string().optional(),
});

const OrderItemStatusHistorySchema = z.object({
    status: OrderItemStatusEnum,
    changedAt: z.string().datetime(),
    reason: z.string().optional(),
});

const OrderItemSchema = z
    .object({
        productId: z.string(),
        vendorId: z.string(),
        shippingId: z.string().optional(),
        variantId: z.string().optional(),
        status: OrderItemStatusEnum.default("PENDING"),
        quantity: z.number().min(1),
        unitPrice: z.number().min(0),
        totalPrice: z.number().min(0),
        currency: z.nativeEnum(ECurrency.Enum),
        taxRate: z.number().min(0).max(1).optional(),
        discounts: z.array(OrderItemDiscountSchema).optional(),
        productSnapshot: ProductSnapshotSchema,
        vendorSnapshot: VendorSnapshotSchema,
        refunds: z.array(OrderItemRefundSchema).optional(),
        statusHistory: z.array(OrderItemStatusHistorySchema).default([]),
    })
    .refine((data) => {
        const basePrice = data.unitPrice * data.quantity;
        const totalDiscount = data.discounts
            ? data.discounts.reduce((sum, discount) => sum + discount.amount, 0)
            : 0;
        const expectedTotal = basePrice - totalDiscount;
        return Math.abs(data.totalPrice - expectedTotal) < 0.01;
    }, {
        message: "totalPrice must equal (unitPrice * quantity) minus total discounts",
        path: ["totalPrice"],
    })

export const OrderSchema = z
    .object({
        id: z.string().optional(),
        userId: z.string(),
        ordId: z.string().optional(),
        items: z.array(OrderItemSchema),
        totalAmount: z.number().min(0),
        totalDiscount: z.number().min(0).optional(),
        currency: z.nativeEnum(ECurrency.Enum),
        paymentId: z.string(),
        shippingId: z.string().optional(),
        shipping: z.array(ShippingSchema).optional(),
        payments: z.array(PaymentSchema).optional(),
        createdAt: z.string().datetime().optional(),
        updatedAt: z.string().datetime().optional(),
        notes: z.string().optional(),
        isGift: z.boolean().default(false),
        giftMessage: z.string().optional(),
        status: OrderStatusEnum.default("PENDING"),
        statusHistory: z.array(
            z.object({
                status: OrderStatusEnum,
                changedAt: z.string().datetime(),
                reason: z.string().optional(),
            })
        ).default([]),
    })
    .strict()


export type TOrder = z.infer<typeof OrderSchema>