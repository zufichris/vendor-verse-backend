import { TPaymentMethod } from "../../../data/entity/payment-method";
import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { getPermission, hasRequiredPermissions, validateData } from "../../../util/functions";
import { EStatusCodes } from "../../../shared/enum";
import { CreatePaymentMethodDTO, CreatePaymentMethodSchema } from "../../../data/dto/payment-method";
import { IPaymentMethodRepository } from "../repository";

export class CreatePaymentMethodUseCase implements BaseUseCase<CreatePaymentMethodDTO, TPaymentMethod, AuthContext> {
    constructor(private readonly paymentMethodRepository: IPaymentMethodRepository) { }

    async execute(input: CreatePaymentMethodDTO, context: AuthContext): Promise<UseCaseResult<TPaymentMethod>> {
        try {
            if (!context.userId) {
                return handleUseCaseError({
                    title: "Forbidden",
                    error: "Access denied. User not authenticated.",
                    status: EStatusCodes.enum.forbidden
                });
            }
            const REQUIRED_PERMISSION = getPermission("payment-method", "create");
            const hasPermission = hasRequiredPermissions(REQUIRED_PERMISSION, context.permissions);
            if (!hasPermission) {
                return handleUseCaseError({
                    error: "Forbidden: You do not have permission to create payment method.",
                    title: "Create Payment method - Authorization",
                    status: EStatusCodes.enum.forbidden,
                });
            }

            const validate = validateData<CreatePaymentMethodDTO>(input, CreatePaymentMethodSchema);
            if (!validate.success) {
                return handleUseCaseError({
                    error: validate.error,
                    title: "Create Payment Method",
                    status: EStatusCodes.enum.badRequest
                });
            }

            const existingMethod = await this.paymentMethodRepository.findOne({
                name: validate.data.name
            });
            if (existingMethod) {
                return handleUseCaseError({
                    error: "Payment method already exists for this user.",
                    title: "Create Payment Method",
                    status: EStatusCodes.enum.conflict
                });
            }

            const paymentData: Partial<TPaymentMethod> = {
                ...validate.data,
                isActive: true,
            };

            const createdPaymentMethod = await this.paymentMethodRepository.create(paymentData);
            if (!createdPaymentMethod) {
                return handleUseCaseError({
                    error: "Error creating payment method.",
                    title: "Create Payment Method",
                    status: EStatusCodes.enum.internalServerError
                });
            }

            return {
                data: createdPaymentMethod,
                success: true,
            };
        } catch (error) {
            return handleUseCaseError({
                title: "Create Payment Method",
                status: EStatusCodes.enum.internalServerError
            });
        }
    }
}