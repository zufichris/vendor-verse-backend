import { Request, Response } from "express";
import { OrderService } from "./order.service";
import { CreateOrderDtoSchema, UpdateOrderDtoSchema } from "./order.dtos";
import { ApiHandler } from "../../util/api-handler";

export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    public createOrder = ApiHandler(async (req: Request, res: Response) => {
        const userId = req.user!.id;
        const dto = CreateOrderDtoSchema.parse(req.body);
        const order = await this.orderService.createOrder(dto, userId);
        res.status(201).json({ success: true, data: order });
    });

    public getMyOrders = ApiHandler(async (req: Request, res: Response) => {
        const orders = await this.orderService.getUserOrders(req.user!.id);
        res.json({ success: true, data: orders });
    });

    public pay = ApiHandler(async (req: Request, res: Response) => {
        const order = await this.orderService.initiatePayment({
            items: [
                {
                    discount: 0,
                    name: "test_product",
                    price: 10,
                    productId: "123",
                    quantity: 1,
                    sku: "sku",
                    total: 10,
                },
            ],
            tax: 0,
            payment: {
                method: "stripe",
                status: "pending",
            },
            shipping: 0,
            shippingAddress: {
                city: "city",
                country: "country",
                email: "email@email.com",
                firstName: "Abanda",
                lastName: "ajang",
                phone: "1234",
                postalCode: "0000",
                state: "state",
                street: "street",
            },
        });
        res.json({ success: true, data: order });
    });

    public updateOrder = ApiHandler(async (req: Request, res: Response) => {
        const dto = UpdateOrderDtoSchema.parse(req.body);
        const order = await this.orderService.updateOrder(req.params.id, dto);
        res.json({ success: true, data: order });
    });
}
