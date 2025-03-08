import { Request, Response, NextFunction } from "express";
import { validateData } from "../../../util/functions";
import { IResponseData, IResponseDataPaginated, IQueryFilters } from "../../../shared/entity";
import { EStatusCodes } from "../../../shared/enum";
import PaymentUseCase from "../../../domain/payment/use-case";
import { PaymentRepositoryImpl } from "../../../data/orm/repository-implementation/payment";
import { CreatePaymentDTO, CreatePaymentSchema, UpdatePaymentDTO, UpdatePaymentSchema } from "../../../data/dto/payment";
import { TPayment } from "../../../data/entity/payment";
import { PaymentModel } from "../../../data/orm/model/payment";

export class PaymentControllers {
    constructor(private readonly paymentUseCase: PaymentUseCase) {
        this.createPayment = this.createPayment.bind(this);
        this.getPayment = this.getPayment.bind(this);
        this.queryPayments = this.queryPayments.bind(this);
        this.updatePayment = this.updatePayment.bind(this);
        this.deletePayment = this.deletePayment.bind(this);
    }

    async createPayment(req: Request, res: Response, next: NextFunction) {
        try {
            const validate = validateData<CreatePaymentDTO>(req.body, CreatePaymentSchema);
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

            const result = await this.paymentUseCase.create.execute(validate.data, req.user!);
            if (!result.success) {
                const data = {
                    ...this.generateMetadata(req, result.error ?? "Payment creation failed"),
                    status: result.status ?? EStatusCodes.enum.badRequest,
                    success: false,
                    description: result.error,
                };
                res.status(data.status).json(data);
                return;
            }

            const data: IResponseData<TPayment> = {
                ...this.generateMetadata(req, "Payment created successfully"),
                status: EStatusCodes.enum.ok,
                success: true,
                data: result.data,
            };
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    async getPayment(req: Request, res: Response, next: NextFunction) {
        try {
            const paymentId = req.params.paymentId;
            const result = await this.paymentUseCase.get.execute({ paymentId }, req.user);
            if (!result.success) {
                const data = {
                    ...this.generateMetadata(req, result.error ?? "Payment not found"),
                    status: result.status ?? EStatusCodes.enum.notFound,
                    success: false,
                };
                res.status(data.status).json(data);
                return;
            }

            const data: IResponseData<TPayment> = {
                ...this.generateMetadata(req, "Payment retrieved successfully"),
                status: EStatusCodes.enum.ok,
                success: true,
                data: result.data,
            };
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    async queryPayments(req: Request, res: Response, next: NextFunction) {
        try {
            const queryOptions = this.generatePaymentQuery(req.query);
            const result = await this.paymentUseCase.query.execute(queryOptions, req.user);
            if (!result.success) {
                const data = {
                    ...this.generateMetadata(req, result.error ?? "Failed to query payments"),
                    status: result.status ?? EStatusCodes.enum.badGateway,
                    success: false,
                };
                res.status(data.status).json(data);
                return;
            }

            const data: IResponseDataPaginated<TPayment> = {
                ...this.generateMetadata(req, "Payments retrieved successfully"),
                status: EStatusCodes.enum.ok,
                success: true,
                ...result.data,
            };
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    async updatePayment(req: Request, res: Response, next: NextFunction) {
        try {
            const validate = validateData<UpdatePaymentDTO>(req.body, UpdatePaymentSchema);
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

            const result = await this.paymentUseCase.update.execute(validate.data, req.user!);
            if (!result.success) {
                const data = {
                    ...this.generateMetadata(req, result.error ?? "Payment update failed"),
                    status: result.status ?? EStatusCodes.enum.conflict,
                    success: false,
                };
                res.status(data.status).json(data);
                return;
            }
            const data: IResponseData<TPayment> = {
                ...this.generateMetadata(req, "Payment updated successfully"),
                status: EStatusCodes.enum.ok,
                success: true,
                data: result.data,
            };
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    async deletePayment(req: Request, res: Response, next: NextFunction) {
        try {
            const paymentId = req.params.paymentId;
            const result = await this.paymentUseCase.delete.execute(paymentId, req.user!);
            if (!result.success) {
                const data = {
                    ...this.generateMetadata(req, result.error ?? "Payment deletion failed"),
                    status: result.status ?? EStatusCodes.enum.badGateway,
                    success: false,
                };
                res.status(data.status).json(data);
                return;
            }
            const data: IResponseData<boolean> = {
                ...this.generateMetadata(req, "Payment deleted successfully"),
                status: EStatusCodes.enum.ok,
                success: true,
                data: result.data,
            };
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    private generateMetadata(req: Request, message: string, type: string = "Payment") {
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

    private generatePaymentQuery(query: any): IQueryFilters<TPayment> {
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
                    { paymentReference: { $regex: search, $options: "i" } },
                    { status: { $regex: search, $options: "i" } },
                ],
            }
            : {};

        const projection = {
            paymentReference: true,
            status: true,
            amount: true,
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

export const paymentControllers = new PaymentControllers(
    new PaymentUseCase(new PaymentRepositoryImpl(PaymentModel))
);