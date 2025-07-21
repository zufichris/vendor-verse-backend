import { z } from "zod";

export const AddressSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(1),
});

export const OrderItemSchema = z.object({
    productId: z.string(),
    variantId: z.string().optional(),
    name: z.string(),
    sku: z.string(),
    price: z.number().positive(),
    quantity: z.number().int().min(1),
    discount: z.number().min(0).default(0),
    total: z.number().positive(),
});

export const PaymentStatusSchema = z.enum([
    "pending",
    "paid",
    "failed",
    "refunded",
    "partially-refunded",
]);
export const PaymentMethodSchema = z.enum([
    "stripe",
    "paypal",
    "apple-pay",
    "google-pay",
    "bank-transfer",
]);

export const PaymentSchema = z.object({
    method: PaymentMethodSchema,
    status: PaymentStatusSchema,
    transactionId: z.string().optional(),
    paidAt: z.string().datetime().optional(),
    refundedAt: z.string().datetime().optional(),
    refundAmount: z.number().min(0).optional(),
});

export const FulfillmentStatusSchema = z.enum([
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "returned",
]);

export const OrderSchema = z.object({
    id: z.string(),
    orderNumber: z.string(),
    userId: z.string(),
    items: z.array(OrderItemSchema).min(1),
    subTotal: z.number().positive(),
    tax: z.number().min(0),
    shipping: z.number().min(0),
    discount: z.number().min(0).default(0),
    grandTotal: z.number().positive(),
    currency: z.string().length(3),
    shippingAddress: AddressSchema,
    billingAddress: AddressSchema.optional(),
    payment: PaymentSchema,
    fulfillmentStatus: FulfillmentStatusSchema,
    notes: z.string().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime().optional(),
    isDeleted: z.boolean().optional(),
});

export type Address = z.infer<typeof AddressSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type Payment = z.infer<typeof PaymentSchema>;
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type FulfillmentStatus = z.infer<typeof FulfillmentStatusSchema>;
export type Order = z.infer<typeof OrderSchema>;
