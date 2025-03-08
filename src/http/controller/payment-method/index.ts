import { Request, Response, NextFunction } from "express";
import { validateData } from "../../../util/functions";
import { IResponseData, IResponseDataPaginated, IQueryFilters } from "../../../shared/entity";
import { EStatusCodes } from "../../../shared/enum";
import PaymentMethodUseCase from "../../../domain/payment-method/use-case";
import { PaymentMethodRepositoryImpl } from "../../../data/orm/repository-implementation/payment-method";
import { CreatePaymentMethodDTO, CreatePaymentMethodSchema, UpdatePaymentMethodDTO, UpdatePaymentMethodSchema } from "../../../data/dto/payment-method";
import { TPaymentMethod } from "../../../data/entity/payment-method";
import { PaymentMethodModel } from "../../../data/orm/model/payment-method";

export class PaymentMethodControllers {
    constructor(private readonly paymentMethodUseCase: PaymentMethodUseCase) {
        this.createPaymentMethod = this.createPaymentMethod.bind(this);
        this.getPaymentMethod = this.getPaymentMethod.bind(this);
        this.queryPaymentMethods = this.queryPaymentMethods.bind(this);
        this.updatePaymentMethod = this.updatePaymentMethod.bind(this);
        this.deletePaymentMethod = this.deletePaymentMethod.bind(this);
    }

    async createPaymentMethod(req: Request, res: Response, next: NextFunction) {
        try {
            const validate = validateData<CreatePaymentMethodDTO>(req.body, CreatePaymentMethodSchema);
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

            const result = await this.paymentMethodUseCase.create.execute(validate.data, req.user!);
            if (!result.success) {
                const data = {
                    ...this.generateMetadata(req, result.error ?? "Payment Method creation failed"),
                    status: result.status ?? EStatusCodes.enum.badRequest,
                    success: false,
                    description: result.error,
                };
                res.status(data.status).json(data);
                return;
            }

            const data: IResponseData<TPaymentMethod> = {
                ...this.generateMetadata(req, "Payment Method created successfully"),
                status: EStatusCodes.enum.ok,
                success: true,
                data: result.data,
            };
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    async getPaymentMethod(req: Request, res: Response, next: NextFunction) {
        try {
            const paymentMethodId = req.params.paymentMethodId;
            const result = await this.paymentMethodUseCase.get.execute({ paymentMethodId }, req.user);
            if (!result.success) {
                const data = {
                    ...this.generateMetadata(req, result.error ?? "Payment Method not found"),
                    status: result.status ?? EStatusCodes.enum.notFound,
                    success: false,
                };
                res.status(data.status).json(data);
                return;
            }

            const data: IResponseData<TPaymentMethod> = {
                ...this.generateMetadata(req, "Payment Method retrieved successfully"),
                status: EStatusCodes.enum.ok,
                success: true,
                data: result.data,
            };
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    async queryPaymentMethods(req: Request, res: Response, next: NextFunction) {
        try {
            const queryOptions = this.generatePaymentMethodQuery(req.query);
            const result = await this.paymentMethodUseCase.query.execute(queryOptions, req.user);
            if (!result.success) {
                const data = {
                    ...this.generateMetadata(req, result.error ?? "Failed to query payment methods"),
                    status: result.status ?? EStatusCodes.enum.badGateway,
                    success: false,
                };
                res.status(data.status).json(data);
                return;
            }

            const data: IResponseDataPaginated<TPaymentMethod> = {
                ...this.generateMetadata(req, "Payment Methods retrieved successfully"),
                status: EStatusCodes.enum.ok,
                success: true,
                ...result.data,
            };
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    async updatePaymentMethod(req: Request, res: Response, next: NextFunction) {
        try {
            const validate = validateData<UpdatePaymentMethodDTO>(req.body, UpdatePaymentMethodSchema);
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

            const result = await this.paymentMethodUseCase.update.execute(validate.data, req.user!);
            if (!result.success) {
                const data = {
                    ...this.generateMetadata(req, result.error ?? "Payment Method update failed"),
                    status: result.status ?? EStatusCodes.enum.conflict,
                    success: false,
                };
                res.status(data.status).json(data);
                return;
            }
            const data: IResponseData<TPaymentMethod> = {
                ...this.generateMetadata(req, "Payment Method updated successfully"),
                status: EStatusCodes.enum.ok,
                success: true,
                data: result.data,
            };
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    async deletePaymentMethod(req: Request, res: Response, next: NextFunction) {
        try {
            const paymentMethodId = req.params.paymentMethodId;
            const result = await this.paymentMethodUseCase.delete.execute(paymentMethodId, req.user!);
            if (!result.success) {
                const data = {
                    ...this.generateMetadata(req, result.error ?? "Payment Method deletion failed"),
                    status: result.status ?? EStatusCodes.enum.badGateway,
                    success: false,
                };
                res.status(data.status).json(data);
                return;
            }
            const data: IResponseData<boolean> = {
                ...this.generateMetadata(req, "Payment Method deleted successfully"),
                status: EStatusCodes.enum.ok,
                success: true,
                data: result.data,
            };
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    private generateMetadata(req: Request, message: string, type: string = "Payment Method") {
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

    private generatePaymentMethodQuery(query: any): IQueryFilters<TPaymentMethod> {
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
                    { methodName: { $regex: search, $options: "i" } },
                    { status: { $regex: search, $options: "i" } },
                ],
            }
            : {};

        const projection = {
            methodName: true,
            status: true,
            details: true,
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

export const paymentMethodControllers = new PaymentMethodControllers(
    new PaymentMethodUseCase(new PaymentMethodRepositoryImpl(PaymentMethodModel))
);