import { Request, Response } from "express";
import { OrderService } from "./order.service";
import { CreateOrderDtoSchema, OrderResponseDto, UpdateOrderDtoSchema } from "./order.dtos";
import { ApiHandler } from "../../util/api-handler";
import { OrdersAdminController } from "./order.admin.controller";
import { AppError } from "../../core/middleware";
import { createErrorResponse, createResponseSchema } from "../../core/dtos";
import z from "zod";
import { id } from "zod/v4/locales";
import { QuiqupCLient } from "../../core/http/quiqup-client";

export class OrderController extends OrdersAdminController {
    constructor(orderService: OrderService) {
        super(orderService)
    }

    public createOrder = ApiHandler(async (req: Request, res: Response) => {
        let user = req.user;

        const dto = CreateOrderDtoSchema.parse(req.body);

        const order = await this.orderService.createOrder(dto, user?.id);

        let paymentLink = ''

        if (dto.paymentMethod !== 'cod') {
            const { url } = await this.orderService.initiatePayment(order);
            paymentLink = url || '';
        }

        // Create order on quiqup's dashboard
        try {
            await QuiqupCLient.creatOrder({
                destination: {
                    address: {
                        address1: dto.shippingAddress.city,
                        address2: '',
                        coords: [],
                        country: 'UAE',
                        town: dto.shippingAddress.state
                    },
                    contact_name: `${dto.shippingAddress.firstName} ${dto.shippingAddress.lastName}`,
                    contact_phone: dto.shippingAddress.phone || user?.phone || '',
                    notes: dto.notes || '',
                    partner_order_id: order.orderNumber,
                    share_tracking: true
                },
                disallowed_payment_types: [],
                items: dto.items.map(itm => ({ name: itm.name, parcel_barcode: itm.variantId, quantity: itm.quantity })),
                kind: dto.shippingMethod === 'free' ? 'partner_same_day' : dto.shippingMethod == 'standard' ? 'partner_next_day' : dto.shippingMethod === 'express' ? 'partner_same_day' : 'partner_next_day',
                metadata: null,
                notes: dto.notes || '',
                partner_order_id: order.orderNumber,
                payment_amount: order.payment.method === 'cod' ? order.grandTotal : 0,
                payment_mode: order.payment.method === 'cod' ? 'paid_on_delivery' : 'pre_paid ',
                required_documents: [],
                scheduled_for: null
            })
        } catch (error) {

        }

        res.json({
            success: true,
            status: 201,
            message: "order created successfully",
            data: {
                paymentLink,
                id: order.id,
                orderNumber: order.orderNumber
            },
        });
    });

    public getMyOrders = ApiHandler(async (req: Request, res: Response) => {
        const user = req.user;
        const page = req.query?.page?.toString()
        const limit = req?.query?.limit?.toString()
        const sortBy = req.query?.sortBy?.toString()
        const sortOrder = req.query?.sortOrder?.toString()

        if (!user) {
            throw AppError.unauthorized("Please login")
        }

        const orders = await this.orderService.getUserOrders({
            userId: user.id,
            page,
            limit,
            sortBy,
            sortOrder
        });
        res.json({ success: true, data: orders });
    });

    getMyOrdersCount = ApiHandler(async (req, res) => {
        const user = req?.user;

        if (!user) {
            throw AppError.unauthorized("Please login")
        }

        const count = await this.orderService.countOrders({ userId: user.id })

        const { success, error, data: response } = createResponseSchema(z.number()).safeParse({
            data: count
        })

        if (!success) {
            res.json(createErrorResponse({ error: error.format() }))
        }

        return res.json(response)
    })

    cancelMyOrder = ApiHandler(async (req, res) => {
        const user = req?.user;

        const orderId = req.params?.id

        const note = req?.query?.note?.toString()?.trim()

        if (!user) {
            throw AppError.unauthorized("Please login")
        }

        if (!orderId) {
            throw AppError.badRequest('Invalid order identifier')
        }


        const result = await this.orderService.cancelOrder(orderId, note || 'Cancelled by user')

        const { success, error, data: response } = createResponseSchema(z.boolean()).safeParse({
            data: result
        })

        if (!success) {
            res.json(createErrorResponse({ error: error.format() }))
        }

        return res.json(response)
    })

    public updateMyOrder = ApiHandler(async (req: Request, res: Response) => {
        const user = req.user;
        const orderId = req.params.id;

        if (!user || !user.id) {
            throw AppError.unauthorized("You are not aauthorised to access this resource")
        }

        if (!orderId) {
            throw AppError.notFound("Ortder with specidied id not found")
        }

        const dto = UpdateOrderDtoSchema.parse(req.body);

        const order = await this.orderService.updateByQuery({
            _id: orderId,
            userId: user.id
        }, dto);

        const { data: response, success, error } = createResponseSchema(OrderResponseDto).safeParse({ data: order });

        res.json(response);
    });

    public getMyOrder = ApiHandler(async (req, res) => {
        const user = req.user;
        const orderId = req.params.id;

        if (!user || !user.id) {
            throw AppError.unauthorized("You are not aauthorised to access this resource")
        }

        if (!orderId) {
            throw AppError.notFound("Ortder with specidied id not found")
        }

        const data = await this.orderService.getOrderById(req.params.id)

        if (!data) {
            throw AppError.badRequest("Unkown order reference")
        }

        const { data: order } = OrderResponseDto.safeParse(JSON.parse(JSON.stringify(data)))

        if (!order || order?.userId?.toString() !== user.id.toString()) {
            throw AppError.unauthorized("You are not authorised to access this resource.")
        }

        const { data: response, success, error } = createResponseSchema(OrderResponseDto).safeParse({ data: order })

        if (!success) {
            throw AppError.internal('Unexpected server error', error.format())
        }

        res.json(response)

    })

    public stripeWebhook = ApiHandler(async (req: Request, res: Response) => {
        const signature = req.headers["stripe-signature"] as string;
        const { received } = await this.orderService.paymentWebhook(signature, req.body);
        if (received) {
            res.status(200).json({ received });
        } else {
            res.status(400).json({ received });
        }
    })

    quiqupWebhook = ApiHandler(async (req, res) => {
        const { payload } = req.body

        if (!payload) {
            return res.status(400).json({ message: 'Invalid payload' })
        }

        await this.orderService.handleQuiqUpWebhook(payload)

        return res.status(200).json({ message: 'success' })
    })
}
