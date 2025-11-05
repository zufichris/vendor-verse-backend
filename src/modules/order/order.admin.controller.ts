import z from "zod";
import { createPaginatedResponseData, createResponseSchema } from "../../core/dtos";
import { AppError } from "../../core/middleware";
import { ApiHandler } from "../../util/api-handler";
import { CreateOrderDtoSchema, OrderAnalyticsResponseDto, OrderResponseDto } from "./order.dtos";
import { OrderService } from "./order.service";

export class OrdersAdminController {
    constructor(protected readonly orderService: OrderService) { }

    queryOrders = ApiHandler(async (req, res) => {
        const query = req.query;

        const data = await this.orderService.queryOrders(query)

        const { data: response } = createResponseSchema(createPaginatedResponseData(OrderResponseDto)).safeParse({
            success: true,
            message: "Orders fetched successfully",
            status: 200,
            data: JSON.parse(JSON.stringify(data))
        })

        return res.json(response)
    })

    getAnalytics = ApiHandler(async (req, res) => {
        const data = await this.orderService.getAnalytics()

        const { data: response } = createResponseSchema(OrderAnalyticsResponseDto).safeParse({
            success: true,
            status: 200,
            message: "Analytics retrieved successfully",
            data
        })

        res.json(response)
    })

    updateOrder = ApiHandler(async (req, res) => {
        const dto = req.body;
        const orderId = req.params.id
        if (!orderId) {
            throw AppError.badRequest('Invalid resource identifier')
        }

        const updatedOrder = await this.orderService.updateOrder(orderId, dto)

        const { data: response, success, error } = createResponseSchema(OrderResponseDto).safeParse({ data: JSON.parse(JSON.stringify(updatedOrder)) })

        if (!success) {
            throw AppError.internal("An Unexpected server error occured", error.format())
        }

        res.json(response)
    })

    getOrder = ApiHandler(async (req, res) => {
        const orderId = req.params.id
        if (!orderId) {
            throw AppError.badRequest('Invalid resource identifier')
        }

        const order = await this.orderService.getOrderById(orderId)

        const { data: response, success, error } = createResponseSchema(OrderResponseDto).safeParse({ data: JSON.parse(JSON.stringify(order)) })

        if (!success) {
            throw AppError.internal("An Unexpected server error occured", error.format())
        }

        res.json(response)
    })

    initOrderForUser = ApiHandler(async (req, res) => {
        const userId: string | null | undefined = req.body?.userId;

        const dto = CreateOrderDtoSchema.parse(req.body);
        const order = await this.orderService.createOrder(dto, userId || undefined);
        const { url } = await this.orderService.initiatePayment(order);

        res.json({
            success: true,
            status: 201,
            message: "order created successfully",
            data: {
                paymentLink: url,
            },
        });
    })


    deleteOrder = ApiHandler(async (req, res) => {
        const orderId = req.params.id || req.query?.id?.toString();

        if (!orderId?.trim()) {
            throw AppError.badRequest('Invalid order identifier')
        }

        await this.orderService.softDeleteOrder(orderId);

        return res.json(createResponseSchema(z.boolean()).safeParse({
            success: true,
            data: true
        }))
    })

    initRefund = ApiHandler(async (req, res) => {
        const orderId = req.params.id || req.query?.id?.toString();

        if (!orderId?.trim()) {
            throw AppError.badRequest('Invalid order identifier')
        }

        await this.orderService.initRefund(orderId)


        return res.json(createResponseSchema(z.boolean()).safeParse({
            success: true,
            data: true
        }))
    })
}