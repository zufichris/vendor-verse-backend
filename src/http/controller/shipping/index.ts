import { Request, Response, NextFunction } from "express";
import { validateData } from "../../../util/functions";
import { IResponseData, IResponseDataPaginated, IQueryFilters } from "../../../shared/entity";
import { EStatusCodes } from "../../../shared/enum";
import ShippingUseCase from "../../../domain/shipping/use-case";
import { ShippingRepositoryImpl } from "../../../data/orm/repository-implementation/shipping";
import { CreateShippingDTO, CreateShippingSchema, UpdateShippingDTO, UpdateShippingSchema } from "../../../data/dto/shipping";
import { TShipping } from "../../../data/entity/shipping";
import { ShippingModel } from "../../../data/orm/model/shipping";

export class ShippingControllers {
    constructor(private readonly shippingUseCase: ShippingUseCase) {
        this.createShipping = this.createShipping.bind(this);
        this.getShipping = this.getShipping.bind(this);
        this.queryShippings = this.queryShippings.bind(this);
        this.updateShipping = this.updateShipping.bind(this);
        this.deleteShipping = this.deleteShipping.bind(this);
    }

    async createShipping(req: Request, res: Response, next: NextFunction) {
        try {
            const validate = validateData<CreateShippingDTO>(req.body, CreateShippingSchema);
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

            const result = await this.shippingUseCase.create.execute(validate.data, req.user!);
            if (!result.success) {
                const data = {
                    ...this.generateMetadata(req, result.error ?? "Shipping creation failed"),
                    status: result.status ?? EStatusCodes.enum.badRequest,
                    success: false,
                    description: result.error,
                };
                res.status(data.status).json(data);
                return;
            }

            const data: IResponseData<TShipping> = {
                ...this.generateMetadata(req, "Shipping created successfully"),
                status: EStatusCodes.enum.ok,
                success: true,
                data: result.data,
            };
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    async getShipping(req: Request, res: Response, next: NextFunction) {
        try {
            const shippingId = req.params.shippingId;
            const result = await this.shippingUseCase.get.execute({ shippingId }, req.user);
            if (!result.success) {
                const data = {
                    ...this.generateMetadata(req, result.error ?? "Shipping not found"),
                    status: result.status ?? EStatusCodes.enum.notFound,
                    success: false,
                };
                res.status(data.status).json(data);
                return;
            }

            const data: IResponseData<TShipping> = {
                ...this.generateMetadata(req, "Shipping retrieved successfully"),
                status: EStatusCodes.enum.ok,
                success: true,
                data: result.data,
            };
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    async queryShippings(req: Request, res: Response, next: NextFunction) {
        try {
            const queryOptions = this.generateShippingQuery(req.query);
            const result = await this.shippingUseCase.query.execute(queryOptions, req.user);
            if (!result.success) {
                const data = {
                    ...this.generateMetadata(req, result.error ?? "Failed to query shippings"),
                    status: result.status ?? EStatusCodes.enum.badGateway,
                    success: false,
                };
                res.status(data.status).json(data);
                return;
            }

            const data: IResponseDataPaginated<TShipping> = {
                ...this.generateMetadata(req, "Shippings retrieved successfully"),
                status: EStatusCodes.enum.ok,
                success: true,
                ...result.data,
            };
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    async updateShipping(req: Request, res: Response, next: NextFunction) {
        try {
            const validate = validateData<UpdateShippingDTO>(req.body, UpdateShippingSchema);
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

            const result = await this.shippingUseCase.update.execute(validate.data, req.user!);
            if (!result.success) {
                const data = {
                    ...this.generateMetadata(req, result.error ?? "Shipping update failed"),
                    status: result.status ?? EStatusCodes.enum.conflict,
                    success: false,
                };
                res.status(data.status).json(data);
                return;
            }
            const data: IResponseData<TShipping> = {
                ...this.generateMetadata(req, "Shipping updated successfully"),
                status: EStatusCodes.enum.ok,
                success: true,
                data: result.data,
            };
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    async deleteShipping(req: Request, res: Response, next: NextFunction) {
        try {
            const shippingId = req.params.shippingId;
            const result = await this.shippingUseCase.delete.execute(shippingId, req.user!);
            if (!result.success) {
                const data = {
                    ...this.generateMetadata(req, result.error ?? "Shipping cancellation failed"),
                    status: result.status ?? EStatusCodes.enum.badGateway,
                    success: false,
                };
                res.status(data.status).json(data);
                return;
            }
            const data: IResponseData<boolean> = {
                ...this.generateMetadata(req, "Shipping cancelled successfully"),
                status: EStatusCodes.enum.ok,
                success: true,
                data: result.data,
            };
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    private generateMetadata(req: Request, message: string, type: string = "Shipping") {
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

    private generateShippingQuery(query: any): IQueryFilters<TShipping> {
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
                    { shippingNumber: { $regex: search, $options: "i" } },
                    { status: { $regex: search, $options: "i" } },
                ],
            }
            : {};

        const projection = {
            shippingNumber: true,
            status: true,
            cost: true,
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

export const shippingControllers = new ShippingControllers(
    new ShippingUseCase(new ShippingRepositoryImpl(ShippingModel))
);