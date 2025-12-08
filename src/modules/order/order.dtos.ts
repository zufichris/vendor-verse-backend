import { z } from "zod";
import { AddressSchema, OrderItemSchema, OrderSchema, OrderUser, PaymentMethodSchema, PaymentSchema } from "./order.types";
import { DateQueryDtoSchema, NumberQueryDtoSchema, PaginationOptionsDtoSchema, SortOptionsDtoSchema } from "../../core/dtos";

export const CreateOrderDtoSchema = z.object({
    items: z.array(OrderItemSchema).min(1),
    shippingAddress: AddressSchema,
    billingAddress: AddressSchema.optional(),
    tax: z.number().default(0),
    shipping: z.number().default(0),
    couponCode: z.string().optional().nullable(),
    notes: z.string().optional(),
    newsletter: z.boolean().optional().default(false),
    currency: z.string(),
    paymentMethod: PaymentMethodSchema.default('stripe'),
    shippingMethod: z.enum(['standard', 'express', 'free'])
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

export const QueryOrderDtoSchema = z.object({
    id: z.string().optional().nullable(),
    orderNumber: z.string().optional().nullable(),
    status: z.string().optional().nullable(), // this should map to order's fulfillmentStatus
    paymentStatus: z.string().optional().nullable(), //maps to oder's payment status
    createdAt: DateQueryDtoSchema.optional().nullable(),
    updatedAt: DateQueryDtoSchema.optional().nullable(),
    search: z.string().optional().nullable(),
    total: NumberQueryDtoSchema.optional().nullable(),
    withDeleted: z.enum(['true', 'false']).optional().default('false'),
    userId: z.string().optional().nullable()
}).merge(PaginationOptionsDtoSchema).merge(SortOptionsDtoSchema(['orderNumber', 'subTotal', 'grandTotal']));


export const OrderResponseDto = OrderSchema.transform((data) => {
    let finalUserId: string | null = null
    let finalUser: OrderUser | null = null

    if (typeof data.userId === 'object') {
        finalUserId = data.userId.id || ((data.userId as any)?._id?.toString());
        finalUser = data.userId;
    } else {
        finalUserId = data.userId;
    }

    data.items = data.items.map(itm => ({
        ...itm,
        imageUrl: itm?.imageUrl || ''
    }))

    return {
        ...data,
        userId: finalUserId,
        user: finalUser
    }
});

export const OrderAnalyticsResponseDto = z.object({
    totalOrders: z.object({
        today: z.number().optional().default(0),
        total: z.number().default(0)
    }),
    totalRevenue: z.object({
        thisWeek: z.number().optional().default(0),
        total: z.number().optional().default(0),
    }),
    averageOrder: z.object({
        pastThreeMonths: z.number().optional().default(0),
        thisMonth: z.number().optional().default(0),
    }),
    pendingOrders: z.object({
        total: z.number().optional().default(0),
        processing: z.number().optional().default(0),
    })

})

export type CreateOrderDto = z.infer<typeof CreateOrderDtoSchema>;
export type UpdateOrderDto = z.infer<typeof UpdateOrderDtoSchema>;
export type QueryOrdersDto = z.infer<typeof QueryOrderDtoSchema>;
export type OrderResponse = z.infer<typeof OrderResponseDto>;
export type OrderAnalyticsResponseDto = z.infer<typeof OrderAnalyticsResponseDto>;
