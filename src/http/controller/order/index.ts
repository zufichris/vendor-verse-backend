import { Request, Response, NextFunction } from "express";
import { validateData } from "../../../util/functions";
import { IResponseData, IResponseDataPaginated, IQueryFilters } from "../../../shared/entity";
import { EStatusCodes } from "../../../shared/enum";
import OrderUseCase from "../../../domain/order/use-case";
import { OrderRepositoryImpl } from "../../../data/orm/repository-implementation/order";
import { CreateOrderDTO, CreateOrderSchema, UpdateOrderDTO, UpdateOrderSchema } from "../../../data/dto/order";
import { TOrder } from "../../../data/entity/order";
import { OrderModel } from "../../../data/orm/model/order";

export class OrderControllers {
    constructor(private readonly orderUseCase: OrderUseCase) {
        this.createOrder = this.createOrder.bind(this);
        this.getOrder = this.getOrder.bind(this);
        this.queryOrders = this.queryOrders.bind(this);
        this.updateOrder = this.updateOrder.bind(this);
        this.cancelOrder = this.cancelOrder.bind(this);
    }

    async createOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const validate = validateData<CreateOrderDTO>(req.body, CreateOrderSchema);
            if (!validate.success) {
                const data = {
                    ...this.generateMetadata(req, "Validation Failed"),
                    status: EStatusCodes.enum.badRequest,
                    success: false,
                    description: validate.error,
                };
                res.status(data.status).json(data);
                return;
            }

            const result = await this.orderUseCase.create.execute(validate.data, req.user!);
            if (!result.success) {
                const data = {
                    ...this.generateMetadata(req, result.error ?? "Order creation failed"),
                    status: result.status ?? EStatusCodes.enum.badRequest,
                    success: false,
                    description: result.error,
                };
                res.status(data.status).json(data);
                return;
            }

            const data: IResponseData<TOrder> = {
                ...this.generateMetadata(req, "Order created successfully"),
                status: EStatusCodes.enum.ok,
                success: true,
                data: result.data,
            };
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    async getOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const orderId = req.params.orderId;
            const result = await this.orderUseCase.get.execute({ orderId }, req.user);
            if (!result.success) {
                const data = {
                    ...this.generateMetadata(req, result.error ?? "Order not found"),
                    status: result.status ?? EStatusCodes.enum.notFound,
                    success: false,
                };
                res.status(data.status).json(data);
                return;
            }

            const data: IResponseData<TOrder> = {
                ...this.generateMetadata(req, "Order retrieved successfully"),
                status: EStatusCodes.enum.ok,
                success: true,
                data: result.data,
            };
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    async queryOrders(req: Request, res: Response, next: NextFunction) {
        try {
            const queryOptions = this.generateOrderQuery(req.query);
            const result = await this.orderUseCase.query.execute(queryOptions, req.user);
            if (!result.success) {
                const data = {
                    ...this.generateMetadata(req, result.error ?? "Failed to query orders"),
                    status: result.status ?? EStatusCodes.enum.badGateway,
                    success: false,
                };
                res.status(data.status).json(data);
                return;
            }

            const data: IResponseDataPaginated<TOrder> = {
                ...this.generateMetadata(req, "Orders retrieved successfully"),
                status: EStatusCodes.enum.ok,
                success: true,
                ...result.data,
            };
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    async updateOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const validate = validateData<UpdateOrderDTO>(req.body, UpdateOrderSchema);
            if (!validate.success) {
                const data = {
                    ...this.generateMetadata(req, "Validation Failed"),
                    status: EStatusCodes.enum.badRequest,
                    success: false,
                    description: validate.error,
                };
                res.status(data.status).json(data);
                return;
            }

            const result = await this.orderUseCase.update.execute(validate.data, req.user!);
            if (!result.success) {
                const data = {
                    ...this.generateMetadata(req, result.error ?? "Order update failed"),
                    status: result.status ?? EStatusCodes.enum.conflict,
                    success: false,
                };
                res.status(data.status).json(data);
                return;
            }
            const data: IResponseData<TOrder> = {
                ...this.generateMetadata(req, "Order updated successfully"),
                status: EStatusCodes.enum.ok,
                success: true,
                data: result.data,
            };
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    async cancelOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const orderId = req.params.orderId;
            const result = await this.orderUseCase.cancel.execute({ id: orderId, userId: req.body.userId, cancellationReason: req.body.reason }, req.user!);
            if (!result.success) {
                const data = {
                    ...this.generateMetadata(req, result.error ?? "Order cancellation failed"),
                    status: result.status ?? EStatusCodes.enum.badGateway,
                    success: false,
                };
                res.status(data.status).json(data);
                return;
            }
            const data: IResponseData<TOrder> = {
                ...this.generateMetadata(req, "Order cancelled successfully"),
                status: EStatusCodes.enum.ok,
                success: true,
                data: result.data,
            };
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    private generateMetadata(req: Request, message: string, type: string = "Order") {
        return {
            url: req.url,
            path: req.path,
            type,
            message,
            error: {
                message,
            },
        };
    }

    private generateOrderQuery(query: any): IQueryFilters<TOrder> {
        const {
            page = 1,
            limit = 10,
            sort_order = "asc",
            sort_by = "createdAt",
            search,
        } = query;

        const sort = { [String(sort_by)]: String(sort_order) === "desc" ? -1 : 1 };

        const filter = search
            ? {
                $or: [
                    { orderNumber: { $regex: search, $options: "i" } },
                    { status: { $regex: search, $options: "i" } },
                ],
            }
            : {};

        const projection = {
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
            updatedAt: true,
            id: true,
        };

        return {
            filter,
            limit: Number(limit),
            page: Number(page),
            projection,
            queryOptions: { sort },
        };
    }
}

export const orderControllers = new OrderControllers(
    new OrderUseCase(new OrderRepositoryImpl(OrderModel))
);