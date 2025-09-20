import { Request, Response, NextFunction } from "express";
import { OrderService } from "./order.service";
import { CreateOrderDtoSchema, UpdateOrderDtoSchema } from "./order.dtos";
import { ApiHandler } from "../../util/api-handler";

export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    public createOrder = ApiHandler(async (req: Request, res: Response) => {
        const user = req.user;

        const dto = CreateOrderDtoSchema.parse(req.body);
        const order = await this.orderService.createOrder(dto, user?.id!);
        const { url } = await this.orderService.initiatePayment({
            items:order.items,
            shipping:order.shipping,
            shippingAddress:order.shippingAddress,
            tax:order.tax,
            notes:order.notes
        });

        res.json({
            success: true,
            status: 201,
            message: "order created successfully",
            data: {
                paymentLink: url,
            },
        });
    });

    public getMyOrders = ApiHandler(async (req: Request, res: Response) => {
        const orders = await this.orderService.getUserOrders(req.user!.id);
        res.json({ success: true, data: orders });
    });

    public updateOrder = ApiHandler(async (req: Request, res: Response) => {
        const dto = UpdateOrderDtoSchema.parse(req.body);
        const order = await this.orderService.updateOrder(req.params.id, dto);
        res.json({ success: true, data: order });
    });

    public stripeWebhook = ApiHandler(async (req: Request, res: Response) => {
        const signature = req.headers["stripe-signature"] as string;
        const { received } = await this.orderService.paymentWebhook(signature, req.body);
        if (received) {
            res.status(200).json({ received });
        } else {
            res.status(400).json({ received });
        }
    })
}
