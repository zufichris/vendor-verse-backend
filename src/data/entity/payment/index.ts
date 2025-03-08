import { z } from "zod";
import { ECurrency } from "../../../shared/enum";

export const PaymentStatusEnum = z.enum([
    "PENDING",
    "PAID",
    "FAILED",
    "REFUNDED",
    "PARTIALLY_REFUNDED"
]);

const PaymentStatusHistorySchema = z.object({
    status: PaymentStatusEnum,
    changedAt: z.string().datetime(),
    reason: z.string().optional(),
});

const PaymentAttemptSchema = z.object({
    amount: z.number().min(0),
    attemptedAt: z.string().datetime(),
    error: z.string().optional(),
});

export const PaymentSchema = z
    .object({
        id: z.string().optional(),
        payId: z.string().optional(),
        orderId: z.string(),
        userId: z.string(),
        paymentMethodId: z.string(),
        transactionId: z.string().optional(),
        status: PaymentStatusEnum.default("PENDING"),
        amountRequested: z.number().min(0),
        amountPaid: z.number().min(0),
        currency: z.nativeEnum(ECurrency.Enum),
        fee: z
            .object({
                processing: z.number().min(0),
                tax: z.number().min(0),
            })
            .optional(),
        statusHistory: z.array(PaymentStatusHistorySchema).default([]),
        attempts: z.array(PaymentAttemptSchema),
        createdAt: z.string().datetime(),
        updatedAt: z.string().datetime(),
    })
    .strict()

export type TPayment = z.infer<typeof PaymentSchema>