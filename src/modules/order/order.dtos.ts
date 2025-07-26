import { z } from "zod";
import { AddressSchema, OrderItemSchema, PaymentSchema } from "./order.types";

export const CreateOrderDtoSchema = z.object({
    items: z.array(OrderItemSchema).min(1),
    shippingAddress: AddressSchema,
    billingAddress: AddressSchema.optional(),
    tax: z.number().default(0),
    shipping: z.number().default(0),
    notes: z.string().optional(),
});

export const UpdateOrderDtoSchema = z.object({
    fulfillmentStatus: z
        .enum([
            "pending",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
            "returned",
        ])
        .optional(),
    notes: z.string().optional(),
});

export type CreateOrderDto = z.infer<typeof CreateOrderDtoSchema>;
export type UpdateOrderDto = z.infer<typeof UpdateOrderDtoSchema>;
