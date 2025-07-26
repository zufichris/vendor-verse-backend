import { Request, Response, NextFunction } from "express";
import { OrderService } from "./order.service";
import { CreateOrderDtoSchema, UpdateOrderDtoSchema } from "./order.dtos";
import { ApiHandler } from "../../util/api-handler";

export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  public createOrder = ApiHandler(async (req: Request, res: Response) => {
    const user = req.user;
    
    const dto = CreateOrderDtoSchema.parse(req.body);
    const order = await this.orderService.createOrder(dto, user?.id!);
    const { url } = await this.orderService.initiatePayment(req.body);

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
}
