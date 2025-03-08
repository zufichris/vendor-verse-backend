import { TPayment } from "../../../data/entity/payment";
import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { getPermission, hasRequiredPermissions, validateData } from "../../../util/functions";
import { EStatusCodes } from "../../../shared/enum";
import { CreatePaymentDTO, CreatePaymentSchema } from "../../../data/dto/payment";
import { IPaymentRepository } from "../repository";

export class CreatePaymentUseCase implements BaseUseCase<CreatePaymentDTO, TPayment, AuthContext> {
    constructor(private readonly paymentRepository: IPaymentRepository) { }

    async execute(input: CreatePaymentDTO, context: AuthContext): Promise<UseCaseResult<TPayment>> {
        try {
            if (!context.userId) {
                return handleUseCaseError({
                    title: "Forbidden",
                    error: "User authentication is required to create a payment.",
                    status: EStatusCodes.enum.forbidden
                });
            }
            const REQUIRED_PERMISSION = getPermission("payment", "create")
            const hasPermission = hasRequiredPermissions(REQUIRED_PERMISSION, context.permissions);
            if (!hasPermission) {
                return handleUseCaseError({
                    error: "Forbidden: You do not have permission to create payment.",
                    title: "Create Payment - Authorization",
                    status: EStatusCodes.enum.forbidden,
                });
            }

            const validation = validateData<CreatePaymentDTO>(input, CreatePaymentSchema);
            if (!validation.success) {
                return handleUseCaseError({
                    title: "Create Payment",
                    error: validation.error,
                    status: EStatusCodes.enum.badRequest
                });
            }

            const data: Partial<TPayment> = {
                ...validation.data,
                status: "PENDING",
            };

            const createdPayment = await this.paymentRepository.create(data);
            if (!createdPayment) {
                return handleUseCaseError({
                    title: "Create Payment",
                    error: "An error occurred while processing the payment.",
                    status: EStatusCodes.enum.internalServerError
                });
            }

            return {
                data: createdPayment,
                success: true,
            };
        } catch (error) {
            return handleUseCaseError({
                title: "Create Payment",
                error: "Unexpected error occurred during payment creation.",
                status: 500
            });
        }
    }
}