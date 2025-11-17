import { OrderRepository } from "./order.repository";
import { CreateOrderDto, QueryOrderDtoSchema, UpdateOrderDto } from "./order.dtos";
import { AppError } from "../../core/middleware/error.middleware";
import { UserService, UserStatus } from "../user";
import { Order } from "./order.types";
import { ProductService } from "../product";
import { PaymentService } from "./payment.service";
import { generateStrongPassword } from "../../util/randomString";
import { NewsletterService } from "../newsletter/newsletter.service";
import { OrderAdminService } from "./order.admin.service";
import { TemplatesEngine } from "../../core/shared/templates-engine";
import { MailJetEmailService } from "../../core/shared/email-service/mail-jet";
import { env } from "../../config";
import { setupOrdersQuery } from "./order.util";
import { isValidObjectId } from "mongoose";
import { CouponService } from "../coupon";

export class OrderService extends OrderAdminService {
    constructor(
        orderRepo: OrderRepository,
        userService: UserService,
        productService: ProductService,
        paymentService: PaymentService,
        newsletterService: NewsletterService,
        private readonly couponSvc: CouponService
    ) {
        super(orderRepo, userService, productService, paymentService, newsletterService)
    }

    async createOrder(dto: CreateOrderDto, userId?: string): Promise<Order> {
        let user = userId ? await this.userService.getUserProfile(userId) : null;
        // Create an anonymous user
        if (!user) {
            user = await this.userService.createAnonymousUser({
                email: dto.billingAddress?.email ?? dto.shippingAddress.email,
                firstName: dto.billingAddress?.firstName ?? dto.shippingAddress.firstName,
                lastName: dto.billingAddress?.lastName ?? dto.shippingAddress.lastName,
                password: generateStrongPassword(),
                marketingConsent: false,
                phone: dto.billingAddress?.phone ?? dto.shippingAddress.phone
            })
        };

        // Check again if user exists
        if (!user) {
            throw AppError.notFound("account not found")
        }

        if (
            [UserStatus.DELETED, UserStatus.BANNED, UserStatus.INACTIVE].includes(user.status)
        ) {
            throw AppError.forbidden("account suspended or inactive, your cannot make purchases");
        }

        const subTotal = dto.items.reduce(
            (sum, i) => sum + i.price * i.quantity - i.discount,
            0,
        );

        // validate coupon
        let coupon: { valid: boolean, discountRate: number, code: string } | null = null

        if (dto.couponCode) {
            coupon = await this.couponSvc.validateCode({
                code: dto.couponCode,
                userEmail: user.email.toLowerCase(),
                totalAmount: subTotal
            })
        }

        if (coupon && !coupon.valid) {
            throw AppError.badRequest("Invalid coupon code")
        }

        const discount = subTotal * (coupon?.discountRate || 0) / 100

        const grandTotal = (subTotal + dto.tax + dto.shipping) - discount;

        const orderNumber =
            "ORD-" +
            Date.now() +
            "-" +
            Math.random().toString().substr(2, 6).toUpperCase();

        // Check products availability before creating order
        await this.checkStock(dto.items);

        const order = await this.orderRepo.create({
            ...dto,
            orderNumber,
            userId: user.id,
            grandTotal,
            subTotal,
            discount,
            discountCode: coupon?.code,
            payment: {
                status: "pending",
                method: dto.paymentMethod || "stripe",
            },
            currency: dto.currency,
            fulfillmentStatus: dto.paymentMethod === 'cod' ? "processing" : "pending",
        });

        await this.reserveStock(order.items);

        // Increment coupon usage
        if (coupon) {
            await this.couponSvc.incrementUsage(coupon.code)
        }

        // if user checked newsletter signup, upsert user eail in newsletter collections
        if (dto.newsletter) {
            try {
                await this.newsletterService.subscribe({
                    email: dto.billingAddress?.email || dto.shippingAddress.email,
                    firstName: dto.billingAddress?.firstName || dto.shippingAddress.firstName,
                    lastName: dto.billingAddress?.lastName || dto.shippingAddress.lastName
                })
            } catch (error) {
                // ignore any errors.
                // This should not break create order flow in any way.
            }
        }

        // Update user metrics
        await this.userService.updateUserMetrics(user.id, { amount: grandTotal, items: dto.items.length });

        // Compile and send order created email
        const html = TemplatesEngine.compile('orders/order-created.template.hbs', {
            shippingAddress: order.shippingAddress,
            orderNumber: order.orderNumber,
            items: order.items.map(itm => ({
                name: itm.name,
                quantity: itm.quantity,
                total: itm.total
            })),
            subTotal: order.subTotal,
            currency: order.currency,
            shipping: order.shipping,
            tax: order.tax,
            grandTotal: order.grandTotal
        })

        MailJetEmailService.sendEmail({
            to: { name: `${user.firstName} ${user.lastName}`, email: user.email },
            html,
            subject: "Order Received"
        })


        return order;
    }
    async initiatePayment(orderData: string | Order) {
        const order = typeof orderData === 'string' ? await this.getOrderById(orderData) : orderData;

        if (!order || !order.id) {
            throw AppError.notFound("Order not found");
        }

        const session = await this.paymentService.createStripeCheckoutSession(order);
        return session
    }
    async getUserOrders(dto: { userId: string } & Record<string, unknown>) {
        return await this.queryOrders(dto)
    }

    async countOrders(dto: Record<string, unknown>) {
        const { success, data: queryData, error } = QueryOrderDtoSchema.safeParse(dto)

        if (!success) {
            throw AppError.badRequest('Invalid query', error.format())
        }


        const { filter } = setupOrdersQuery(queryData);

        return this.orderRepo.count(filter)
    }

    async getOrderByNumber(orderNumber: string): Promise<Order> {
        const result = await this.orderRepo.findByOrderNumber(orderNumber);
        if (!result) {
            throw AppError.notFound("order not found");
        }
        return result;
    }

    async getOrderById(id: string): Promise<Order | null> {
        if (isValidObjectId(id)) {
            return await this.orderRepo.findById(id)
        }

        return await this.orderRepo.findByOrderNumber(id);
    }

    async updateOrder(id: string, dto: UpdateOrderDto): Promise<Order> {
        const updated = await this.orderRepo.updateById(id, dto);

        if (!updated) {
            throw AppError.badGateway("failed to update order");
        }

        // Send email if order status is changed to shipped or delivered
        let html: string | null = null
        let emailSubject: string = ''

        if (dto.fulfillmentStatus && dto.fulfillmentStatus === 'shipped') {
            const params = {
                orderNumber: updated.orderNumber,
                estimatedDeliveryDate: new Date().toISOString(),
                shippingProvider: "Local",
                trackingUrl: `${env.client_url}/account/orders/${updated.orderNumber}`,
                trackingNumber: updated.orderNumber
            }
            html = TemplatesEngine.compile('orders/order-shipped.template.hbs', params);
            emailSubject = 'Order Shipped'
        }

        if (dto.fulfillmentStatus && dto.fulfillmentStatus === 'delivered') {
            const params = {
                orderNumber: updated.orderNumber,
                shippingAddress: updated.shippingAddress,
                reviewUrl: `${env.client_url}/account/orders/${updated.orderNumber}`
            }
            html = TemplatesEngine.compile('orders/order-delivered.template.hbs', params);
            emailSubject = 'Order Delivered'
        }

        if (html) {
            const user = await this.userService.getUserById(updated.userId as string);

            if (user) {
                MailJetEmailService.sendEmail({
                    to: {
                        email: user.email,
                        name: `${user.firstName} ${user.lastName}`
                    },
                    html,
                    subject: emailSubject
                })
            }
        }
        return updated;
    }

    async cancelOrder(orderId: string, note?: string) {
        const order = await this.getOrderById(orderId)

        if (!order) {
            throw AppError.notFound('Order not found')
        }

        if (order.isDeleted) {
            throw AppError.badRequest('Cannot cancel a deleted order')
        }

        if (order.fulfillmentStatus !== 'pending') {
            throw AppError.badRequest(`Cannot delete order with status: ${order.fulfillmentStatus}`)
        }

        await this.orderRepo.updateById(order.id, {
            fulfillmentStatus: 'cancelled',
            notes: note,

        })
        const user = await this.userService.getUserById(order.userId as string)

        const html = TemplatesEngine.compile('orders/order-cancelled.template.hbs', {
            shippingAddress: order.shippingAddress,
            cancelledAt: new Date().toISOString(),
            cancelReason: note,
            items: order.items,
            subTotal: order.subTotal,
            currency: order.currency.toUpperCase(),
            shipping: order.shipping,
            tax: order.tax,
            grandTotal: order.grandTotal,
            // refundAmount: 
            // refundStatus
            // refundReceiptUrl
            // reorderUrl
            supportEmail: env.email.defaultSender.email
        })

        await MailJetEmailService.sendEmail({
            to: {
                name: `${user.firstName} ${user.lastName}`,
                email: user.email
            },
            html,
            subject: "Order Cancelled"
        })

        return true
    }

    async updateByQuery(query: Record<string, unknown>, dto: UpdateOrderDto) {
        const updated = await this.orderRepo.updateOne(query, dto, {
            new: true
        })

        return updated;
    }

    async markPaid(
        orderId: string,
        transactionId: string,
        paymentMethod: Order['payment']['method'],
        receiptUrl?: string
    ): Promise<Order | null> {
        const order = await this.orderRepo.updateById(orderId, {
            "payment.status": "paid",
            "payment.transactionId": transactionId,
            "payment.paidAt": new Date().toISOString(),
            fulfillmentStatus: "processing", // payment received, order is being processed.
        });

        if (!order) throw AppError.notFound("Order not found");

        const params = {
            orderNumber: order.orderNumber,
            grandTotal: order.grandTotal,
            currency: order.currency.toUpperCase(),
            payment: {
                method: paymentMethod,
                transactionId: transactionId?.startsWith('pi_') ? transactionId.replace('pi_', '') : transactionId,
                paidAt: new Date(order.payment.paidAt || new Date()).toISOString(),
            },
            paymentReceiptUrl: receiptUrl
        }

        const user = await this.userService.getUserById(order.userId as string)

        const html = TemplatesEngine.compile('orders/payment-received.template.hbs', params)

        await MailJetEmailService.sendEmail({
            to: {
                email: user.email,
                name: `${user.firstName} ${user.lastName}`
            },
            html,
            subject: 'Payment Received'
        })

        return order;
    }

    async markFailed(orderId: string): Promise<Order | null> {
        const order = await this.orderRepo.updateById(orderId, {
            "payment.status": "failed",
        });
        if (!order) throw AppError.notFound("Order not found");
        return order;
    }

    async markRefunded(orderId: string, amount: number, refundId?: string): Promise<Order | null> {
        const order = await this.orderRepo.findById(orderId);
        if (!order) throw AppError.notFound("Order not found");

        const newRefund = Math.min(
            order.payment.refundAmount ?? 0 + amount,
            order.grandTotal,
        );
        const status =
            newRefund >= order.grandTotal ? "refunded" : "partially-refunded";

        return this.orderRepo.updateById(orderId, {
            "payment.fulfillmentStatus": status,
            "payment.refundAmount": newRefund,
            "payment.refundedAt": new Date().toISOString(),
            "payment.refundId": refundId
        });
    }

    private async checkStock(items: CreateOrderDto['items']) {
        for (const item of items) {
            const available = await this.productService.checkStockAvailability(
                item.productId,
                item.variantId,
                item.quantity,
            );
            if (!available) throw AppError.badRequest(`Out of stock: ${item.sku}`);
        }
    }

    private async reserveStock(items: CreateOrderDto["items"]) {
        for (const item of items) {
            const available = await this.productService.checkStockAvailability(
                item.productId,
                item.variantId,
                item.quantity,
            );
            if (!available) throw AppError.badRequest(`Out of stock: ${item.sku}`);
        }

        for (const item of items) {
            await this.productService.decrementStock(
                item.productId,
                item.variantId,
                item.quantity,
            );
        }
    }

    softDeleteOrder(id: string) {
        return this.orderRepo.updateById(id, {
            isDeleted: true,
            updatedAt: new Date().toISOString(),
        });
    }
    async paymentWebhook(signature: string, body: unknown) {
        const result = await this.paymentService.stripeCheckoutWebwook(signature, body);
        if (result.received && result.orderId) {
            if (result.paymentStatus === 'success') {
                await this.markPaid(result.orderId, result.transactionId || result.paymentIntentId || 'stripe-webhook', result.paymentMethod, result.receiptUrl);

            } else {
                await this.markFailed(result.orderId!);
            }
        }
        return result
    }

    async initRefund(orderId: string) {
        const order = await this.getOrderById(orderId)

        if (!order) {
            throw AppError.notFound("Order not found")
        }

        if (order.payment.status !== 'paid' && order.payment.status !== 'partially-refunded') {
            throw AppError.badRequest("Order payment was not fulfilled")
        }

        if (order.payment.refundAmount && order.payment.refundAmount === order.grandTotal) {
            throw AppError.badRequest('Order has already been fully refunded')
        }

        if ((order.payment.refundAmount || order.payment.refundId) && order.payment.status !== 'partially-refunded') {
            throw AppError.badRequest("Order has already been refunded")
        }

        if (!order.payment.transactionId) {
            throw AppError.badRequest('Please contact admin for refund. Invalid transaction id.')
        }

        const refundAmount = order.grandTotal - (order.payment.refundAmount || 0);

        const refund = await this.paymentService.createRefund({
            grandTotal: refundAmount,
            id: order.id,
            method: order.payment.method,
            transactionId: order.payment.transactionId
        })

        await this.markRefunded(order.id, refundAmount, refund.id)
    }
}
