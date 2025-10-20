import { OrderRepository } from "./order.repository";
import { CreateOrderDto, CreateOrderDtoSchema, UpdateOrderDto } from "./order.dtos";
import { AppError } from "../../core/middleware/error.middleware";
import { UserService, UserStatus } from "../user";
import { Order } from "./order.types";
import { ProductService } from "../product";
import { PaymentService } from "./payment.service";
import { generateStrongPassword } from "../../util/randomString";

export class OrderService {
    constructor(
        private readonly orderRepo: OrderRepository,
        private readonly userService: UserService,
        private readonly productService: ProductService,
        private readonly paymentService: PaymentService
    ) { }

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
        const grandTotal = subTotal + dto.tax + dto.shipping;

        const orderNumber =
            "ORD-" +
            Date.now() +
            "-" +
            Math.random().toString().substr(2, 6).toUpperCase();

        const order = await this.orderRepo.create({
            ...dto,
            orderNumber,
            userId: user.id,
            grandTotal,
            subTotal,
            payment: {
                status: "pending",
                method: "stripe",
            },
            currency: "usd",
            fulfillmentStatus: "pending",
        });

        await this.reserveStock(order.items);

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
    async getUserOrders(userId: string) {
        return this.orderRepo.paginate({
            filter: {
                userId,
            },
        });
    }

    async getOrderByNumber(orderNumber: string): Promise<Order> {
        const result = await this.orderRepo.findByOrderNumber(orderNumber);
        if (!result) {
            throw AppError.notFound("order not found");
        }
        return result;
    }

    async getOrderById(id: string): Promise<Order | null> {
        return this.orderRepo.findById(id);
    }

    async updateOrder(id: string, dto: UpdateOrderDto): Promise<Order> {
        const updated = await this.orderRepo.updateById(id, dto);

        if (!updated) {
            throw AppError.badGateway("failed to update order");
        }
        return updated;
    }

    async markPaid(
        orderId: string,
        transactionId: string,
    ): Promise<Order | null> {
        const order = await this.orderRepo.updateById(orderId, {
            "payment.status": "paid",
            "payment.transactionId": transactionId,
            "payment.paidAt": new Date().toISOString(),
            fulfillmentStatus: "processing",
        });
        if (!order) throw AppError.notFound("Order not found");
        return order;
    }

    async markFailed(orderId: string): Promise<Order | null> {
        const order = await this.orderRepo.updateById(orderId, {
            "payment.status": "failed",
        });
        if (!order) throw AppError.notFound("Order not found");
        return order;
    }

    async markRefunded(orderId: string, amount: number): Promise<Order | null> {
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
        });
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

    async softDeleteOrder(id: string) {
        return this.orderRepo.updateById(id, {
            isDeleted: true,
            updatedAt: new Date().toISOString(),
        });
    }
    async paymentWebhook(signature: string, body: unknown) {
        const result = await this.paymentService.stripeCheckoutWebwook(signature, body);
        if (result.received && result.orderId) {
            if (result.paymentStatus === 'success') {
                await this.markPaid(result.orderId, "stripe-webhook");
            } else {
                await this.markFailed(result.orderId!);

            }
        }
        return result
    }
}
