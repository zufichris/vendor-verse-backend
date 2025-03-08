import { TPayment } from "../../../data/entity/payment";
import { BaseUseCase, UseCaseResult, handleUseCaseError, AuthContext } from "../../../shared/use-case";
import { IPaymentRepository } from "../repository";
import { EStatusCodes } from "../../../shared/enum";
import { getPermission, hasRequiredPermissions } from "../../../util/functions";

export interface GetPaymentInput {
    paymentId: string;
}

export class GetPaymentUseCase implements BaseUseCase<GetPaymentInput, TPayment, AuthContext> {
    constructor(private readonly paymentRepository: IPaymentRepository) { }

    async execute(input: GetPaymentInput, context?: AuthContext): Promise<UseCaseResult<TPayment>> {
        try {
            if (!context?.userId) {
                return handleUseCaseError({
                    error: "Unauthorized access: User authentication is required to retrieve payment information.",
                    title: "Get Payment",
                    status: EStatusCodes.enum.forbidden,
                });
            }
            const REQUIRED_PERMISSION = getPermission("payment", "view_own");
            const hasPermission = hasRequiredPermissions(REQUIRED_PERMISSION, context.permissions);
            if (!hasPermission) {
                return handleUseCaseError({
                    error: "Forbidden: You do not have permission to create roles.",
                    title: "Create Role - Authorization",
                    status: EStatusCodes.enum.forbidden,
                });
            }

            if (!input.paymentId) {
                return handleUseCaseError({
                    error: "Invalid request: A paymentId must be provided.",
                    title: "Get Payment",
                    status: EStatusCodes.enum.badRequest,
                });
            }

            const payment = await this.paymentRepository.findById(input.paymentId);

            if (!payment) {
                return handleUseCaseError({
                    error: "Payment record not found for the provided identifier.",
                    title: "Get Payment",
                    status: EStatusCodes.enum.notFound,
                });
            }

            return {
                success: true,
                data: payment,
            };
        } catch (error) {
            return handleUseCaseError({
                error: "An unexpected error occurred while retrieving the payment record.",
                title: "Get Payment",
                status: EStatusCodes.enum.internalServerError,
            });
        }
    }
}